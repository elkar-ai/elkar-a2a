import React, { useState, useRef, useEffect } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import styled from "styled-components";
import { useSupabase } from "../../contexts/SupabaseContext";
import {
  IoPersonCircle,
  IoLogOutOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router";

const Container = styled.div`
  position: relative;
  z-index: 100;
`;

const DropdownToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: box-shadow 0.2s;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}40;
  }
`;

const AvatarContainer = styled.div<{ $hasImage: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 200px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
  z-index: 10;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const MenuHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const MenuHeaderAvatar = styled.div<{ $hasImage: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  float: left;
  margin-right: ${({ theme }) => theme.spacing.sm};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MenuHeaderName = styled.div`
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const MenuHeaderEmail = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}40;
  }

  svg {
    margin-right: ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 16px;
  }
`;

const LogoutMenuItem = styled(MenuItem)`
  color: ${({ theme }) => theme.colors.error};

  svg {
    color: ${({ theme }) => theme.colors.error};
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 0;
`;

/**
 * UserDropdown provides a user menu with profile and logout options.
 * Accessible, keyboard-navigable, and fully themed.
 */
const UserDropdown: React.FC = () => {
  const { user, signOut } = useSupabase();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  // Extract user information
  const displayName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User";
  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error("Error during sign out:", error);
      }
      setIsOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      setIsOpen(false);
      navigate("/login");
    }
  };

  const navigateToSettings = () => {
    setIsOpen(false);
    navigate("/settings/profile");
  };

  const toggleDropdown = () => {
    setIsOpen((open) => !open);
  };

  const handleToggleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <Container ref={dropdownRef}>
      <DropdownToggle
        ref={toggleRef}
        onClick={toggleDropdown}
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="user-dropdown-menu"
        onKeyDown={handleToggleKeyDown}
      >
        <AvatarContainer $hasImage={!!avatarUrl}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} />
          ) : (
            <IoPersonCircle size={20} />
          )}
        </AvatarContainer>
      </DropdownToggle>

      <DropdownMenu $isOpen={isOpen} id="user-dropdown-menu" role="menu">
        {user.email && (
          <MenuHeader>
            <MenuHeaderAvatar $hasImage={!!avatarUrl}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} />
              ) : (
                <IoPersonCircle size={24} />
              )}
            </MenuHeaderAvatar>
            <MenuHeaderName>{displayName}</MenuHeaderName>
            <MenuHeaderEmail>{user.email}</MenuHeaderEmail>
          </MenuHeader>
        )}
        <MenuItem role="menuitem" tabIndex={0} onClick={navigateToSettings}>
          <IoSettingsOutline size={16} />
          Settings
        </MenuItem>
        <Divider />
        <LogoutMenuItem role="menuitem" tabIndex={0} onClick={handleLogout}>
          <IoLogOutOutline size={16} />
          Sign Out
        </LogoutMenuItem>
      </DropdownMenu>
    </Container>
  );
};

export default UserDropdown;
