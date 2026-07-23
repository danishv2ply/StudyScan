import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // Ensure this path correctly points to your supabaseClient.js file
import { FaGraduationCap } from "react-icons/fa"; 

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔍 1. Query your custom Supabase 'users' table directly
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.trim())
        .eq("password", password)
        .maybeSingle();

      if (error) throw error;

      if (user) {
        // 🎉 2. Success! Save the email session into localStorage so Home/Profile components can load this specific user
        localStorage.setItem("userSession", JSON.stringify({ email: user.email }));
        navigate("/home");
      } else {
        // ❌ 3. The email or password does not match any row inside your Supabase table
        alert("❌ Invalid email or password. Please check your spelling and character case (e.g., 06POPCorn!)");
      }
    } catch (error) {
      alert(`❌ Database error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", boxSizing: "border-box", fontFamily: "-apple-system, sans-serif" }}>
      
      {/* BRANDING HEADER */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>
        <div style={{ color: "#818cf8", marginBottom: "6px" }}>
          <FaGraduationCap size={56} />
        </div>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800" }}>UiTM StudentHub</h1>
        <p style={{ margin: "6px 0 0 0", color: "#9ca3af", fontSize: "15px" }}>Log in to access your modules</p>
      </div>

      {/* LOGIN FORM */}
      <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        <input 
          type="email" 
          placeholder="Student Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ width: "100%", background: "#1e293b", border: "1px solid #374151", borderRadius: "12px", padding: "14px 16px", color: "#ffffff", fontSize: "15px", boxSizing: "border-box", outline: "none" }} 
        />
        
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ width: "100%", background: "#1e293b", border: "1px solid #374151", borderRadius: "12px", padding: "14px 16px", color: "#ffffff", fontSize: "15px", boxSizing: "border-box", outline: "none" }} 
        />
        
        <button 
          type="submit" 
          disabled={loading} 
          style={{ width: "100%", background: "#6366f1", border: "none", borderRadius: "12px", padding: "14px", color: "#ffffff", fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", marginTop: "8px", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

      </form>

      {/* LINK TO SIGN UP */}
      <p style={{ marginTop: "24px", fontSize: "14px", color: "#9ca3af" }}>
        Don't have an account?{" "}
        <span onClick={() => navigate("/register")} style={{ color: "#6366f1", fontWeight: "600", cursor: "pointer" }}>
          Sign up
        </span>
      </p>

    </div>
  );
}

export default Login;