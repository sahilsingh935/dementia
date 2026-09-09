import pickle
import pandas as pd

with open("difficulty_model.pkl", "rb") as file:
    model = pickle.load(file)


def predict_difficulty(
    current_level, accuracy, response_time, mistakes, hints_used, previous_score
):
    data = pd.DataFrame(
        [
            {
                "current_level": current_level,
                "accuracy": accuracy,
                "response_time": response_time,
                "mistakes": mistakes,
                "hints_used": hints_used,
                "previous_score": previous_score,
            }
        ]
    )

    prediction = model.predict(data)[0]

    return prediction


result = predict_difficulty(
    current_level=2,
    accuracy=92,
    response_time=4,
    mistakes=1,
    hints_used=0,
    previous_score=88,
)

print("Predicted Difficulty:", result)
