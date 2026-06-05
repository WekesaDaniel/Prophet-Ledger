import os
import requests
import joblib
import tempfile
from functools import lru_cache

class HuggingFaceModelLoader:
    def __init__(self):
        self.repo_id = "Nomandaniels/prophetledger-models"
        self.cache_dir = "/tmp/prophetledger_models"
        os.makedirs(self.cache_dir, exist_ok=True)
    
    def _download_file(self, filename):
        url = f"https://huggingface.co/{self.repo_id}/resolve/main/{filename}"
        local_path = os.path.join(self.cache_dir, filename)
        if not os.path.exists(local_path):
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
    
    def get_model_status(self):
        return {
            "isolation_forest": self.load_isolation_forest() is not None,
            "scaler": self.load_scaler() is not None,
            "cache_directory": self.cache_dir,
            "hf_repo": self.repo_id
        }

hf_loader = HuggingFaceModelLoader()
