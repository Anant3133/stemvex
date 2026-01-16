"""
SVG Utilities

Post-processing utilities to normalize SVG output for Adobe Express compatibility.
Converts complex Matplotlib SVGs to simpler formats that Express can handle.
"""

import base64
import re
from io import BytesIO
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from matplotlib.figure import Figure


def figure_to_png_blob(fig: "Figure", dpi: int = 150) -> tuple[bytes, int, int]:
    """
    Render a matplotlib Figure to PNG bytes.
    
    Args:
        fig: Matplotlib Figure object
        dpi: Resolution in dots per inch
        
    Returns:
        Tuple of (png_bytes, width_px, height_px)
    """
    buffer = BytesIO()
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


def create_simple_svg_with_image(png_bytes: bytes, width: int, height: int) -> str:
    """
    Create a simple SVG that embeds a PNG image.
    
    This approach works around Adobe Express's limitations with complex SVGs
    by embedding a rasterized version of the chart.
    
    Args:
        png_bytes: PNG image bytes
        width: Image width in pixels
        height: Image height in pixels
        
    Returns:
        SVG string with embedded PNG
    """
    # Convert PNG to base64
    png_base64 = base64.b64encode(png_bytes).decode("utf-8")
    
    # Create a simple SVG with embedded image
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{width}" 
     height="{height}" 
     viewBox="0 0 {width} {height}"
     id="plot-svg-root">
  <image 
    width="{width}" 
    height="{height}" 
    href="data:image/png;base64,{png_base64}"
  />
</svg>'''
    
    return svg


def render_figure_to_svg(fig: "Figure") -> tuple[str, float, float]:
    """
    Complete pipeline: render Figure to Express-compatible SVG.
    
    Uses PNG embedding to work around Adobe Express's limitations
    with complex SVG structures.
    
    Args:
        fig: Matplotlib Figure object
        
    Returns:
        Tuple of (svg_string, width, height)
    """
    import matplotlib.pyplot as plt
    
    try:
        # Render to PNG first (this always works)
        png_bytes, width, height = figure_to_png_blob(fig, dpi=150)
        
        # Wrap in a simple SVG
        svg_string = create_simple_svg_with_image(png_bytes, width, height)
        
        return svg_string, float(width), float(height)
    finally:
        # Always close the figure to prevent memory leaks
        plt.close(fig)
