import sys
import os
import pickle
import pandas as pd

# =========================================================
# ROUTINE / OLD ONE OUT - ML PREDICTION
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "routine_difficulty_model.pkl"
)

# =========================================================
# LOAD MODEL
# =========================================================

with open(MODEL_PATH, "rb") as file:
    model = pickle.load(file)

# =========================================================
# READ INPUTS
# =========================================================

current_difficulty = int(sys.argv[1])
accuracy = float(sys.argv[2])
response_time = float(sys.argv[3])
total_attempts = int(sys.argv[4])
mistakes = int(sys.argv[5])
score = float(sys.argv[6])
previous_score = float(sys.argv[7])

# =========================================================
# CREATE INPUT DATA
# =========================================================

data = pd.DataFrame([
    {
        "current_difficulty": current_difficulty,
        "accuracy": accuracy,
        "response_time": response_time,
        "total_attempts": total_attempts,
        "mistakes": mistakes,
        "score": score,
        "previous_score": previous_score,
    }
])

# =========================================================
# PREDICT
# =========================================================

prediction = model.predict(data)[0]

# =========================================================
# OUTPUT
# =========================================================

print(prediction)