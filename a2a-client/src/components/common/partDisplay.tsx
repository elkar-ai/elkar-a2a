import React from "react";
import styled from "styled-components";
import { Part } from "../../types/a2aTypes";

const CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  overflow-x: auto;
  font-family: "Fira Code", monospace;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  margin-top: ${({ theme }) => theme.spacing.md};
  flex: 1;
  height: 100%;
`;

const PartContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const PartType = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-right: ${({ theme }) => theme.spacing.sm};
`;

interface PartDisplayProps {
  part: Part;
  index: number;
}

export const PartDisplay: React.FC<PartDisplayProps> = ({ part, index }) => {
  switch (part.type) {
    case "text":
      return (
        <PartContainer key={index}>
          <PartType>Text:</PartType>
          <CodeBlock>{part.text}</CodeBlock>
        </PartContainer>
      );
    case "file":
      return (
        <PartContainer key={index}>
          <PartType>File:</PartType>
          <div>
            <div>Name: {part.file.name || "Unnamed"}</div>
            <div>MIME Type: {part.file.mimeType || "Unknown"}</div>
            {part.file.uri && <div>URI: {part.file.uri}</div>}
          </div>
        </PartContainer>
      );
    case "data":
      return (
        <PartContainer key={index}>
          <PartType>Data:</PartType>
          <CodeBlock>{JSON.stringify(part.data, null, 2)}</CodeBlock>
        </PartContainer>
      );
    default:
      return null;
  }
};
