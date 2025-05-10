import React from "react";
import { GrCaretNext, GrCaretPrevious } from "react-icons/gr";
import styled from "styled-components";

const PaginationContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin: ${({ theme }) => theme.spacing.sm};
  width: fit-content;
  min-width: 120px;
`;

const PageInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const CurrentPage = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
`;

const TotalItems = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-style: italic;
`;

const NavigationButton = styled.button<{ $disabled: boolean }>`
  background: none;
  border: none;
  padding: ${({ theme }) => theme.spacing.xs};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  color: ${({ theme, $disabled }) =>
    $disabled ? theme.colors.textSecondary : theme.colors.text};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: color 0.2s ease;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.primary};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
`;

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  totalCount?: number;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
}

/**
 * Pagination component that provides navigation controls for paginated content.
 * Includes current page indicator, total pages, and optional total items count.
 */
const Pagination: React.FC<PaginationProps> = ({
  totalPages,
  currentPage,
  totalCount,
  onPageChange,
  ariaLabel = "Pagination",
}) => {
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const isPreviousDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <PaginationContainer role="navigation" aria-label={ariaLabel}>
      <NavigationButton
        onClick={handlePreviousPage}
        disabled={isPreviousDisabled}
        $disabled={isPreviousDisabled}
        aria-label="Previous page"
      >
        <GrCaretPrevious size={20} aria-hidden="true" />
      </NavigationButton>

      <PageInfo>
        <CurrentPage>
          {currentPage} / {totalPages}
        </CurrentPage>
        {totalCount !== undefined && (
          <TotalItems>{totalCount} items</TotalItems>
        )}
      </PageInfo>

      <NavigationButton
        onClick={handleNextPage}
        disabled={isNextDisabled}
        $disabled={isNextDisabled}
        aria-label="Next page"
      >
        <GrCaretNext size={20} aria-hidden="true" />
      </NavigationButton>
    </PaginationContainer>
  );
};

export default Pagination;
