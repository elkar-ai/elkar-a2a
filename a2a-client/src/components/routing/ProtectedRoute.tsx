import React, { useEffect } from "react";
import { Navigate } from "react-router";
import { useSupabase } from "../../contexts/SupabaseContext";
import styled from "styled-components";
import { api } from "../../api/api";
import { useQuery, useMutation } from "@tanstack/react-query";

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useSupabase();

  // Check if user is registered
  const checkRegistrationQuery = useQuery({
    queryKey: ["isRegistered", user?.id],
    queryFn: () => api.epIsRegistered(),
    enabled: !!user && !loading,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: () => api.epRegisterUser(),
    retry: 1,
  });

  // Handle registration process
  useEffect(() => {
    if (!user) return;

    // If registration check is successful and the user is not registered, register them
    if (
      checkRegistrationQuery.isSuccess &&
      checkRegistrationQuery.data && // Added safety check for data
      !checkRegistrationQuery.data.isRegistered
    ) {
      registerMutation.mutate();
    }
  }, [
    user,
    checkRegistrationQuery.isSuccess,
    checkRegistrationQuery.data,
    registerMutation,
  ]); // Added registerMutation

  // Skip loading if authentication is complete
  if (loading) {
    return (
      <LoadingContainer>
        <LoadingText>Loading authentication...</LoadingText>
      </LoadingContainer>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Show loading while checking registration status
  if (checkRegistrationQuery.isLoading) {
    return (
      <LoadingContainer>
        <LoadingText>Checking registration status...</LoadingText>
      </LoadingContainer>
    );
  }

  // Show loading during registration
  if (registerMutation.isPending) {
    return (
      <LoadingContainer>
        <LoadingText>Completing registration...</LoadingText>
      </LoadingContainer>
    );
  }

  // If registration is successful or the user is already registered, proceed
  if (
    checkRegistrationQuery.isSuccess &&
    checkRegistrationQuery.data && // Ensure data is present
    (checkRegistrationQuery.data.isRegistered || registerMutation.isSuccess)
  ) {
    return <>{children}</>;
  }

  // If registration process failed (error in check or mutation), deny access
  if (checkRegistrationQuery.isError || registerMutation.isError) {
    console.error(
      "Registration process failed:",
      checkRegistrationQuery.error || registerMutation.error
    );
    return (
      <LoadingContainer>
        <LoadingText>
          Failed to check registration. Please try again later or contact
          support.
        </LoadingText>
      </LoadingContainer>
    );
  }

  // Default loading state as fallback
  return (
    <LoadingContainer>
      <LoadingText>Connecting to application...</LoadingText>
    </LoadingContainer>
  );
};

export default ProtectedRoute;
