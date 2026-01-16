"""
Plot Schema Definitions

Pydantic models for validating plot request payloads.
All plot specifications are defined as structured JSON - no raw Python code accepted.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class PlotConfig(BaseModel):
    """Configuration for the plot type and rendering library."""
    
    type: Literal["line", "scatter", "bar", "histogram", "boxplot", "heatmap"] = Field(
        ...,
        description="The type of plot to render"
    )
    library: Literal["matplotlib", "seaborn"] = Field(
        default="matplotlib",
        description="The plotting library to use"
    )


class DataConfig(BaseModel):
    """Data configuration with column names and row values."""
    
    columns: list[str] = Field(
        ...,
        min_length=1,
        description="Column names for the data"
    )
    rows: list[list[Any]] = Field(
        ...,
        min_length=1,
        description="Row data as a list of lists"
    )
    
    @field_validator("rows")
    @classmethod
    def validate_rows_match_columns(cls, rows: list[list[Any]], info) -> list[list[Any]]:
        """Ensure each row has the same number of elements as columns."""
        if "columns" in info.data:
            num_columns = len(info.data["columns"])
            for i, row in enumerate(rows):
                if len(row) != num_columns:
                    raise ValueError(
                        f"Row {i} has {len(row)} elements, expected {num_columns} (matching columns)"
                    )
        return rows


class MappingConfig(BaseModel):
    """Mapping of data columns to plot aesthetics."""
    
    x: str = Field(
        ...,
        description="Column name for x-axis"
    )
    y: str | None = Field(
        default=None,
        description="Column name for y-axis (optional for histograms)"
    )
    hue: str | None = Field(
        default=None,
        description="Column name for color grouping"
    )
    size: str | None = Field(
        default=None,
        description="Column name for size mapping (scatter plots)"
    )


class StyleConfig(BaseModel):
    """Visual styling options for the plot."""
    
    color: str | None = Field(
        default=None,
        description="Primary color (hex or named color)"
    )
    palette: str | None = Field(
        default=None,
        description="Color palette name (e.g., 'viridis', 'husl', 'Set2')"
    )
    alpha: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Transparency level (0.0 to 1.0)"
    )
    linewidth: float | None = Field(
        default=None,
        ge=0.0,
        description="Line width for line plots"
    )
    edgecolor: str | None = Field(
        default=None,
        description="Edge color for bars, scatter points, etc."
    )


class AxesConfig(BaseModel):
    """Axes configuration including labels, title, and scales."""
    
    title: str | None = Field(
        default=None,
        description="Plot title"
    )
    x_label: str | None = Field(
        default=None,
        description="X-axis label"
    )
    y_label: str | None = Field(
        default=None,
        description="Y-axis label"
    )
    x_scale: Literal["linear", "log"] = Field(
        default="linear",
        description="X-axis scale type"
    )
    y_scale: Literal["linear", "log"] = Field(
        default="linear",
        description="Y-axis scale type"
    )
    x_min: float | None = Field(
        default=None,
        description="X-axis minimum value"
    )
    x_max: float | None = Field(
        default=None,
        description="X-axis maximum value"
    )
    y_min: float | None = Field(
        default=None,
        description="Y-axis minimum value"
    )
    y_max: float | None = Field(
        default=None,
        description="Y-axis maximum value"
    )
    legend: bool = Field(
        default=True,
        description="Whether to show legend"
    )
    grid: bool = Field(
        default=False,
        description="Whether to show grid lines"
    )


class PlotRequest(BaseModel):
    """Complete plot request specification."""
    
    plot: PlotConfig = Field(
        ...,
        description="Plot type and library configuration"
    )
    data: DataConfig = Field(
        ...,
        description="Data to plot"
    )
    mapping: MappingConfig = Field(
        ...,
        description="Column-to-aesthetic mappings"
    )
    style: StyleConfig | None = Field(
        default=None,
        description="Visual styling options"
    )
    axes: AxesConfig | None = Field(
        default=None,
        description="Axes configuration"
    )
    
    @field_validator("mapping")
    @classmethod
    def validate_mapping_columns_exist(cls, mapping: MappingConfig, info) -> MappingConfig:
        """Ensure mapped columns exist in the data."""
        if "data" in info.data:
            columns = set(info.data["data"].columns)
            
            if mapping.x not in columns:
                raise ValueError(f"Mapped column 'x' = '{mapping.x}' not found in data columns")
            
            if mapping.y is not None and mapping.y not in columns:
                raise ValueError(f"Mapped column 'y' = '{mapping.y}' not found in data columns")
            
            if mapping.hue is not None and mapping.hue not in columns:
                raise ValueError(f"Mapped column 'hue' = '{mapping.hue}' not found in data columns")
            
            if mapping.size is not None and mapping.size not in columns:
                raise ValueError(f"Mapped column 'size' = '{mapping.size}' not found in data columns")
        
        return mapping


class PlotResponse(BaseModel):
    """Response containing rendered SVG and dimensions."""
    
    svg: str = Field(
        ...,
        description="The rendered SVG content"
    )
    width: float = Field(
        ...,
        description="Width of the SVG in pixels"
    )
    height: float = Field(
        ...,
        description="Height of the SVG in pixels"
    )


class ErrorResponse(BaseModel):
    """Error response structure."""
    
    error: str = Field(
        ...,
        description="Error type"
    )
    message: str = Field(
        ...,
        description="Human-readable error message"
    )
    details: dict[str, Any] | None = Field(
        default=None,
        description="Additional error details"
    )
