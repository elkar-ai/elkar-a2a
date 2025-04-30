import "styled-components";
import { DefaultTheme } from "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      success: string;
      error: string;
      warning: string;
      info: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
    };
    fontSizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
    };
  }
}

export const lightTheme: DefaultTheme = {
  colors: {
    primary: "#6B4EFF",
    secondary: "#4A4A4A",
    background: "#FFFFFF",
    surface: "#F5F5F5",
    text: "#1E1E1E",
    textSecondary: "#666666",
    border: "#E0E0E0",
    success: "#00C853",
    error: "#FF3B30",
    warning: "#FFB300",
    info: "#2196F3",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
  fontSizes: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "18px",
    xl: "20px",
  },
  shadows: {
    sm: "0 2px 4px rgba(0,0,0,0.1)",
    md: "0 4px 8px rgba(0,0,0,0.1)",
    lg: "0 8px 16px rgba(0,0,0,0.1)",
  },
};

export const darkTheme: DefaultTheme = {
  colors: {
    primary: "#6B4EFF",
    secondary: "#4A4A4A",
    background: "#1E1E1E",
    surface: "#2D2D2D",
    text: "#FFFFFF",
    textSecondary: "#A0A0A0",
    border: "#3D3D3D",
    success: "#00C853",
    error: "#FF3B30",
    warning: "#FFB300",
    info: "#2196F3",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
  fontSizes: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "18px",
    xl: "20px",
  },
  shadows: {
    sm: "0 2px 4px rgba(0,0,0,0.2)",
    md: "0 4px 8px rgba(0,0,0,0.2)",
    lg: "0 8px 16px rgba(0,0,0,0.2)",
  },
};

export type Theme = typeof lightTheme;
