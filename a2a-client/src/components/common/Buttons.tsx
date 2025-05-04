import React, { ReactNode, ButtonHTMLAttributes } from "react";
import styled from "styled-components";

// Base button styles
const BaseButton = styled.button<{ $fullWidth?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: ${({ theme }) => theme.cursor};
  transition: all 0.2s ease;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
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
    background-color: ${({ theme }) => `${theme.colors.primary}dd`};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}40`};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.border};
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
    background-color: ${({ theme }) => `${theme.colors.error}dd`};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.error}40`};
  }
`;

// Text button (no border or background)
const TextButtonStyled = styled(BaseButton)`
  background-color: ${({ theme }) => theme.colors.transparent};
  color: ${({ theme }) => theme.colors.primary};
  border: none;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}20`};
  }
`;

// Interface for button props
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

// Button components
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

export const DangerButton: React.FC<ButtonProps> = ({
  children,
  fullWidth = false,
  ...props
}) => (
  <DangerButtonStyled $fullWidth={fullWidth} {...props}>
    {children}
  </DangerButtonStyled>
);

export const TextButton: React.FC<ButtonProps> = ({
  children,
  fullWidth = false,
  ...props
}) => (
  <TextButtonStyled $fullWidth={fullWidth} {...props}>
    {children}
  </TextButtonStyled>
);
