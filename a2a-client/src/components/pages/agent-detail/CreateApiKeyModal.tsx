import React, { useState } from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 500px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  padding: ${({ theme }) => theme.spacing.xs};
  transition: all 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
    outline: none;
  }
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
    outline: none;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const CancelButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: white;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}dd`};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.border};
    cursor: not-allowed;
  }
`;

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, expiresIn?: number) => void;
  isSubmitting: boolean;
}

// Duration options (display value and corresponding seconds)
const expirationOptions = [
  { value: "", label: "Never expires", seconds: undefined },
  { value: "30d", label: "30 days", seconds: 30 * 24 * 60 * 60 },
  { value: "90d", label: "90 days", seconds: 90 * 24 * 60 * 60 },
  {
    value: "180d",
    label: "180 days",
    seconds: 180 * 24 * 60 * 60,
  },
  { value: "365d", label: "1 year", seconds: 365 * 24 * 60 * 60 },
];

const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [name, setName] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert duration to seconds if a value is selected
    let durationInSeconds: number | undefined = undefined;
    if (expiresIn) {
      const selectedOption = expirationOptions.find(
        (option) => option.value === expiresIn
      );
      durationInSeconds = selectedOption?.seconds;
    }

    onSubmit(name, durationInSeconds);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>Create API Key</Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter API key name"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="expiration">Expiration</Label>
            <Select
              id="expiration"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
            >
              {expirationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormGroup>
          <Actions>
            <CancelButton
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={!name || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create API Key"}
            </SubmitButton>
          </Actions>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateApiKeyModal;
