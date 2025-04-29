import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import styled from "styled-components";
import {
  TaskSendParams,
  Part,
  TextPart,
  FilePart,
  DataPart,
} from "../../types/a2aTypes";
import { useUrl } from "../../contexts/UrlContext";
import A2AClient from "../../services/a2aClient";
import SplitContentLayout from "../layouts/SplitContentLayout";
import TaskResultPanel from "./TaskResultPanel";
import { v4 as uuidv4 } from "uuid";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  resize: vertical;
  font-family: "Fira Code", monospace;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PartContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const PartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PartTypeSelect = styled.select`
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

const RemoveButton = styled.button`
  background-color: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
`;

const AddPartButton = styled.button`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: 200px;
  align-self: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    opacity: 0.95;
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &::before {
    content: "+";
    font-size: 1.2em;
    font-weight: bold;
  }
`;

const FileInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const FileName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const FileSize = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const RemoveFileButton = styled.button`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.error};
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover {
    opacity: 0.8;
  }
`;

const DraggablePartContainer = styled.div<{ isDragging: boolean }>`
  opacity: ${({ isDragging }) => (isDragging ? 0.5 : 1)};
  cursor: move;
`;

const URLInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FileSourceSelector = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SourceButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary : theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

type FileSource = "upload" | "url";

interface PartItemProps {
  part: Part;
  index: number;
  movePart: (dragIndex: number, hoverIndex: number) => void;
  updatePartType: (index: number, type: Part["type"]) => void;
  updatePartContent: (index: number, content: string) => void;
  updateFilePart: (index: number, file: File) => void;
  removeFile: (index: number) => void;
  removePart: (index: number) => void;
  isPending: boolean;
  taskSendParams: TaskSendParams;
  setTaskSendParams: React.Dispatch<React.SetStateAction<TaskSendParams>>;
}

const PartItem = ({
  part,
  index,
  movePart,
  updatePartType,
  updatePartContent,
  updateFilePart,
  removeFile,
  removePart,
  isPending,
}: PartItemProps) => {
  const [fileSource, setFileSource] = useState<FileSource>("upload");
  const [url, setUrl] = useState("");

  const [{ isDragging }, drag] = useDrag({
    type: "PART",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "PART",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        movePart(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <DraggablePartContainer
      ref={(node) => {
        if (node) {
          drag(node);
          drop(node);
        }
      }}
      isDragging={isDragging}
    >
      <PartContainer>
        <PartHeader>
          <PartTypeSelect
            value={part.type}
            onChange={(e) =>
              updatePartType(index, e.target.value as Part["type"])
            }
            disabled={isPending}
          >
            <option value="text">Text</option>
            <option value="file">File</option>
            <option value="data">Data</option>
          </PartTypeSelect>
          <RemoveButton onClick={() => removePart(index)} disabled={isPending}>
            Remove
          </RemoveButton>
        </PartHeader>
        {part.type === "text" && (
          <TextArea
            value={(part as TextPart).text}
            onChange={(e) => updatePartContent(index, e.target.value)}
            placeholder="Enter your message"
            disabled={isPending}
          />
        )}
        {part.type === "file" && (
          <FileInputContainer>
            <FileSourceSelector>
              <SourceButton
                isActive={fileSource === "upload"}
                onClick={() => setFileSource("upload")}
              >
                Upload File
              </SourceButton>
              <SourceButton
                isActive={fileSource === "url"}
                onClick={() => setFileSource("url")}
              >
                URL
              </SourceButton>
            </FileSourceSelector>
            {fileSource === "upload" ? (
              !(part as FilePart).file.bytes ? (
                <FileInputLabel>
                  <FileInput
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateFilePart(index, file);
                      }
                    }}
                    disabled={isPending}
                  />
                  Click to select a file or drag and drop
                </FileInputLabel>
              ) : (
                <FilePreview>
                  <FileName>{(part as FilePart).file.name}</FileName>
                  <FileSize>
                    {Math.round(
                      ((part as FilePart).file.bytes!.length * 0.75) / 1024
                    )}{" "}
                    KB
                  </FileSize>
                  <RemoveFileButton
                    onClick={() => removeFile(index)}
                    disabled={isPending}
                  >
                    Remove
                  </RemoveFileButton>
                </FilePreview>
              )
            ) : (
              <>
                <URLInput
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter file URL"
                  disabled={isPending}
                />
                {(part as FilePart).file.uri && (
                  <FilePreview>
                    <FileName>URL File</FileName>
                    <RemoveFileButton
                      onClick={() => removeFile(index)}
                      disabled={isPending}
                    >
                      Remove
                    </RemoveFileButton>
                  </FilePreview>
                )}
              </>
            )}
          </FileInputContainer>
        )}
        {part.type === "data" && (
          <div>Data input functionality coming soon ... </div>
        )}
      </PartContainer>
    </DraggablePartContainer>
  );
};

const SendTaskPanel = () => {
  const [taskSendParams, setTaskSendParams] = useState<TaskSendParams>({
    message: {
      role: "user",
      parts: [
        {
          type: "text",
          text: "",
        } as TextPart,
      ],
    },
    sessionId: "",
    id: "",
  });

  const { endpoint } = useUrl();
  const apiClient = new A2AClient(endpoint);

  const sendQueryMutation = useMutation({
    mutationFn: (params: TaskSendParams) => {
      return apiClient.sendTask(params);
    },
  });

  const movePart = (dragIndex: number, hoverIndex: number) => {
    const newParts = [...taskSendParams.message.parts];
    const [removed] = newParts.splice(dragIndex, 1);
    newParts.splice(hoverIndex, 0, removed);
    setTaskSendParams({
      ...taskSendParams,
      message: {
        ...taskSendParams.message,
        parts: newParts,
      },
    });
  };

  const addPart = () => {
    setTaskSendParams({
      ...taskSendParams,
      message: {
        ...taskSendParams.message,
        parts: [
          ...taskSendParams.message.parts,
          { type: "text", text: "" } as TextPart,
        ],
      },
    });
  };

  const removePart = (index: number) => {
    setTaskSendParams({
      ...taskSendParams,
      message: {
        ...taskSendParams.message,
        parts: taskSendParams.message.parts.filter((_, i) => i !== index),
      },
    });
  };

  const updatePartType = (index: number, type: Part["type"]) => {
    const newParts = [...taskSendParams.message.parts];
    switch (type) {
      case "text":
        newParts[index] = { type: "text", text: "" } as TextPart;
        break;
      case "file":
        newParts[index] = { type: "file", file: {} } as FilePart;
        break;
      case "data":
        newParts[index] = { type: "data", data: {} } as DataPart;
        break;
    }
    setTaskSendParams({
      ...taskSendParams,
      message: {
        ...taskSendParams.message,
        parts: newParts,
      },
    });
  };

  const updatePartContent = (index: number, content: string) => {
    const newParts = [...taskSendParams.message.parts];
    if (newParts[index].type === "text") {
      (newParts[index] as TextPart).text = content;
    }
    setTaskSendParams({
      ...taskSendParams,
      message: {
        ...taskSendParams.message,
        parts: newParts,
      },
    });
  };

  const updateFilePart = (index: number, file: File) => {
    const newParts = [...taskSendParams.message.parts];
    if (newParts[index].type === "file") {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        (newParts[index] as FilePart).file = {
          name: file.name,
          mimeType: file.type,
          bytes: base64String.split(",")[1], // Remove the data URL prefix
        };
        setTaskSendParams({
          ...taskSendParams,
          message: {
            ...taskSendParams.message,
            parts: newParts,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (index: number) => {
    const newParts = [...taskSendParams.message.parts];
    if (newParts[index].type === "file") {
      (newParts[index] as FilePart).file = {};
      setTaskSendParams({
        ...taskSendParams,
        message: {
          ...taskSendParams.message,
          parts: newParts,
        },
      });
    }
  };

  const isSendDisabled = () => {
    return (
      sendQueryMutation.isPending ||
      taskSendParams.message.parts.length === 0 ||
      taskSendParams.message.parts.some((part) => {
        if (part.type === "text") {
          return !(part as TextPart).text.trim();
        }
        if (part.type === "file") {
          return !(part as FilePart).file.bytes;
        }
        return false;
      })
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <SplitContentLayout
        input={
          <PanelContainer>
            <AddPartButton
              onClick={addPart}
              disabled={sendQueryMutation.isPending}
            >
              Add Part
            </AddPartButton>
            {taskSendParams.message.parts.map((part, index) => (
              <PartItem
                key={index}
                part={part}
                index={index}
                movePart={movePart}
                updatePartType={updatePartType}
                updatePartContent={updatePartContent}
                updateFilePart={updateFilePart}
                removeFile={removeFile}
                removePart={removePart}
                isPending={sendQueryMutation.isPending}
                taskSendParams={taskSendParams}
                setTaskSendParams={setTaskSendParams}
              />
            ))}
            <Button
              onClick={() =>
                sendQueryMutation.mutate({
                  ...taskSendParams,
                  id: uuidv4(),
                  sessionId: uuidv4(),
                })
              }
              disabled={isSendDisabled()}
            >
              {sendQueryMutation.isPending ? "Sending..." : "Send Task"}
            </Button>
          </PanelContainer>
        }
        output={
          sendQueryMutation.data && (
            <TaskResultPanel task={sendQueryMutation.data} />
          )
        }
      />
    </DndProvider>
  );
};

export default SendTaskPanel;
