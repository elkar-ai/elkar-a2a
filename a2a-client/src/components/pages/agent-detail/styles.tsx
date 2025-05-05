import styled from "styled-components";

export const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

export const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const Tab = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background-color: transparent;
  color: ${({ theme, active }) =>
    active ? theme.colors.primary : theme.colors.textSecondary};
  border: none;
  border-bottom: 2px solid
    ${({ theme, active }) => (active ? theme.colors.primary : "transparent")};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ active }) => (active ? "600" : "400")};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};
`;

export const InfoItem = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const InfoLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

export const InfoValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
`;

export const Button = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}dd`};
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

export const EmptyStateText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.error}10;
  border: 1px solid ${({ theme }) => theme.colors.error}30;
  color: ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;
