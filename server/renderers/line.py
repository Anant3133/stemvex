"""
Line Plot Renderer

Renders line plots using Matplotlib or Seaborn.
"""

from typing import TYPE_CHECKING

import pandas as pd

if TYPE_CHECKING:
    from matplotlib.figure import Figure

from plot_schema import AxesConfig, MappingConfig, StyleConfig, FigureConfig, FontConfig

from .base import BaseRenderer


class LineRenderer(BaseRenderer):
    """Renderer for line plots."""
    
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
        Render a line plot.
        
        Args:
            df: DataFrame containing the plot data
            mapping: Column-to-aesthetic mappings (x, y, hue)
            style: Visual styling options
            axes: Axes configuration
            figure: Figure configuration
            font: Font configuration
            
        Returns:
            Matplotlib Figure with the line plot
        """
        # Apply font configuration first
        self.apply_font_config(font)
        
        # Create figure
        fig, ax = self.create_figure(figure=figure)
        
        x_col = mapping.x
        y_col = mapping.y
        hue_col = mapping.hue
        
        if y_col is None:
            raise ValueError("Line plot requires 'y' mapping")
        
        if self.use_seaborn:
            self._render_seaborn(df, ax, x_col, y_col, hue_col, style)
        else:
            self._render_matplotlib(df, ax, x_col, y_col, hue_col, style)
        
        # Apply axes configuration
        self.apply_axes_config(ax, axes)
        self.apply_legend(ax, axes, has_hue=hue_col is not None)
        
        # Finalize
        self.finalize_figure(fig, figure)
        
        return fig
    
    def _render_matplotlib(
        self,
        df: pd.DataFrame,
        ax,
        x_col: str,
        y_col: str,
        hue_col: str | None,
        style: StyleConfig | None,
    ) -> None:
        """Render using matplotlib directly."""
        style_kwargs = self.get_style_kwargs(style)
        
        # Set default linewidth if not specified
        if "linewidth" not in style_kwargs:
            style_kwargs["linewidth"] = 2
        
        if hue_col is None:
            # Single line
            ax.plot(df[x_col], df[y_col], **style_kwargs)
        else:
            # Multiple lines by hue
            # Remove color from kwargs if present (will be set per group)
            style_kwargs.pop("color", None)
            
            for label, group in df.groupby(hue_col):
                ax.plot(
                    group[x_col],
                    group[y_col],
                    label=str(label),
                    **style_kwargs,
                )
    
    def _render_seaborn(
        self,
        df: pd.DataFrame,
        ax,
        x_col: str,
        y_col: str,
        hue_col: str | None,
        style: StyleConfig | None,
    ) -> None:
        """Render using seaborn."""
        import seaborn as sns
        
        sns_kwargs = self.get_seaborn_kwargs(style)
        
        # Set default linewidth if not specified
        if "linewidth" not in sns_kwargs:
            sns_kwargs["linewidth"] = 2
        
        sns.lineplot(
            data=df,
            x=x_col,
            y=y_col,
            hue=hue_col,
            ax=ax,
            **sns_kwargs,
        )
