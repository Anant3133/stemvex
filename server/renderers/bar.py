"""
Bar Plot Renderer

Renders bar plots using Matplotlib or Seaborn.
"""

from typing import TYPE_CHECKING

import pandas as pd

if TYPE_CHECKING:
    from matplotlib.figure import Figure

from plot_schema import AxesConfig, MappingConfig, StyleConfig, FigureConfig, FontConfig

from .base import BaseRenderer


class BarRenderer(BaseRenderer):
    """Renderer for bar plots."""
    
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
        Render a bar plot.
        
        Args:
            df: DataFrame containing the plot data
            mapping: Column-to-aesthetic mappings (x, y, hue)
            style: Visual styling options
            axes: Axes configuration
            figure: Figure configuration
            font: Font configuration
            
        Returns:
            Matplotlib Figure with the bar plot
        """
        # Apply font configuration first
        self.apply_font_config(font)
        
        # Create figure
        fig, ax = self.create_figure(figure=figure)
        
        x_col = mapping.x
        y_col = mapping.y
        hue_col = mapping.hue
        
        if y_col is None:
            raise ValueError("Bar plot requires 'y' mapping")
        
        if self.use_seaborn:
            self._render_seaborn(df, ax, x_col, y_col, hue_col, style)
        else:
            self._render_matplotlib(df, ax, x_col, y_col, hue_col, style)
        
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
        hue_col: str | None,
        style: StyleConfig | None,
    ) -> None:
        """Render using matplotlib directly."""
        import numpy as np
        
        style_kwargs = self.get_style_kwargs(style)
        
        # Set defaults
        if "edgecolor" not in style_kwargs:
            style_kwargs["edgecolor"] = "black"
        if "linewidth" not in style_kwargs:
            style_kwargs["linewidth"] = 0.5
        
        # Get bar width from style
        bar_width_factor = 0.8
        if style is not None and style.bar_width is not None:
            bar_width_factor = style.bar_width
        
        if hue_col is None:
            # Simple bar plot
            # Aggregate if there are duplicate x values
            aggregated = df.groupby(x_col)[y_col].mean()
            
            ax.bar(
                range(len(aggregated)),
                aggregated.values,
                tick_label=aggregated.index.astype(str),
                width=bar_width_factor,
                **style_kwargs,
            )
        else:
            # Grouped bar plot
            style_kwargs.pop("color", None)
            
            hue_values = df[hue_col].unique()
            x_values = df[x_col].unique()
            
            n_hues = len(hue_values)
            n_x = len(x_values)
            
            bar_width = bar_width_factor / n_hues
            x_positions = np.arange(n_x)
            
            for i, hue_val in enumerate(hue_values):
                hue_data = df[df[hue_col] == hue_val]
                # Aggregate y values for each x
                aggregated = hue_data.groupby(x_col)[y_col].mean()
                
                # Align with x_values order
                y_values = [aggregated.get(x, 0) for x in x_values]
                
                offset = (i - n_hues / 2 + 0.5) * bar_width
                ax.bar(
                    x_positions + offset,
                    y_values,
                    width=bar_width,
                    label=str(hue_val),
                    **style_kwargs,
                )
            
            ax.set_xticks(x_positions)
            ax.set_xticklabels([str(x) for x in x_values])
    
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
        
        # Set default edgecolor
        if "edgecolor" not in sns_kwargs:
            sns_kwargs["edgecolor"] = "black"
        if "linewidth" not in sns_kwargs:
            sns_kwargs["linewidth"] = 0.5
        
        sns.barplot(
            data=df,
            x=x_col,
            y=y_col,
            hue=hue_col,
            ax=ax,
            width=style.bar_width if style and style.bar_width else 0.8,
            **sns_kwargs,
        )
