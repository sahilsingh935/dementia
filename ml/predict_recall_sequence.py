import sys
import os
import pickle
import pandas as pd

# ================================
# 1. LOAD MODEL
# ================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "recall_sequence_model.pkl")

with open(MODEL_PATH, "rb") as file:
    model = pickle.load(file)


# ================================
# 2. GET INPUTS
# ================================

sequence_length = int(sys.argv[1])
accuracy = float(sys.argv[2])
response_time = float(sys.argv[3])
total_attempts = int(sys.argv[4])
mistakes = int(sys.argv[5])
previous_score = float(sys.argv[6])
current_level = int(sys.argv[7])


# ================================
# 3. CREATE INPUT DATA
# ================================

data = pd.DataFrame(
    [
        {
            "sequence_length": sequence_length,
            "accuracy": accuracy,
            "response_time": response_time,
            "total_attempts": total_attempts,
            "mistakes": mistakes,
            "previous_score": previous_score,
            "current_level": current_level,
        }
    ]
)


# ================================
# 4. PREDICT
# ================================

prediction = model.predict(data)[0]


# ================================
# 5. OUTPUT
# ================================

print(prediction)
