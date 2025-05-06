import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "../../contexts/SupabaseContext";
import { IoPersonCircle } from "react-icons/io5";

const SettingsContainer = styled.div`
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

const ProfileContainer = styled.div`
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

const OrganizationList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const OrganizationItem = styled.li`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:last-child {
    border-bottom: none;
  }
`;

const OrganizationName = styled.span`
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const OrganizationRole = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const LoadingMessage = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing.md};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing.md};
`;

interface Organization {
  id: string;
  name: string;
  role?: string;
}

const Settings = () => {
  const { user } = useSupabase();

  // Fetch user's organizations
  const {
    data: organizations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      // Simulating API call since the actual endpoint might not exist yet
      try {
        // This is a placeholder - replace with actual API call when available
        // const response = await api.epListTenants();
        // Mocked response
        return [
          { id: "1", name: "Organization 1", role: "Admin" },
          { id: "2", name: "Organization 2", role: "Member" },
        ] as Organization[];
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
        throw err;
      }
    },
  });

  // Extract user information
  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <SettingsContainer>
      <SectionTitle>User Settings</SectionTitle>

      <Card>
        <SectionTitle>Profile</SectionTitle>
        <ProfileContainer>
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
          </ProfileInfo>
        </ProfileContainer>
      </Card>

      <Card>
        <SectionTitle>Your Organizations</SectionTitle>

        {isLoading && (
          <LoadingMessage>Loading your organizations...</LoadingMessage>
        )}

        {error && (
          <ErrorMessage>
            Failed to load organizations. Please try again later.
          </ErrorMessage>
        )}

        {organizations && organizations.length > 0 ? (
          <OrganizationList>
            {organizations.map((org: Organization) => (
              <OrganizationItem key={org.id}>
                <OrganizationName>{org.name}</OrganizationName>
                <OrganizationRole>{org.role || "Member"}</OrganizationRole>
              </OrganizationItem>
            ))}
          </OrganizationList>
        ) : (
          !isLoading &&
          !error && (
            <LoadingMessage>
              You don't belong to any organizations yet.
            </LoadingMessage>
          )
        )}
      </Card>
    </SettingsContainer>
  );
};

export default Settings;
