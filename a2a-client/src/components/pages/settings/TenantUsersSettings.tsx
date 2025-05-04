import React, { useState } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IoAdd } from "react-icons/io5";
import { FiUser } from "react-icons/fi";
import Modal from "../../common/Modal";
import { Form, FormGroup, Label, Input } from "../../common/Form";
import { PrimaryButton, SecondaryButton } from "../../common/Buttons";
import { api } from "../../../api/api";
import { TreeTable } from "../../common/AppTable";
import {
  ApplicationUserStatus,
  UnpaginatedOutputApplicationUserOutputRecordsInner as ApiUser,
} from "../../../../generated-api";

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
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

const UserName = styled.div`
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const UserEmail = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const UserStatus = styled.span<{ $status: ApplicationUserStatus }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ $status, theme }) =>
    $status === ApplicationUserStatus.Active
      ? `${theme.colors.success}20`
      : $status === ApplicationUserStatus.Invited
      ? `${theme.colors.warning}20`
      : `${theme.colors.error}20`};
  color: ${({ $status, theme }) =>
    $status === ApplicationUserStatus.Active
      ? theme.colors.success
      : $status === ApplicationUserStatus.Invited
      ? theme.colors.warning
      : theme.colors.error};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  text-transform: capitalize;
  font-weight: 500;
  display: inline-block;
`;

// Extend ApiUser with name property for display
interface ExtendedUser extends ApiUser {
  name: string; // Computed from firstName and lastName
}

interface InviteUserFormData {
  email: string;
}

const TenantUsersSettings: React.FC = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteUserData, setInviteUserData] = useState<InviteUserFormData>({
    email: "",
  });

  const queryClient = useQueryClient();

  // Fetch users
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        // Use the API to fetch users
        const response = await api.epRetrieveTenantUsers();

        // Map the API response to include a name field
        return (response.records || []).map((user) => ({
          ...user,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.email,
        }));
      } catch (err) {
        console.error("Failed to fetch users:", err);
        throw err;
      }
    },
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserFormData) => {
      // Send invitation using API endpoint
      const response = await api.epInviteUser({
        inviteUserInput: {
          email: data.email,
        },
      });

      return response;
    },
    onSuccess: () => {
      // Close invite modal and reset form
      setIsInviteModalOpen(false);
      setInviteUserData({
        email: "",
      });

      // Refetch users
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const openInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteUserData({
      email: "",
    });
  };

  const handleInviteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInviteUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserData.email.trim()) return;

    inviteUserMutation.mutate(inviteUserData);
  };

  // Modal footer buttons for inviting users
  const inviteModalFooter = (
    <>
      <SecondaryButton type="button" onClick={closeInviteModal}>
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
      title: "User",
      render: (user: ExtendedUser) => (
        <div>
          <UserName>
            <FiUser size={16} />
            {user.name}
          </UserName>
          <UserEmail>{user.email}</UserEmail>
        </div>
      ),
      sortable: true,
    },
    {
      key: "status",
      title: "Status",
      render: (user: ExtendedUser) => (
        <UserStatus $status={user.status}>{user.status}</UserStatus>
      ),
    },
  ];

  return (
    <Container>
      <HeaderContainer>
        <SectionTitle>Users</SectionTitle>
        <PrimaryButton onClick={openInviteModal}>
          <IoAdd /> Invite User
        </PrimaryButton>
      </HeaderContainer>

      {isLoadingUsers ? (
        <LoadingMessage>Loading users...</LoadingMessage>
      ) : usersError ? (
        <ErrorMessage>
          Failed to load users. Please try again later.
        </ErrorMessage>
      ) : users && users.length > 0 ? (
        <TreeTable
          data={users.map((user: ExtendedUser) => ({
            data: user,
            hasChildren: false,
          }))}
          columns={columns}
        />
      ) : (
        <LoadingMessage>No users available.</LoadingMessage>
      )}

      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={closeInviteModal}
        title="Invite User"
        footer={inviteModalFooter}
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
        </Form>
        {inviteUserMutation.isError && (
          <ErrorMessage>
            Failed to send invitation. Please try again later.
          </ErrorMessage>
        )}
      </Modal>
    </Container>
  );
};

export default TenantUsersSettings;
