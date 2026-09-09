import sys
import os
import pickle
import pandas as pd

# =========================
# MODEL PATH
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "difficulty_model_dementia_final_v6.pkl")


# =========================
# LOAD MODEL
# =========================

with open(MODEL_PATH, "rb") as file:
    model = pickle.load(file)


# =========================
# READ INPUT FEATURES
# =========================

current_level = int(sys.argv[1])

accuracy = float(sys.argv[2])

response_time = float(sys.argv[3])

total_attempts = int(sys.argv[4])

later_attempts = int(sys.argv[5])

later_mistakes = int(sys.argv[6])

previous_score = float(sys.argv[7])


# =========================
# CREATE DATAFRAME
# =========================

data = pd.DataFrame(
    [
        {
            "current_level": current_level,
            "accuracy": accuracy,
            "response_time": response_time,
            "total_attempts": total_attempts,
            "later_attempts": later_attempts,
            "later_mistakes": later_mistakes,
            "previous_score": previous_score,
        }
    ]
)


# =========================
# ML PREDICTION
# =========================

prediction = model.predict(data)[0]


# =========================
# RETURN RESULT
# =========================

print(prediction)
