"""
Base Renderer

Abstract base class for all plot renderers.
Provides common functionality for figure creation, axes configuration, and SVG output.
"""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

import matplotlib.pyplot as plt
import matplotlib as mpl
import pandas as pd

if TYPE_CHECKING:
    from matplotlib.axes import Axes
    from matplotlib.figure import Figure

from plot_schema import (
    AxesConfig, MappingConfig, StyleConfig, FigureConfig, 
    FontConfig, GridConfig, LegendConfig, SpineConfig,
    TitleConfig, LabelConfig, TickConfig
)


class BaseRenderer(ABC):
    """
    Abstract base class for plot renderers.
    
    Each plot type (line, scatter, bar, etc.) should inherit from this class
    and implement the render() method.
    """
    
    # Default figure size in inches
    DEFAULT_FIGSIZE = (10, 6)
    
    # Default DPI for SVG output
    DEFAULT_DPI = 150
    
    # Line style mapping
    LINESTYLE_MAP = {
        "solid": "-",
        "dashed": "--",
        "dotted": ":",
        "dashdot": "-.",
    }
    
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
        figure: FigureConfig | None = None,
        font: FontConfig | None = None,
    ) -> "Figure":
        """
        Render the plot and return a matplotlib Figure.
        
        Args:
            df: DataFrame containing the plot data
            mapping: Column-to-aesthetic mappings
            style: Visual styling options
            axes: Axes configuration (title, labels, scales)
            figure: Figure configuration (size, dpi, background)
            font: Font configuration
            
        Returns:
            Matplotlib Figure object with the rendered plot
        """
        pass
    
    def apply_font_config(self, font: FontConfig | None) -> None:
        """
        Apply font configuration using matplotlib rcParams.
        
        Args:
            font: Font configuration
        """
        if font is None:
            return
        
        # Set font family
        mpl.rcParams['font.family'] = font.family
        
        # Apply size multiplier to various font sizes
        base_sizes = {
            'font.size': 10,
            'axes.titlesize': 14,
            'axes.labelsize': 11,
            'xtick.labelsize': 10,
            'ytick.labelsize': 10,
            'legend.fontsize': 10,
        }
        
        for param, base_size in base_sizes.items():
            mpl.rcParams[param] = base_size * font.size_multiplier
    
    def create_figure(
        self,
        figsize: tuple[float, float] | None = None,
        figure: FigureConfig | None = None,
    ) -> tuple["Figure", "Axes"]:
        """
        Create a new figure and axes.
        
        Args:
            figsize: Optional figure size (width, height) in inches
            figure: Figure configuration
            
        Returns:
            Tuple of (Figure, Axes)
        """
        # Determine figure size and DPI
        if figure is not None:
            # Convert pixels to inches
            dpi = figure.dpi
            width_inches = figure.width / dpi
            height_inches = figure.height / dpi
            figsize = (width_inches, height_inches)
        elif figsize is None:
            figsize = self.DEFAULT_FIGSIZE
            dpi = self.DEFAULT_DPI
        else:
            dpi = self.DEFAULT_DPI
        
        fig, ax = plt.subplots(figsize=figsize, dpi=dpi)
        
        # Apply background color
        if figure is not None:
            if figure.transparent:
                fig.patch.set_alpha(0)
                ax.set_facecolor('none')
            else:
                fig.patch.set_facecolor(figure.background)
                ax.set_facecolor(figure.background)
        else:
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
        
        # Apply title
        self._apply_title(ax, axes)
        
        # Apply axis labels
        self._apply_labels(ax, axes)
        
        # Apply tick configuration
        self._apply_ticks(ax, axes)
        
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
        
        # Apply grid
        self._apply_grid(ax, axes)
        
        # Apply spines
        self._apply_spines(ax, axes)
    
    def _apply_title(self, ax: "Axes", axes: AxesConfig) -> None:
        """Apply title configuration."""
        if axes.title_config is not None:
            config = axes.title_config
            if config.text:
                ax.set_title(
                    config.text,
                    fontsize=config.font_size,
                    fontweight=config.font_weight,
                    color=config.color,
                    pad=15
                )
        elif axes.title:
            ax.set_title(axes.title, fontsize=14, fontweight="bold", pad=15)
    
    def _apply_labels(self, ax: "Axes", axes: AxesConfig) -> None:
        """Apply axis label configuration."""
        # X-axis label
        if axes.x_label_config is not None:
            config = axes.x_label_config
            if config.text:
                ax.set_xlabel(
                    config.text,
                    fontsize=config.font_size,
                    color=config.color
                )
        elif axes.x_label:
            ax.set_xlabel(axes.x_label, fontsize=11)
        
        # Y-axis label
        if axes.y_label_config is not None:
            config = axes.y_label_config
            if config.text:
                ax.set_ylabel(
                    config.text,
                    fontsize=config.font_size,
                    color=config.color
                )
        elif axes.y_label:
            ax.set_ylabel(axes.y_label, fontsize=11)
    
    def _apply_ticks(self, ax: "Axes", axes: AxesConfig) -> None:
        """Apply tick configuration."""
        if axes.tick_config is not None:
            config = axes.tick_config
            ax.tick_params(
                axis='both',
                labelsize=config.font_size,
                labelcolor=config.color,
                labelrotation=config.rotation
            )
    
    def _apply_grid(self, ax: "Axes", axes: AxesConfig) -> None:
        """Apply grid configuration."""
        grid = axes.grid
        
        if isinstance(grid, bool):
            if grid:
                ax.grid(True, linestyle="--", alpha=0.7)
            else:
                ax.grid(False)
        elif isinstance(grid, GridConfig):
            if grid.show:
                linestyle = self.LINESTYLE_MAP.get(grid.style, "--")
                
                # Determine which axis
                if grid.axis == "both":
                    ax.grid(True, linestyle=linestyle, color=grid.color, 
                           alpha=grid.alpha, linewidth=grid.line_width)
                elif grid.axis == "x":
                    ax.grid(True, axis='x', linestyle=linestyle, color=grid.color,
                           alpha=grid.alpha, linewidth=grid.line_width)
                elif grid.axis == "y":
                    ax.grid(True, axis='y', linestyle=linestyle, color=grid.color,
                           alpha=grid.alpha, linewidth=grid.line_width)
            else:
                ax.grid(False)
    
    def _apply_spines(self, ax: "Axes", axes: AxesConfig) -> None:
        """Apply spine configuration."""
        if axes.spines is not None:
            config = axes.spines
            
            ax.spines['top'].set_visible(config.top)
            ax.spines['right'].set_visible(config.right)
            ax.spines['bottom'].set_visible(config.bottom)
            ax.spines['left'].set_visible(config.left)
            
            for spine in ax.spines.values():
                spine.set_color(config.color)
                spine.set_linewidth(config.width)
    
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
        if axes is None:
            if has_hue:
                ax.legend(loc="best", framealpha=0.9)
            return
        
        legend = axes.legend
        
        if isinstance(legend, bool):
            if legend and has_hue:
                ax.legend(loc="best", framealpha=0.9)
            elif not legend:
                leg = ax.get_legend()
                if leg is not None:
                    leg.remove()
        elif isinstance(legend, LegendConfig):
            if legend.show and has_hue:
                leg = ax.legend(
                    loc=legend.position,
                    fontsize=legend.font_size,
                    frameon=legend.frame,
                    framealpha=legend.frame_alpha if legend.frame else 0
                )
            elif not legend.show:
                leg = ax.get_legend()
                if leg is not None:
                    leg.remove()
    
    def get_style_kwargs(self, style: StyleConfig | None) -> dict:
        """
        Convert StyleConfig to matplotlib kwargs.
        
        Args:
            style: Style configuration
            
        Returns:
            Dictionary of matplotlib-compatible keyword arguments
            
        Note:
            marker_size ('s') is intentionally NOT included here as it's
            only applicable to scatter plots. Handle it in the scatter renderer.
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
        
        if style.linestyle is not None:
            kwargs["linestyle"] = self.LINESTYLE_MAP.get(style.linestyle, style.linestyle)
        
        if style.edgecolor is not None:
            kwargs["edgecolor"] = style.edgecolor
        
        if style.marker is not None:
            kwargs["marker"] = style.marker
        
        # Note: marker_size is handled in scatter renderer as 's' parameter
        # bar_width is handled in bar renderer
        
        return kwargs
    
    def get_seaborn_kwargs(self, style: StyleConfig | None) -> dict:
        """
        Convert StyleConfig to seaborn kwargs.
        
        Args:
            style: Style configuration
            
        Returns:
            Dictionary of seaborn-compatible keyword arguments
            
        Note:
            marker_size ('s') and marker are intentionally NOT included here as they're
            only applicable to scatter/line plots. Handle them in those renderers.
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
        
        # Note: marker and marker_size ('s') are handled in scatter/line renderers only
        
        return kwargs
    
    def finalize_figure(self, fig: "Figure", figure: FigureConfig | None = None) -> None:
        """
        Finalize the figure before SVG export.
        
        Args:
            fig: Matplotlib Figure object
            figure: Figure configuration
        """
        # Adjust layout to prevent clipping
        pad = 0.1
        if figure is not None:
            pad = getattr(figure, 'padding', 0.1) or 0.1
        
        fig.tight_layout(pad=pad)
