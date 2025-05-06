import React from "react";
import styled from "styled-components";
import { useSupabase } from "../../contexts/SupabaseContext";
import { useNavigate } from "react-router";
import { IoLogOutOutline } from "react-icons/io5";

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.transparent};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: ${({ theme }) => theme.cursor};
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background-color: ${({ theme }) => theme.colors.error}10;
    color: ${({ theme }) => theme.colors.error};
    border-color: ${({ theme }) => theme.colors.error}30;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

interface LogoutButtonProps {
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
  const { signOut } = useSupabase();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error("Error during sign out:", error);
      }
      navigate("/login");
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      navigate("/login");
    }
  };

  return (
    <Button onClick={handleLogout} className={className}>
      <IoLogOutOutline size={16} />
      Logout
    </Button>
  );
};

export default LogoutButton;
