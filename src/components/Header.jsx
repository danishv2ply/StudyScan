import React from "react";
import { FaUserCircle, FaBell } from "react-icons/fa";

function Header() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0",
      marginBottom: "10px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <FaUserCircle size={32} color="#6366f1" />
        <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff", fontWeight: "700" }}>
          Hello, danish! 👋
        </h3>
      </div>
      <FaBell size={20} color="#9ca3af" style={{ cursor: "pointer" }} />
    </div>
  );
}

export default Header;