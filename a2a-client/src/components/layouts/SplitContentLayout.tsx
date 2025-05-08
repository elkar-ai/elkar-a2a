import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  height: 100%;
  overflow: hidden;
`;

const InputSection = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const OutputSection = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

interface SplitContentLayoutProps {
  input: React.ReactNode;
  output: React.ReactNode;
}

const SplitContentLayout: React.FC<SplitContentLayoutProps> = ({
  input,
  output,
}) => {
  return (
    <Container>
      <InputSection>{input}</InputSection>
      <OutputSection>{output}</OutputSection>
    </Container>
  );
};

export default SplitContentLayout;
