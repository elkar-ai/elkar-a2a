import React from "react";
import styled from "styled-components";

interface ErrorMessageProps {
  message: string;
}

const ErrorContainer = styled.div`
  background-color: #fee2e2;
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border-left: 4px solid ${({ theme }) => theme.colors.error};
`;

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return <ErrorContainer>{message}</ErrorContainer>;
};

export default ErrorMessage;
