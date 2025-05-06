import React, { useState } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IoAdd, IoTrashOutline, IoPeopleOutline } from "react-icons/io5";
import { FiUser, FiBriefcase } from "react-icons/fi";
import Modal from "../../common/Modal";
import { Form, FormGroup, Label, Input } from "../../common/Form";
import {
  PrimaryButton,
  SecondaryButton,
  DangerButton,
} from "../../common/Buttons";
import { api } from "../../../api/api";
import { CreateTenantInput } from "../../../../generated-api";
import { TreeTable } from "../../common/AppTable";

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
  background-color: ${({ theme }) => theme.colors.errorLight};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
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

const ActionsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ConfirmationText = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
`;

const UsersList = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const UserItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const UserEmail = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const UserActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const UserRoleSelect = styled.select`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

interface Tenant {
  id: string;
  name: string;
  role?: string;
}

interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface NewTenantFormData {
  name: string;
}

interface InviteUserFormData {
  email: string;
  role: string;
}

const TenantsSettings: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] =
    useState(false);
  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState<NewTenantFormData>({ name: "" });
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [inviteUserData, setInviteUserData] = useState<InviteUserFormData>({
    email: "",
    role: "member",
  });
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

  // Fetch users for selected tenant
  const {
    data: tenantUsers,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["tenantUsers", selectedTenant?.id],
    queryFn: async () => {
      if (!selectedTenant) return [];

      try {
        // TODO: Replace with actual API call when available
        // Mocking user data for now
        await new Promise((resolve) => setTimeout(resolve, 500));
        return [
          {
            id: "1",
            email: "user1@example.com",
            name: "User One",
            role: "admin",
          },
          {
            id: "2",
            email: "user2@example.com",
            name: "User Two",
            role: "member",
          },
          {
            id: "3",
            email: "user3@example.com",
            name: "User Three",
            role: "member",
          },
        ];
      } catch (err) {
        console.error("Failed to fetch tenant users:", err);
        throw err;
      }
    },
    enabled: !!selectedTenant?.id,
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

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      // TODO: Replace with actual API call when backend endpoint is available
      // The epDeleteTenant endpoint doesn't exist yet, so we're mocking the deletion
      console.log(`Mock deletion of tenant with ID: ${tenantId}`);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Return a mock response
      return { success: true };
    },
    onSuccess: () => {
      // Close modal
      setIsDeleteModalOpen(false);
      setTenantToDelete(null);

      // For a real implementation, we would invalidate and refetch
      // For now, we'll manually filter out the deleted tenant from the local state
      if (tenantToDelete && tenants) {
        queryClient.setQueryData<{ records: Tenant[] }>(["tenants"], {
          records: tenants.filter((t: Tenant) => t.id !== tenantToDelete.id),
        });
      }
    },
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (data: {
      tenantId: string;
      userData: InviteUserFormData;
    }) => {
      // TODO: Replace with actual API call when available
      console.log(
        `Mock invitation to tenant ${data.tenantId} for user ${data.userData.email} with role ${data.userData.role}`
      );

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return { success: true };
    },
    onSuccess: () => {
      // Close invite modal and reset form
      setIsInviteUserModalOpen(false);
      setInviteUserData({ email: "", role: "member" });

      // Refetch users for the tenant
      queryClient.invalidateQueries({
        queryKey: ["tenantUsers", selectedTenant?.id],
      });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async (data: {
      tenantId: string;
      userId: string;
      role: string;
    }) => {
      // TODO: Replace with actual API call when available
      console.log(
        `Mock update of user ${data.userId} role to ${data.role} in tenant ${data.tenantId}`
      );

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return { success: true };
    },
    onSuccess: () => {
      // Refetch users for the tenant
      queryClient.invalidateQueries({
        queryKey: ["tenantUsers", selectedTenant?.id],
      });
    },
  });

  // Remove user from tenant mutation
  const removeUserMutation = useMutation({
    mutationFn: async (data: { tenantId: string; userId: string }) => {
      // TODO: Replace with actual API call when available
      console.log(
        `Mock removal of user ${data.userId} from tenant ${data.tenantId}`
      );

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return { success: true };
    },
    onSuccess: () => {
      // Refetch users for the tenant
      queryClient.invalidateQueries({
        queryKey: ["tenantUsers", selectedTenant?.id],
      });
    },
  });

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTenant({ name: "" });
  };

  const openDeleteModal = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTenantToDelete(null);
  };

  const openUserManagementModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsUserManagementModalOpen(true);
  };

  const closeUserManagementModal = () => {
    setIsUserManagementModalOpen(false);
    setSelectedTenant(null);
  };

  const openInviteUserModal = () => {
    setIsInviteUserModalOpen(true);
  };

  const closeInviteUserModal = () => {
    setIsInviteUserModalOpen(false);
    setInviteUserData({ email: "", role: "member" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTenant((prev) => ({ ...prev, [name]: value }));
  };

  const handleInviteInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInviteUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name.trim()) return;

    createTenantMutation.mutate(newTenant);
  };

  const handleDeleteTenant = () => {
    if (tenantToDelete) {
      deleteTenantMutation.mutate(tenantToDelete.id);
    }
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserData.email.trim() || !selectedTenant) return;

    inviteUserMutation.mutate({
      tenantId: selectedTenant.id,
      userData: inviteUserData,
    });
  };

  const handleUpdateUserRole = (userId: string, role: string) => {
    if (!selectedTenant) return;

    updateUserRoleMutation.mutate({
      tenantId: selectedTenant.id,
      userId,
      role,
    });
  };

  const handleRemoveUser = (userId: string) => {
    if (!selectedTenant) return;

    removeUserMutation.mutate({
      tenantId: selectedTenant.id,
      userId,
    });
  };

  // Modal footer buttons for tenant creation
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

  // Modal footer buttons for tenant deletion
  const deleteModalFooter = (
    <>
      <SecondaryButton type="button" onClick={closeDeleteModal}>
        Cancel
      </SecondaryButton>
      <DangerButton
        type="button"
        onClick={handleDeleteTenant}
        disabled={deleteTenantMutation.isPending}
      >
        {deleteTenantMutation.isPending ? "Deleting..." : "Delete Tenant"}
      </DangerButton>
    </>
  );

  // Modal footer buttons for user management
  const userManagementModalFooter = (
    <>
      <SecondaryButton type="button" onClick={closeUserManagementModal}>
        Close
      </SecondaryButton>
      <PrimaryButton type="button" onClick={openInviteUserModal}>
        <IoAdd /> Invite User
      </PrimaryButton>
    </>
  );

  // Modal footer buttons for inviting users
  const inviteUserModalFooter = (
    <>
      <SecondaryButton type="button" onClick={closeInviteUserModal}>
        Cancel
      </SecondaryButton>
      <PrimaryButton
        type="submit"
        form="invite-user-form"
        disabled={!inviteUserData.email.trim() || inviteUserMutation.isPending}
      >
        {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
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
    {
      key: "actions",
      title: "",
      render: (tenant: Tenant) => (
        <ActionsContainer>
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              openUserManagementModal(tenant);
            }}
            title="Manage users"
          >
            <IoPeopleOutline size={16} />
          </ActionButton>
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(tenant);
            }}
            title="Delete tenant"
          >
            <IoTrashOutline size={16} />
          </ActionButton>
        </ActionsContainer>
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

      {/* Delete Tenant Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete Tenant"
        footer={deleteModalFooter}
      >
        <ConfirmationText>
          Are you sure you want to delete the tenant "{tenantToDelete?.name}"?
          This action cannot be undone.
        </ConfirmationText>
        {deleteTenantMutation.isError && (
          <ErrorMessage>
            Failed to delete tenant. Please try again later.
          </ErrorMessage>
        )}
      </Modal>

      {/* User Management Modal */}
      <Modal
        isOpen={isUserManagementModalOpen}
        onClose={closeUserManagementModal}
        title={`Manage Users - ${selectedTenant?.name}`}
        footer={userManagementModalFooter}
      >
        {isLoadingUsers ? (
          <LoadingMessage>Loading users...</LoadingMessage>
        ) : usersError ? (
          <ErrorMessage>
            Failed to load users. Please try again later.
          </ErrorMessage>
        ) : tenantUsers && tenantUsers.length > 0 ? (
          <UsersList>
            {tenantUsers.map((user: TenantUser) => (
              <UserItem key={user.id}>
                <UserInfo>
                  <FiUser size={16} />
                  <div>
                    <div>{user.name}</div>
                    <UserEmail>{user.email}</UserEmail>
                  </div>
                </UserInfo>
                <UserActions>
                  <UserRoleSelect
                    value={user.role}
                    onChange={(e) =>
                      handleUpdateUserRole(user.id, e.target.value)
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="guest">Guest</option>
                  </UserRoleSelect>
                  <ActionButton
                    onClick={() => handleRemoveUser(user.id)}
                    title="Remove user"
                  >
                    <IoTrashOutline size={16} />
                  </ActionButton>
                </UserActions>
              </UserItem>
            ))}
          </UsersList>
        ) : (
          <LoadingMessage>No users in this tenant yet.</LoadingMessage>
        )}
      </Modal>

      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteUserModalOpen}
        onClose={closeInviteUserModal}
        title="Invite User"
        footer={inviteUserModalFooter}
      >
        <Form id="invite-user-form" onSubmit={handleInviteUser}>
          <FormGroup>
            <Label htmlFor="email">Email Address*</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={inviteUserData.email}
              onChange={handleInviteInputChange}
              placeholder="Enter email address"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="role">Role</Label>
            <UserRoleSelect
              id="role"
              name="role"
              value={inviteUserData.role}
              onChange={handleInviteInputChange}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </UserRoleSelect>
          </FormGroup>
        </Form>
        {inviteUserMutation.isError && (
          <ErrorMessage>
            Failed to send invitation. Please try again later.
          </ErrorMessage>
        )}
      </Modal>
    </TenantsContainer>
  );
};

export default TenantsSettings;
