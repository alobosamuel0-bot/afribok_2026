"""
Afribok FastAPI Application
Main entry point for the healthcare system
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import structlog
import logging

from core.config import settings
from core.logging_config import setup_logging


# Setup logging
setup_logging(settings.LOG_LEVEL)
logger = structlog.get_logger(__name__)


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
    )

    # ============= MIDDLEWARE =============

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )

    # Gzip compression for responses > 512 bytes
    app.add_middleware(GZipMiddleware, minimum_size=512)

    # ============= EVENT HANDLERS =============

    @app.on_event("startup")
    async def startup_event():
        """Initialize application on startup"""
        logger.info("app.startup", environment=settings.ENVIRONMENT, version=settings.APP_VERSION)

        # TODO: Initialize database connections
        # TODO: Initialize Redis cache
        # TODO: Start background sync task
        # TODO: Load ML models

    @app.on_event("shutdown")
    async def shutdown_event():
        """Cleanup on shutdown"""
        logger.info("app.shutdown")

        # TODO: Close database connections
        # TODO: Close Redis connection
        # TODO: Save pending sync data

    # ============= EXCEPTION HANDLERS =============

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Handle uncaught exceptions"""
        logger.error(
            "unhandled_exception",
            path=request.url.path,
            method=request.method,
            error=str(exc),
            exc_info=True,
        )

        # Don't expose sensitive details in production
        if settings.DEBUG:
            detail = str(exc)
        else:
            detail = "An error occurred"

        return JSONResponse(
            status_code=500,
            content={"detail": detail, "error_id": "ERR_INTERNAL_SERVER_ERROR"},
        )

    # ============= HEALTH CHECK =============

    @app.get("/health", tags=["System"])
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    @app.get("/", tags=["System"])
    async def root():
        """Root endpoint"""
        return {
            "message": f"Welcome to {settings.APP_NAME}",
            "version": settings.APP_VERSION,
            "docs": "/docs",
        }

    # ============= INCLUDE ROUTERS =============

    # Import and include routers from api modules
    from api.patients import router as patients_router
    
    app.include_router(patients_router)

    logger.info("app.created", routes=len(app.routes))

    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "core.app:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
