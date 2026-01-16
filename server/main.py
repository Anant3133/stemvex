"""
Python Plotting Server

A production-ready FastAPI server that renders graphs using Matplotlib and Seaborn.
Returns SVG output suitable for editing in Adobe Express.

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000

For development:
    uvicorn main:app --reload --port 8000
"""

import sys
from contextlib import asynccontextmanager
from typing import Any

# Configure Matplotlib to use non-interactive backend BEFORE importing pyplot
import matplotlib
matplotlib.use("Agg")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from plot_router import router as plot_router
from equation_router import router as equation_router


# Server version
VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    Performs setup on startup and cleanup on shutdown.
    """
    # Startup
    print(f"🚀 Plot Server v{VERSION} starting...")
    print(f"   Python: {sys.version}")
    print(f"   Matplotlib backend: {matplotlib.get_backend()}")
    
    # Verify matplotlib is using Agg backend
    assert matplotlib.get_backend() == "Agg", (
        f"Expected 'Agg' backend, got '{matplotlib.get_backend()}'. "
        "Make sure matplotlib.use('Agg') is called before importing pyplot."
    )
    
    yield
    
    # Shutdown
    print("👋 Plot Server shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Plot Server",
    description=(
        "A production-ready plotting server that renders graphs using "
        "Matplotlib and Seaborn. Returns SVG output suitable for editing "
        "in Adobe Express."
    ),
    version=VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# Configure CORS for Adobe Express integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include the plot router
app.include_router(plot_router)

# Include the equation router
app.include_router(equation_router)


@app.get(
    "/health",
    summary="Health check",
    description="Check if the server is running and healthy.",
    response_model=dict[str, Any],
)
async def health_check() -> dict[str, Any]:
    """
    Health check endpoint.
    
    Returns:
        Server status information
    """
    return {
        "status": "healthy",
        "version": VERSION,
        "backend": matplotlib.get_backend(),
    }


@app.get(
    "/",
    summary="Root",
    description="Root endpoint with basic server info.",
    response_model=dict[str, str],
)
async def root() -> dict[str, str]:
    """
    Root endpoint.
    
    Returns:
        Basic server information
    """
    return {
        "name": "Plot Server",
        "version": VERSION,
        "docs": "/docs",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for unhandled errors.
    
    Logs the error and returns a generic error response.
    """
    # In production, log this error
    print(f"Unhandled error: {exc}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred. Please try again.",
        },
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
