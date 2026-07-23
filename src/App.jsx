import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";       
import Register from "./pages/Register"; 
import Home from "./pages/Home";
import Subjects from "./pages/Subjects";
import Scan from "./pages/Scan";
import Notes from "./pages/Notes";
import Profile from "./pages/Profile";

// 🔐 Automated Router Guard Component
const ProtectedRoute = ({ children }) => {
  const activeSession = localStorage.getItem("userSession");
  
  // If no user is logged in, immediately kick them out to the login page
  if (!activeSession) {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise, grant access to the requested dashboard page
  return children;
};

function App() {
  return (
    <Router>
      {/* 🔔 Global In-App Toast Notification Container */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#ffffff",
            border: "1px solid #334155",
            borderRadius: "14px",
            fontSize: "14px",
            fontWeight: "600",
            padding: "12px 16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff"
            }
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff"
            }
          }
        }}
      />

      <Routes>
        {/* Public Authentication Screens */}
        <Route path="/" element={<Login />} />       
        <Route path="/register" element={<Register />} />

        {/* Private Protected App Screens */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;