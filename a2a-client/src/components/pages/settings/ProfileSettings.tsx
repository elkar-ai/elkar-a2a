import React from "react";
import styled from "styled-components";
import { useSupabase } from "../../../contexts/SupabaseContext";
import { IoPersonCircle } from "react-icons/io5";

const ProfileContainer = styled.div`
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

const ProfileInfoContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ProfileAvatar = styled.div<{ $hasImage: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  margin-right: ${({ theme }) => theme.spacing.lg};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text};
`;

const ProfileEmail = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ProfileDetail = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ProfileSettings: React.FC = () => {
  const { user } = useSupabase();

  // Extract user information
  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <ProfileContainer>
      <SectionTitle>Profile Settings</SectionTitle>

      <Card>
        <ProfileInfoContainer>
          <ProfileAvatar $hasImage={!!avatarUrl}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} />
            ) : (
              <IoPersonCircle size={50} />
            )}
          </ProfileAvatar>
          <ProfileInfo>
            <ProfileName>{displayName}</ProfileName>
            <ProfileEmail>{user?.email}</ProfileEmail>
            <ProfileDetail>User ID: {user?.id}</ProfileDetail>
            {user?.app_metadata?.provider && (
              <ProfileDetail>
                Login method: {user.app_metadata.provider}
              </ProfileDetail>
            )}
          </ProfileInfo>
        </ProfileInfoContainer>
      </Card>
    </ProfileContainer>
  );
};

export default ProfileSettings;
