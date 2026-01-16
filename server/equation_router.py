"""
Equation Router

FastAPI router for rendering mathematical function graphs from LaTeX equations.
"""

from io import BytesIO
from typing import Optional

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from equation_parser import (
    EquationParser,
    EquationParseError,
    parse_latex_equation,
    create_plottable_function,
)


router = APIRouter(prefix="/equation", tags=["Equation Plotting"])


class EquationRequest(BaseModel):
    """Request schema for equation plotting."""
    
    latex: str = Field(
        ...,
        description="LaTeX equation to plot (e.g., 'y = x^2', '\\sin(x)')",
        examples=["y = x^2", "\\sin(x) + \\cos(x)", "e^{-x^2}"]
    )
    x_min: float = Field(
        default=-10.0,
        description="Minimum x value for plot range"
    )
    x_max: float = Field(
        default=10.0,
        description="Maximum x value for plot range"
    )
    y_min: Optional[float] = Field(
        default=None,
        description="Minimum y value (auto if None)"
    )
    y_max: Optional[float] = Field(
        default=None,
        description="Maximum y value (auto if None)"
    )
    title: Optional[str] = Field(
        default=None,
        description="Plot title"
    )
    color: str = Field(
        default="#416afd",
        description="Line color (hex or named)"
    )
    line_width: float = Field(
        default=2.0,
        ge=0.5,
        le=5.0,
        description="Line width"
    )
    grid: bool = Field(
        default=True,
        description="Show grid lines"
    )
    show_axes: bool = Field(
        default=True,
        description="Show x=0 and y=0 axis lines"
    )
    num_points: int = Field(
        default=500,
        ge=100,
        le=2000,
        description="Number of points to plot"
    )


class ParseResponse(BaseModel):
    """Response for equation parsing."""
    
    valid: bool
    python_expr: Optional[str] = None
    error: Optional[str] = None
    latex_cleaned: Optional[str] = None


class EquationInfoResponse(BaseModel):
    """Response with equation info."""
    
    latex: str
    python_expr: str
    sample_values: dict


@router.post(
    "/parse",
    response_model=ParseResponse,
    summary="Parse and validate LaTeX equation",
    description="Parse a LaTeX equation and return the Python expression, or error if invalid.",
)
async def parse_equation(latex: str) -> ParseResponse:
    """
    Parse and validate a LaTeX equation.
    
    Returns the Python expression if valid, or error message if not.
    """
    try:
        parser = EquationParser()
        python_expr = parser.parse(latex)
        
        # Test with a sample value
        func = parser.create_function(python_expr)
        test_result = func(np.array([1.0]))
        
        if np.isnan(test_result).all():
            return ParseResponse(
                valid=False,
                error="Equation produces invalid values",
                latex_cleaned=latex.strip()
            )
        
        return ParseResponse(
            valid=True,
            python_expr=python_expr,
            latex_cleaned=latex.strip()
        )
        
    except EquationParseError as e:
        return ParseResponse(
            valid=False,
            error=str(e),
            latex_cleaned=latex.strip()
        )
    except Exception as e:
        return ParseResponse(
            valid=False,
            error=f"Parse error: {str(e)}",
            latex_cleaned=latex.strip()
        )


