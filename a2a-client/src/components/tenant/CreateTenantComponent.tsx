import React, { useState } from "react";
import styled from "styled-components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "../../api/api"; // Assuming your API service is here
import toast from "react-hot-toast";
import { useTenant } from "../../contexts/TenantContext";

// Styled Components
const CreateTenantContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh; // Ensure it takes up significant screen space
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.background};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px; // Limit form width for better readability
  gap: ${({ theme }) => theme.spacing.md};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}33; // Subtle focus ring
  }
`;

const Button = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white; // Assuming primary button text is white for contrast
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`;

const MessageText = styled.p<{ error?: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme, error }) =>
    error ? theme.colors.error : theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const WelcomeText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  max-width: 600px;
  line-height: 1.5;
`;

// Component
const CreateTenantComponent: React.FC = () => {
  const [tenantName, setTenantName] = useState("");
  const navigate = useNavigate();
  const tenantContext = useTenant();
  const isRegisteredQuery = useQuery({
    queryKey: ["isRegistered"],
    queryFn: () => api.epIsRegistered(),
  });
  const createTenantMutation = useMutation({
    mutationFn: (name: string) =>
      api.epCreateTenant({ createTenantInput: { name } }),
    onSuccess: async (data) => {
      const result = await isRegisteredQuery.refetch();
      if (result.data?.needToCreateTenant) {
        toast.error("Internal error: please contact support");
        return;
      }
      tenantContext.setCurrentTenant(data);
      await tenantContext.refetchTenants();
      navigate("/");
    },
    onError: (error) => {
      console.error("Failed to create tenant:", error);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantName.trim()) {
      alert("Tenant name cannot be empty.");
      return;
    }
    createTenantMutation.mutate(tenantName);
  };

  return (
    <CreateTenantContainer>
      <Title>Welcome to Elkar</Title>
      <WelcomeText>
        To get started with Elkar, you'll need to create a tenant first. A
        tenant represents your organization or team workspace where all your
        data will be stored.
      </WelcomeText>
      <Form onSubmit={handleSubmit}>
        <Label htmlFor="tenantName">Tenant Name</Label>
        <Input
          id="tenantName"
          type="text"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          placeholder="Enter your organization or team name"
          disabled={createTenantMutation.isPending}
        />
        <Button type="submit" disabled={createTenantMutation.isPending}>
          {createTenantMutation.isPending ? "Creating..." : "Create Tenant"}
        </Button>
      </Form>
      {createTenantMutation.isError && (
        <MessageText error>
          Failed to create tenant:{" "}
          {createTenantMutation.error instanceof Error
            ? createTenantMutation.error.message
            : "Unknown error"}
        </MessageText>
      )}
      {createTenantMutation.isSuccess && (
        <MessageText>Tenant created successfully! Redirecting...</MessageText>
      )}
    </CreateTenantContainer>
  );
};

export default CreateTenantComponent;
