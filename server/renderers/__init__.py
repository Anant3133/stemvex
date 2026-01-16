"""
Renderer Registry

Central registry for all plot renderers.
Maps plot types to their corresponding renderer classes.
"""

from typing import Type

from .base import BaseRenderer
from .bar import BarRenderer
from .boxplot import BoxplotRenderer
from .heatmap import HeatmapRenderer
from .histogram import HistogramRenderer
from .line import LineRenderer
from .scatter import ScatterRenderer


# Registry mapping plot type names to renderer classes
RENDERER_REGISTRY: dict[str, Type[BaseRenderer]] = {
    "line": LineRenderer,
    "scatter": ScatterRenderer,
    "bar": BarRenderer,
    "histogram": HistogramRenderer,
    "boxplot": BoxplotRenderer,
    "heatmap": HeatmapRenderer,
}


def get_renderer(plot_type: str, use_seaborn: bool = False) -> BaseRenderer:
    """
    Get a renderer instance for the specified plot type.
    
    Args:
        plot_type: Type of plot (line, scatter, bar, histogram, boxplot, heatmap)
        use_seaborn: Whether to use Seaborn for rendering
        
    Returns:
        Configured renderer instance
        
    Raises:
        ValueError: If plot type is not supported
    """
    if plot_type not in RENDERER_REGISTRY:
        supported = ", ".join(sorted(RENDERER_REGISTRY.keys()))
        raise ValueError(
            f"Unsupported plot type: '{plot_type}'. Supported types: {supported}"
        )
    
    renderer_class = RENDERER_REGISTRY[plot_type]
    return renderer_class(use_seaborn=use_seaborn)


def list_supported_plot_types() -> list[str]:
    """
    Get a list of all supported plot types.
    
    Returns:
        Sorted list of supported plot type names
    """
    return sorted(RENDERER_REGISTRY.keys())


__all__ = [
    "BaseRenderer",
    "BarRenderer",
    "BoxplotRenderer",
    "HeatmapRenderer",
    "HistogramRenderer",
    "LineRenderer",
    "ScatterRenderer",
    "RENDERER_REGISTRY",
    "get_renderer",
    "list_supported_plot_types",
]
