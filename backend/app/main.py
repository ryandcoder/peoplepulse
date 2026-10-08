import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import state
from app.api.routes import router
from app.database.db import wait_for_db
from app.database.loader import load_if_needed

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("peoplepulse")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        wait_for_db()
        load_if_needed()
    except Exception as exc:  # keep the API up so the UI can show a helpful message
        log.exception("Startup data load failed")
        state.startup_error = str(exc)
    yield


app = FastAPI(title="PeoplePulse API", version="1.0.0", lifespan=lifespan)
# Comma-separated list of allowed browser origins, e.g. "https://peoplepulse.vercel.app". "*" = any (fine for local use).
origins = [o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET"], allow_headers=["*"])
app.include_router(router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "data_error": state.startup_error}
