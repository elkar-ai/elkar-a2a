import React from "react";
import styled from "styled-components";

interface HeaderProps {
  serverUrl: string;
  apiKey: string;
  onServerUrlChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
}

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: box-shadow ${({ theme }) => theme.transitions.normal};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const HeaderTitle = styled.div`
  h1 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    background: ${({ theme }) => theme.colors.gradient.primary};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex: 1;
  max-width: 800px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    margin-top: ${({ theme }) => theme.spacing.md};
  }
`;

const InputWrapper = styled.div`
  position: relative;
  flex: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.highlight};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.lightGray};
  }
`;

const Header: React.FC<HeaderProps> = ({
  serverUrl,
  apiKey,
  onServerUrlChange,
  onApiKeyChange,
}) => {
  return (
    <HeaderContainer>
      <HeaderTitle>
        <h1>A2A API Tester</h1>
      </HeaderTitle>
      <HeaderControls>
        <InputWrapper>
          <Input
            id="server-url"
            type="text"
            value={serverUrl}
            onChange={(e) => onServerUrlChange(e.target.value)}
            placeholder="Server URL (e.g. http://localhost:8000)"
          />
        </InputWrapper>
        <InputWrapper>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="API Key (optional)"
          />
        </InputWrapper>
      </HeaderControls>
    </HeaderContainer>
  );
};

export default Header;
