import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.5;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
    color: inherit;
  }

  button:focus{
    outline: none;
    box-shadow: 0 0 0 0px ${({ theme }) => theme.colors.primary}20;
  }
  a:focus,
  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }

  input, textarea {
    font-family: inherit;
    color: inherit;
    background-color:transparent;
    border: none;
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;
