import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { FaArrowLeft, FaCamera, FaMagic, FaSync, FaSave, FaBrain } from "react-icons/fa";
import { supabase } from "../supabaseClient";

function Scan() {
  const navigate = useNavigate();
  
  // 1. Separate Refs for Camera vs Gallery
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Enrolled Subjects State
  const [subjectsList, setSubjectsList] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  useEffect(() => {
    fetchUserSubjects();
  }, []);

  // Safe helper to extract numeric ID or handle text usernames
  const getSafeStudentId = (email) => {
    if (!email) return null;
    const rawId = email.split("@")[0];
    return !isNaN(rawId) && rawId !== "" ? parseInt(rawId, 10) : null;
  };

  // Fetch Enrolled Modules for Subject Tagging
  const fetchUserSubjects = async () => {
    const activeSession = localStorage.getItem("userSession");
    if (!activeSession) return;

    try {
      const { email: sessionEmail } = JSON.parse(activeSession);
      const rawId = sessionEmail ? sessionEmail.split("@")[0] : null;

      if (!rawId) return;

      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", rawId);

      if (error) throw error;

      setSubjectsList(data || []);
      if (data && data.length > 0) {
        setSelectedSubjectId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  // Client-Side Image Compressor
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200; 
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          resolve(compressedBase64);
        };
      };
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatusMessage("Compressing document layout...");
    const compressed = await compressImage(file);
    setImagePreview(compressed);
    setExtractedText("");
    setStatusMessage("");
  };

  // Direct Gemini Call API with Retry Mechanism
  const executeGeminiScanWithRetry = async (base64Data, retriesLeft = 2, delay = 2000) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY is missing from your .env file!");
    }

    const rawBase64Data = base64Data.split(",")[1];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: rawBase64Data
              }
            },
            {
              text: "You are an expert OCR and study assistant. Read the provided handwritten study notes, whiteboard diagrams, or textbook images carefully. Extract all text clearly, format definitions into clean markdown bullet points, and maintain logical headers."
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let detailedError = `Status ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error?.message) {
            detailedError = errorData.error.message;
          }
        } catch (_) {}

        if ((response.status === 429 || response.status === 503) && retriesLeft > 0) {
          setStatusMessage(`Server busy. Retrying extraction loop... (${retriesLeft} left)`);
          await new Promise((res) => setTimeout(res, delay));
          return await executeGeminiScanWithRetry(base64Data, retriesLeft - 1, delay * 1.5);
        }
        throw new Error(detailedError);
      }

      const data = await response.json();
      const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResult) throw new Error("Could not find text payload inside Gemini response structures.");
      return textResult;

    } catch (err) {
      if (retriesLeft === 0) throw err;
      await new Promise((res) => setTimeout(res, delay));
      return await executeGeminiScanWithRetry(base64Data, retriesLeft - 1, delay * 1.5);
    }
  };

  const handleStartScan = async () => {
    if (!imagePreview) return;

    setLoading(true);
    setStatusMessage("Analyzing text structures via Gemini Flash...");

    try {
      const parsedText = await executeGeminiScanWithRetry(imagePreview);
      setExtractedText(parsedText);
      setStatusMessage("");
    } catch (error) {
      console.error(error);
      alert(`Gemini Extraction Failed: ${error.message}`);
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  // Save Extracted Text directly into Supabase 'notes' table
  const handleSaveToNotes = async () => {
    if (!extractedText) return;
    setSaving(true);

    const activeSession = localStorage.getItem("userSession");
    const { email: sessionEmail } = activeSession ? JSON.parse(activeSession) : { email: "" };
    const studentId = getSafeStudentId(sessionEmail);

    try {
      const parsedSubjectId = selectedSubjectId ? parseInt(selectedSubjectId, 10) : null;
      const matchedSubject = subjectsList.find(s => s.id === parsedSubjectId);
      const noteTitle = matchedSubject 
        ? `${matchedSubject.code} Scan - ${new Date().toLocaleDateString()}` 
        : `Scan Note - ${new Date().toLocaleDateString()}`;

      const { error } = await supabase.from("notes").insert([
        {
          title: noteTitle,
          scanned_text: extractedText,
          user_id: studentId,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;

      alert("✨ Note saved successfully!");
      navigate("/notes");
    } catch (err) {
      console.error("Save Note Error:", err);
      alert(`Failed to save note: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // AI Flashcard Generator from Extracted Text
  const handleGenerateAIFlashcards = async () => {
    if (!extractedText) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Missing Gemini API Key in .env!");
      return;
    }

    setGeneratingCards(true);
    setStatusMessage("AI is drafting study flashcards from your note...");

    const prompt = `Based on the following study notes, generate 3 to 5 clear question and answer study pairs. Return STRICTLY a JSON array of objects without markdown formatting or backticks. Format: [{"question": "...", "answer": "..."}].\n\nStudy Notes:\n${extractedText}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error("Gemini AI request failed.");

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const flashcardsArray = JSON.parse(cleanedJson);

      const activeSession = localStorage.getItem("userSession");
      const { email: sessionEmail } = activeSession ? JSON.parse(activeSession) : { email: "" };
      const studentId = getSafeStudentId(sessionEmail);

      const parsedSubjectId = selectedSubjectId ? parseInt(selectedSubjectId, 10) : null;

      // Insert generated flashcards into Supabase
      const payload = flashcardsArray.map(card => ({
        subject_id: !isNaN(parsedSubjectId) ? parsedSubjectId : null,
        question: card.question,
        answer: card.answer,
        user_id: studentId,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from("flashcards").insert(payload);
      if (error) throw error;

      alert(`🎉 Successfully generated and saved ${flashcardsArray.length} AI flashcards!`);
      navigate("/notes");

    } catch (err) {
      console.error("Flashcard Generation Error:", err);
      alert(`Failed to generate flashcards: ${err.message}`);
    } finally {
      setGeneratingCards(false);
      setStatusMessage("");
    }
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#ffffff", padding: "16px 20px", paddingBottom: "120px", boxSizing: "border-box", fontFamily: "-apple-system, sans-serif" }}>
      
      {/* 2. HIDDEN FILE INPUTS */}
      {/* (A) Camera Only Input */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={cameraInputRef} 
        onChange={handleFileChange} 
        style={{ display: "none" }} 
      />

      {/* (B) Gallery / File Selection Input */}
      <input 
        type="file" 
        accept="image/*" 
        ref={galleryInputRef} 
        onChange={handleFileChange} 
        style={{ display: "none" }} 
      />

      {/* HEADER BAR */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", marginTop: "10px" }}>
        <button onClick={() => navigate("/home")} style={{ background: "#1e293b", border: "none", color: "#ffffff", padding: "10px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <FaArrowLeft size={16} />
        </button>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>Scan Picture 🧠</h2>
      </div>

      {/* SUBJECT TAG SELECTION */}
      <div style={{ background: "#1e293b", padding: "14px 16px", borderRadius: "14px", marginBottom: "20px", border: "1px solid #334155" }}>
        <label style={{ display: "block", fontSize: "11px", color: "#a855f7", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>
          TAG TO MODULE / SUBJECT:
        </label>
        <select 
          value={selectedSubjectId} 
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          style={{ width: "100%", background: "#0f172a", border: "1px solid #4b5563", borderRadius: "10px", padding: "12px", color: "#ffffff", fontSize: "14px", outline: "none" }}
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

      {/* HOW TO SCAN GUIDE */}
      <div style={{ background: "#1e293b", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #334155" }}>
        <div style={{ fontSize: "12px", color: "#a855f7", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.5px" }}>How to scan:</div>
        <ul style={{ margin: 0, paddingLeft: "18px", color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
          <li>Tap the camera container to open camera directly or click "Choose Photo" to select from Gallery.</li>
          <li>Ensure lighting is bright and handwriting or print text is legible.</li>
          <li>Click "Extract Text" to process and format your notes.</li>
        </ul>
      </div>

      {/* PHOTO PREVIEW BOX (Triggers direct camera capture) */}
      <div style={{ width: "100%", background: "#1e293b", border: "2px dashed #4b5563", borderRadius: "20px", minHeight: "240px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", marginBottom: "20px" }}>
        {imagePreview ? (
          <img src={imagePreview} alt="Scan Target" style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "350px" }} />
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", cursor: "pointer" }} onClick={() => cameraInputRef.current.click()}>
            <FaCamera size={40} style={{ color: "#a855f7", marginBottom: "12px" }} />
            <div style={{ fontSize: "14px", fontWeight: "600" }}>Tap to snap or upload study notes</div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        {/* Gallery / File Picker Trigger Button */}
        <button onClick={() => galleryInputRef.current.click()} style={{ flex: 1, background: "#334155", border: "1px solid #4b5563", borderRadius: "12px", padding: "14px", color: "#ffffff", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <FaSync size={13} /> {imagePreview ? "Change Photo" : "Choose Photo"}
        </button>
        
        <button onClick={handleStartScan} disabled={loading || !imagePreview} style={{ flex: 2, background: !imagePreview ? "#4b5563" : "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)", border: "none", borderRadius: "12px", padding: "14px", color: "#ffffff", fontWeight: "700", cursor: !imagePreview ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <FaMagic size={14} /> {loading ? "Analyzing..." : "Extract Text"}
        </button>
      </div>

      {/* LIVE PROGRESS STATUS FOOTER */}
      {statusMessage && (
        <div style={{ background: "#1e1b4b", border: "1px solid #4338ca", color: "#c7d2fe", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", marginBottom: "20px", textAlign: "center" }}>
          🔄 {statusMessage}
        </div>
      )}

      {/* RESULT CONTAINER PANEL */}
      {extractedText && (
        <div style={{ background: "#1e293b", border: "1px solid #374151", borderRadius: "18px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#10b981", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>Extracted Result Summary</div>
          <div style={{ fontSize: "15px", color: "#cbd5e1", lineHeight: "1.6", whiteSpace: "pre-wrap", marginBottom: "20px" }}>
            {extractedText}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button 
              onClick={handleSaveToNotes} 
              disabled={saving}
              style={{ width: "100%", background: "#10b981", border: "none", borderRadius: "12px", padding: "14px", color: "#ffffff", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <FaSave size={14} /> {saving ? "Saving..." : "Save to Captured Scans"}
            </button>

            <button 
              onClick={handleGenerateAIFlashcards} 
              disabled={generatingCards}
              style={{ width: "100%", background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)", border: "none", borderRadius: "12px", padding: "14px", color: "#ffffff", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <FaBrain size={14} /> {generatingCards ? "Generating Cards..." : "Generate AI Flashcards"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default Scan;