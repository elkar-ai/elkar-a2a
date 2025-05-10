import React, { ReactNode, ButtonHTMLAttributes } from "react";
import styled, { css } from "styled-components";

// Base button styles
const BaseButton = styled.button<{ $fullWidth?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 500;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
  outline: none;
  border: none;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  min-height: 40px;
  user-select: none;
  text-align: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    font-size: 18px;
  }
`;

// Primary button
const PrimaryButtonStyled = styled(BaseButton)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary}CC;
  }

  &:focus {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}40;
  }
`;

// Secondary button
const SecondaryButtonStyled = styled(BaseButton)`
  background-color: ${({ theme }) => theme.colors.transparent};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.background};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.border}80`};
  }
`;

// Danger button
const DangerButtonStyled = styled(BaseButton)`
  background-color: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.white};
  border: none;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.error}CC;
  }

  &:focus {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.error}40;
  }
`;

// Text button (no border or background)
const TextButtonStyled = styled(BaseButton)`
  background-color: ${({ theme }) => theme.colors.transparent};
  color: ${({ theme }) => theme.colors.primary};
  border: none;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary}10;
  }

  &:focus {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

/**
 * Button component props
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

/**
 * Primary button for main actions
 */
export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  fullWidth = false,
  ...props
}) => (
  <PrimaryButtonStyled $fullWidth={fullWidth} {...props}>
    {children}
  </PrimaryButtonStyled>
);

export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  fullWidth = false,
  ...props
}) => (
  <SecondaryButtonStyled $fullWidth={fullWidth} {...props}>
    {children}
  </SecondaryButtonStyled>
);

/**
 * Danger button for destructive actions
 */
export const DangerButton: React.FC<ButtonProps> = ({
  children,
  fullWidth = false,
  ...props
}) => (
  <DangerButtonStyled $fullWidth={fullWidth} {...props}>
    {children}
  </DangerButtonStyled>
);

/**
 * Text button for less prominent actions
 */
export const TextButton: React.FC<ButtonProps> = ({
  children,
  fullWidth = false,
  ...props
}) => (
  <TextButtonStyled $fullWidth={fullWidth} {...props}>
    {children}
  </TextButtonStyled>
);
