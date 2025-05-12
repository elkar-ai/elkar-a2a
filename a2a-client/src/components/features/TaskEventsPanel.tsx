import React from "react";
import styled from "styled-components";
import {
  Task,
  TaskState,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
} from "../../types/a2aTypes";
import { useQuery } from "@tanstack/react-query";
import { TaskEventApi } from "../../../generated-api";
import { apiConfig } from "../../api/api";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  height: 100%;
  width: 100%;
  overflow: auto;
  min-height: 0;
  max-height: 100%;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  position: relative;
  width: 100%;
  min-height: 0;

  &:before {
    content: "";
    position: absolute;
    left: 140px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${({ theme }) => theme.colors.border};
  }
`;

const EventItem = styled.div<{ $type: "status" | "artifact" }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
  margin-left: 40px;

  &:before {
    content: "";
    position: absolute;
    left: -47px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${({ $type, theme }) =>
      $type === "status" ? theme.colors.primary : theme.colors.secondary};
    border: 3px solid ${({ theme }) => theme.colors.background};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.border};
  }

  &:after {
    content: "";
    position: absolute;
    left: -31px;
    top: 50%;
    transform: translateY(-50%);
    width: 31px;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.border};
  }
`;

const TimeColumn = styled.div`
  min-width: 120px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: right;
  padding-right: ${({ theme }) => theme.spacing.lg};
`;

const TimeDate = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const TimeHour = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const EventContent = styled.div`
  flex: 1;
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const EventType = styled.span<{ $type: "status" | "artifact" }>`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ $type, theme }) =>
    $type === "status" ? theme.colors.primary : theme.colors.secondary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const EventDetails = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.5;
`;

const StatusBadge = styled.span<{ $state: TaskState }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: ${({ $state, theme }) => {
    switch ($state) {
      case TaskState.COMPLETED:
        return `${theme.colors.success}20`;
      case TaskState.FAILED:
        return `${theme.colors.error}20`;
      case TaskState.CANCELED:
        return `${theme.colors.warning}20`;
      default:
        return `${theme.colors.info}20`;
    }
  }};
  color: ${({ $state, theme }) => {
    switch ($state) {
      case TaskState.COMPLETED:
        return theme.colors.success;
      case TaskState.FAILED:
        return theme.colors.error;
      case TaskState.CANCELED:
        return theme.colors.warning;
      default:
        return theme.colors.info;
    }
  }};
  border: 1px solid
    ${({ $state, theme }) => {
      switch ($state) {
        case TaskState.COMPLETED:
          return `${theme.colors.success}40`;
        case TaskState.FAILED:
          return `${theme.colors.error}40`;
        case TaskState.CANCELED:
          return `${theme.colors.warning}40`;
        default:
          return `${theme.colors.info}40`;
      }
    }};
`;

const MessagePart = styled.div`
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ArtifactName = styled.div`
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ArtifactDescription = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-style: italic;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FinalLabel = styled.strong`
  display: inline-block;
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

interface TaskEventsPanelProps {
  taskId: string;
}

export const TaskEventsPanel: React.FC<TaskEventsPanelProps> = ({ taskId }) => {
  const taskEventApi = new TaskEventApi(apiConfig);

  const eventsQuery = useQuery({
    queryKey: ["taskEvents", taskId],
    queryFn: () =>
      taskEventApi.epRetrieveTaskEvents({
        getTaskEventsQuery: {
          taskIdIn: [taskId],
          orderBy: "created-at",
          limit: 100,
          page: 1,
        },
      }),
    enabled: !!taskId,
  });

  if (eventsQuery.isLoading) {
    return <div>Loading events...</div>;
  }

  if (eventsQuery.isError) {
    return (
      <div>Error loading events: {(eventsQuery.error as Error).message}</div>
    );
  }

  const events = eventsQuery.data?.records || [];

  return (
    <Container>
      <TimelineContainer>
        {events.map((event, index) => {
          const eventData = event.eventData;
          const isStatusEvent = "status" in eventData;
          const timestamp = event.createdAt;
          const date = new Date(timestamp);

          return (
            <EventItem
              key={event.id}
              $type={isStatusEvent ? "status" : "artifact"}
            >
              <TimeColumn>
                <TimeDate>{date.toLocaleDateString()}</TimeDate>
                <TimeHour>{date.toLocaleTimeString()}</TimeHour>
              </TimeColumn>
              <EventContent>
                <EventHeader>
                  <EventType $type={isStatusEvent ? "status" : "artifact"}>
                    {isStatusEvent ? "Status Update" : "Artifact Update"}
                  </EventType>
                  {isStatusEvent && (
                    <StatusBadge $state={eventData.status.state}>
                      {eventData.status.state}
                    </StatusBadge>
                  )}
                </EventHeader>
                <EventDetails>
                  {isStatusEvent ? (
                    <>
                      {eventData.status.message?.parts.map(
                        (part: any, i: number) => (
                          <MessagePart key={i}>
                            {part.type === "text" && part.text}
                          </MessagePart>
                        ),
                      )}
                      {eventData.final && (
                        <FinalLabel>Final Status Update</FinalLabel>
                      )}
                    </>
                  ) : (
                    <>
                      <ArtifactName>{eventData.artifact.name}</ArtifactName>
                      {eventData.artifact.description && (
                        <ArtifactDescription>
                          {eventData.artifact.description}
                        </ArtifactDescription>
                      )}
                      {eventData.artifact.parts.map((part: any, i: number) => (
                        <MessagePart key={i}>
                          {part.type === "text" && part.text}
                        </MessagePart>
                      ))}
                      {eventData.artifact.lastChunk && (
                        <FinalLabel>Final Artifact Chunk</FinalLabel>
                      )}
                    </>
                  )}
                </EventDetails>
              </EventContent>
            </EventItem>
          );
        })}
      </TimelineContainer>
    </Container>
  );
};
