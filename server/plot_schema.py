"""
Plot Schema Definitions

Pydantic models for validating plot request payloads.
All plot specifications are defined as structured JSON - no raw Python code accepted.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


# =============================================================================
# Font Configuration
# =============================================================================

class FontConfig(BaseModel):
    """Font configuration for the entire plot."""
    
    family: Literal["sans-serif", "serif", "monospace"] = Field(
        default="sans-serif",
        description="Font family"
    )
    size_multiplier: float = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="Global font size multiplier"
    )


# =============================================================================
# Title & Label Configuration
# =============================================================================

class TitleConfig(BaseModel):
    """Title styling configuration."""
    
    text: str | None = Field(
        default=None,
        description="Title text"
    )
    font_size: int = Field(
        default=14,
        ge=8,
        le=32,
        description="Title font size"
    )
    font_weight: Literal["normal", "bold"] = Field(
        default="bold",
        description="Title font weight"
    )
    color: str = Field(
        default="#000000",
        description="Title color (hex)"
    )


class LabelConfig(BaseModel):
    """Axis label styling configuration."""
    
    text: str | None = Field(
        default=None,
        description="Label text"
    )
    font_size: int = Field(
        default=11,
        ge=8,
        le=24,
        description="Label font size"
    )
    color: str = Field(
        default="#000000",
        description="Label color (hex)"
    )


class TickConfig(BaseModel):
    """Tick label configuration."""
    
    font_size: int = Field(
        default=10,
        ge=6,
        le=20,
        description="Tick label font size"
    )
    rotation: int = Field(
        default=0,
        ge=-90,
        le=90,
        description="Tick label rotation in degrees"
    )
    color: str = Field(
        default="#000000",
        description="Tick label color"
    )


# =============================================================================
# Grid Configuration
# =============================================================================

class GridConfig(BaseModel):
    """Grid styling configuration."""
    
    show: bool = Field(
        default=False,
        description="Show grid lines"
    )
    style: Literal["solid", "dashed", "dotted"] = Field(
        default="dashed",
        description="Grid line style"
    )
    color: str = Field(
        default="#cccccc",
        description="Grid color (hex)"
    )
    alpha: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Grid transparency"
    )
    line_width: float = Field(
        default=0.5,
        ge=0.1,
        le=3.0,
        description="Grid line width"
    )
    axis: Literal["both", "x", "y"] = Field(
        default="both",
        description="Which axis to show grid for"
    )


# =============================================================================
# Legend Configuration
# =============================================================================

class LegendConfig(BaseModel):
    """Legend styling configuration."""
    
    show: bool = Field(
        default=True,
        description="Show legend"
    )
    position: Literal[
        "best", "upper right", "upper left", "lower right", 
        "lower left", "center", "center right", "center left",
        "upper center", "lower center"
    ] = Field(
        default="best",
        description="Legend position"
    )
    font_size: int = Field(
        default=10,
        ge=6,
        le=20,
        description="Legend font size"
    )
    frame: bool = Field(
        default=True,
        description="Show legend frame"
    )
    frame_alpha: float = Field(
        default=0.9,
        ge=0.0,
        le=1.0,
        description="Legend frame transparency"
    )


# =============================================================================
# Figure Configuration
# =============================================================================

class FigureConfig(BaseModel):
    """Figure (canvas) configuration."""
    
    width: int = Field(
        default=800,
        ge=200,
        le=2000,
        description="Figure width in pixels"
    )
    height: int = Field(
        default=500,
        ge=200,
        le=1500,
        description="Figure height in pixels"
    )
    dpi: int = Field(
        default=150,
        ge=72,
        le=300,
        description="Figure resolution (DPI)"
    )
    background: str = Field(
        default="#ffffff",
        description="Background color (hex)"
    )
    transparent: bool = Field(
        default=False,
        description="Transparent background"
    )


# =============================================================================
# Spine Configuration
# =============================================================================

class SpineConfig(BaseModel):
    """Axis spine (border) configuration."""
    
    top: bool = Field(default=True, description="Show top spine")
    right: bool = Field(default=True, description="Show right spine")
    bottom: bool = Field(default=True, description="Show bottom spine")
    left: bool = Field(default=True, description="Show left spine")
    color: str = Field(default="#000000", description="Spine color")
    width: float = Field(default=1.0, ge=0.5, le=3.0, description="Spine width")


# =============================================================================
# Plot Type Configuration
# =============================================================================

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


# =============================================================================
# Data Configuration
# =============================================================================

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


# =============================================================================
# Mapping Configuration
# =============================================================================

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


# =============================================================================
# Style Configuration (Enhanced)
# =============================================================================

class StyleConfig(BaseModel):
    """Visual styling options for the plot."""
    
    # Colors
    color: str | None = Field(
        default=None,
        description="Primary color (hex or named color)"
    )
    palette: str | None = Field(
        default=None,
        description="Color palette name (e.g., 'viridis', 'husl', 'Set2')"
    )
    
    # Transparency
    alpha: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Transparency level (0.0 to 1.0)"
    )
    
    # Line styling
    linewidth: float | None = Field(
        default=None,
        ge=0.5,
        le=10.0,
        description="Line width for line plots"
    )
    linestyle: Literal["solid", "dashed", "dotted", "dashdot"] | None = Field(
        default=None,
        description="Line style"
    )
    
    # Marker styling
    marker: str | None = Field(
        default=None,
        description="Marker style (o, s, ^, v, D, etc.)"
    )
    marker_size: float | None = Field(
        default=None,
        ge=10,
        le=500,
        description="Marker size for scatter plots"
    )
    
    # Bar styling
    bar_width: float | None = Field(
        default=None,
        ge=0.1,
        le=1.0,
        description="Bar width for bar charts"
    )
    
    # Edge styling
    edgecolor: str | None = Field(
        default=None,
        description="Edge color for bars, scatter points, etc."
    )
    edgewidth: float | None = Field(
        default=None,
        ge=0.0,
        le=5.0,
        description="Edge line width"
    )


# =============================================================================
# Axes Configuration (Enhanced)
# =============================================================================

class AxesConfig(BaseModel):
    """Axes configuration including labels, title, and scales."""
    
    # Legacy simple fields (still supported)
    title: str | None = Field(default=None, description="Plot title (simple)")
    x_label: str | None = Field(default=None, description="X-axis label (simple)")
    y_label: str | None = Field(default=None, description="Y-axis label (simple)")
    
    # Enhanced title/label configs
    title_config: TitleConfig | None = Field(default=None, description="Detailed title config")
    x_label_config: LabelConfig | None = Field(default=None, description="X-axis label config")
    y_label_config: LabelConfig | None = Field(default=None, description="Y-axis label config")
    tick_config: TickConfig | None = Field(default=None, description="Tick label config")
    
    # Scales
    x_scale: Literal["linear", "log"] = Field(default="linear", description="X-axis scale type")
    y_scale: Literal["linear", "log"] = Field(default="linear", description="Y-axis scale type")
    
    # Limits
    x_min: float | None = Field(default=None, description="X-axis minimum value")
    x_max: float | None = Field(default=None, description="X-axis maximum value")
    y_min: float | None = Field(default=None, description="Y-axis minimum value")
    y_max: float | None = Field(default=None, description="Y-axis maximum value")
    
    # Grid (legacy bool or new config)
    grid: bool | GridConfig = Field(default=False, description="Grid configuration")
    
    # Legend (legacy bool or new config)
    legend: bool | LegendConfig = Field(default=True, description="Legend configuration")
    
    # Spines
    spines: SpineConfig | None = Field(default=None, description="Axis spine config")


# =============================================================================
# Complete Plot Request
# =============================================================================

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
    figure: FigureConfig | None = Field(
        default=None,
        description="Figure (canvas) configuration"
    )
    font: FontConfig | None = Field(
        default=None,
        description="Font configuration"
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


# =============================================================================
# Response Models
# =============================================================================

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
