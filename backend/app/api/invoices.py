# backend/app/api/invoices.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import re
import io
import PyPDF2
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.invoice import Invoice

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

class InvoiceResponse(BaseModel):
    id: int
    user_id: int
    vendor: Optional[str]
    total_amount: Optional[float]
    tax: Optional[float]
    date: Optional[datetime]
    pdf_url: Optional[str]
    invoice_number: Optional[str]
    extracted_data: Optional[dict]
    created_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    vendor: str
    total_amount: float
    tax: float = 0
    date: datetime
    pdf_url: str
    invoice_number: str
    extracted_data: dict

def extract_invoice_data(text: str) -> dict:
    """Extract invoice data using regex patterns"""
    data = {}
    
    # Extract vendor name (look for common patterns)
    vendor_patterns = [
        r'(?:Vendor|From|Company|Store|Merchant)[:\s]+([^\n]+)',
        r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Invoice',
        r'Bill To:?\s*([^\n]+)'
    ]
    for pattern in vendor_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['vendor'] = match.group(1).strip()
            break
    if 'vendor' not in data:
        data['vendor'] = 'Unknown'

    # Extract total amount
    total_patterns = [
        r'(?:Total|Amount Due|Invoice Total|Grand Total)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)',
        r'(?:Total|Amount)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)',
        r'[\$£€]\s*([\d,]+\.?\d*)\s*(?:Total|Amount)'
    ]
    for pattern in total_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['total'] = float(match.group(1).replace(',', ''))
            break
    if 'total' not in data:
        data['total'] = 0.0

    # Extract tax
    tax_patterns = [
        r'(?:Tax|GST|VAT|HST)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)',
        r'(?:Tax|GST|VAT).*?[\$£€]\s*([\d,]+\.?\d*)'
    ]
    for pattern in tax_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['tax'] = float(match.group(1).replace(',', ''))
            break
    if 'tax' not in data:
        data['tax'] = 0.0

    # Extract date
    date_patterns = [
        r'(?:Date|Invoice Date|Issue Date)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(?:Date)[:\s]+(\d{4}-\d{2}-\d{2})'
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['date'] = match.group(1)
            break
    if 'date' not in data:
        data['date'] = datetime.now().strftime('%Y-%m-%d')

    # Extract invoice number
    inv_patterns = [
        r'(?:Invoice|Invoice Number|INV|Bill)[:\s#]+([A-Z0-9-]+)',
        r'Invoice\s*#?\s*([A-Z0-9-]+)'
    ]
    for pattern in inv_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['invoiceNumber'] = match.group(1)
            break
    if 'invoiceNumber' not in data:
        data['invoiceNumber'] = f'INV-{datetime.now().strftime("%Y%m%d%H%M%S")}'

    return data

@router.post("/extract")
async def extract_from_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Extract data from uploaded PDF invoice"""
    try:
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        extracted_data = extract_invoice_data(text)
        return extracted_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract data: {str(e)}")

@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all invoices for current user"""
    invoices = db.query(Invoice).filter(Invoice.user_id == current_user.id).order_by(Invoice.created_at.desc()).all()
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific invoice"""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    invoice: InvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new invoice record"""
    db_invoice = Invoice(
        user_id=current_user.id,
        vendor=invoice.vendor,
        total_amount=invoice.total_amount,
        tax=invoice.tax,
        date=invoice.date,
        pdf_url=invoice.pdf_url,
        invoice_number=invoice.invoice_number,
        extracted_data=invoice.extracted_data
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an invoice"""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db.delete(invoice)
    db.commit()
    return {"message": "Invoice deleted successfully"}