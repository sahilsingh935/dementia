import sys
import os
import pickle
import pandas as pd

# -----------------------------------------
# 1. MODEL PATH
# -----------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "puzzle_difficulty_model_v4.pkl")


# -----------------------------------------
# 2. LOAD MODEL
# -----------------------------------------

with open(MODEL_PATH, "rb") as file:

    model = pickle.load(file)


# -----------------------------------------
# 3. GET INPUT FROM NODE.JS
# -----------------------------------------

puzzle_pieces = int(sys.argv[1])
accuracy = float(sys.argv[2])
response_time = float(sys.argv[3])
attempts = int(sys.argv[4])
mistakes = int(sys.argv[5])
previous_score = float(sys.argv[6])
current_level = int(sys.argv[7])


# -----------------------------------------
# 4. CREATE DATAFRAME
# -----------------------------------------

data = pd.DataFrame(
    [
        {
            "puzzle_pieces": puzzle_pieces,
            "accuracy": accuracy,
            "response_time": response_time,
            "attempts": attempts,
            "mistakes": mistakes,
            "previous_score": previous_score,
            "current_level": current_level,
        }
    ]
)


# -----------------------------------------
# 5. PREDICT
# -----------------------------------------

prediction = model.predict(data)[0]


# -----------------------------------------
# 6. RETURN RESULT
# -----------------------------------------

print(prediction)
