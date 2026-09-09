import sys
import os
import pickle
import pandas as pd

# ==========================================
# MODEL PATH
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "recognition_difficulty_model.pkl")


# ==========================================
# LOAD MODEL
# ==========================================

with open(MODEL_PATH, "rb") as file:

    model = pickle.load(file)


# ==========================================
# READ INPUTS
# ==========================================

current_level = int(sys.argv[1])

accuracy = float(sys.argv[2])

response_time = float(sys.argv[3])

total_attempts = int(sys.argv[4])

mistakes = int(sys.argv[5])

previous_score = float(sys.argv[6])

hint_used = int(sys.argv[7])

difficulty_score = float(sys.argv[8])


# ==========================================
# CREATE INPUT DATA
# ==========================================

data = pd.DataFrame(
    [
        {
            "current_level": current_level,
            "accuracy": accuracy,
            "response_time": response_time,
            "total_attempts": total_attempts,
            "mistakes": mistakes,
            "previous_score": previous_score,
            "hint_used": hint_used,
            "difficulty_score": difficulty_score,
        }
    ]
)


# ==========================================
# PREDICTION
# ==========================================

prediction = model.predict(data)[0]


# ==========================================
# OUTPUT
# ==========================================

print(prediction)
