import React from "react";
import styled from "styled-components";
import { UseMutationResult } from "@tanstack/react-query";
import { ApiKeyOutput } from "../../../../generated-api";
import Modal from "../../common/Modal";
import { SecondaryButton, DangerButton } from "../../common/Buttons";

const ConfirmationText = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
`;

const ErrorContainer = styled.div`
  color: ${({ theme }) => theme.colors.error};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

interface DeleteApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: ApiKeyOutput | null;
  onDelete: () => void;
  deleteApiKeyMutation: UseMutationResult<void, Error, string, unknown>;
}

const DeleteApiKeyModal: React.FC<DeleteApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onDelete,
  deleteApiKeyMutation,
}) => {
  // Modal footer buttons for API key deletion
  const deleteModalFooter = (
    <>
      <SecondaryButton type="button" onClick={onClose}>
        Cancel
      </SecondaryButton>
      <DangerButton
        type="button"
        onClick={onDelete}
        disabled={deleteApiKeyMutation.isPending}
      >
        {deleteApiKeyMutation.isPending ? "Deleting..." : "Delete API Key"}
      </DangerButton>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete API Key"
      footer={deleteModalFooter}
    >
      <ConfirmationText>
        Are you sure you want to delete the API key "{apiKey?.name}"? This
        action cannot be undone.
      </ConfirmationText>
      {deleteApiKeyMutation.isError && (
        <ErrorContainer>
          Failed to delete API key. Please try again later.
        </ErrorContainer>
      )}
    </Modal>
  );
};

export default DeleteApiKeyModal;
