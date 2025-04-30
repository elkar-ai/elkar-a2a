import { UseMutationResult } from "@tanstack/react-query";
import {
  FilePart,
  Message,
  TaskSendParams,
  TextPart,
} from "../../types/a2aTypes";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import styled, { useTheme } from "styled-components";
import { IoMdClose } from "react-icons/io";
import { ImAttachment } from "react-icons/im";

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;

  gap: 0.5rem;
  background-color: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border: 1px solid ${({ theme }) => theme.colors.border};
  margin: 3px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.75rem;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 24px;
  max-height: 200px;
  resize: none;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::before {
    content: "→";
    font-size: 1.1em;
  }
`;

const UploadButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function SendMessageArea({
  taskId,
  sessionId,
  sendTaskMutation,
  setMessages,
}: {
  taskId: string;
  sessionId: string | null;
  sendTaskMutation: UseMutationResult<any, Error, TaskSendParams>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
}) {
  const theme = useTheme();
  const [textPart, setTextPart] = useState<TextPart>({
    type: "text",
    text: "",
  });

  const [fileParts, setFileParts] = useState<FilePart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const message = {
    role: "user",
    parts: [textPart, ...fileParts],
  };

  const TaskSendParams: TaskSendParams = {
    id: taskId,
    sessionId: sessionId ?? "",
    message: message as Message,
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFileParts = await Promise.all(
        Array.from(files).map(async (file) => {
          const bytes = await file.arrayBuffer();
          const uint8Array = new Uint8Array(bytes);
          const base64String = btoa(
            String.fromCharCode.apply(null, Array.from(uint8Array))
          );
          return {
            type: "file" as const,
            file: {
              name: file.name,
              mimeType: file.type,
              bytes: base64String,
            },
          };
        })
      );
      setFileParts((prev) => [...prev, ...newFileParts]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <PanelContainer>
      {fileParts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          {fileParts.map((filePart) => {
            return (
              <FilePartInInputArea
                key={filePart.file.name}
                filePart={filePart}
                canRemove={true}
                onRemove={() => {
                  setFileParts(fileParts.filter((f) => f !== filePart));
                }}
              />
            );
          })}
        </div>
      )}
      <TextArea
        value={textPart.text}
        onChange={(e) => {
          setTextPart({ ...textPart, text: e.target.value });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
            e.preventDefault();
            sendTaskMutation.mutate(TaskSendParams);
            setMessages((prev) => [...prev, message as Message]);
            setTextPart({ ...textPart, text: "" });
            setFileParts([]);
          }
        }}
        placeholder="Message"
        disabled={false}
      />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          multiple
        />
        <UploadButton onClick={handleUploadClick}>
          <ImAttachment color={theme.colors.text} />
        </UploadButton>
        <Button
          onClick={() => {
            sendTaskMutation.mutate(TaskSendParams);
            setMessages((prev) => [...prev, message as Message]);
            setTextPart({ ...textPart, text: "" });
            setFileParts([]);
          }}
          disabled={sendTaskMutation.isPending}
        />
      </div>
    </PanelContainer>
  );
}

const FilePartContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: fit-content;
  font-size: 0.8rem;
  gap: 0.5rem;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 0.05rem;
  padding-left: 0.3rem;
  padding-right: 0.3rem;
  padding-top: 0.1rem;
  padding-bottom: 0.1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const FilePartInInputArea = ({
  filePart,
  canRemove = true,
  onRemove,
}: {
  filePart: FilePart;
  canRemove: boolean;
  onRemove: () => void;
}) => {
  const theme = useTheme();
  return (
    <FilePartContainer>
      <div>{filePart.file.name}</div>
      {canRemove && (
        <IoMdClose
          style={{ cursor: "pointer" }}
          color={theme.colors.error}
          onClick={() => {
            onRemove();
          }}
        />
      )}
    </FilePartContainer>
  );
};
