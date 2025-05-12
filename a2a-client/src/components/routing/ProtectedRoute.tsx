import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router";
import { useSupabase } from "../../contexts/SupabaseContext";
import { useTenant } from "../../contexts/TenantContext";
import styled from "styled-components";
import { api } from "../../api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const { setCurrentTenant } = useTenant();
  const queryClient = useQueryClient();

  // Check if user is registered
  const checkRegistrationQuery = useQuery({
    queryKey: ["isRegistered"],
    queryFn: () => api.epIsRegistered(),
    enabled: !!user && !loading,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: () => api.epRegisterUser(),
    retry: 1,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isRegistered"] });
    },
  });

  // useEffect to trigger registration if needed
  useEffect(() => {
    if (!user || loading) return; // Don't run if no user or auth is initially loading

    if (
      checkRegistrationQuery.isSuccess &&
      checkRegistrationQuery.data &&
      !checkRegistrationQuery.data.isRegistered &&
      !registerMutation.isPending &&
      !registerMutation.isSuccess && // Avoid re-triggering if just succeeded (wait for query refresh)
      !registerMutation.isError
    ) {
      registerMutation.mutate();
    }
  }, [
    user,
    loading,
    checkRegistrationQuery.isSuccess,
    checkRegistrationQuery.data,
    registerMutation.isPending,
    registerMutation.isSuccess,
    registerMutation.isError,
    registerMutation.mutate, // mutate function itself
  ]);

  // useEffect to reset tenant ID if user is registered but not on a tenant
  useEffect(() => {
    if (
      user &&
      !loading && // Ensure user is authenticated and auth is not loading
      checkRegistrationQuery.isSuccess &&
      checkRegistrationQuery.data &&
      checkRegistrationQuery.data.isRegistered && // User must be registered
      checkRegistrationQuery.data.isOnTenant === false // And not on a tenant
    ) {
      setCurrentTenant(null);
    }
  }, [
    user,
    loading,
    checkRegistrationQuery.isSuccess, // Re-run when query status changes
    checkRegistrationQuery.data, // Re-run when query data changes (specifically isRegistered or isOnTenant)
  ]);

  // --- Loading States and Early Exits ---
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

  // Show loading while checking registration status (initial load or if no data yet)
  if (checkRegistrationQuery.isLoading) {
    return (
      <LoadingContainer>
        <LoadingText>Checking registration status...</LoadingText>
      </LoadingContainer>
    );
  }

  // Show loading during registration mutation
  if (registerMutation.isPending) {
    return (
      <LoadingContainer>
        <LoadingText>Completing registration...</LoadingText>
      </LoadingContainer>
    );
  }

  // --- Error Handling ---
  if (checkRegistrationQuery.isError) {
    console.error(
      "ProtectedRoute: Failed to check registration status:",
      checkRegistrationQuery.error,
    );
    return (
      <LoadingContainer>
        <LoadingText>
          Failed to check registration. Please try again later.
        </LoadingText>
      </LoadingContainer>
    );
  }

  if (registerMutation.isError) {
    console.error(
      "ProtectedRoute: Registration mutation failed:",
      registerMutation.error,
    );
    return (
      <LoadingContainer>
        <LoadingText>
          Registration failed. Please try again later or contact support.
        </LoadingText>
      </LoadingContainer>
    );
  }
  console.log("location.pathname", location.pathname);

  // --- Logic based on fetched registration data ---
  if (checkRegistrationQuery.isSuccess && checkRegistrationQuery.data) {
    const { isRegistered, needToCreateTenant } = checkRegistrationQuery.data;

    if (!isRegistered) {
      // This state implies that registration hasn't completed or reflected in the query yet.
      // The useEffect for registration should be handling the mutation trigger.
      // The registerMutation.isPending state should cover active registration.
      // If we reach here, it's likely a brief moment before states align or mutation kicks in.
      return (
        <LoadingContainer>
          <LoadingText>Finalizing registration setup...</LoadingText>
        </LoadingContainer>
      );
    }

    // User is confirmed to be registered at this point.
    if (needToCreateTenant === true && location.pathname !== "/create-tenant") {
      return <Navigate to="/create-tenant" />;
    }

    // If user is registered and does not need to create a tenant, they can proceed.
    // The resetTenantId logic (if isOnTenant was false) is handled by the second useEffect.
    return <>{children}</>;
  }

  // Default fallback: Should ideally not be reached if logic is exhaustive.
  // Could indicate query success but data is unexpectedly null/undefined, or still fetching initial data.
  return (
    <LoadingContainer>
      <LoadingText>Connecting to application...</LoadingText>
    </LoadingContainer>
  );
};

export default ProtectedRoute;
