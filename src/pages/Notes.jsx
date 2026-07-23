import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import { 
  FaCamera, 
  FaBrain, 
  FaTrash, 
  FaBookOpen, 
  FaPlus, 
  FaSyncAlt, 
  FaQuestionCircle, 
  FaCheckCircle, 
  FaFolderOpen,
  FaCopy,
  FaDownload
} from "react-icons/fa";

function Notes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("scanned"); // 'scanned' or 'flashcards'
  
  // Scanned Notes State
  const [notesList, setNotesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Flashcards State
  const [flashcardsList, setFlashcardsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(true);
  const [flippedCards, setFlippedCards] = useState({});

  // Flashcard Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [savingCard, setSavingCard] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchFlashcardData();
  }, []);

  // Helper function to safely parse user ID from session
  const getStudentId = () => {
    const activeSession = localStorage.getItem("userSession");
    if (!activeSession) return null;

    try {
      const { email: sessionEmail } = JSON.parse(activeSession);
      if (!sessionEmail) return null;

      const rawId = sessionEmail.split("@")[0];
      // Convert to integer if it's strictly numeric, otherwise return string
      return !isNaN(rawId) && rawId.trim() !== "" ? parseInt(rawId, 10) : rawId;
    } catch (e) {
      console.error("Session parse error:", e);
      return null;
    }
  };

  // 1. FETCH SCANNED NOTES FILTERED STRICTLY BY CURRENT USER ID
  const fetchNotes = async () => {
    const studentId = getStudentId();
    if (!studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotesList(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  // 2. FETCH USER SUBJECTS & FLASHCARDS FOR ACTIVE SESSION
  const fetchFlashcardData = async () => {
    const studentId = getStudentId();
    if (!studentId) return;

    // Fetch User Enrolled Subjects
    try {
      const { data: subjectsData, error: subErr } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", studentId);

      if (subErr) console.error("Error fetching subjects:", subErr);

      setSubjectsList(subjectsData || []);
      if (subjectsData && subjectsData.length > 0) {
        setSelectedSubjectId(subjectsData[0].id);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }

    // Fetch User Flashcards
    try {
      setLoadingFlashcards(true);
      const { data: flashData, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlashcardsList(flashData || []);
    } catch (err) {
      console.error("Error fetching flashcards:", err.message);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  // Copy Note Text to Clipboard
  const handleCopyNote = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Note copied to clipboard! 📋");
  };

  // Download Note as Text File (.txt)
  const handleDownloadNote = (title, text) => {
    if (!text) return;
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${(title || "Scan_Note").replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Downloaded note as text file! 📄");
  };

  // Delete note function
  const handleDeleteNote = async (id) => {
    const toastId = toast.loading("Deleting scan note...");
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;

      setNotesList((prev) => prev.filter((note) => note.id !== id));
      toast.success("Note deleted!", { id: toastId });
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`, { id: toastId });
    }
  };

  // Create new flashcard
  const handleCreateFlashcard = async (e) => {
    e.preventDefault();
    if (!questionInput.trim() || !answerInput.trim()) {
      toast.error("Please enter both a question and an answer.");
      return;
    }

    const studentId = getStudentId();
    if (!studentId) {
      toast.error("User session missing.");
      return;
    }

    setSavingCard(true);
    const toastId = toast.loading("Saving flashcard...");

    try {
      const { data, error } = await supabase
        .from("flashcards")
        .insert([
          {
            subject_id: selectedSubjectId ? parseInt(selectedSubjectId, 10) : null,
            question: questionInput.trim(),
            answer: answerInput.trim(),
            user_id: studentId,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      toast.success("✨ Flashcard created successfully!", { id: toastId });
      setQuestionInput("");
      setAnswerInput("");

      if (data && data.length > 0) {
        setFlashcardsList((prev) => [data[0], ...prev]);
      } else {
        fetchFlashcardData();
      }
    } catch (err) {
      toast.error(`Error saving card: ${err.message}`, { id: toastId });
    } finally {
      setSavingCard(false);
    }
  };

  // Delete flashcard
  const handleDeleteFlashcard = async (id) => {
    const toastId = toast.loading("Deleting card...");
    try {
      const { error } = await supabase.from("flashcards").delete().eq("id", id);
      if (error) throw error;

      setFlashcardsList((prev) => prev.filter((card) => card.id !== id));
      toast.success("Flashcard removed!", { id: toastId });
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`, { id: toastId });
    }
  };

  // Toggle card flip (reveal answer)
  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // GROUP FLASHCARDS BY SUBJECT
  const groupedFlashcards = flashcardsList.reduce((acc, card) => {
    const subject = subjectsList.find((s) => s.id === card.subject_id);
    const subjectKey = subject ? `${subject.code} - ${subject.name}` : "General / Uncategorized";
    
    if (!acc[subjectKey]) {
      acc[subjectKey] = [];
    }
    acc[subjectKey].push(card);
    return acc;
  }, {});

  return (
    <div style={{ background: "#0b1120", minHeight: "100vh", color: "#ffffff", padding: "16px 20px", paddingBottom: "120px", boxSizing: "border-box", fontFamily: "-apple-system, sans-serif" }}>
      
      {/* TOGGLE TAB HEADER */}
      <div style={{ display: "flex", background: "#1e293b", padding: "4px", borderRadius: "14px", marginBottom: "24px" }}>
        <button 
          onClick={() => setActiveTab("scanned")}
          style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: activeTab === "scanned" ? "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)" : "transparent", color: activeTab === "scanned" ? "#ffffff" : "#9ca3af", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          <FaCamera size={14} /> Scanned Notes
        </button>
        <button 
          onClick={() => setActiveTab("flashcards")}
          style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: activeTab === "flashcards" ? "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)" : "transparent", color: activeTab === "flashcards" ? "#ffffff" : "#9ca3af", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          <FaBrain size={14} /> Flashcards
        </button>
      </div>

      {activeTab === "scanned" ? (
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", textAlign: "center", marginBottom: "20px" }}>Captured Scans 📸</h2>

          {loading ? (
            <div style={{ textAlign: "center", color: "#9ca3af", marginTop: "40px" }}>Loading saved scans...</div>
          ) : notesList.length === 0 ? (
            <div style={{ width: "100%", background: "#1e293b", border: "1px dashed #4b5563", borderRadius: "16px", padding: "40px 20px", textAlign: "center", color: "#9ca3af", boxSizing: "border-box" }}>
              No documents scanned yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {notesList.map((note) => (
                <div key={note.id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#a855f7", display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaBookOpen size={14} /> {note.title || "Untitled Scan"}
                    </div>
                    
                    {/* ACTION BUTTONS (COPY, DOWNLOAD, DELETE) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button 
                        onClick={() => handleCopyNote(note.scanned_text)}
                        title="Copy to Clipboard"
                        style={{ background: "rgba(168, 85, 247, 0.15)", border: "none", color: "#c084fc", cursor: "pointer", padding: "6px 8px", borderRadius: "8px", display: "flex", alignItems: "center" }}
                      >
                        <FaCopy size={13} />
                      </button>
                      <button 
                        onClick={() => handleDownloadNote(note.title, note.scanned_text)}
                        title="Download Text File"
                        style={{ background: "rgba(59, 130, 246, 0.15)", border: "none", color: "#60a5fa", cursor: "pointer", padding: "6px 8px", borderRadius: "8px", display: "flex", alignItems: "center" }}
                      >
                        <FaDownload size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        title="Delete Note"
                        style={{ background: "rgba(239, 68, 68, 0.15)", border: "none", color: "#f87171", cursor: "pointer", padding: "6px 8px", borderRadius: "8px", display: "flex", alignItems: "center" }}
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.5", whiteSpace: "pre-wrap", background: "#0f172a", padding: "12px", borderRadius: "10px", maxHeight: "150px", overflowY: "auto" }}>
                    {note.scanned_text || "No text available."}
                  </div>

                  <div style={{ fontSize: "11px", color: "#64748b", textAlign: "right" }}>
                    {note.created_at ? new Date(note.created_at).toLocaleString() : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* CREATE FLASHCARD FORM */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "20px", padding: "20px", marginBottom: "28px", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaPlus style={{ color: "#c084fc" }} size={14} /> Create New Flashcard
            </h3>

            <form onSubmit={handleCreateFlashcard} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* SUBJECT DROPDOWN */}
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "6px", fontWeight: "700", letterSpacing: "0.5px" }}>SELECT SUBJECT</label>
                <select 
                  value={selectedSubjectId} 
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "12px", padding: "12px", color: "#ffffff", fontSize: "14px", outline: "none" }}
                >
                  {subjectsList.length === 0 ? (
                    <option value="">No enrolled subjects found</option>
                  ) : (
                    subjectsList.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* QUESTION INPUT */}
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "6px", fontWeight: "700", letterSpacing: "0.5px" }}>QUESTION / FRONT</label>
                <input 
                  type="text" 
                  placeholder="e.g., What is mobile app development?"
                  value={questionInput} 
                  onChange={(e) => setQuestionInput(e.target.value)} 
                  required
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "12px", padding: "12px", color: "#ffffff", fontSize: "14px", boxSizing: "border-box", outline: "none" }} 
                />
              </div>

              {/* ANSWER INPUT */}
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "6px", fontWeight: "700", letterSpacing: "0.5px" }}>ANSWER / BACK</label>
                <textarea 
                  rows={3}
                  placeholder="e.g., The process of creating software applications that run on a mobile device."
                  value={answerInput} 
                  onChange={(e) => setAnswerInput(e.target.value)} 
                  required
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "12px", padding: "12px", color: "#ffffff", fontSize: "14px", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }} 
                />
              </div>

              <button 
                type="submit" 
                disabled={savingCard}
                style={{ width: "100%", background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)", border: "none", borderRadius: "12px", padding: "14px", color: "#ffffff", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(168, 85, 247, 0.3)" }}
              >
                <FaPlus size={13} /> {savingCard ? "Saving..." : "Add Flashcard"}
              </button>
            </form>
          </div>

          {/* FLASHCARD DISPLAY SECTIONS BY SUBJECT */}
          {loadingFlashcards ? (
            <div style={{ textAlign: "center", color: "#9ca3af", marginTop: "20px" }}>Loading flashcards...</div>
          ) : Object.keys(groupedFlashcards).length === 0 ? (
            <div style={{ width: "100%", background: "#1e293b", border: "1px dashed #4b5563", borderRadius: "16px", padding: "30px 20px", textAlign: "center", color: "#9ca3af", boxSizing: "border-box" }}>
              No flashcards created yet. Use the form above to add your first card!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {Object.entries(groupedFlashcards).map(([subjectTitle, cards]) => (
                <div key={subjectTitle}>
                  {/* SUBJECT SECTION HEADER */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid #1e293b", paddingBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FaFolderOpen style={{ color: "#a855f7" }} size={18} />
                      <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>
                        {subjectTitle}
                      </h3>
                    </div>
                    <span style={{ background: "#312e81", color: "#a5b4fc", fontSize: "12px", padding: "4px 12px", borderRadius: "20px", fontWeight: "800" }}>
                      {cards.length} {cards.length === 1 ? "Card" : "Cards"}
                    </span>
                  </div>

                  {/* CARDS LIST FOR THIS SUBJECT */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {cards.map((card) => {
                      const isFlipped = flippedCards[card.id];
                      const matchedSubject = subjectsList.find((s) => s.id === card.subject_id);

                      return (
                        <div
                          key={card.id}
                          onClick={() => toggleFlip(card.id)}
                          style={{
                            perspective: "1000px",
                            cursor: "pointer",
                            height: "170px",
                            position: "relative"
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              position: "relative",
                              transformStyle: "preserve-3d",
                              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                            }}
                          >
                            {/* FRONT OF CARD (QUESTION) */}
                            <div
                              style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                backfaceVisibility: "hidden",
                                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                                border: "1px solid #3b82f6",
                                borderRadius: "20px",
                                padding: "18px",
                                boxSizing: "border-box",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.2)"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ background: "#1e3a8a", color: "#60a5fa", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "12px", letterSpacing: "0.5px" }}>
                                    {matchedSubject ? matchedSubject.code : "MODULE"}
                                  </span>
                                  <span style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", fontSize: "10px", fontWeight: "800", padding: "4px 8px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <FaQuestionCircle size={10} /> QUESTION
                                  </span>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteFlashcard(card.id); }}
                                  style={{ background: "rgba(239, 68, 68, 0.15)", border: "none", color: "#f87171", padding: "8px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <FaTrash size={12} />
                                </button>
                              </div>

                              <div style={{ fontSize: "17px", fontWeight: "800", color: "#ffffff", textAlign: "center", padding: "0 10px" }}>
                                {card.question}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", color: "#60a5fa", fontWeight: "600" }}>
                                <FaSyncAlt size={11} /> Tap to flip card
                              </div>
                            </div>

                            {/* BACK OF CARD (ANSWER) */}
                            <div
                              style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                backfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                                background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)",
                                border: "1px solid #818cf8",
                                borderRadius: "20px",
                                padding: "18px",
                                boxSizing: "border-box",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.3)"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ background: "#4338ca", color: "#a5b4fc", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "12px", letterSpacing: "0.5px" }}>
                                    {matchedSubject ? matchedSubject.code : "MODULE"}
                                  </span>
                                  <span style={{ background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontSize: "10px", fontWeight: "800", padding: "4px 8px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <FaCheckCircle size={10} /> ANSWER
                                  </span>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteFlashcard(card.id); }}
                                  style={{ background: "rgba(239, 68, 68, 0.2)", border: "none", color: "#f87171", padding: "8px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <FaTrash size={12} />
                                </button>
                              </div>

                              <div style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", textAlign: "center", lineHeight: "1.4", padding: "0 10px" }}>
                                {card.answer}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", color: "#a5b4fc", fontWeight: "600" }}>
                                <FaSyncAlt size={11} /> Tap to flip back
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default Notes;