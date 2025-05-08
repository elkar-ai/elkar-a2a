import React from "react";
import { Toaster } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../../styles/theme"; // Import themes

export const ThemedToaster: React.FC = () => {
  const { themeMode } = useTheme();
  const currentTheme = themeMode === "dark" ? darkTheme : lightTheme;

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: currentTheme.colors.surface,
          color: currentTheme.colors.text,
          border: `1px solid ${currentTheme.colors.border}`,
          borderRadius: currentTheme.borderRadius.md,
          boxShadow: currentTheme.shadows.md,
          padding: currentTheme.spacing.md,
          fontSize: currentTheme.fontSizes.sm,
        },
        // Success toast styling
        success: {
          style: {
            background: currentTheme.colors.surface,
            borderLeft: `4px solid ${currentTheme.colors.success}`,
          },
          iconTheme: {
            primary: currentTheme.colors.success,
            secondary: currentTheme.colors.surface, // Or text, depending on desired contrast
          },
        },
        // Error toast styling
        error: {
          style: {
            background: currentTheme.colors.surface,
            borderLeft: `4px solid ${currentTheme.colors.error}`,
          },
          iconTheme: {
            primary: currentTheme.colors.error,
            secondary: currentTheme.colors.surface, // Or text
          },
        },
      }}
    />
  );
};

export default ThemedToaster;
