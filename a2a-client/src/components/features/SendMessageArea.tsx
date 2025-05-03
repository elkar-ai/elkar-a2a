import { UseMutationResult } from "@tanstack/react-query";
import {
  FilePart,
  Message,
  TaskSendParams,
  TextPart,
} from "../../types/a2aTypes";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import styled from "styled-components";
import { IoMdClose } from "react-icons/io";
import { ImAttachment } from "react-icons/im";

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 24px;
  max-height: 200px;
  resize: none;
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-weight: 500;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &::before {
    content: "→";
    font-size: 1.1em;
  }
`;

const AttachmentButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.surface};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const FileName = styled.span`
  color: ${({ theme }) => theme.colors.text};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.error};
    background-color: ${({ theme }) => theme.colors.surface};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-end;
`;

interface SendMessageAreaProps {
  taskId: string | null;
  sessionId: string | null;
  sendTaskMutation: UseMutationResult<
    Message | undefined,
    Error,
    TaskSendParams,
    unknown
  >;
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

export const SendMessageArea: React.FC<SendMessageAreaProps> = ({
  taskId,
  sessionId,
  sendTaskMutation,
  setMessages,
}) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!taskId) return;

    const parts: (TextPart | FilePart)[] = [];
    if (message) {
      parts.push({ type: "text", text: message });
    }
    files.forEach((file) => {
      parts.push({
        type: "file",
        file: {
          name: file.name,
          mimeType: file.type,
          uri: URL.createObjectURL(file),
        },
      });
    });

    if (parts.length === 0) return;

    sendTaskMutation.mutate(
      {
        id: taskId,
        sessionId: sessionId ?? "",
        message: { role: "user", parts },
      },
      {
        onSuccess: (data) => {
          if (data) {
            setMessages((prev) => [...prev, data]);
          }
          setMessage("");
          setFiles([]);
        },
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PanelContainer>
      {files.length > 0 && (
        <FileList>
          {files.map((file, index) => (
            <FilePreview key={index}>
              <FileName>{file.name}</FileName>
              <RemoveButton onClick={() => handleRemoveFile(index)}>
                <IoMdClose />
              </RemoveButton>
            </FilePreview>
          ))}
        </FileList>
      )}
      <InputContainer>
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
        />
        <AttachmentButton
          onClick={() => fileInputRef.current?.click()}
          title="Attach files"
        >
          <ImAttachment />
        </AttachmentButton>
        <Button
          onClick={handleSend}
          disabled={
            (!message && files.length === 0) || sendTaskMutation.isPending
          }
        />
      </InputContainer>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        multiple
      />
    </PanelContainer>
  );
};
