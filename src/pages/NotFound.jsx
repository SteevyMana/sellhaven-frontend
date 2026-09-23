import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#e8edf3",
      textAlign: "center",
      padding: "20px"
    }}>

      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "48px 40px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        maxWidth: "420px",
        width: "100%"
      }}>

        <div style={{
          fontSize: "72px",
          fontWeight: "700",
          color: "#e2e8f0",
          lineHeight: 1,
          marginBottom: "16px"
        }}>
          404
        </div>

        <h2 style={{
          fontSize: "20px",
          fontWeight: "600",
          color: "#0f172a",
          marginBottom: "8px"
        }}>
          Page not found
        </h2>

        <p style={{
          color: "#64748b",
          fontSize: "14px",
          marginBottom: "28px"
        }}>
          The page you're looking for doesn't exist or was moved.
        </p>

        <button
          onClick={() => navigate("/")}
          style={{
            background: "#dbeafe",
            color: "#1d4ed8",
            border: "none",
            padding: "12px 28px",
            borderRadius: "10px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          Go to Dashboard
        </button>

      </div>

    </div>
  );
}

export default NotFound;