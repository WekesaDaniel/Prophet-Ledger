# backend/app/services/hf_loader.py
from huggingface_hub import hf_hub_download
import joblib

class HuggingFaceLoader:
    def __init__(self):
        self.repo_id = "Nomandaniels/prophetledger-models" 
    
    def load_isolation_forest(self):
        path = hf_hub_download(
            repo_id=self.repo_id,
            filename="isolation_forest.pkl"
        )
        return joblib.load(path)