# backend/app/services/hf_model_loader.py
import os
import requests
import joblib
from functools import lru_cache
from typing import Optional, Tuple

class HuggingFaceModelLoader:
    def __init__(self):
        self.repo_id = "Nomandaniels/prophetledger-models"
        self.cache_dir = "/tmp/prophetledger_models"
        self.api_token = os.environ.get("HF_TOKEN")
        os.makedirs(self.cache_dir, exist_ok=True)
        print("✅ HuggingFace Model Loader initialized")
    
    def _download_file(self, filename):
        url = f"https://huggingface.co/{self.repo_id}/resolve/main/{filename}"
        local_path = os.path.join(self.cache_dir, filename)
        if not os.path.exists(local_path):
            print(f"Downloading {filename}...")
            response = requests.get(url)
            response.raise_for_status()
            with open(local_path, 'wb') as f:
                f.write(response.content)
        return local_path
    
    @lru_cache(maxsize=1)
    def load_isolation_forest(self):
        try:
            path = self._download_file("isolation_forest.pkl")
            return joblib.load(path)
        except Exception as e:
            print(f"Failed to load Isolation Forest: {e}")
            return None
    
    @lru_cache(maxsize=1)
    def load_scaler(self):
        try:
            path = self._download_file("anomaly_scaler.pkl")
            return joblib.load(path)
        except Exception as e:
            print(f"Failed to load scaler: {e}")
            return None
    
    def classify_with_hf_inference(self, description: str) -> Optional[dict]:
        """Use Hugging Face Inference API for classification"""
        if not self.api_token:
            return None
        
        api_url = f"https://api-inference.huggingface.co/models/{self.repo_id}"
        headers = {"Authorization": f"Bearer {self.api_token}"}
        
        try:
            response = requests.post(api_url, headers=headers, json={"inputs": description})
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    return {"category": result[0][0]['label'], "confidence": result[0][0]['score'], "method": "hf_inference"}
            return None
        except Exception as e:
            print(f"HF Inference error: {e}")
            return None
    
    def get_model_status(self):
        return {
            "isolation_forest": self.load_isolation_forest() is not None,
            "scaler": self.load_scaler() is not None,
            "hf_inference": self.api_token is not None,
            "cache_directory": self.cache_dir,
            "repo": self.repo_id
        }

hf_loader = HuggingFaceModelLoader()