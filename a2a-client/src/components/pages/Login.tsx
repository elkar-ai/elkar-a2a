import React, { useState } from "react";
import styled from "styled-components";
import { useSupabase } from "../../contexts/SupabaseContext";
import { Navigate, Link } from "react-router";
import { FcGoogle } from "react-icons/fc";
import {
  IoMailOutline,
  IoLockClosedOutline,
  IoLogInOutline,
  IoPersonAddOutline,
} from "react-icons/io5";
import toast, { Toaster } from "react-hot-toast";

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const LoginCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 400px;
`;

const LoginTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
`;

const LoginSubtitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  font-weight: 500;
`;

const SocialButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}40;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: ${({ theme }) => theme.spacing.lg} 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.border};
  }

  span {
    padding: 0 ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}40;
    outline: none;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 500;
  cursor: ${({ theme }) => theme.cursor};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ForgotPassword = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: right;
  text-decoration: none;
  margin-top: ${({ theme }) => theme.spacing.xs};
  display: block;

  &:hover {
    text-decoration: underline;
  }
`;

const ToggleView = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const ToggleButton = styled.button`
  background: ${({ theme }) => theme.colors.transparent};
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: ${({ theme }) => theme.cursor};

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

type AuthView = "signin" | "signup";

const Login: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    user,
    loading,
  } = useSupabase();
  const [view, setView] = useState<AuthView>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is already logged in, redirect to home page
  if (user && !loading) {
    return <Navigate to="/" />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError("Email and password are required");
      setIsLoading(false);
      return;
    }

    try {
      if (view === "signin") {
        const { error } = await signInWithPassword(email, password);
        if (error) {
          setError(error.message);
        }
      } else {
        const { error } = await signUpWithPassword(email, password);

        if (error) {
          setError(
            error.message ||
              "Registration failed. Please try again or contact support."
          );
        } else {
          toast.success("Registration successful! Please sign in.");
          setView("signin");
          setEmail("");
          setPassword("");
          setError(null);
        }
      }
    } catch (err) {
      console.error("Unexpected auth error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setView(view === "signin" ? "signup" : "signin");
    setError(null);
  };

  return (
    <LoginContainer>
      <Toaster position="top-center" reverseOrder={false} />
      <LoginCard>
        <LoginTitle>Welcome</LoginTitle>
        <LoginSubtitle>
          {view === "signin"
            ? "Sign in to your account"
            : "Create a new account"}
        </LoginSubtitle>

        <SocialButton onClick={signInWithGoogle}>
          <FcGoogle size={20} />
          Continue with Google
        </SocialButton>

        <Divider>
          <span>OR</span>
        </Divider>

        <Form onSubmit={handleEmailAuth}>
          <InputGroup>
            <InputIcon>
              <IoMailOutline size={18} />
            </InputIcon>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </InputGroup>

          <InputGroup>
            <InputIcon>
              <IoLockClosedOutline size={18} />
            </InputIcon>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </InputGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {view === "signin" && (
            <ForgotPassword to="/reset-password">
              Forgot password?
            </ForgotPassword>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              "Processing..."
            ) : view === "signin" ? (
              <>
                <IoLogInOutline size={18} />
                Sign In
              </>
            ) : (
              <>
                <IoPersonAddOutline size={18} />
                Create Account
              </>
            )}
          </Button>
        </Form>

        <ToggleView>
          {view === "signin" ? (
            <>
              Don't have an account?{" "}
              <ToggleButton onClick={toggleView}>Sign up</ToggleButton>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <ToggleButton onClick={toggleView}>Sign in</ToggleButton>
            </>
          )}
        </ToggleView>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
