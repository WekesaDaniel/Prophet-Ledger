# backend/app/services/hf_model_loader.py
import os
import joblib
import tempfile
import logging
from functools import lru_cache
from typing import Optional, Tuple
from huggingface_hub import hf_hub_download

logger = logging.getLogger(__name__)

class HuggingFaceModelLoader:
    """Load machine learning models from Hugging Face Hub"""
    
    def __init__(self):
        self.repo_id = "Nomandaniels/prophetledger-models"  # Your Hugging Face repo
        self.cache_dir = "/tmp/prophetledger_models"
        os.makedirs(self.cache_dir, exist_ok=True)
        self._models = {}
        
    @lru_cache(maxsize=1)
    def load_isolation_forest(self):
        """Load Isolation Forest model from Hugging Face"""
        try:
            model_path = hf_hub_download(
                repo_id=self.repo_id,
                filename="isolation_forest.pkl",
                cache_dir=self.cache_dir
            )
            model = joblib.load(model_path)
            logger.info("✅ Isolation Forest model loaded from Hugging Face")
            return model
        except Exception as e:
            logger.error(f"Failed to load Isolation Forest: {e}")
            return None
    
    @lru_cache(maxsize=1)
    def load_scaler(self):
        """Load StandardScaler from Hugging Face"""
        try:
            scaler_path = hf_hub_download(
                repo_id=self.repo_id,
                filename="anomaly_scaler.pkl",
                cache_dir=self.cache_dir
            )
            scaler = joblib.load(scaler_path)
            logger.info("✅ Scaler loaded from Hugging Face")
            return scaler
        except Exception as e:
            logger.error(f"Failed to load scaler: {e}")
            return None
    
    @lru_cache(maxsize=1)
    def load_bert_classifier(self) -> Tuple[Optional[object], Optional[object]]:
        """Load BERT classifier from Hugging Face"""
        try:
            from transformers import BertTokenizer, BertForSequenceClassification
            
            # Download the entire folder
            model_path = hf_hub_download(
                repo_id=self.repo_id,
                filename="bert_classifier/config.json",
                cache_dir=self.cache_dir
            )
            # Get the directory path
            base_dir = os.path.dirname(model_path)
            
            tokenizer = BertTokenizer.from_pretrained(base_dir)
            model = BertForSequenceClassification.from_pretrained(base_dir)
            
            # Load label encoder
            label_encoder_path = os.path.join(base_dir, "label_encoder.pkl")
            if os.path.exists(label_encoder_path):
                label_encoder = joblib.load(label_encoder_path)
            else:
                label_encoder = None
            
            logger.info("✅ BERT classifier loaded from Hugging Face")
            return model, tokenizer, label_encoder
        except Exception as e:
            logger.error(f"Failed to load BERT: {e}")
            return None, None, None
    
    def get_model_status(self) -> dict:
        """Get status of all models"""
        return {
            "isolation_forest": self.load_isolation_forest() is not None,
            "scaler": self.load_scaler() is not None,
            "bert": self.load_bert_classifier()[0] is not None,
            "cache_directory": self.cache_dir
        }

# Global instance
hf_loader = HuggingFaceModelLoader()