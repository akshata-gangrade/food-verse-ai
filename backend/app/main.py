import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.db.mongo import db_manager

# Import all routers
from app.routers import auth, users, food, freshness, hygiene, chat, recipes, mealplans, history, dashboard, system

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("aahaar.main")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to database & seed demo data if needed
    logger.info("Initializing Food Verse AI backend services...")
    await db_manager.connect()
    yield
    # Shutdown: clean up connections
    logger.info("Closing database connections...")
    await db_manager.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )

    # State & Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Standardized Exception Handlers (no stack traces leaked)
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        if isinstance(exc.detail, dict):
            body = {
                "error": exc.detail.get("error", "http_error"),
                "message": exc.detail.get("message", "An error occurred."),
                "details": exc.detail.get("details", None)
            }
        else:
            body = {
                "error": "http_error",
                "message": str(exc.detail),
                "details": None
            }
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        first_err = exc.errors()[0] if exc.errors() else {}
        loc = " -> ".join([str(x) for x in first_err.get("loc", [])])
        msg = first_err.get("msg", "Invalid parameter")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "validation_error",
                "message": f"Validation failed at '{loc}': {msg}",
                "details": exc.errors()
            }
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "internal_server_error",
                "message": "An unexpected error occurred while processing your request.",
                "details": str(exc) if not settings.is_demo else None
            }
        )

    # Mount all API routers under /api/v1
    v1_prefix = settings.API_V1_STR
    app.include_router(auth.router, prefix=v1_prefix)
    app.include_router(users.router, prefix=v1_prefix)
    app.include_router(food.router, prefix=v1_prefix)
    app.include_router(freshness.router, prefix=v1_prefix)
    app.include_router(hygiene.router, prefix=v1_prefix)
    app.include_router(chat.router, prefix=v1_prefix)
    app.include_router(recipes.router, prefix=v1_prefix)
    app.include_router(mealplans.router, prefix=v1_prefix)
    app.include_router(history.router, prefix=v1_prefix)
    app.include_router(dashboard.router, prefix=v1_prefix)
    app.include_router(system.router, prefix=v1_prefix)

    @app.get("/")
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "status": "online",
            "api_version": "v1",
            "docs": "/docs",
            "mode": "demo_sample" if settings.is_demo else "live_ai"
        }

    return app


app = create_app()
