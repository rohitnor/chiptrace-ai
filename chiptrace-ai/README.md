# ChipTrace AI 🔍
### Metric Tree-Driven Supply Chain Performance Analysis System
> Automotive Legacy Semiconductor Supply Chain | OEM ↔ N-Tier Visibility | 24-Hour Hackathon Build

---

## Quick Start (Docker)

```bash
git clone https://github.com/YOUR_USERNAME/chiptrace-ai.git
cd chiptrace-ai
docker-compose up --build
```

Then open:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Manual Setup (Without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set env variable
export DATABASE_URL=postgresql://chiptrace:chiptrace123@localhost:5432/chiptrace_db

# Generate data + seed DB
python data/generate_dataset.py
python data/seed_db.py

# Train ML models
python ml/train_delay_model.py
python ml/train_resolution_model.py
python ml/train_impact_model.py

# Start server
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## Project Structure
```
chiptrace-ai/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── database.py              # DB connection
│   ├── models/db_models.py      # ORM models
│   ├── services/
│   │   ├── metric_tree.py       # Metric tree scoring engine
│   │   ├── alert_engine.py      # RED/AMBER alert detection
│   │   └── ml_service.py        # ML inference service
│   ├── routers/                 # API route handlers
│   ├── data/                    # Data generation + seeding
│   └── ml/                      # Model training scripts
└── frontend/
    └── src/
        ├── components/          # React components
        ├── pages/               # Page views
        ├── hooks/               # Custom React hooks
        └── api/                 # API call functions
```

---

## Team
| Member | Responsibility |
|--------|---------------|
| Member 1 | Backend + ML (Python, FastAPI, scikit-learn) |
| Member 2 | Frontend (React, D3.js, Tailwind) |

---

## Tech Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, PostgreSQL
- **ML:** XGBoost, scikit-learn, LightGBM, SHAP
- **Frontend:** React 18, D3.js, Recharts, Tailwind CSS
- **Infra:** Docker, Docker Compose
