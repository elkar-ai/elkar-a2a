import React, { useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import { IoTrashOutline } from "react-icons/io5";
import { TreeTable } from "../../common/AppTable";
import { api } from "../../../api/api";
import { ApiKeyOutput, CreateApiKeyInput } from "../../../../generated-api";
import {
  Card,
  SectionTitle,
  EmptyState,
  EmptyStateText,
  Button,
  InfoLabel,
} from "./styles";
import CreateApiKeyModal from "./CreateApiKeyModal";
import DeleteApiKeyModal from "./DeleteApiKeyModal";
import UserDisplay from "../../common/UserDisplay";

// Styled components for API key display
const KeyContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const KeyDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-family: monospace;
  overflow-x: auto;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ErrorContainer = styled.div`
  color: ${({ theme }) => theme.colors.error};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ActionButton = styled.button`
  background-color: ${({ theme }) => theme.colors.transparent};
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: ${({ theme }) => theme.cursor};
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${({ theme }) => theme.colors.error}10;
    color: ${({ theme }) => theme.colors.error};
  }
`;

const ApiKeySection: React.FC = () => {
  const { id: agentId } = useParams<{ id: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyOutput | null>(null);
  const queryClient = useQueryClient();

  // Query API keys for the current agent
  const apiKeysQuery = useQuery({
    queryKey: ["apiKeys", agentId],
    queryFn: () =>
      api.epListApiKeys({
        listApiKeysInput: {
          agentIdIn: agentId ? [agentId] : undefined,
        },
      }),
    enabled: !!agentId,
  });

  // Mutation for creating a new API key
  const createApiKeyMutation = useMutation({
    mutationFn: (params: { name: string; expiresIn?: number }) => {
      const createInput: CreateApiKeyInput = {
        name: params.name,
        agentId,
        expiresIn: params.expiresIn,
      };
      return api.epCreateApiKey({ createApiKeyInput: createInput });
    },
    onSuccess: (data) => {
      // Store the key for display (it won't be retrievable again)
      setNewApiKey(data.apiKey || null);
      // Invalidate the API keys query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["apiKeys", agentId] });
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error("Failed to create API key:", error);
    },
  });

  // Mutation for deleting an API key
  const deleteApiKeyMutation = useMutation({
    mutationFn: (id: string) => {
      return api.epDeleteApiKey({ id });
    },
    onSuccess: () => {
      // Invalidate the API keys query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["apiKeys", agentId] });
      closeDeleteModal();
    },
    onError: (error) => {
      console.error("Failed to delete API key:", error);
    },
  });

  // Handle API key creation form submission
  const handleCreateApiKey = (name: string, expiresIn?: number) => {
    createApiKeyMutation.mutate({
      name,
      expiresIn,
    });
  };

  // Handle opening delete modal
  const openDeleteModal = (apiKey: ApiKeyOutput) => {
    setKeyToDelete(apiKey);
    setIsDeleteModalOpen(true);
  };

  // Handle closing delete modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setKeyToDelete(null);
  };

  // Handle API key deletion
  const handleDeleteApiKey = () => {
    if (keyToDelete) {
      deleteApiKeyMutation.mutate(keyToDelete.id);
    }
  };

  const columns = [
    {
      key: "name",
      title: "Name",
      render: (apiKey: ApiKeyOutput) => {
        return <div>{apiKey.name}</div>;
      },
    },
    {
      key: "createdBy",
      title: "Created By",
      render: (apiKey: ApiKeyOutput) => {
        return apiKey.createdBy ? (
          <UserDisplay application_user_id={apiKey.createdBy} />
        ) : (
          <div>-</div>
        );
      },
    },
    {
      key: "createdAt",
      title: "Created",
      render: (apiKey: ApiKeyOutput) => {
        return (
          <div>
            {apiKey.createdAt
              ? new Date(apiKey.createdAt).toLocaleDateString()
              : "-"}
          </div>
        );
      },
    },
    {
      key: "expiresAt",
      title: "Expires",
      render: (apiKey: ApiKeyOutput) => {
        return (
          <div>
            {apiKey.expiresAt
              ? new Date(apiKey.expiresAt).toLocaleDateString()
              : "Never"}
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "",
      render: (apiKey: ApiKeyOutput) => {
        return (
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(apiKey);
            }}
            title="Delete API key"
          >
            <IoTrashOutline size={16} />
          </ActionButton>
        );
      },
    },
  ];

  // Handle loading state
  if (apiKeysQuery.isLoading) {
    return (
      <div>
        <HeaderContainer>
          <SectionTitle>API Keys</SectionTitle>
        </HeaderContainer>
        <Card>
          <LoadingContainer>Loading API keys...</LoadingContainer>
        </Card>
      </div>
    );
  }

  // Handle error state
  if (apiKeysQuery.isError) {
    return (
      <div>
        <HeaderContainer>
          <SectionTitle>API Keys</SectionTitle>
          <Button onClick={() => setIsModalOpen(true)}>
            Generate new API key
          </Button>
        </HeaderContainer>
        <Card>
          <ErrorContainer>
            Error loading API keys: {(apiKeysQuery.error as Error).message}
          </ErrorContainer>
        </Card>

        <CreateApiKeyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateApiKey}
          isSubmitting={createApiKeyMutation.isPending}
        />
      </div>
    );
  }

  const apiKeys = apiKeysQuery.data?.records || [];

  return (
    <div>
      <HeaderContainer>
        <SectionTitle>API Keys</SectionTitle>
        <Button
          onClick={() => setIsModalOpen(true)}
          disabled={createApiKeyMutation.isPending}
        >
          Generate new API key
        </Button>
      </HeaderContainer>

      {newApiKey && (
        <Card>
          <KeyContainer>
            <InfoLabel>
              Your new API key (save this, it won't be shown again):
            </InfoLabel>
            <KeyDisplay>{newApiKey}</KeyDisplay>
          </KeyContainer>
        </Card>
      )}

      {apiKeys.length === 0 ? (
        <Card>
          <EmptyState>
            <EmptyStateText>
              No active API keys found. Generate a new API key to interact with
              this agent programmatically.
            </EmptyStateText>
          </EmptyState>
        </Card>
      ) : (
        <Card>
          <TreeTable
            data={apiKeys.map((key) => ({
              data: key,
              hasChildren: false,
            }))}
            onRowClick={(key) => {
              console.log("Selected API key:", key);
            }}
            columns={columns}
          />
        </Card>
      )}

      <CreateApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateApiKey}
        isSubmitting={createApiKeyMutation.isPending}
      />

      <DeleteApiKeyModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        apiKey={keyToDelete}
        onDelete={handleDeleteApiKey}
        deleteApiKeyMutation={deleteApiKeyMutation}
      />
    </div>
  );
};

export default ApiKeySection;
