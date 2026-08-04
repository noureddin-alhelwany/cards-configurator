from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse, Response
from starlette.staticfiles import StaticFiles

from .config import get_settings
from .db import Base, ensure_database_compatibility, get_engine
from .registries.loader import load_registry_bundle
from .routes import router


def create_app() -> FastAPI:
    get_settings.cache_clear()
    get_engine.cache_clear()
    settings = get_settings()
    app = FastAPI(title=settings.app_name)
    app.include_router(router)

    @app.on_event("startup")
    def load_registries() -> None:
        app.state.registry_bundle = load_registry_bundle(settings.registries_dir, settings.proof_assets_dir)
        Base.metadata.create_all(bind=get_engine())
        ensure_database_compatibility(get_engine())

    fonts_dir = settings.proof_assets_dir / "fonts"
    if fonts_dir.exists():
        app.mount("/fonts", StaticFiles(directory=fonts_dir), name="fonts")
    if settings.proof_assets_dir.exists():
        app.mount("/proof-assets", StaticFiles(directory=settings.proof_assets_dir), name="proof-assets")

    frontend_index = settings.frontend_dist_dir / "index.html"
    if frontend_index.exists():
        assets_dir = settings.frontend_dist_dir / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/", response_model=None)
        @app.get("/{path:path}", include_in_schema=False, response_model=None)
        def spa(path: str = "") -> Response:
            if path.startswith(("api/", "assets/", "fonts/", "proof-assets/")):
                return JSONResponse({"detail": "Not found"}, status_code=404)
            return FileResponse(frontend_index)
    else:

        @app.get("/", response_model=None)
        def root() -> Response:
            return JSONResponse({"service": settings.app_name, "status": "ready"})

    return app


app = create_app()
