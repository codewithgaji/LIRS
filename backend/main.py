# entry point. I start it from inside the backend folder:
#   uvicorn main:app --reload --port 8000
# swagger docs show up at http://localhost:8000/docs

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import admin, auth, correspondence, departments, reports, users

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Digital correspondence register for the Lagos State Internal Revenue Service.",
)

# the react app runs on another port, so the browser blocks the calls
# unless I allow that origin here
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# every router gets the /api/v1 prefix from settings
for module in (auth, users, departments, correspondence, reports, admin):
    app.include_router(module.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}

@app.get("/", tags=["Health"])
def root() -> dict[str, str]:
    return {"message": "Welcome to the Lagos State Internal Revenue Service Digital Correspondence Register API."}
