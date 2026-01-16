"""
Scatter Plot Renderer

Renders scatter plots using Matplotlib or Seaborn.
"""

from typing import TYPE_CHECKING

import pandas as pd

if TYPE_CHECKING:
    from matplotlib.figure import Figure

from plot_schema import AxesConfig, MappingConfig, StyleConfig, FigureConfig, FontConfig

from .base import BaseRenderer


class ScatterRenderer(BaseRenderer):
    """Renderer for scatter plots."""
    
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
        Render a scatter plot.
        
        Args:
            df: DataFrame containing the plot data
            mapping: Column-to-aesthetic mappings (x, y, hue, size)
            style: Visual styling options
            axes: Axes configuration
            figure: Figure configuration
            font: Font configuration
            
        Returns:
            Matplotlib Figure with the scatter plot
        """
        # Apply font configuration first
        self.apply_font_config(font)
        
        # Create figure
        fig, ax = self.create_figure(figure=figure)
        
        x_col = mapping.x
        y_col = mapping.y
        hue_col = mapping.hue
        size_col = mapping.size
        
        if y_col is None:
            raise ValueError("Scatter plot requires 'y' mapping")
        
        if self.use_seaborn:
            self._render_seaborn(df, ax, x_col, y_col, hue_col, size_col, style)
        else:
            self._render_matplotlib(df, ax, x_col, y_col, hue_col, size_col, style)
        
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
        size_col: str | None,
        style: StyleConfig | None,
    ) -> None:
        """Render using matplotlib directly."""
        style_kwargs = self.get_style_kwargs(style)
        
        # Set defaults
        if "alpha" not in style_kwargs:
            style_kwargs["alpha"] = 0.7
        
        # Get marker size from style or default
        default_size = 50
        if style is not None and style.marker_size is not None:
            default_size = style.marker_size
        
        # Handle size mapping
        sizes = None
        if size_col is not None:
            # Normalize sizes to reasonable range
            size_data = df[size_col]
            sizes = 20 + (size_data - size_data.min()) / (size_data.max() - size_data.min() + 1e-10) * 200
        
        if hue_col is None:
            # Single scatter
            ax.scatter(
                df[x_col],
                df[y_col],
                s=sizes if sizes is not None else default_size,
                **style_kwargs,
            )
        else:
            # Multiple scatters by hue
            style_kwargs.pop("color", None)
            style_kwargs.pop("s", None)  # Remove size from kwargs
            
            for label, group in df.groupby(hue_col):
                group_sizes = None
                if sizes is not None:
                    group_sizes = sizes.loc[group.index]
                
                ax.scatter(
                    group[x_col],
                    group[y_col],
                    s=group_sizes if group_sizes is not None else default_size,
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
        size_col: str | None,
        style: StyleConfig | None,
    ) -> None:
        """Render using seaborn."""
        import seaborn as sns
        
        sns_kwargs = self.get_seaborn_kwargs(style)
        
        # Add marker and marker_size for scatter plots specifically
        if style is not None:
            if style.marker is not None:
                sns_kwargs["marker"] = style.marker
            if style.marker_size is not None:
                sns_kwargs["s"] = style.marker_size
        
        # Set default alpha if not specified
        if "alpha" not in sns_kwargs:
            sns_kwargs["alpha"] = 0.7
        
        sns.scatterplot(
            data=df,
            x=x_col,
            y=y_col,
            hue=hue_col,
            size=size_col,
            ax=ax,
            **sns_kwargs,
        )
