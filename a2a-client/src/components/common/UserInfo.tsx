import React from "react";
import styled from "styled-components";
import { useSupabase } from "../../contexts/SupabaseContext";
import { IoPersonCircle } from "react-icons/io5";

const Container = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Avatar = styled.div<{ hasImage: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: ${({ theme }) => theme.spacing.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserEmail = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserInfo: React.FC = () => {
  const { user } = useSupabase();

  if (!user) return null;

  // Determine display name - use user metadata name if available, or email
  const displayName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User";
  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;

  return (
    <Container>
      <Avatar hasImage={!!avatarUrl}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} />
        ) : (
          <IoPersonCircle size={20} />
        )}
      </Avatar>
      <UserDetails>
        <UserName>{displayName}</UserName>
        {user.email && <UserEmail>{user.email}</UserEmail>}
      </UserDetails>
    </Container>
  );
};

export default UserInfo;
