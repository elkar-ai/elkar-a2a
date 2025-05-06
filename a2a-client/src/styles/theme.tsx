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
      white: string;
      transparent: string;
      overlay: string;
      errorLight: string;
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
    cursor: string;
  }
}

export const lightTheme: DefaultTheme = {
  colors: {
    primary: "#3ECF8E",
    secondary: "#24B47E",
    background: "#FFFFFF",
    surface: "#F8F9FA",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    success: "#3ECF8E",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    white: "#FFFFFF",
    transparent: "transparent",
    overlay: "rgba(0, 0, 0, 0.5)",
    errorLight: "rgba(255, 0, 0, 0.05)",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  borderRadius: {
    sm: "6px",
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
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
  cursor: "pointer",
};

export const darkTheme: DefaultTheme = {
  colors: {
    primary: "#3ECF8E",
    secondary: "#24B47E",
    background: "#1F2937",
    surface: "#374151",
    text: "#F9FAFB",
    textSecondary: "#D1D5DB",
    border: "#4B5563",
    success: "#3ECF8E",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    white: "#FFFFFF",
    transparent: "transparent",
    overlay: "rgba(0, 0, 0, 0.5)",
    errorLight: "rgba(255, 0, 0, 0.05)",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  borderRadius: {
    sm: "6px",
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
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
  },
  cursor: "pointer",
};

export type Theme = typeof lightTheme;
