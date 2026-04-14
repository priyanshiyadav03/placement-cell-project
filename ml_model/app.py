import pickle
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel

# Load model
model = pickle.load(open("placement_model.pkl", "rb"))

app = FastAPI()
class InputData(BaseModel):
    features: list
@app.get("/")
def home():
    return {"message": "API running"}

@app.post("/predict")
def predict(data: dict):
    features = np.array(data["features"]).reshape(1, -1)
    prediction = model.predict(features)
    return {"prediction": prediction.tolist()
            }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

  
       

   