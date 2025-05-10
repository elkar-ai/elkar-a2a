import { useState, useCallback } from "react";
import styled from "styled-components";

// Types
export type FilterValue = Record<string, string | number | boolean | null>;

export interface FilterOption<T> {
  id: string;
  label: string;
  type: "select" | "date" | "text";
  options?: Array<{
    value: T;
    label: string;
  }>;
}

interface FilterComponentProps<T> {
  options: FilterOption<T>[];
  onFilterChange: (values: FilterValue) => void;
  initialValues?: FilterValue;
  className?: string;
  ariaLabel?: string;
}

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const FiltersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FiltersTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FiltersCount = styled.span`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}10;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const FilterLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SelectFilter = styled.select`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const DateFilter = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const TextFilter = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

function FilterComponent<T>({
  options,
  onFilterChange,
  initialValues = {},
  className,
  ariaLabel = "Filters",
}: FilterComponentProps<T>) {
  const [filterValues, setFilterValues] = useState<FilterValue>(initialValues);

  const handleFilterChange = useCallback(
    (id: string, value: string | number | boolean | null) => {
      const newFilterValues = {
        ...filterValues,
        [id]: value,
      };

      // Remove empty values
      if (value === "" || value === null || value === undefined) {
        delete newFilterValues[id];
      }

      setFilterValues(newFilterValues);
      // Apply filters immediately
      onFilterChange(newFilterValues);
    },
    [filterValues, onFilterChange],
  );

  const clearFilters = useCallback(() => {
    setFilterValues({});
    onFilterChange({});
  }, [onFilterChange]);

  const activeFilterCount = Object.keys(filterValues).length;

  return (
    <Container className={className} role="region" aria-label={ariaLabel}>
      <FiltersHeader>
        <FiltersTitle>
          Filters
          {activeFilterCount > 0 && (
            <FiltersCount aria-label={`${activeFilterCount} active filters`}>
              {activeFilterCount}
            </FiltersCount>
          )}
        </FiltersTitle>
        {activeFilterCount > 0 && (
          <ClearButton onClick={clearFilters} aria-label="Clear all filters">
            Clear all
          </ClearButton>
        )}
      </FiltersHeader>
      <FilterContainer>
        {options.map((option) => (
          <FilterItem key={option.id}>
            <FilterLabel htmlFor={`filter-${option.id}`}>
              {option.label}
            </FilterLabel>
            {option.type === "select" && (
              <SelectFilter
                id={`filter-${option.id}`}
                value={filterValues[option.id]?.toString() || ""}
                onChange={(e) => handleFilterChange(option.id, e.target.value)}
                aria-label={`Filter by ${option.label}`}
              >
                <option value="">All</option>
                {option.options?.map((opt) => (
                  <option key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </SelectFilter>
            )}
            {option.type === "date" && (
              <DateFilter
                id={`filter-${option.id}`}
                type="date"
                value={filterValues[option.id]?.toString() || ""}
                onChange={(e) => handleFilterChange(option.id, e.target.value)}
                aria-label={`Filter by ${option.label}`}
              />
            )}
            {option.type === "text" && (
              <TextFilter
                id={`filter-${option.id}`}
                type="text"
                value={filterValues[option.id]?.toString() || ""}
                onChange={(e) => handleFilterChange(option.id, e.target.value)}
                placeholder={`Filter by ${option.label.toLowerCase()}`}
                aria-label={`Filter by ${option.label}`}
              />
            )}
          </FilterItem>
        ))}
      </FilterContainer>
    </Container>
  );
}

export default FilterComponent;
