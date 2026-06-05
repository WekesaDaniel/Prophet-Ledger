import os

class HuggingFaceModelLoader:
    def __init__(self):
        print("✅ Dummy model loader initialized")
    
    def load_isolation_forest(self):
        return None
    
    def load_scaler(self):
        return None
    
    def get_model_status(self):
        return {
            "isolation_forest": False,
            "scaler": False,
            "cache_directory": "/tmp",
            "hf_repo": "dummy"
        }

hf_loader = HuggingFaceModelLoader()