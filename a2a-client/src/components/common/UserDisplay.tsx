import React from "react";
import styled from "styled-components";
import { IoPersonCircle } from "react-icons/io5";
import { useUsers } from "../../hooks/useUsers";

const Container = styled.div<{ $compact: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1;
`;

const Avatar = styled.div<{ $hasImage: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserDetails = styled.div`
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LoadingPlaceholder = styled.div`
  width: 60px;
  height: 10px;
  background-color: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  opacity: 0.3;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 0.3;
    }
  }
`;

interface UserDisplayProps {
  application_user_id: string;
  compact?: boolean;
}

/**
 * Compact component to display user information
 */
const UserDisplay: React.FC<UserDisplayProps> = ({
  application_user_id,
  compact = true,
}) => {
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const userData = users.find((user) => user.id === application_user_id);

  const displayName = userData?.firstName || userData?.email;

  if (isLoadingUsers) {
    return (
      <Container $compact={compact}>
        <Avatar $hasImage={false}>
          <IoPersonCircle size={12} />
        </Avatar>
        <LoadingPlaceholder />
      </Container>
    );
  }

  return (
    <Container $compact={compact}>
      <Avatar $hasImage={false}>
        <IoPersonCircle size={12} />
      </Avatar>
      <UserDetails>
        <UserName>{displayName}</UserName>
      </UserDetails>
    </Container>
  );
};

export default UserDisplay;
