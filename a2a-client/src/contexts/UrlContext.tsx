import React, { createContext, useContext, useState, useEffect } from "react";

interface UrlContextType {
  endpoint: string;
  setEndpoint: (url: string) => void;
}

const UrlContext = createContext<UrlContextType | undefined>(undefined);

export const useUrl = () => {
  const context = useContext(UrlContext);
  if (!context) {
    throw new Error("useUrl must be used within a UrlProvider");
  }
  return context;
};

interface UrlProviderProps {
  children: React.ReactNode;
  defaultEndpoint?: string;
}

export const UrlProvider: React.FC<UrlProviderProps> = ({
  children,
  defaultEndpoint = "http://localhost:3000",
}) => {
  const [endpoint, setEndpoint] = useState<string>(() => {
    const savedEndpoint = localStorage.getItem("a2aEndpoint");
    return savedEndpoint || defaultEndpoint;
  });

  useEffect(() => {
    localStorage.setItem("a2aEndpoint", endpoint);
  }, [endpoint]);

  return (
    <UrlContext.Provider value={{ endpoint, setEndpoint }}>
      {children}
    </UrlContext.Provider>
  );
};
