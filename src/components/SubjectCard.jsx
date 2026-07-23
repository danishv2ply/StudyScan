import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaBook, FaTrash, FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";

function SubjectCard({ subject, onDeleteSubject }) {
  const [flashcards, setFlashcards] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  
  const [loadingCards, setLoadingCards] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [revealedCardId, setRevealedCardId] = useState(null);
  const [showDeck, setShowDeck] = useState(false);

  // 1. Fetch flashcards belonging to this specific subject instance
  const fetchFlashcards = async () => {
    if (!subject?.id) return;
    try {
      setLoadingCards(true);
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("subject_id", subject.id); // Maps directly to your subject_id column

      if (error) throw error;
      setFlashcards(data || []);
    } catch (err) {
      console.error("Error fetching flashcards:", err.message);
    } finally {
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    if (showDeck) {
      fetchFlashcards();
    }
  }, [showDeck]);

  // 2. Create a new flashcard for this subject
  const handleAddFlashcard = async (e) => {
    e.preventDefault();
    if (!questionText.trim() || !answerText.trim()) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("flashcards")
        .insert([
          {
            question: questionText.trim(),      // Matches your 'question' column
            answer: answerText.trim(),          // Matches your 'answer' column
            subject_id: parseInt(subject.id, 10) // Matches your 'subject_id' column
          }
        ]);

      if (error) throw error;

      setQuestionText("");
      setAnswerText("");
      fetchFlashcards(); // Refresh list
    } catch (error) {
      alert(`Error creating card: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Delete an individual flashcard row
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Delete this flashcard?")) return;

    try {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", cardId);

      if (error) throw error;
      fetchFlashcards();
    } catch (error) {
      alert(`Error deleting card: ${error.message}`);
    }
  };

  return (
    <div style={{ background: "#1e293b", border: "1px solid #374151", borderRadius: "20px", padding: "20px", marginBottom: "16px", color: "#ffffff", fontFamily: "-apple-system, sans-serif" }}>
      
      {/* SUBJECT INFO HEADER ROW */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ background: "#312e81", color: "#818cf8", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaBook size={18} />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#818cf8" }}>{subject.code}</div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#ffffff", marginTop: "2px" }}>{subject.name}</div>
          </div>
        </div>
        
        {onDeleteSubject && (
          <button onClick={() => onDeleteSubject(subject.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "6px" }}>
            <FaTrash size={15} />
          </button>
        )}
      </div>

      {/* TOGGLE DECK EXPANSION BUTTON */}
      <button onClick={() => setShowDeck(!showDeck)} style={{ width: "100%", background: showDeck ? "#334155" : "#2e1065", border: showDeck ? "1px solid #4b5563" : "1px solid #6b21a8", borderRadius: "12px", padding: "10px", color: showDeck ? "#ffffff" : "#c084fc", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}>
        {showDeck ? "Hide Flashcards" : `View Flashcards (${flashcards.length || "👀"})`}
      </button>

      {/* EXPANDABLE DECK CONTENT */}
      {showDeck && (
        <div style={{ marginTop: "16px", borderTop: "1px solid #374151", paddingTop: "16px" }}>
          
          {/* QUICK INLINE CREATION FORM */}
          <form onSubmit={handleAddFlashcard} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px", background: "#0f172a", padding: "12px", borderRadius: "14px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#a855f7" }}>Quick Add Card</span>
            <input type="text" placeholder="Question..." value={questionText} onChange={(e) => setQuestionText(e.target.value)} required style={{ background: "#1e293b", border: "1px solid #4b5563", borderRadius: "8px", padding: "8px 12px", color: "#ffffff", fontSize: "13px", outline: "none" }} />
            <input type="text" placeholder="Answer..." value={answerText} onChange={(e) => setAnswerText(e.target.value)} required style={{ background: "#1e293b", border: "1px solid #4b5563", borderRadius: "8px", padding: "8px 12px", color: "#ffffff", fontSize: "13px", outline: "none" }} />
            <button type="submit" disabled={submitting} style={{ background: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)", border: "none", borderRadius: "8px", padding: "8px", color: "#ffffff", fontWeight: "600", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <FaPlus size={10} /> {submitting ? "Adding..." : "Save Card"}
            </button>
          </form>

          {/* LIST OF CARDS */}
          {loadingCards ? (
            <div style={{ textAlign: "center", padding: "10px", color: "#9ca3af", fontSize: "13px" }}>Loading deck...</div>
          ) : flashcards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px", color: "#9ca3af", fontSize: "13px", fontStyle: "italic" }}>No flashcards inside this module.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {flashcards.map((card) => (
                <div key={card.id} style={{ background: "#0f172a", borderRadius: "12px", padding: "12px", border: "1px solid #374151" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>Q: {card.question}</div>
                    <button onClick={() => handleDeleteCard(card.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px" }}><FaTrash size={11} /></button>
                  </div>

                  {/* ANSWER REVEAL LOGIC */}
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {revealedCardId === card.id ? (
                      <div style={{ fontSize: "13px", color: "#cbd5e1", background: "#1e293b", padding: "8px", borderRadius: "8px", borderLeft: "3px solid #10b981" }}>
                        <strong>A:</strong> {card.answer}
                        <button onClick={() => setRevealedCardId(null)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "11px", cursor: "pointer", display: "block", marginTop: "4px", padding: 0 }}>Hide</button>
                      </div>
                    ) : (
                      <button onClick={() => setRevealedCardId(card.id)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#c084fc", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}>
                        <FaEye size={12} /> View Answer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default SubjectCard;