import React from "react";

import styled from "styled-components";
import { Routes, Route, Navigate, NavLink } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../contexts/ThemeContext";
import { UrlProvider } from "../contexts/UrlContext";
import { TenantProvider } from "../contexts/TenantContext";
import { BrowserRouter as Router } from "react-router";
import { GlobalStyles } from "../styles/GlobalStyles";

import Layout from "./layouts/Layout";
import MethodNav from "./features/MethodNav";
import SendTaskPanel from "./features/SendTaskPanel";
import AgentCard from "./features/AgentCard";
import { AppThemeProvider } from "../styles/ThemeProvider";
import { ListAgents } from "./features";
import { SupabaseProvider } from "../contexts/SupabaseContext";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./routing/ProtectedRoute";
import ResetPassword from "./pages/ResetPassword";
import SettingsSidebar from "./features/SettingsSidebar";
import ProfileSettings from "./pages/settings/ProfileSettings";
import TenantsSettings from "./pages/settings/TenantsSettings";
import TenantUsersSettings from "./pages/settings/TenantUsersSettings";
import AgentDetail from "./pages/agent-detail";
import TaskDetailPage from "./pages/task-detail/TaskDetailPage";
import ThemedToaster from "./common/ThemedToaster";
import A2ADebuggerPage from "./pages/A2ADebuggerPage";
import UpdatePassword from "./pages/UpdatePassword";

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
  display: block;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }

  &.active {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    font-weight: 500;
  }
`;

const MainSidebarContent: React.FC = () => {
  return (
    <>
      <SidebarSection>
        <SidebarSectionTitle>Navigation</SidebarSectionTitle>
        <StyledNavLink to="/list-agents">Agents</StyledNavLink>
        <StyledNavLink to="/a2a-debugger">A2A Debugger</StyledNavLink>
        <StyledNavLink to="/settings">Settings</StyledNavLink>
      </SidebarSection>
    </>
  );
};

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <UrlProvider>
        <SupabaseProvider>
          <ThemeProvider>
            <TenantProvider>
              <Router>
                <GlobalStyles />
                <AppThemeProvider>
                  <ThemedToaster />
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route
                      path="/update-password"
                      element={<UpdatePassword />}
                    />

                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<MainSidebarContent />}>
                            <A2ADebuggerPage />
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
                      path="/list-agents"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<MainSidebarContent />}>
                            <ListAgents />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/agents/:id"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<MainSidebarContent />}>
                            <AgentDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/task/:taskId"
                      element={
                        <ProtectedRoute>
                          <Layout sidebar={<MainSidebarContent />}>
                            <TaskDetailPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

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
                </AppThemeProvider>
              </Router>
            </TenantProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </UrlProvider>
    </QueryClientProvider>
  );
};

export default App;
