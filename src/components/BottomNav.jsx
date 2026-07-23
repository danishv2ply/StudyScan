import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaCamera, FaStickyNote, FaUser } from "react-icons/fa";

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabStyle = (path) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    color: location.pathname === path ? "#6366f1" : "#9ca3af",
    cursor: "pointer",
    gap: "4px",
    flex: 1,
    padding: "8px 0",
    textDecoration: "none"
  });

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "#111827",
      borderTop: "1px solid #1f2937",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      padding: "10px 0 calc(env(safe-area-inset-bottom) + 8px) 0",
      zIndex: 100,
      boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.4)"
    }}>
      <button onClick={() => navigate("/home")} style={tabStyle("/home")}>
        <FaHome size={22} />
        <span style={{ fontSize: "11px", fontWeight: "600" }}>Home</span>
      </button>

      <button onClick={() => navigate("/scan")} style={tabStyle("/scan")}>
        <FaCamera size={22} />
        <span style={{ fontSize: "11px", fontWeight: "600" }}>Scan</span>
      </button>

      <button onClick={() => navigate("/notes")} style={tabStyle("/notes")}>
        <FaStickyNote size={22} />
        <span style={{ fontSize: "11px", fontWeight: "600" }}>Notes</span>
      </button>

      <button onClick={() => navigate("/profile")} style={tabStyle("/profile")}>
        <FaUser size={22} />
        <span style={{ fontSize: "11px", fontWeight: "600" }}>Profile</span>
      </button>
    </div>
  );
}

export default BottomNav;