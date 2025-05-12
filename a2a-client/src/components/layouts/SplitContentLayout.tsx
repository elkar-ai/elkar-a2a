import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  height: 100%;
  width: 100%;
  overflow: visible;
  min-height: 0;
`;

const InputSection = styled.section`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: visible;
  height: 100%;
  max-height: 100%;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const OutputSection = styled.section`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: visible;
  height: 100%;
  max-height: 100%;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

interface SplitContentLayoutProps {
  input: React.ReactNode;
  output: React.ReactNode;
  inputLabel?: string;
  outputLabel?: string;
}

/**
 * Layout component that splits the content into two equal sections for input and output.
 * Commonly used for code editors, forms, and other split-view interfaces.
 */
const SplitContentLayout: React.FC<SplitContentLayoutProps> = ({
  input,
  output,
  inputLabel = "Input section",
  outputLabel = "Output section",
}) => {
  return (
    <Container>
      <InputSection aria-label={inputLabel}>{input}</InputSection>
      <OutputSection aria-label={outputLabel}>{output}</OutputSection>
    </Container>
  );
};

export default SplitContentLayout;
