import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { DebuggerHistoryResponse } from "../../../generated-api/models/DebuggerHistoryResponse";
import { DebuggerHistoryApi } from "../../../generated-api/apis/DebuggerHistoryApi";
import { Configuration } from "../../../generated-api/runtime";
import SendTaskPanel from "./SendTaskPanel";
import { useUrl } from "../../contexts/UrlContext";
import { debuggerHistoryApi } from "../../api/api";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  overflow-y: auto;
  max-height: 300px;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const HistoryItem = styled.div<{ $selected: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ $selected, theme }) =>
    $selected ? `${theme.colors.primary}20` : theme.colors.surface};
  border: 1px solid
    ${({ $selected, theme }) =>
      $selected ? theme.colors.primary : theme.colors.border};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ $selected, theme }) =>
      $selected ? `${theme.colors.primary}30` : `${theme.colors.background}80`};
  }
`;

const HistoryItemDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const TaskId = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Url = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const LoadingContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const LoadingSpinner = styled.div`
  width: 30px;
  height: 30px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
`;

const RefreshButton = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

const DebuggerHistoryPanel: React.FC = () => {
  const [selectedEntry, setSelectedEntry] =
    useState<DebuggerHistoryResponse | null>(null);

  const {
    data: historyEntries,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["debuggerHistory"],
    queryFn: async () => {
      try {
        const response = await debuggerHistoryApi.epGetDebuggerHistory();
        return response;
      } catch (error) {
        console.error("Error fetching debugger history:", error);
        return [];
      }
    },
  });

  const handleSelectEntry = (entry: DebuggerHistoryResponse) => {
    setSelectedEntry(entry);
  };

  return (
    <Container>
      <Header>
        <Title>Debugger History</Title>
        <RefreshButton onClick={() => refetch()}>Refresh</RefreshButton>
      </Header>

      {isLoading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading history...</LoadingText>
        </LoadingContainer>
      ) : (
        <>
          <ListContainer>
            {!historyEntries || historyEntries.length === 0 ? (
              <EmptyState>
                No history entries found. Send some tasks to see them here.
              </EmptyState>
            ) : (
              historyEntries.map((entry) => (
                <HistoryItem
                  key={entry.id}
                  $selected={selectedEntry?.id === entry.id}
                  onClick={() => handleSelectEntry(entry)}
                >
                  <HistoryItemDetail>
                    <TaskId>Task: {entry.taskId}</TaskId>
                    <Url>URL: {entry.url}</Url>
                  </HistoryItemDetail>
                </HistoryItem>
              ))
            )}
          </ListContainer>

          {selectedEntry && (
            <SendTaskPanel
              readOnly={true}
              taskId={selectedEntry.payload?.id || selectedEntry.taskId}
              showNewTaskButton={false}
              showGetTaskButton={false}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default DebuggerHistoryPanel;
