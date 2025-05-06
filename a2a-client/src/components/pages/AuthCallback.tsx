import React, { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { useSupabase } from "../../contexts/SupabaseContext";
import styled from "styled-components";

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

const AuthCallback: React.FC = () => {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have a session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!data.session) {
          // If no session, try to exchange the code for a session
          const { error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
        }
      } catch (e) {
        console.error("Error during auth callback:", e);
        setError(e instanceof Error ? e.message : "Authentication error");
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [supabase]);

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingText>Completing authentication, please wait...</LoadingText>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <LoadingContainer>
        <LoadingText>Authentication error: {error}</LoadingText>
      </LoadingContainer>
    );
  }

  // Redirect to home on successful auth
  return <Navigate to="/" />;
};

export default AuthCallback;
