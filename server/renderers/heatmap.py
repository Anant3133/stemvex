"""
Heatmap Renderer

Renders heatmaps using Matplotlib or Seaborn.
"""

from typing import TYPE_CHECKING

import pandas as pd

if TYPE_CHECKING:
    from matplotlib.figure import Figure

from plot_schema import AxesConfig, MappingConfig, StyleConfig, FigureConfig, FontConfig

from .base import BaseRenderer


class HeatmapRenderer(BaseRenderer):
    """Renderer for heatmaps."""
    
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
        Render a heatmap.
        
        For heatmaps, the data is expected to be pivotable:
        - x: column for x-axis categories (columns in heatmap)
        - y: column for y-axis categories (rows in heatmap)
        - hue: values to display (the numeric data)
        
        Args:
            df: DataFrame containing the plot data
            mapping: Column-to-aesthetic mappings
            style: Visual styling options
            axes: Axes configuration
            figure: Figure configuration
            font: Font configuration
            
        Returns:
            Matplotlib Figure with the heatmap
        """
        # Apply font configuration first
        self.apply_font_config(font)
        
        # Create figure
        fig, ax = self.create_figure(figure=figure)
        
        x_col = mapping.x
        y_col = mapping.y
        value_col = mapping.hue  # For heatmaps, hue is the value column
        
        # Prepare the heatmap data
        try:
            if y_col is not None and value_col is not None:
                # Ensure value column is numeric
                df_copy = df.copy()
                df_copy[value_col] = pd.to_numeric(df_copy[value_col], errors='coerce')
                
                # Pivot the data: x becomes columns, y becomes rows, value_col becomes values
                pivot_data = df_copy.pivot_table(
                    index=y_col,
                    columns=x_col,
                    values=value_col,
                    aggfunc="mean",
                )
            elif y_col is not None:
                # Count occurrences (crosstab style)
                pivot_data = pd.crosstab(df[y_col], df[x_col])
            else:
                # Assume df is already in matrix form
                numeric_cols = df.select_dtypes(include=["number"]).columns
                pivot_data = df[numeric_cols]
        except Exception as e:
            raise ValueError(f"Failed to pivot data for heatmap: {e}. "
                           f"Ensure X ({x_col}) and Y ({y_col}) are categorical columns, "
                           f"and Value ({value_col}) is numeric.")
        
        if self.use_seaborn:
            self._render_seaborn(pivot_data, ax, style)
        else:
            self._render_matplotlib(pivot_data, ax, style)
        
        # Apply axes configuration
        self.apply_axes_config(ax, axes)
        
        # Finalize
        self.finalize_figure(fig, figure)
        
        return fig
    
    def _render_matplotlib(
        self,
        data: pd.DataFrame,
        ax,
        style: StyleConfig | None,
    ) -> None:
        """Render using matplotlib directly."""
        # Get colormap
        cmap = "viridis"
        if style is not None and style.palette is not None:
            cmap = style.palette
        
        # Render heatmap
        im = ax.imshow(
            data.values,
            cmap=cmap,
            aspect="auto",
        )
        
        # Add colorbar
        ax.figure.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
        
        # Set tick labels
        ax.set_xticks(range(len(data.columns)))
        ax.set_xticklabels(data.columns, rotation=45, ha="right")
        
        ax.set_yticks(range(len(data.index)))
        ax.set_yticklabels(data.index)
        
        # Add value annotations if the matrix is small enough
        if data.shape[0] * data.shape[1] <= 100:
            for i in range(data.shape[0]):
                for j in range(data.shape[1]):
                    value = data.iloc[i, j]
                    if pd.notna(value):
                        # Choose text color based on background
                        text_color = "white" if value > data.values.mean() else "black"
                        ax.text(
                            j, i,
                            f"{value:.2f}" if isinstance(value, float) else str(value),
                            ha="center",
                            va="center",
                            color=text_color,
                            fontsize=8,
                        )
    
    def _render_seaborn(
        self,
        data: pd.DataFrame,
        ax,
        style: StyleConfig | None,
    ) -> None:
        """Render using seaborn."""
        import seaborn as sns
        
        # Get palette/cmap
        cmap = "viridis"
        if style is not None and style.palette is not None:
            cmap = style.palette
        
        # Determine if we should annotate
        annot = data.shape[0] * data.shape[1] <= 100
        
        sns.heatmap(
            data,
            ax=ax,
            cmap=cmap,
            annot=annot,
            fmt=".2f" if annot else None,
            cbar=True,
            square=False,
        )
        
        # Rotate x labels
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, ha="right")
