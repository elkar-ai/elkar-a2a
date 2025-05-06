import React, { useState } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IoAdd } from "react-icons/io5";
import { FiUser, FiBriefcase } from "react-icons/fi";
import Modal from "./common/Modal";
import { Form, FormGroup, Label, Input } from "./common/Form";
import { PrimaryButton, SecondaryButton } from "./common/Buttons";
import { api } from "../api/api";
import { CreateTenantInput } from "../../generated-api";
import { TreeTable } from "./common/AppTable";

const TenantsContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
`;

const TenantName = styled.div`
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TenantRole = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100px;
  white-space: nowrap;
`;

const LoadingMessage = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: rgba(255, 0, 0, 0.05);
  margin-bottom: ${({ theme }) => theme.spacing.md};
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

  // Define table columns
  const columns = [
    {
      key: "name",
      title: "Tenant Name",
      render: (tenant: Tenant) => (
        <TenantName>
          <FiBriefcase />
          {tenant.name}
        </TenantName>
      ),
      sortable: true,
    },
    {
      key: "role",
      title: "Role",
      render: (tenant: Tenant) => (
        <TenantRole>
          <FiUser size={12} />
          {tenant.role || "Member"}
        </TenantRole>
      ),
    },
  ];

  return (
    <TenantsContainer>
      <HeaderContainer>
        <SectionTitle>Tenants</SectionTitle>
        <PrimaryButton onClick={openModal}>
          <IoAdd /> Create Tenant
        </PrimaryButton>
      </HeaderContainer>

      {error && (
        <ErrorMessage>
          Failed to load tenants. Please try again later.
        </ErrorMessage>
      )}

      {isLoading ? (
        <LoadingMessage>Loading your tenants...</LoadingMessage>
      ) : tenants && tenants.length > 0 ? (
        <TreeTable
          data={tenants.map((tenant: Tenant) => ({
            data: tenant,
            hasChildren: false,
          }))}
          columns={columns}
          onRowClick={(tenant) => console.log("Selected tenant:", tenant)}
        />
      ) : (
        !error && (
          <LoadingMessage>You don't belong to any tenants yet.</LoadingMessage>
        )
      )}

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
