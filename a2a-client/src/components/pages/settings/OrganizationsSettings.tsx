import React, { useState } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IoAdd } from "react-icons/io5";
import Modal from "../../common/Modal";
import { Form, FormGroup, Label, Input } from "../../common/Form";
import { PrimaryButton, SecondaryButton } from "../../common/Buttons";
import { api } from "../../../api/api";
import { CreateTenantInput } from "../../../../generated-api";

const TenantsContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TenantList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const TenantItem = styled.li`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:last-child {
    border-bottom: none;
  }
`;

const TenantName = styled.span`
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const TenantRole = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const LoadingMessage = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing.md};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing.md};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

interface Tenant {
  id: string;
  name: string;
  role?: string;
}

interface NewTenantFormData {
  name: string;
}

const TenantsSettings: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState<NewTenantFormData>({ name: "" });
  const queryClient = useQueryClient();

  // Fetch user's tenants
  const {
    data: tenants,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      try {
        const response = await api.epRetrieveTenants();
        return response.records || [];
      } catch (err) {
        console.error("Failed to fetch tenants:", err);
        throw err;
      }
    },
  });

  // Create new tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (data: NewTenantFormData) => {
      const tenantInput: CreateTenantInput = {
        name: data.name,
      };

      const response = await api.epCreateTenant({
        createTenantInput: tenantInput,
      });

      return response;
    },
    onSuccess: (newTenant) => {
      // Update the tenants query data
      queryClient.setQueryData<Tenant[]>(["tenants"], (oldData) =>
        oldData ? [...oldData, newTenant] : [newTenant]
      );

      // Close modal and reset form
      setIsModalOpen(false);
      setNewTenant({ name: "" });

      // Invalidate and refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTenant({ name: "" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTenant((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name.trim()) return;

    createTenantMutation.mutate(newTenant);
  };

  // Modal footer buttons
  const modalFooter = (
    <>
      <SecondaryButton type="button" onClick={closeModal}>
        Cancel
      </SecondaryButton>
      <PrimaryButton
        type="submit"
        form="create-tenant-form"
        disabled={!newTenant.name.trim() || createTenantMutation.isPending}
      >
        {createTenantMutation.isPending ? "Creating..." : "Create Tenant"}
      </PrimaryButton>
    </>
  );

  return (
    <TenantsContainer>
      <HeaderContainer>
        <SectionTitle>Tenants</SectionTitle>
        <PrimaryButton onClick={openModal}>
          <IoAdd /> Create Tenant
        </PrimaryButton>
      </HeaderContainer>

      <Card>
        {isLoading && <LoadingMessage>Loading your tenants...</LoadingMessage>}

        {error && (
          <ErrorMessage>
            Failed to load tenants. Please try again later.
          </ErrorMessage>
        )}

        {tenants && tenants.length > 0 ? (
          <TenantList>
            {tenants.map((tenant: Tenant) => (
              <TenantItem key={tenant.id}>
                <TenantName>{tenant.name}</TenantName>
                <TenantRole>{tenant.role || "Member"}</TenantRole>
              </TenantItem>
            ))}
          </TenantList>
        ) : (
          !isLoading &&
          !error && (
            <LoadingMessage>
              You don't belong to any tenants yet.
            </LoadingMessage>
          )
        )}
      </Card>

      {/* Create Tenant Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Create New Tenant"
        footer={modalFooter}
      >
        <Form id="create-tenant-form" onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Tenant Name*</Label>
            <Input
              id="name"
              name="name"
              value={newTenant.name}
              onChange={handleInputChange}
              placeholder="Enter tenant name"
              required
            />
          </FormGroup>
        </Form>
      </Modal>
    </TenantsContainer>
  );
};

export default TenantsSettings;
