from fastapi import FastAPI

from app.api.v1.api import api_router
from app.api.v1.endpoints.auth import router as auth_router
from app.ws.endpoints import router as ws_router

app = FastAPI(
    title="Doordarshan",
)


app.include_router(
    auth_router,
    prefix="/api/v1",
)

app.include_router(api_router, prefix="/api/v1")

app.include_router(ws_router)
