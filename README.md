# 🎙️ AI Interviewer

An intelligent, automated technical interview platform built with **FastAPI** and **SentenceTransformers**. The application evaluates candidate responses against ideal answers using semantic text embeddings and cosine similarity, delivering instant, objective scoring through a clean web interface.

## ✨ Features

- **Role-Specific Question Bank:** Dynamically loads curated technical questions across multiple developer roles from `question.json`.
- **Semantic Answer Evaluation:** Uses dense vector embeddings (`sentence-transformers`) and cosine similarity (`scikit-learn`) to grade answers based on meaning rather than exact keyword matching.
- **Fast & Lightweight Backend:** Powered by FastAPI and Pydantic for strict data validation and low-latency API responses.
- **Interactive Web UI:** Server-rendered frontend built with Jinja2 templates, HTML, and custom CSS.

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, Uvicorn, Pydantic
- **AI / NLP:** SentenceTransformers, Scikit-Learn, NumPy
- **Frontend:** HTML5, CSS3, Jinja2 Templates

## 📂 Project Structure

```text
├── main.py              # FastAPI routes & semantic evaluation logic
├── question.json        # Role-based interview question & reference answer bank
├── requirements.txt     # Python dependencies
├── static/              # CSS stylesheets and frontend assets
└── template/            # Jinja2 HTML templates
