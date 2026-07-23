import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import BottomNav from "../components/BottomNav";
import toast from "react-hot-toast";
import { FaBook, FaPlus, FaTrash, FaArrowLeft } from "react-icons/fa";

function Subjects() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch subjects matching the user's string user_id
  const fetchSubjects = async (studentId) => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", studentId);

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error.message);
    }
  };

  useEffect(() => {
    const activeSession = localStorage.getItem("userSession");
    if (!activeSession) {
      navigate("/");
      return;
    }

    const { email } = JSON.parse(activeSession);
    // Keep exact string identifier (e.g. "2024277606" or "apek123")
    const studentId = email.split("@")[0];

    setUserId(studentId);
    fetchSubjects(studentId);
  }, [navigate]);

  // Insert subject using matching schema columns (code, name, user_id)
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setLoading(true);

    const formattedCode = code.trim().toUpperCase();
    const formattedName = name.trim();

    try {
      const { error } = await supabase.from("subjects").insert([
        {
          code: formattedCode,
          name: formattedName,
          user_id: userId,
        },
      ]);

      if (error) throw error;

      setCode("");
      setName("");
      fetchSubjects(userId);
      toast.success("✨ Subject added successfully!");
    } catch (error) {
      toast.error(`Error adding subject: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete subject
  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;

    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);

      if (error) throw error;
      toast.success("Subject deleted successfully");
      fetchSubjects(userId);
    } catch (error) {
      toast.error(`Error deleting subject: ${error.message}`);
    }
  };

  return (
    <div
      style={{
        background: "#0f172a",
        minHeight: "100vh",
        color: "#ffffff",
        padding: "16px 20px",
        paddingBottom: "120px",
        boxSizing: "border-box",
        fontFamily: "-apple-system, sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
          marginTop: "10px",
        }}
      >
        <button
          onClick={() => navigate("/home")}
          style={{
            background: "#1e293b",
            border: "none",
            color: "#ffffff",
            padding: "10px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaArrowLeft size={16} />
        </button>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
          My Subjects
        </h2>
      </div>

      {/* ADD SUBJECT FORM */}
      <form
        onSubmit={handleAddSubject}
        style={{
          background: "#1e293b",
          border: "1px solid #374151",
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#9ca3af",
              fontWeight: "600",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Subject Code
          </label>
          <input
            type="text"
            placeholder="e.g., CSC264"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            style={{
              width: "100%",
              background: "#0f172a",
              border: "1px solid #4b5563",
              borderRadius: "12px",
              padding: "12px",
              color: "#ffffff",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#9ca3af",
              fontWeight: "600",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Subject Name
          </label>
          <input
            type="text"
            placeholder="e.g., Mobile Web Development"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: "100%",
              background: "#0f172a",
              border: "1px solid #4b5563",
              borderRadius: "12px",
              padding: "12px",
              color: "#ffffff",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background:
              "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            border: "none",
            borderRadius: "12px",
            padding: "14px",
            color: "#ffffff",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "6px",
          }}
        >
          <FaPlus size={14} /> {loading ? "Adding..." : "Add Subject"}
        </button>
      </form>

      {/* ENROLLED SUBJECTS LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3
          style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#9ca3af" }}
        >
          Enrolled List ({subjects.length})
        </h3>

        {subjects.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "#1e293b",
              borderRadius: "16px",
              border: "1px dashed #4b5563",
              color: "#9ca3af",
            }}
          >
            <FaBook
              size={32}
              style={{ marginBottom: "12px", opacity: 0.5 }}
            />
            <p style={{ margin: 0, fontSize: "14px" }}>
              No subjects added yet. Add your modules above!
            </p>
          </div>
        ) : (
          subjects.map((sub) => (
            <div
              key={sub.id}
              style={{
                background: "#1e293b",
                border: "1px solid #374151",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    background: "#312e81",
                    color: "#818cf8",
                    padding: "12px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaBook size={18} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#818cf8",
                    }}
                  >
                    {sub.code}
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#ffffff",
                      marginTop: "2px",
                    }}
                  >
                    {sub.name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteSubject(sub.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  padding: "8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FaTrash size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Subjects;