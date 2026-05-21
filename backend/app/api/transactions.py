# backend/app/api/transactions.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionCategory

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

# Pydantic models
class TransactionCreate(BaseModel):
    amount: float
    description: str
    category: TransactionCategory
    type: TransactionType
    date: date
    vendor: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    description: str
    category: TransactionCategory
    type: TransactionType
    date: date
    vendor: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    category: Optional[TransactionCategory] = None
    type: Optional[TransactionType] = None
    date: Optional[date] = None
    vendor: Optional[str] = None

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[TransactionCategory] = None,
    type: Optional[TransactionType] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all transactions for the current user with optional filters"""
    
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    # Apply filters
    if category:
        query = query.filter(Transaction.category == category)
    if type:
        query = query.filter(Transaction.type == type)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    # Order by date descending
    transactions = query.order_by(desc(Transaction.date)).offset(skip).limit(limit).all()
    
    return transactions

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single transaction by ID"""
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction

@router.post("/", response_model=TransactionResponse, status_code=201)
def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new transaction"""
    
    db_transaction = Transaction(
        user_id=current_user.id,
        amount=transaction.amount,
        description=transaction.description,
        category=transaction.category,
        type=transaction.type,
        date=transaction.date,
        vendor=transaction.vendor
    )
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing transaction"""
    
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update only fields that are provided
    update_data = transaction_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_transaction, field, value)
    
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction

@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transaction"""
    
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(db_transaction)
    db.commit()
    
    return {"message": "Transaction deleted successfully"}

@router.get("/summary/stats")
def get_transaction_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get summary statistics for transactions"""
    
    from sqlalchemy import func
    
    # Get total income and expenses
    stats = db.query(
        func.sum(Transaction.amount).filter(Transaction.type == TransactionType.INCOME).label('total_income'),
        func.sum(Transaction.amount).filter(Transaction.type == TransactionType.EXPENSE).label('total_expenses'),
        func.count(Transaction.id).label('total_transactions')
    ).filter(Transaction.user_id == current_user.id).first()
    
    # Get recent transactions (last 30 days)
    from datetime import timedelta
    thirty_days_ago = date.today() - timedelta(days=30)
    
    recent_stats = db.query(
        func.sum(Transaction.amount).filter(Transaction.type == TransactionType.INCOME).label('recent_income'),
        func.sum(Transaction.amount).filter(Transaction.type == TransactionType.EXPENSE).label('recent_expenses')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= thirty_days_ago
    ).first()
    
    return {
        "total_income": float(stats.total_income or 0),
        "total_expenses": float(stats.total_expenses or 0),
        "net_savings": float((stats.total_income or 0) - (stats.total_expenses or 0)),
        "total_transactions": stats.total_transactions or 0,
        "recent_income": float(recent_stats.recent_income or 0),
        "recent_expenses": float(recent_stats.recent_expenses or 0),
        "recent_net": float((recent_stats.recent_income or 0) - (recent_stats.recent_expenses or 0))
    }