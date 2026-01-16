"""
Plot Router

FastAPI router for handling plot rendering requests.
Routes requests to the appropriate renderer based on plot type and library.
"""

import base64
from io import BytesIO

import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from plot_schema import (
    AxesConfig,
    ErrorResponse,
    MappingConfig,
    PlotRequest,
    PlotResponse,
    StyleConfig,
)
from renderers import get_renderer, list_supported_plot_types


router = APIRouter()


def create_dataframe(request: PlotRequest) -> pd.DataFrame:
    """
    Convert the request data to a Pandas DataFrame.
    
    Args:
        request: The plot request containing data
        
    Returns:
        DataFrame with the request data
    """
    return pd.DataFrame(
        data=request.data.rows,
        columns=request.data.columns,
    )


def validate_mapping(df: pd.DataFrame, mapping: MappingConfig, plot_type: str) -> None:
    """
    Validate that mapped columns exist in the DataFrame.
    
    Args:
        df: The DataFrame
        mapping: Column mappings
        plot_type: Type of plot for error messages
        
    Raises:
        HTTPException: If a mapped column doesn't exist
    """
    available = set(df.columns)
    
    if mapping.x not in available:
        raise HTTPException(
            status_code=400,
            detail=f"Column '{mapping.x}' not found in data. Available columns: {list(available)}",
        )
    
    if mapping.y is not None and mapping.y not in available:
        raise HTTPException(
            status_code=400,
            detail=f"Column '{mapping.y}' not found in data. Available columns: {list(available)}",
        )
    
    if mapping.hue is not None and mapping.hue not in available:
        raise HTTPException(
            status_code=400,
            detail=f"Hue column '{mapping.hue}' not found in data. Available columns: {list(available)}",
        )
    
    if mapping.size is not None and mapping.size not in available:
        raise HTTPException(
            status_code=400,
            detail=f"Size column '{mapping.size}' not found in data. Available columns: {list(available)}",
        )


def render_figure_to_png(fig) -> tuple[bytes, int, int]:
    """
    Render a matplotlib Figure to PNG bytes.
    
    Args:
        fig: Matplotlib Figure object
        
    Returns:
        Tuple of (png_bytes, width_px, height_px)
    """
    import matplotlib.pyplot as plt
    
    try:
        buffer = BytesIO()
        dpi = 150
        fig.savefig(
            buffer,
            format="png",
            dpi=dpi,
            bbox_inches="tight",
            facecolor="white",
            edgecolor="none",
        )
        buffer.seek(0)
        png_bytes = buffer.getvalue()
        
        # Calculate dimensions
        fig_width, fig_height = fig.get_size_inches()
        width_px = int(fig_width * dpi)
        height_px = int(fig_height * dpi)
        
        return png_bytes, width_px, height_px
    finally:
        plt.close(fig)


@router.post(
    "/render",
    response_model=PlotResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Rendering error"},
    },
    summary="Render a plot",
    description="Render a plot from a JSON specification and return base64-encoded PNG.",
)
async def render_plot(request: PlotRequest) -> PlotResponse:
    """
    Render a plot based on the provided specification.
    
    Returns base64-encoded PNG for maximum compatibility with Adobe Express.
    """
    try:
        # Convert data to DataFrame
        df = create_dataframe(request)
        
        # Validate mappings
        validate_mapping(df, request.mapping, request.plot.type)
        
        # Get the appropriate renderer
        use_seaborn = request.plot.library == "seaborn"
        renderer = get_renderer(request.plot.type, use_seaborn=use_seaborn)
        
        # Prepare config objects (use defaults if None)
        style = request.style or StyleConfig()
        axes = request.axes or AxesConfig()
        
        # Render the plot
        fig = renderer.render(
            df=df,
            mapping=request.mapping,
            style=style,
            axes=axes,
        )
        
        # Convert to PNG
        png_bytes, width, height = render_figure_to_png(fig)
        
        # Encode as base64
        png_base64 = base64.b64encode(png_bytes).decode("utf-8")
        
        return PlotResponse(
            svg=png_base64,  # Using svg field for base64 PNG data
            width=float(width),
            height=float(height),
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log the error in production
        raise HTTPException(
            status_code=500,
            detail=f"Failed to render plot: {str(e)}",
        )


@router.post(
    "/render-png",
    responses={
        200: {"content": {"image/png": {}}},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Rendering error"},
    },
    summary="Render a plot as PNG",
    description="Render a plot and return raw PNG bytes.",
)
async def render_plot_png(request: PlotRequest) -> Response:
    """
    Render a plot and return raw PNG bytes.
    """
    try:
        # Convert data to DataFrame
        df = create_dataframe(request)
        
        # Validate mappings
        validate_mapping(df, request.mapping, request.plot.type)
        
        # Get the appropriate renderer
        use_seaborn = request.plot.library == "seaborn"
        renderer = get_renderer(request.plot.type, use_seaborn=use_seaborn)
        
        # Prepare config objects
        style = request.style or StyleConfig()
        axes = request.axes or AxesConfig()
        
        # Render the plot
        fig = renderer.render(
            df=df,
            mapping=request.mapping,
            style=style,
            axes=axes,
        )
        
        # Convert to PNG
        png_bytes, width, height = render_figure_to_png(fig)
        
        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={
                "X-Image-Width": str(width),
                "X-Image-Height": str(height),
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to render plot: {str(e)}",
        )


@router.get(
    "/plot-types",
    response_model=list[str],
    summary="List supported plot types",
    description="Get a list of all supported plot types.",
)
async def get_plot_types() -> list[str]:
    """
    Get a list of all supported plot types.
    
    Returns:
        List of plot type names
    """
    return list_supported_plot_types()
