import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGraduationCap } from "react-icons/fa"; 

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    if (username && email && password) {
      const existingUsers = JSON.parse(localStorage.getItem("studyScanUsers")) || [];
      
      const userExists = existingUsers.some(user => user.email === email);
      if (userExists) {
        alert("❌ An account with this email already exists!");
        return;
      }

      const newUser = { 
        id: "std-" + Date.now(), 
        username, 
        email, 
        password, 
        profilePic: "" 
      };
      
      existingUsers.push(newUser);
      localStorage.setItem("studyScanUsers", JSON.stringify(existingUsers));
      localStorage.setItem("userSession", JSON.stringify({ email: newUser.email }));
      
      alert("🎉 Account created successfully! Welcome to StudentHub.");
      navigate("/home");
    }
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", boxSizing: "border-box", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>
        <div style={{ color: "#818cf8", marginBottom: "6px" }}><FaGraduationCap size={56} /></div>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800" }}>UiTM StudentHub</h1>
        <p style={{ margin: "6px 0 0 0", color: "#9ca3af", fontSize: "15px" }}>Create an account to get started</p>
      </div>

      <form onSubmit={handleRegister} style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: "100%", background: "#1e293b", border: "1px solid #374151", borderRadius: "12px", padding: "14px 16px", color: "#ffffff", fontSize: "15px", boxSizing: "border-box", outline: "none" }} />
        <input type="email" placeholder="Student Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", background: "#1e293b", border: "1px solid #374151", borderRadius: "12px", padding: "14px 16px", color: "#ffffff", fontSize: "15px", boxSizing: "border-box", outline: "none" }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", background: "#1e293b", border: "1px solid #374151", borderRadius: "12px", padding: "14px 16px", color: "#ffffff", fontSize: "15px", boxSizing: "border-box", outline: "none" }} />
        <button type="submit" style={{ width: "100%", background: "#6366f1", border: "none", borderRadius: "12px", padding: "14px", color: "#ffffff", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "8px" }}>Sign Up</button>
      </form>

      <p style={{ marginTop: "24px", fontSize: "14px", color: "#9ca3af" }}>Already have an account? <span onClick={() => navigate("/")} style={{ color: "#6366f1", fontWeight: "600", cursor: "pointer" }}>Log in</span></p>
    </div>
  );
}

export default Register;