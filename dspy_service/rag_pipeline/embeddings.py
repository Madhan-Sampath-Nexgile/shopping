import os
import json
import numpy as np
import faiss
from litellm import embedding
from dotenv import load_dotenv

load_dotenv()

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "products.json")
INDEX_PATH = os.path.join(os.path.dirname(__file__), "data", "faiss.index")
MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")


class EmbeddingRetriever:
    def __init__(self):
        self.data_path = DATA_PATH
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"ERROR Missing data file: {self.data_path}")

        with open(self.data_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)
        print(f"[INFO] Loaded {len(self.data)} product entries")

    def create_embeddings(self):
        vectors = []
        for item in self.data:
            text = f"{item['name']} - {item['description']}"
            response = embedding(model=MODEL, input=text)
            emb = response["data"][0]["embedding"]
            vectors.append(np.array(emb, dtype=np.float32))
        vectors = np.vstack(vectors)
        return vectors

    def build_index(self):
        vectors = self.create_embeddings()
        index = faiss.IndexFlatL2(vectors.shape[1])
        index.add(vectors)
        faiss.write_index(index, INDEX_PATH)
        print(f"[OK] FAISS index saved to {INDEX_PATH}")


if __name__ == "__main__":
    retriever = EmbeddingRetriever()
    retriever.build_index()
