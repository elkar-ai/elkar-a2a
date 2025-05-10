import React from "react";
import styled from "styled-components";

const ErrorContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.error}10;
  color: ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

interface ErrorMessageProps {
  message: string;
  id?: string;
  className?: string;
}

/**
 * A reusable error message component that displays error messages in a consistent style
 * with proper accessibility attributes.
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  id,
  className,
}) => {
  return (
    <ErrorContainer
      id={id}
      className={className}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </ErrorContainer>
  );
};

export default ErrorMessage;
