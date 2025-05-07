import React, { useMemo, useState } from "react";
import { styled } from "styled-components";
import { useQueries } from "@tanstack/react-query";
import { UUID } from "crypto";
import { PaginationComponent } from "./Pagination";

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  box-shadow: ${({ theme }) => theme.shadows.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.background};
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const Table = styled.table`
  width: 100%;
  border-spacing: 0;
  border-collapse: separate;
`;

const Th = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.025em;
  transition: background-color 0.2s ease;

  &:first-child {
    border-top-left-radius: ${({ theme }) => theme.borderRadius.lg};
  }

  &:last-child {
    border-top-right-radius: ${({ theme }) => theme.borderRadius.lg};
  }

  &:hover {
    background: ${(props) =>
      props.onClick ? props.theme.colors.surface : props.theme.colors.surface};
  }
`;

const Td = styled.td<{ $isChild?: boolean }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${(props) =>
    props.$isChild
      ? props.theme.colors.surface
      : props.theme.colors.background};
  transition: background-color 0.2s ease;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};

  &:first-child {
    border-left: 3px solid transparent;
    border-left-color: ${(props) =>
      props.$isChild ? props.theme.colors.border : "transparent"};
  }
`;

const TableRow = styled.tr<{ $isClickable?: boolean }>`
  transition: all 0.2s ease;
  cursor: pointer;
  &:hover {
    background-color: ${(props) =>
      props.$isClickable ? props.theme.colors.surface : "inherit"};
    td {
      background-color: ${(props) =>
        props.$isClickable ? props.theme.colors.surface : "inherit"};
    }
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: ${({ theme }) => theme.spacing.md} 0;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  margin-right: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all 0.2s ease;
  font-size: ${({ theme }) => theme.fontSizes.xs};

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const IndentedCell = styled.div<{ level: number }>`
  padding-left: ${(props) => props.level * 28}px;
  display: flex;
  align-items: center;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: ${(props) => (props.level > 0 ? props.level * 28 - 18 : 0)}px;
    top: -8px;
    width: 1px;
    height: ${(props) => (props.level > 0 ? "calc(100% + 16px)" : "0")};
    background-color: ${({ theme }) => theme.colors.border};
    display: ${(props) => (props.level > 0 ? "block" : "none")};
    transition: all 0.2s ease;
  }
`;

const TotalCount = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  span {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
  }
`;

interface BaseItem {
  id: string | number | UUID;
}

interface TableProps<T extends BaseItem> {
  data: { data: T; hasChildren: boolean }[];
  columns: {
    key: string;
    title: string;
    render: (item: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  onRowClick?: (item: T) => void;
  filter?: React.ReactNode;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  searchParamKey?: string;
  currentSort?: { column: string; order: "ASC" | "DESC" };
  onSort?: (column: string, order: "ASC" | "DESC") => void;
  totalCount?: number;
  page?: number;
  totalPages?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  getChildren?: (item: T) => Promise<{ data: T; hasChildren: boolean }[]>;
  isExpanded?: (item: T) => boolean;
  onToggleExpand?: (item: T) => void;
  expandOnClick?: boolean;
  rightActions?: React.ReactNode;
}

export function TreeTable<T extends BaseItem>({
  data,
  columns,
  rightActions,
  onRowClick,
  filter,
  currentSort,
  onSort,
  totalCount,
  page,
  totalPages,
  onIncrement,
  onDecrement,
  getChildren,
  isExpanded,
  onToggleExpand,
  expandOnClick = false,
}: TableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const childrenQueries = useQueries({
    queries: data.map((item) => ({
      queryKey: ["children", item.data.id],
      queryFn: async () => {
        const results = (await getChildren?.(item.data)) ?? [];
        return results;
      },
      enabled: item.hasChildren && expandedRows.has(JSON.stringify(item.data)),
    })),
  });

  // Create a map of queries by ID for efficient lookup
  const queriesById = useMemo(() => {
    const map = new Map();
    childrenQueries.forEach((query, index) => {
      if (data[index]) {
        map.set(data[index].data.id, query);
      }
    });
    return map;
  }, [childrenQueries, data]);

  const renderTableRows = (
    items: { data: T; hasChildren: boolean }[],
    level: number = 0
  ): React.ReactElement[] => {
    return items.flatMap((item) => {
      const itemKey = JSON.stringify(item.data);
      const childrenQuery = queriesById.get(item.data.id);
      const children = childrenQuery?.data ?? [];
      const hasChildren = item.hasChildren || (children && children.length > 0);
      if (hasChildren) {
        console.log(children, item.data["id"]);
      }
      const expanded = isExpanded
        ? isExpanded(item.data)
        : expandedRows.has(itemKey);

      const handleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleExpand) {
          onToggleExpand(item.data);
        } else {
          setExpandedRows((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(itemKey)) {
              newSet.delete(itemKey);
            } else {
              newSet.add(itemKey);
            }
            return newSet;
          });
        }
      };

      const rowKey = itemKey + "level" + level;
      const rows = [
        <TableRow
          key={rowKey}
          onClick={(e) => {
            if (hasChildren && expandOnClick) {
              console.log("expanding");
              handleExpand(e);
            } else {
              onRowClick?.(item.data);
            }
          }}
          $isClickable={!!onRowClick}
        >
          {columns.map((column, columnIndex) => (
            <Td key={column.key} $isChild={level > 0}>
              {columnIndex === 0 ? (
                <IndentedCell level={level}>
                  {hasChildren && (
                    <ExpandButton onClick={handleExpand}>
                      {!childrenQuery?.isLoading && expanded && "▼"}
                      {!childrenQuery?.isLoading && !expanded && "▶"}
                    </ExpandButton>
                  )}
                  {column.render(item.data)}
                </IndentedCell>
              ) : (
                column.render(item.data)
              )}
            </Td>
          ))}
        </TableRow>,
      ];

      if (hasChildren && expanded) {
        rows.push(...renderTableRows(children || [], level + 1));
      }

      return rows;
    });
  };

  return (
    <div>
      <Actions>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* {onSearch && (
              <TableSearch
                onSearch={onSearch}
                placeholder={searchPlaceholder}
                searchParamKey={searchParamKey}
              />
            )} */}
            {filter}
          </div>
          {rightActions}
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {page && totalCount && (
            <>
              <TotalCount>
                Showing <span>{data.length}</span> of <span>{totalCount}</span>{" "}
                items
              </TotalCount>
              <PaginationComponent
                currentPage={page}
                totalPages={totalPages}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
              />
            </>
          )}
        </div>
      </Actions>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              {columns.map((column) => (
                <Th
                  key={column.key}
                  onClick={() => {
                    if (!column.sortable || !onSort) return;
                    const newOrder =
                      currentSort?.column === column.key &&
                      currentSort.order === "ASC"
                        ? "DESC"
                        : "ASC";
                    onSort(column.key, newOrder);
                  }}
                  style={{ cursor: column.sortable ? "pointer" : "default" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {column.title}
                    {column.sortable && currentSort?.column === column.key && (
                      <span>{currentSort.order === "ASC" ? "↑" : "↓"}</span>
                    )}
                    {column.sortable && currentSort?.column !== column.key && (
                      <span style={{ color: "#c2c8cf" }}>{"↓"}</span>
                    )}
                  </div>
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>{renderTableRows(data)}</tbody>
        </Table>
      </TableContainer>
    </div>
  );
}
