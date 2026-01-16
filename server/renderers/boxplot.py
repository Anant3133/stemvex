"""
Box Plot Renderer

Renders box plots using Matplotlib or Seaborn.
"""

from typing import TYPE_CHECKING

import pandas as pd

if TYPE_CHECKING:
    from matplotlib.figure import Figure

from plot_schema import AxesConfig, MappingConfig, StyleConfig, FigureConfig, FontConfig

from .base import BaseRenderer


class BoxplotRenderer(BaseRenderer):
    """Renderer for box plots."""
    
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
        Render a box plot.
        
        Args:
            df: DataFrame containing the plot data
            mapping: Column-to-aesthetic mappings (x, y, hue)
            style: Visual styling options
            axes: Axes configuration
            figure: Figure configuration
            font: Font configuration
            
        Returns:
            Matplotlib Figure with the box plot
        """
        # Apply font configuration first
        self.apply_font_config(font)
        
        # Create figure
        fig, ax = self.create_figure(figure=figure)
        
        x_col = mapping.x
        y_col = mapping.y
        hue_col = mapping.hue
        
        if y_col is None:
            raise ValueError("Box plot requires 'y' mapping for the values")
        
        if self.use_seaborn:
            self._render_seaborn(df, ax, x_col, y_col, hue_col, style)
        else:
            self._render_matplotlib(df, ax, x_col, y_col, style)
        
        # Apply axes configuration
        self.apply_axes_config(ax, axes)
        self.apply_legend(ax, axes, has_hue=hue_col is not None)
        
        # Rotate x-axis labels if they might overlap (unless tick_config handles it)
        if axes is None or axes.tick_config is None:
            if len(df[x_col].unique()) > 5:
                ax.tick_params(axis="x", rotation=45)
        
        # Finalize
        self.finalize_figure(fig, figure)
        
        return fig
    
    def _render_matplotlib(
        self,
        df: pd.DataFrame,
        ax,
        x_col: str,
        y_col: str,
        style: StyleConfig | None,
    ) -> None:
        """
        Render using matplotlib directly.
        
        Note: Matplotlib's boxplot doesn't natively support hue grouping,
        so we recommend using Seaborn for grouped boxplots.
        """
        # Group data by x column
        groups = []
        labels = []
        
        for x_val in df[x_col].unique():
            group_data = df[df[x_col] == x_val][y_col].dropna()
            groups.append(group_data.values)
            labels.append(str(x_val))
        
        # Style options
        box_style = {}
        if style is not None:
            if style.color is not None:
                box_style["boxprops"] = {"facecolor": style.color}
            if style.alpha is not None:
                if "boxprops" not in box_style:
                    box_style["boxprops"] = {}
                box_style["boxprops"]["alpha"] = style.alpha
        
        bp = ax.boxplot(
            groups,
            labels=labels,
            patch_artist=True,  # Enable fill
            **box_style,
        )
        
        # Apply colors to boxes if not set
        if style is None or style.color is None:
            for patch in bp["boxes"]:
                patch.set_facecolor("#3498db")
                patch.set_alpha(0.7)
    
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
        
        # Remove alpha - boxplot doesn't support it directly
        sns_kwargs.pop("alpha", None)
        # Remove linewidth - boxplot uses different param names
        sns_kwargs.pop("linewidth", None)
        
        sns.boxplot(
            data=df,
            x=x_col,
            y=y_col,
            hue=hue_col,
            ax=ax,
            **sns_kwargs,
        )
