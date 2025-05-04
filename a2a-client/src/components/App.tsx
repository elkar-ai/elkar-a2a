import React from "react";

import styled from "styled-components";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../contexts/ThemeContext";
import { UrlProvider } from "../contexts/UrlContext";
import { TenantProvider } from "../contexts/TenantContext";
import { BrowserRouter as Router } from "react-router-dom";
import { GlobalStyles } from "../styles/GlobalStyles";

import Layout from "./layouts/Layout";
import MethodNav from "./features/MethodNav";
import SendTaskPanel from "./features/SendTaskPanel";
import AgentCard from "./features/AgentCard";
import { AppThemeProvider } from "../styles/ThemeProvider";
import { useUrl } from "../contexts/UrlContext";
import { ListTasks, ListAgents } from "./features";
import { SupabaseProvider } from "../contexts/SupabaseContext";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./routing/ProtectedRoute";
// import SupabaseTest from "./pages/SupabaseTest";
import ResetPassword from "./pages/ResetPassword";
// import { useQuery } from "@tanstack/react-query";
// import { api } from "../api/api";
import SettingsSidebar from "./features/SettingsSidebar";
import ProfileSettings from "./pages/settings/ProfileSettings";
import TenantsSettings from "./pages/settings/TenantsSettings";
import TenantUsersSettings from "./pages/settings/TenantUsersSettings";

const ServerUrlContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ServerUrlLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-weight: 500;
`;

const ServerUrlInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

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

// Add a component for the sidebar content to avoid repetition
const MainSidebarContent: React.FC = () => {
  const { endpoint, setEndpoint } = useUrl();

  return (
    <>
      <SidebarSection>
        <ServerUrlContainer>
          <ServerUrlLabel>Server URL</ServerUrlLabel>
          <ServerUrlInput
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="Enter server URL"
          />
        </ServerUrlContainer>
      </SidebarSection>
      <SidebarSection>
        <SidebarSectionTitle>Navigation</SidebarSectionTitle>
        <MethodNav />
      </SidebarSection>
    </>
  );
};

// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <UrlProvider>
        <ThemeProvider>
          <TenantProvider>
            <Router>
              <GlobalStyles />
              <AppThemeProvider>
                <SupabaseProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Main app routes */}
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<MainSidebarContent />}>
                            <SendTaskPanel />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/send-task"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<MainSidebarContent />}>
                            <SendTaskPanel />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/agent-card"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<MainSidebarContent />}>
                            <AgentCard />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/list-tasks"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<MainSidebarContent />}>
                            <ListTasks />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/list-agents"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<MainSidebarContent />}>
                            <ListAgents />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Settings routes with custom sidebar */}
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<SettingsSidebar />}>
                            <Navigate to="/settings/profile" replace />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/profile"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<SettingsSidebar />}>
                            <ProfileSettings />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/tenants"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<SettingsSidebar />}>
                            <TenantsSettings />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/tenant-users"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<SettingsSidebar />}>
                            <TenantUsersSettings />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </SupabaseProvider>
              </AppThemeProvider>
            </Router>
          </TenantProvider>
        </ThemeProvider>
      </UrlProvider>
    </QueryClientProvider>
  );
};

export default App;
