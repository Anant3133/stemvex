import React from "react";
import { PlotType } from "../../services/plotService";
import { Button } from "@swc-react/button";

export interface Template {
    id: string;
    title: string;
    description: string;
    icon: string;
    config: {
        plotType: PlotType;
        csv: string;
        mapX: string;
        mapY: string;
        mapHue?: string;
        title: string;
        xLabel: string;
        yLabel: string;
    };
}

const TEMPLATES: Template[] = [
    {
        id: "sales-trend",
        title: "Sales Trend",
        description: "Monthly revenue growth over one year with a trend line.",
        icon: "📈",
        config: {
            plotType: "line",
            csv: `Month,Revenue,Target
Jan,45000,40000
Feb,52000,42000
Mar,49000,44000
Apr,58000,46000
May,62000,48000
Jun,68000,50000
Jul,71000,52000
Aug,65000,54000
Sep,75000,56000
Oct,82000,58000
Nov,88000,60000
Dec,95000,62000`,
            mapX: "Month",
            mapY: "Revenue",
            title: "Monthly Revenue Growth 2024",
            xLabel: "Month",
            yLabel: "Revenue ($)"
        }
    },
    {
        id: "scientific-scatter",
        title: "Correlation Study",
        description: "Scientific scatter plot showing relationship between two variables.",
        icon: "🔬",
        config: {
            plotType: "scatter",
            csv: `Height_cm,Weight_kg,Group
165,60,Control
170,65,Control
175,70,Control
180,75,Control
168,62,Control
162,55,Treatment
167,58,Treatment
172,63,Treatment
178,71,Treatment
182,78,Treatment
160,52,Treatment
185,82,Control`,
            mapX: "Height_cm",
            mapY: "Weight_kg",
            mapHue: "Group",
            title: "Height vs Weight Distribution",
            xLabel: "Height (cm)",
            yLabel: "Weight (kg)"
        }
    },
    {
        id: "survey-bar",
        title: "Survey Results",
        description: "Categorical comparison of survey responses.",
        icon: "📊",
        config: {
            plotType: "bar",
            csv: `Platform,Users,Age_Group
Instagram,850,18-24
TikTok,920,18-24
Facebook,320,18-24
Instagram,780,25-34
TikTok,650,25-34
Facebook,890,25-34
Instagram,540,35+
TikTok,210,35+
Facebook,980,35+`,
            mapX: "Platform",
            mapY: "Users",
            mapHue: "Age_Group",
            title: "Social Media Usage by Age Group",
            xLabel: "Platform",
            yLabel: "Number of Users"
        }
    },
    {
        id: "heatmap-activity",
        title: "Activity Heatmap",
        description: "Density of user activity across time and days.",
        icon: "🔥",
        config: {
            plotType: "heatmap",
            csv: `Day,Hour,Activity_Level
Mon,Morning,25
Mon,Afternoon,65
Mon,Evening,45
Tue,Morning,30
Tue,Afternoon,70
Tue,Evening,50
Wed,Morning,28
Wed,Afternoon,68
Wed,Evening,48
Thu,Morning,35
Thu,Afternoon,75
Thu,Evening,55
Fri,Morning,20
Fri,Afternoon,55
Fri,Evening,80`,
            mapX: "Hour",
            mapY: "Day",
            mapHue: "Activity_Level",
            title: "Weekly User Activity Heatmap",
            xLabel: "Time of Day",
            yLabel: "Day of Week"
        }
    },
    {
        id: "boxplot-distribution",
        title: "Price Distribution",
        description: "Box plot showing statistical distribution across categories.",
        icon: "📦",
        config: {
            plotType: "boxplot",
            csv: `Category,Price
Electronics,120
Electronics,150
Electronics,80
Electronics,200
Electronics,180
Clothing,45
Clothing,60
Clothing,30
Clothing,85
Clothing,50
Home,90
Home,110
Home,75
Home,130
Home,95
Books,25
Books,15
Books,35
Books,20
Books,30`,
            mapX: "Category",
            mapY: "Price",
            title: "Product Price Distribution by Category",
            xLabel: "Category",
            yLabel: "Price ($)"
        }
    }
];

interface GalleryProps {
    onSelectTemplate: (template: Template) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onSelectTemplate }) => {
    return (
        <div className="section gallery-section">
            <div className="gallery-header">
                <h3 className="section-title">Smart Templates</h3>
                <p className="section-description">
                    Jumpstart your visualization with these professionally designed templates.
                </p>
            </div>

            <div className="templates-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "16px",
                marginTop: "16px"
            }}>
                {TEMPLATES.map((template) => (
                    <div
                        key={template.id}
                        className="template-card"
                        style={{
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            padding: "16px",
                            cursor: "pointer",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            backgroundColor: "white",
                            display: "flex",
                            flexDirection: "column",
                            height: "100%"
                        }}
                        onClick={() => onSelectTemplate(template)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <div className="template-icon" style={{ fontSize: "32px", marginBottom: "12px" }}>
                            {template.icon}
                        </div>
                        <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600 }}>{template.title}</h4>
                        <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#666", flexGrow: 1 }}>
                            {template.description}
                        </p>
                        <Button variant="secondary" size="s" style={{ width: "100%" }}>
                            Use Template
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};