@router.post(
    "/render-png",
    responses={
        200: {"content": {"image/png": {}}},
        400: {"description": "Invalid equation"},
        500: {"description": "Rendering error"},
    },
    summary="Render equation graph as PNG",
    description="Parse a LaTeX equation and render its graph as a PNG image.",
)
async def render_equation_png(request: EquationRequest) -> Response:
    """
    Render a mathematical function graph from LaTeX equation.
    
    Returns raw PNG bytes.
    """
    try:
        # Parse the equation
        parser = EquationParser()
        python_expr = parser.parse(request.latex)
        func = parser.create_function(python_expr)
        
        # Generate x values
        x = np.linspace(request.x_min, request.x_max, request.num_points)
        
        # Calculate y values with error handling
        with np.errstate(divide='ignore', invalid='ignore'):
            y = func(x)
        
        # Convert to numpy array if scalar
        if np.isscalar(y):
            y = np.full_like(x, y)
        
        # Handle infinities and very large values
        y = np.where(np.isinf(y), np.nan, y)
        
        # Auto-calculate y limits if not specified
        y_finite = y[np.isfinite(y)]
        if len(y_finite) == 0:
            raise HTTPException(
                status_code=400,
                detail="Equation produces no valid values in the given range"
            )
        
        if request.y_min is None or request.y_max is None:
            y_margin = (np.max(y_finite) - np.min(y_finite)) * 0.1
            auto_y_min = np.min(y_finite) - y_margin
            auto_y_max = np.max(y_finite) + y_margin
            
            # Clamp to reasonable values
            auto_y_min = max(auto_y_min, -1000)
            auto_y_max = min(auto_y_max, 1000)
        
        y_min = request.y_min if request.y_min is not None else auto_y_min
        y_max = request.y_max if request.y_max is not None else auto_y_max
        
        # Create the plot
        fig, ax = plt.subplots(figsize=(8, 6), dpi=150)
        
        # Plot the function
        ax.plot(x, y, color=request.color, linewidth=request.line_width)
        
        # Set axis limits
        ax.set_xlim(request.x_min, request.x_max)
        ax.set_ylim(y_min, y_max)
        
        # Add axis lines at x=0 and y=0
        if request.show_axes:
            ax.axhline(y=0, color='#000000', linewidth=0.5, alpha=0.5)
            ax.axvline(x=0, color='#000000', linewidth=0.5, alpha=0.5)
        
        # Add grid
        if request.grid:
            ax.grid(True, alpha=0.3, linestyle='--')
        
        # Add title (use LaTeX cleaned version if no title specified)
        if request.title:
            ax.set_title(request.title, fontsize=14, fontweight='bold')
        else:
            # Try to display the original LaTeX
            try:
                ax.set_title(f"$y = {request.latex}$", fontsize=14)
            except:
                ax.set_title(f"y = {python_expr}", fontsize=12)
        
        # Labels
        ax.set_xlabel('x', fontsize=12)
        ax.set_ylabel('y', fontsize=12)
        
        # Style
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        
        plt.tight_layout()
        
        # Save to PNG
        buffer = BytesIO()
        fig.savefig(
            buffer,
            format='png',
            dpi=150,
            bbox_inches='tight',
            facecolor='white',
            edgecolor='none'
        )
        buffer.seek(0)
        png_bytes = buffer.getvalue()
        
        # Get dimensions
        fig_width, fig_height = fig.get_size_inches()
        width_px = int(fig_width * 150)
        height_px = int(fig_height * 150)
        
        plt.close(fig)
        
        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={
                "X-Image-Width": str(width_px),
                "X-Image-Height": str(height_px),
            }
        )
        
    except EquationParseError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to render equation: {str(e)}"
        )


@router.get(
    "/examples",
    response_model=list[dict],
    summary="Get example equations",
    description="Get a list of example LaTeX equations for testing.",
)
async def get_examples() -> list[dict]:
    """
    Get example equations for testing.
    """
    return [
        {"latex": "x^2", "description": "Parabola"},
        {"latex": "x^3 - x", "description": "Cubic"},
        {"latex": "\\sin(x)", "description": "Sine wave"},
        {"latex": "\\cos(x)", "description": "Cosine wave"},
        {"latex": "\\tan(x)", "description": "Tangent"},
        {"latex": "e^{-x^2}", "description": "Gaussian"},
        {"latex": "\\frac{1}{x}", "description": "Hyperbola"},
        {"latex": "\\sqrt{x}", "description": "Square root"},
        {"latex": "\\ln(x)", "description": "Natural log"},
        {"latex": "x^2 + \\sin(x)", "description": "Polynomial + Trig"},
        {"latex": "\\frac{\\sin(x)}{x}", "description": "Sinc function"},
        {"latex": "2^x", "description": "Exponential"},
    ]
