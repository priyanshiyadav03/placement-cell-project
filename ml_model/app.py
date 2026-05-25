# import pickle
# import numpy as np
# from fastapi import FastAPI
# from pydantic import BaseModel

# # Load model
# model = pickle.load(open("placement_model.pkl", "rb"))

# app = FastAPI()
# class InputData(BaseModel):
#     features: list
# @app.get("/")
# def home():
#     return {"message": "API running"}

# @app.post("/predict")
# def predict(data: dict):
#     features = np.array(data["features"]).reshape(1, -1)
#     prediction = model.predict(features)
#     return {"prediction": prediction.tolist()
#             }



# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="127.0.0.1", port=8000)

# import streamlit as st
# import pickle
# import numpy as np

# # Load trained model
# model = pickle.load(open("placement_model.pkl", "rb"))

# st.title("Placement Prediction System")

# st.write("Enter all 21 feature values")

# features = []

# # 21 inputs
# for i in range(21):
#     value = st.number_input(f"Feature {i+1}")
#     features.append(value)

# if st.button("Predict"):

#     final_features = np.array([features])

#     prediction = model.predict(final_features)

#     if prediction[0] == 1:
#         st.success("Placed")
#     else:
#         st.error("Not Placed")
       
import streamlit as st
import pickle
import numpy as np

# Load model
model = pickle.load(open("placement_model.pkl", "rb"))

st.title("Placement Prediction System")

# Numeric Inputs
age = st.number_input("Age", min_value=0, step=1)
cgpa = st.number_input("CGPA", min_value=0.0, max_value=10.0)
backlogs = st.number_input("Backlogs", min_value=0, step=1)
internships = st.number_input("Internships", min_value=0, step=1)
certifications = st.number_input("Certifications", min_value=0, step=1)
coding_skills = st.number_input("Coding Skills", min_value=0, max_value=10, step=1)
communication_skills = st.number_input("Communication Skills", min_value=0, max_value=10, step=1)
aptitude_score = st.number_input("Aptitude Score", min_value=0, max_value=100, step=1)
projects = st.number_input("Projects", min_value=0, step=1)

# Categorical Inputs
gender = st.selectbox("Gender", ["Male", "Female"])

degree = st.selectbox(
    "Degree",
    ["BCA", "BE", "BSc", "BTech"]
)

branch = st.selectbox(
    "Branch",
    ["AI", "CS", "DS", "Electrical", "IT", "Mechanical"]
)

if st.button("Predict"):

    features = [

        int(age),
        float(cgpa),
        int(backlogs),
        int(internships),
        int(certifications),
        int(coding_skills),
        int(communication_skills),
        int(aptitude_score),
        int(projects),

        1 if gender == "Female" else 0,
        1 if gender == "Male" else 0,

        1 if degree == "BCA" else 0,
        1 if degree == "BE" else 0,
        1 if degree == "BSc" else 0,
        1 if degree == "BTech" else 0,

        1 if branch == "AI" else 0,
        1 if branch == "CS" else 0,
        1 if branch == "DS" else 0,
        1 if branch == "Electrical" else 0,
        1 if branch == "IT" else 0,
        1 if branch == "Mechanical" else 0
    ]

    final_features = np.array([features])

    prediction = model.predict(final_features)

    if prediction[0] == 1:
        st.success("Student is likely to be Placed")
    else:
        st.error("Student is NOT likely to be Placed")
   