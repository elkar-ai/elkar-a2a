import React, { useState } from "react";
import styled from "styled-components";

// Define filter option types
export type FilterOption<T> = {
  id: string;
  label: string;
  type: "select" | "date" | "text";
  options?: Array<{
    value: T;
    label: string;
  }>;
};

export type FilterValue = {
  [key: string]: string | number | boolean | null;
};

type FilterComponentProps<T> = {
  options: FilterOption<T>[];
  onFilterChange: (values: FilterValue) => void;
  initialValues?: FilterValue;
  className?: string;
};

const Container = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => `${theme.colors.background}11`};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 150px;
`;

const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
  color: ${({ theme }) => theme.colors.text};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SelectFilter = styled.select`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  min-width: 170px;
  height: 40px;
  font-size: 14px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 12px top 50%;
  background-size: 10px auto;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}20`};
  }
`;

const DateFilter = styled.input`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  width: 170px;
  height: 40px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}20`};
  }
`;

const TextFilter = styled.input`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  min-width: 170px;
  height: 40px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}20`};
  }
`;

const FiltersHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const FiltersTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;

  &:before {
    content: "";
    display: inline-block;
    width: 16px;
    height: 16px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'%3E%3C/polygon%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
    margin-right: 8px;
    opacity: 0.7;
  }
`;

const FiltersCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => `${theme.colors.primary}30`};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 12px;
  font-weight: 600;
  height: 20px;
  min-width: 20px;
  padding: 0 6px;
  border-radius: 10px;
  margin-left: 8px;
`;

const ClearButton = styled.button`
  padding: 8px 12px;
  border-radius: 6px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary};
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
  }

  &:before {
    content: "";
    display: inline-block;
    width: 14px;
    height: 14px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
    margin-right: 6px;
    opacity: 0.7;
  }
`;

function FilterComponent<T>({
  options,
  onFilterChange,
  initialValues = {},
  className,
}: FilterComponentProps<T>) {
  const [filterValues, setFilterValues] = useState<FilterValue>(initialValues);

  const handleFilterChange = (
    id: string,
    value: string | number | boolean | null
  ) => {
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
  };

  const clearFilters = () => {
    setFilterValues({});
    onFilterChange({});
  };

  const activeFilterCount = Object.keys(filterValues).length;

  return (
    <Container className={className}>
      <FiltersHeader>
        <FiltersTitle>
          Filters
          {activeFilterCount > 0 && (
            <FiltersCount>{activeFilterCount}</FiltersCount>
          )}
        </FiltersTitle>
        {activeFilterCount > 0 && (
          <ClearButton onClick={clearFilters}>Clear all</ClearButton>
        )}
      </FiltersHeader>
      <FilterContainer>
        {options.map((option) => (
          <FilterItem key={option.id}>
            <FilterLabel>{option.label}</FilterLabel>
            {option.type === "select" && (
              <SelectFilter
                value={filterValues[option.id]?.toString() || ""}
                onChange={(e) => handleFilterChange(option.id, e.target.value)}
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
                type="date"
                value={filterValues[option.id]?.toString() || ""}
                onChange={(e) => handleFilterChange(option.id, e.target.value)}
              />
            )}
            {option.type === "text" && (
              <TextFilter
                type="text"
                value={filterValues[option.id]?.toString() || ""}
                onChange={(e) => handleFilterChange(option.id, e.target.value)}
                placeholder={`Filter by ${option.label.toLowerCase()}`}
              />
            )}
          </FilterItem>
        ))}
      </FilterContainer>
    </Container>
  );
}

export default FilterComponent;
