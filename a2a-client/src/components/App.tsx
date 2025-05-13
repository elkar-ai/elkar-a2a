import React from "react";
import styled from "styled-components";
import { Routes, Route, Navigate, NavLink, BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../contexts/ThemeContext";
import { UrlProvider } from "../contexts/UrlContext";
import { TenantProvider } from "../contexts/TenantContext";
import { GlobalStyles } from "../styles/GlobalStyles";
import { RiRobot2Line } from "react-icons/ri";
import {
  IoSettingsOutline,
  IoCodeSlashOutline,
  IoHelpCircleOutline,
  IoKeyOutline,
} from "react-icons/io5";
import { SiDiscord } from "react-icons/si";

// Layout components
import Layout from "./layouts/Layout";
import SecondarySidebarLayout from "./layouts/SecondarySidebarLayout";

// Context providers
import { AppThemeProvider } from "../styles/ThemeProvider";
import { SupabaseProvider } from "../contexts/SupabaseContext";

// Features
import { ListAgents } from "./features";
import AgentSidebar from "./features/AgentSidebar";
import AgentDashboard from "./features/AgentDashboard";
import SettingsSidebar from "./features/SettingsSidebar";

// Pages
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import ProfileSettings from "./pages/settings/ProfileSettings";
import TenantsSettings from "./pages/settings/TenantsSettings";
import TenantUsersSettings from "./pages/settings/TenantUsersSettings";
import AgentDetail from "./pages/agent-detail";
import AgentPage from "./pages/AgentPage";
import TaskDetailPage from "./pages/task-detail/TaskDetailPage";
import A2ADebuggerPage from "./pages/A2ADebuggerPage";
import ApiKeysSettings from "./pages/settings/ApiKeysSettings";
import CreateTenantComponent from "./tenant/CreateTenantComponent";

// Common components
import ThemedToaster from "./common/ThemedToaster";
import ProtectedRoute from "./routing/ProtectedRoute";

// Styled components
const SidebarSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SidebarSectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 600;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  transition: all 0.2s ease;
  font-weight: 400;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primary};
  }

  &.active {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 500;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: currentColor;
`;

const LinkText = styled.span`
  flex: 1;
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const HelpLink = styled.a`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all 0.2s ease;
  font-weight: 400;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

interface MainSidebarContentProps {
  className?: string;
}

/**
 * Main sidebar content component that provides navigation links and help section.
 */
export const MainSidebarContent: React.FC<MainSidebarContentProps> = ({
  className,
}) => {
  return (
    <>
      <SidebarSection>
        <SidebarSectionTitle>Navigation</SidebarSectionTitle>
        <StyledNavLink to="/agents" aria-label="View agents">
          <IconWrapper>
            <RiRobot2Line size={18} aria-hidden="true" />
          </IconWrapper>
          <LinkText>Agents</LinkText>
        </StyledNavLink>
        <StyledNavLink to="/a2a-debugger" aria-label="Open A2A debugger">
          <IconWrapper>
            <IoCodeSlashOutline size={18} aria-hidden="true" />
          </IconWrapper>
          <LinkText>A2A Debugger</LinkText>
        </StyledNavLink>
        <StyledNavLink to="/api-keys" aria-label="Manage API keys">
          <IconWrapper>
            <IoKeyOutline size={18} aria-hidden="true" />
          </IconWrapper>
          <LinkText>API Keys</LinkText>
        </StyledNavLink>
        <StyledNavLink to="/settings" aria-label="Open settings">
          <IconWrapper>
            <IoSettingsOutline size={18} aria-hidden="true" />
          </IconWrapper>
          <LinkText>Settings</LinkText>
        </StyledNavLink>
      </SidebarSection>

      <SidebarFooter>
        <HelpLink
          href="https://discord.gg/HDB4rkqn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join Discord for help and support"
        >
          <IconWrapper>
            <SiDiscord size={18} aria-hidden="true" />
          </IconWrapper>
          <LinkText>Help / Support</LinkText>
        </HelpLink>
      </SidebarFooter>
    </>
  );
};

// Create a single instance of QueryClient with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Router = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout sidebar={<MainSidebarContent />}>
              <Navigate to="/agents" replace />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/a2a-debugger"
        element={
          <ProtectedRoute>
            <Layout sidebar={<MainSidebarContent />}>
              <A2ADebuggerPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/api-keys"
        element={
          <ProtectedRoute>
            <Layout sidebar={<MainSidebarContent />}>
              <ApiKeysSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agents"
        element={
          <ProtectedRoute>
            <AgentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agents/:id"
        element={
          <ProtectedRoute>
            <AgentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/task/:taskId"
        element={
          <ProtectedRoute>
            <TaskDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-tenant"
        element={
          <ProtectedRoute>
            <CreateTenantComponent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SecondarySidebarLayout secondarySidebar={<SettingsSidebar />}>
              <Navigate to="/settings/profile" replace />
            </SecondarySidebarLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/profile"
        element={
          <ProtectedRoute>
            <SecondarySidebarLayout secondarySidebar={<SettingsSidebar />}>
              <ProfileSettings />
            </SecondarySidebarLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/tenants"
        element={
          <ProtectedRoute>
            <SecondarySidebarLayout secondarySidebar={<SettingsSidebar />}>
              <TenantsSettings />
            </SecondarySidebarLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/tenant-users"
        element={
          <ProtectedRoute>
            <SecondarySidebarLayout secondarySidebar={<SettingsSidebar />}>
              <TenantUsersSettings />
            </SecondarySidebarLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/api-keys"
        element={
          <ProtectedRoute>
            <SecondarySidebarLayout secondarySidebar={<SettingsSidebar />}>
              <ApiKeysSettings />
            </SecondarySidebarLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const A2ADebuggerContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 100px;
  height: 100%;
`;

/**
 * Root application component that sets up providers, routing, and global styles.
 */
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <UrlProvider>
        <SupabaseProvider>
          <ThemeProvider>
            <TenantProvider>
              <BrowserRouter>
                <GlobalStyles />
                <AppThemeProvider>
                  <ThemedToaster />
                  {import.meta.env.VITE_A2A_DEBUGGER === "true" ? (
                    <A2ADebuggerContainer>
                      <A2ADebuggerPage />
                    </A2ADebuggerContainer>
                  ) : (
                    <Router />
                  )}
                </AppThemeProvider>
              </BrowserRouter>
            </TenantProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </UrlProvider>
    </QueryClientProvider>
  );
};

export default App;
