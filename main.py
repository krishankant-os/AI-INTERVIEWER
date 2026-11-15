import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

# Ensure your directory name matches your project structure (standard is "templates" or "template")
templates = Jinja2Templates(directory="template")

BASE_DIR = Path(__file__).resolve().parent
json_file = BASE_DIR / "question.json"

# Load the Sentence Transformer model once at startup for high performance
model = SentenceTransformer("all-MiniLM-L6-v2")


def load_question():
    if not json_file.exists():
        return {}
    with open(json_file, "r", encoding="utf-8") as file:
        return json.load(file)


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/question/{role}/{difficulty}")
def get_question(role: str, difficulty: str):
    question = load_question()

    if role not in question:
        raise HTTPException(status_code=404, detail="Job role not found")

    if difficulty not in question[role]:
        raise HTTPException(status_code=404, detail="Difficulty level not found")

    return {
        "role": role,
        "difficulty": difficulty,
        "question": question[role][difficulty],
    }


class Answer(BaseModel):
    role: str
    difficulty: str
    question_id: int
    answer: str


@app.post("/evaluate")
def evaluate(para: Answer):
    if not para.answer.strip():
        raise HTTPException(
            status_code=400, 
            detail="Please enter an answer"
        )
    
    ques = load_question()
    
    try:
        questions_list = ques[para.role][para.difficulty]
        target_question = next(q for q in questions_list if q["id"] == para.question_id)
        ideal_answer = target_question["ideal_answer"]
    except (KeyError, StopIteration):
        raise HTTPException(status_code=404, detail="Question or ideal answer not found for given parameters")
    
    # Encode both sentences directly using the loaded SentenceTransformer model
    embeddings = model.encode([para.answer, ideal_answer])
    
    # Reshape for cosine_similarity (expects 2D arrays)
    similarity = cosine_similarity(
        embeddings[0].reshape(1, -1), 
        embeddings[1].reshape(1, -1)
    )[0][0]
    
    score = round(max(0, min(100, float(similarity) * 100)), 2)

    if score >= 80:
        feedback = "Answer is highly accurate and semantically aligned with the optimal response."
    elif score >= 60:
        feedback = "Your answer is partially correct. Consider adding more technical depth and completeness."
    else:
        feedback = "Review the core concepts for this question and try providing a more precise explanation."
        
    return JSONResponse({
        "question_id": para.question_id,
        "score": score,
        "feedback": feedback
    })
