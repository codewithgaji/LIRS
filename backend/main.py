"""FastAPI entry point for the LIRS Correspondence Register Management System.

Run locally with:
    uvicorn backend.main:app --reload --port 8000
Interactive API docs: http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import admin, auth, correspondence, departments, reports, users

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Digital correspondence register for the Lagos State Internal Revenue Service.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (auth, users, departments, correspondence, reports, admin):
    app.include_router(module.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
