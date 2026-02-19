from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import tree, disruptions, predict, compare, simulate, suppliers

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ChipTrace AI API",
    description="Metric Tree-Driven Supply Chain Performance Analysis for Automotive Semiconductor Supply Chains",
    version="1.0.0"
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(tree.router, prefix="/api/metric-tree", tags=["Metric Tree"])
app.include_router(disruptions.router, prefix="/api/disruptions", tags=["Disruptions"])
app.include_router(predict.router, prefix="/api/predict", tags=["Predictions"])
app.include_router(compare.router, prefix="/api/compare", tags=["Compare"])
app.include_router(simulate.router, prefix="/api/simulate", tags=["Simulate"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["Suppliers"])


@app.get("/")
def root():
    return {
        "project": "ChipTrace AI",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "ok"}
