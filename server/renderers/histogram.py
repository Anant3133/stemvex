"""
Histogram Renderer

Renders histograms using Matplotlib or Seaborn.
"""

from typing import TYPE_CHECKING

import pandas as pd

if TYPE_CHECKING:
    from matplotlib.figure import Figure

from plot_schema import AxesConfig, MappingConfig, StyleConfig

from .base import BaseRenderer


class HistogramRenderer(BaseRenderer):
    """Renderer for histograms."""
    
    # Default number of bins
    DEFAULT_BINS = 30
    
    def render(
        self,
        df: pd.DataFrame,
        mapping: MappingConfig,
        style: StyleConfig | None = None,
        axes: AxesConfig | None = None,
    ) -> "Figure":
        """
        Render a histogram.
        
        Args:
            df: DataFrame containing the plot data
            mapping: Column-to-aesthetic mappings (x, hue)
            style: Visual styling options
            axes: Axes configuration
            
        Returns:
            Matplotlib Figure with the histogram
        """
        fig, ax = self.create_figure()
        
        x_col = mapping.x
        hue_col = mapping.hue
        
        if self.use_seaborn:
            self._render_seaborn(df, ax, x_col, hue_col, style)
        else:
            self._render_matplotlib(df, ax, x_col, hue_col, style)
        
        # Apply axes configuration
        self.apply_axes_config(ax, axes)
        self.apply_legend(ax, axes, has_hue=hue_col is not None)
        
        # Finalize
        self.finalize_figure(fig)
        
        return fig
    
    def _render_matplotlib(
        self,
        df: pd.DataFrame,
        ax,
        x_col: str,
        hue_col: str | None,
        style: StyleConfig | None,
    ) -> None:
        """Render using matplotlib directly."""
        style_kwargs = self.get_style_kwargs(style)
        
        # Set defaults
        if "edgecolor" not in style_kwargs:
            style_kwargs["edgecolor"] = "black"
        if "alpha" not in style_kwargs:
            style_kwargs["alpha"] = 0.7
        
        if hue_col is None:
            # Single histogram
            ax.hist(
                df[x_col].dropna(),
                bins=self.DEFAULT_BINS,
                **style_kwargs,
            )
        else:
            # Multiple overlapping histograms
            style_kwargs.pop("color", None)
            
            for label, group in df.groupby(hue_col):
                ax.hist(
                    group[x_col].dropna(),
                    bins=self.DEFAULT_BINS,
                    label=str(label),
                    **style_kwargs,
                )
    
    def _render_seaborn(
        self,
        df: pd.DataFrame,
        ax,
        x_col: str,
        hue_col: str | None,
        style: StyleConfig | None,
    ) -> None:
        """Render using seaborn."""
        import seaborn as sns
        
        sns_kwargs = self.get_seaborn_kwargs(style)
        
        # Set default alpha for overlapping histograms
        if hue_col is not None and "alpha" not in sns_kwargs:
            sns_kwargs["alpha"] = 0.7
        
        sns.histplot(
            data=df,
            x=x_col,
            hue=hue_col,
            bins=self.DEFAULT_BINS,
            ax=ax,
            **sns_kwargs,
        )
