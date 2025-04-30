import { GrCaretNext, GrCaretPrevious } from "react-icons/gr";
import { styled } from "styled-components";

const PaginationComponentContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border: 1px solid #0000001b;
  border-radius: 10px;
  margin: 10px;
  width: 100px;
  align-items: center;
`;

interface PaginationComponentProps {
  totalPages?: number | null;
  currentPage?: number | null;
  totalCount?: number | null;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export const PaginationComponent = ({
  currentPage = null,
  totalPages = null,
  totalCount = null,
  onIncrement = () => {},
  onDecrement = () => {},
}: PaginationComponentProps) => {
  const handleNextPage = () => {
    onIncrement();
  };
  const handlePreviousPage = () => {
    onDecrement();
  };
  return (
    <PaginationComponentContainer>
      {currentPage && currentPage > 1 ? (
        <GrCaretPrevious cursor="pointer" onClick={handlePreviousPage} />
      ) : (
        <GrCaretPrevious cursor="not-allowed" />
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "1.1em" }}>
          {currentPage}/{totalPages ? totalPages : 1}
        </div>
        {totalCount && (
          <div
            style={{
              fontSize: "0.75em",
              color: "#666",
              marginTop: "2px",
              fontStyle: "italic",
            }}
          >
            {totalCount} items
          </div>
        )}
      </div>
      {currentPage && totalPages && currentPage < totalPages ? (
        <GrCaretNext cursor="pointer" onClick={handleNextPage} />
      ) : (
        <GrCaretNext cursor="not-allowed" />
      )}
    </PaginationComponentContainer>
  );
};
