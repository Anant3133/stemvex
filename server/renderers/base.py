"""
Base Renderer

Abstract base class for all plot renderers.
Provides common functionality for figure creation, axes configuration, and SVG output.
"""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

import matplotlib.pyplot as plt
import pandas as pd

if TYPE_CHECKING:
    from matplotlib.axes import Axes
    from matplotlib.figure import Figure

from plot_schema import AxesConfig, MappingConfig, StyleConfig


class BaseRenderer(ABC):
    """
    Abstract base class for plot renderers.
    
    Each plot type (line, scatter, bar, etc.) should inherit from this class
    and implement the render() method.
    """
    
    # Default figure size in inches
    DEFAULT_FIGSIZE = (10, 6)
    
    # Default DPI for SVG output
    DEFAULT_DPI = 100
    
    def __init__(self, use_seaborn: bool = False):
        """
        Initialize renderer.
        
        Args:
            use_seaborn: Whether to use Seaborn for rendering
        """
        self.use_seaborn = use_seaborn
    
    @abstractmethod
    def render(
        self,
        df: pd.DataFrame,
        mapping: MappingConfig,
        style: StyleConfig | None = None,
        axes: AxesConfig | None = None,
    ) -> "Figure":
        """
        Render the plot and return a matplotlib Figure.
        
        Args:
            df: DataFrame containing the plot data
            mapping: Column-to-aesthetic mappings
            style: Visual styling options
            axes: Axes configuration (title, labels, scales)
            
        Returns:
            Matplotlib Figure object with the rendered plot
        """
        pass
    
    def create_figure(
        self,
        figsize: tuple[float, float] | None = None,
    ) -> tuple["Figure", "Axes"]:
        """
        Create a new figure and axes.
        
        Args:
            figsize: Optional figure size (width, height) in inches
            
        Returns:
            Tuple of (Figure, Axes)
        """
        if figsize is None:
            figsize = self.DEFAULT_FIGSIZE
        
        fig, ax = plt.subplots(figsize=figsize, dpi=self.DEFAULT_DPI)
        
        # Use a clean style
        fig.patch.set_facecolor("white")
        ax.set_facecolor("white")
        
        return fig, ax
    
    def apply_axes_config(
        self,
        ax: "Axes",
        axes: AxesConfig | None,
    ) -> None:
        """
        Apply axes configuration to the plot.
        
        Args:
            ax: Matplotlib Axes object
            axes: Axes configuration
        """
        if axes is None:
            return
        
        # Set title
        if axes.title:
            ax.set_title(axes.title, fontsize=14, fontweight="bold", pad=15)
        
        # Set axis labels
        if axes.x_label:
            ax.set_xlabel(axes.x_label, fontsize=11)
        if axes.y_label:
            ax.set_ylabel(axes.y_label, fontsize=11)
        
        # Set scales
        if axes.x_scale:
            ax.set_xscale(axes.x_scale)
        if axes.y_scale:
            ax.set_yscale(axes.y_scale)
        
        # Set axis limits
        if axes.x_min is not None or axes.x_max is not None:
            current_xlim = ax.get_xlim()
            new_xmin = axes.x_min if axes.x_min is not None else current_xlim[0]
            new_xmax = axes.x_max if axes.x_max is not None else current_xlim[1]
            ax.set_xlim(new_xmin, new_xmax)
        
        if axes.y_min is not None or axes.y_max is not None:
            current_ylim = ax.get_ylim()
            new_ymin = axes.y_min if axes.y_min is not None else current_ylim[0]
            new_ymax = axes.y_max if axes.y_max is not None else current_ylim[1]
            ax.set_ylim(new_ymin, new_ymax)
        
        # Grid
        if axes.grid:
            ax.grid(True, linestyle="--", alpha=0.7)
        
        # Legend handling is done per-renderer as it depends on hue
    
    def apply_legend(
        self,
        ax: "Axes",
        axes: AxesConfig | None,
        has_hue: bool = False,
    ) -> None:
        """
        Apply legend configuration.
        
        Args:
            ax: Matplotlib Axes object
            axes: Axes configuration
            has_hue: Whether the plot uses hue mapping
        """
        show_legend = True
        if axes is not None:
            show_legend = axes.legend
        
        if show_legend and has_hue:
            ax.legend(loc="best", framealpha=0.9)
        elif not show_legend:
            legend = ax.get_legend()
            if legend is not None:
                legend.remove()
    
    def get_style_kwargs(self, style: StyleConfig | None) -> dict:
        """
        Convert StyleConfig to matplotlib kwargs.
        
        Args:
            style: Style configuration
            
        Returns:
            Dictionary of matplotlib-compatible keyword arguments
        """
        kwargs = {}
        
        if style is None:
            return kwargs
        
        if style.color is not None:
            kwargs["color"] = style.color
        
        if style.alpha is not None:
            kwargs["alpha"] = style.alpha
        
        if style.linewidth is not None:
            kwargs["linewidth"] = style.linewidth
        
        if style.edgecolor is not None:
            kwargs["edgecolor"] = style.edgecolor
        
        return kwargs
    
    def get_seaborn_kwargs(self, style: StyleConfig | None) -> dict:
        """
        Convert StyleConfig to seaborn kwargs.
        
        Args:
            style: Style configuration
            
        Returns:
            Dictionary of seaborn-compatible keyword arguments
        """
        kwargs = {}
        
        if style is None:
            return kwargs
        
        if style.palette is not None:
            kwargs["palette"] = style.palette
        
        if style.alpha is not None:
            kwargs["alpha"] = style.alpha
        
        if style.linewidth is not None:
            kwargs["linewidth"] = style.linewidth
        
        return kwargs
    
    def finalize_figure(self, fig: "Figure") -> None:
        """
        Finalize the figure before SVG export.
        
        Args:
            fig: Matplotlib Figure object
        """
        # Adjust layout to prevent clipping
        fig.tight_layout()
