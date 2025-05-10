import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import {
  IoTrashOutline,
  IoCopyOutline,
  IoCheckmarkOutline,
} from "react-icons/io5";
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
} from "../agent-detail/styles";
import CreateApiKeyModal from "../agent-detail/CreateApiKeyModal";
import DeleteApiKeyModal from "../agent-detail/DeleteApiKeyModal";
import UserDisplay from "../../common/UserDisplay";
import toast from "react-hot-toast";

// Styled components for API key display
const KeyContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const KeyDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-family: monospace;
  overflow-x: auto;
  width: fit-content;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  position: relative;
`;

const KeyText = styled.div`
  overflow-x: auto;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textSecondary};
  letter-spacing: 0.5px;
  font-size: 14px;
  font-weight: 500;
  padding-right: ${({ theme }) => theme.spacing.md};
`;

const CopyButton = styled.button`
  background-color: ${({ theme }) => theme.colors.transparent};
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: ${({ theme }) => theme.cursor};
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}10;
  }
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

const ApiKeysSettings: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyOutput | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<CreateApiKeyInput>({
    name: "",
    agentId: undefined,
    expiresIn: undefined,
  });
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Query all API keys
  const apiKeysQuery = useQuery({
    queryKey: ["apiKeys"],
    queryFn: () =>
      api.epListApiKeys({
        listApiKeysInput: {},
      }),
  });

  // Mutation for creating a new API key
  const createApiKeyMutation = useMutation({
    mutationFn: (input: CreateApiKeyInput) => {
      return api.epCreateApiKey({ createApiKeyInput: input });
    },
    onSuccess: (data) => {
      setNewApiKey(data.apiKey || null);
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
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
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      closeDeleteModal();
    },
    onError: (error) => {
      console.error("Failed to delete API key:", error);
    },
  });

  // Handle API key creation form submission
  const handleCreateApiKey = (input: CreateApiKeyInput) => {
    setApiKeyInput(input);
    createApiKeyMutation.mutate(input);
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

  // Add copy function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy: ", err);
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
      key: "agent",
      title: "Agent",
      render: (apiKey: ApiKeyOutput) => {
        return apiKey.agentId ? <div>{apiKey.agentId}</div> : <div>-</div>;
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
              Your new API key ( save this, it won't be shown again ):
            </InfoLabel>
            <KeyDisplay>
              <KeyText>{newApiKey}</KeyText>
              <CopyButton onClick={() => copyToClipboard(newApiKey)}>
                {copied ? (
                  <IoCheckmarkOutline size={16} />
                ) : (
                  <IoCopyOutline size={16} />
                )}
              </CopyButton>
            </KeyDisplay>
          </KeyContainer>
        </Card>
      )}

      {apiKeys.length === 0 ? (
        <Card>
          <EmptyState>
            <EmptyStateText>
              No active API keys found. Generate a new API key to interact with
              the API programmatically.
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

export default ApiKeysSettings;
