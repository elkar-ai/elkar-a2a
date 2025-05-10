import React, { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import styled from "styled-components";

// Form container with proper ARIA attributes
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

// Form group
export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

// Form labels
export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

// Form inputs with proper accessibility attributes
const BaseInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;
  width: 100%;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.6;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.surface};
    cursor: not-allowed;
    opacity: 0.7;
  }

  &.error {
    border-color: ${({ theme }) => theme.colors.error};
  }
`;

// Textarea style with proper accessibility attributes
const TextareaStyled = styled.textarea`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;
  width: 100%;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.6;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.surface};
    cursor: not-allowed;
    opacity: 0.7;
  }

  &.error {
    border-color: ${({ theme }) => theme.colors.error};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const HelperText = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

// Input Component with proper TypeScript types and accessibility
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
  id: string;
}

export const Input: React.FC<InputProps> = ({
  error,
  helperText,
  className = "",
  label,
  id,
  ...props
}) => (
  <div>
    {label && (
      <label htmlFor={id} style={{ display: "block", marginBottom: "4px" }}>
        {label}
      </label>
    )}
    <BaseInput
      id={id}
      className={`${className} ${error ? "error" : ""}`}
      aria-invalid={!!error}
      aria-describedby={
        error ? `${id}-error` : helperText ? `${id}-helper` : undefined
      }
      {...props}
    />
    {error && (
      <ErrorMessage id={`${id}-error`} role="alert">
        {error}
      </ErrorMessage>
    )}
    {helperText && !error && (
      <HelperText id={`${id}-helper`}>{helperText}</HelperText>
    )}
  </div>
);

// Textarea Component with proper TypeScript types and accessibility
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
  label?: string;
  id: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  error,
  helperText,
  className = "",
  label,
  id,
  ...props
}) => (
  <div>
    {label && (
      <label htmlFor={id} style={{ display: "block", marginBottom: "4px" }}>
        {label}
      </label>
    )}
    <TextareaStyled
      id={id}
      className={`${className} ${error ? "error" : ""}`}
      aria-invalid={!!error}
      aria-describedby={
        error ? `${id}-error` : helperText ? `${id}-helper` : undefined
      }
      {...props}
    />
    {error && (
      <ErrorMessage id={`${id}-error`} role="alert">
        {error}
      </ErrorMessage>
    )}
    {helperText && !error && (
      <HelperText id={`${id}-helper`}>{helperText}</HelperText>
    )}
  </div>
);
