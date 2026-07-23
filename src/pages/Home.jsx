import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import BottomNav from "../components/BottomNav";
import { FaBook, FaCamera, FaStickyNote, FaBell, FaUserCircle, FaQuoteLeft, FaFire, FaChartLine } from "react-icons/fa";
import { LuHand } from "react-icons/lu"; 

function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Student"); 
  const [profilePic, setProfilePic] = useState(""); 
  const [dailyQuote, setDailyQuote] = useState("");

  // Analytics & Streak State
  const [stats, setStats] = useState({
    subjectsCount: 0,
    scansCount: 0,
    flashcardsCount: 0
  });
  const [streakDays, setStreakDays] = useState(3);

  const motivationalQuotes = [
    "Push yourself, because no one else is going to do it for you. You've got this!",
    "Believe you can and you're halfway there. Enjoy the journey today!",
    "Small progress every single day adds up to big massive results.",
    "Be happy with what you have while working for what you want. Smile!"
  ];

  useEffect(() => {
    const fetchUserDataAndStats = async () => {
      // 1. Get current active user email session from login
      const activeSession = localStorage.getItem("userSession");
      if (!activeSession) {
        navigate("/"); 
        return;
      }

      const { email } = JSON.parse(activeSession);
      const studentId = email.split("@")[0];

      // 2. Query custom Supabase 'users' table
      const { data: userData, error } = await supabase
        .from("users")
        .select("*") 
        .eq("email", email)
        .maybeSingle();

      if (userData && !error) {
        const dynamicName = userData.username || studentId;
        setUsername(dynamicName);
        setProfilePic(userData.profilePic || "");
      } else {
        setUsername(studentId);
      }

      // 3. Fetch Live Analytics Stats (Supporting user_id OR email matching)
      try {
        const [subjectsRes, notesRes, flashcardsRes] = await Promise.all([
          supabase.from("subjects").select("*").or(`user_id.eq.${studentId},user_id.eq.${email}`),
          supabase.from("notes").select("*").or(`user_id.eq.${studentId},user_id.eq.${email}`),
          supabase.from("flashcards").select("*").or(`user_id.eq.${studentId},user_id.eq.${email}`)
        ]);

        const totalSubjects = subjectsRes.data?.length || 0;
        const totalScans = notesRes.data?.length || 0;
        const totalCards = flashcardsRes.data?.length || 0;

        setStats({
          subjectsCount: totalSubjects,
          scansCount: totalScans,
          flashcardsCount: totalCards
        });

        // Dynamic streak calculation based on total activities
        const activityPoints = totalScans + totalCards;
        setStreakDays(activityPoints > 0 ? Math.min(activityPoints + 1, 14) : 1);

      } catch (err) {
        console.error("Error loading analytics stats:", err);
      }
    };

    fetchUserDataAndStats();

    const dayOfMonth = new Date().getDate();
    setDailyQuote(motivationalQuotes[dayOfMonth % motivationalQuotes.length]);
  }, [navigate]);

  // Calculate Weekly Goal Progress (Target: 10 total scans/flashcards per week)
  const totalActivities = stats.scansCount + stats.flashcardsCount;
  const weeklyTarget = 10;
  const progressPercent = Math.min(Math.round((totalActivities / weeklyTarget) * 100), 100);

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#ffffff", padding: "16px 20px", paddingBottom: "120px", boxSizing: "border-box", fontFamily: "-apple-system, sans-serif" }}>
      
      {/* HEADER ROW */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", marginTop: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div onClick={() => navigate("/profile")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
            {profilePic ? (
              <img src={profilePic} alt="Profile" style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "2px solid #818cf8" }} />
            ) : (
              <FaUserCircle size={38} style={{ color: "#818cf8" }} />
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
            Hello, {username}! <LuHand size={20} style={{ color: "#facc15", transform: "rotate(15deg)" }} />
          </h2>
        </div>
        <div style={{ background: "#1e293b", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
          <FaBell size={18} />
        </div>
      </div>

      {/* WELCOME BANNER */}
      <div style={{ width: "100%", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", borderRadius: "24px", padding: "28px 20px", boxSizing: "border-box", textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", opacity: 0.9 }}>Welcome Student:</h1>
        <h2 style={{ margin: "6px 0 0 0", fontSize: "26px", fontWeight: "800", color: "#fef08a" }}>"{username}"</h2>
      </div>

      {/* CORE FEATURES GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div onClick={() => navigate("/subjects")} style={{ background: "#1e293b", border: "1px solid #374151", borderRadius: "20px", padding: "22px 16px", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
          <FaBook size={20} style={{ color: "#818cf8", marginBottom: "10px" }} />
          <span style={{ fontSize: "15px", fontWeight: "700" }}>My Subjects</span>
        </div>
        <div onClick={() => navigate("/scan")} style={{ background: "#1e293b", border: "1px solid #374151", borderRadius: "20px", padding: "22px 16px", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
          <FaCamera size={20} style={{ color: "#c084fc", marginBottom: "10px" }} />
          <span style={{ fontSize: "15px", fontWeight: "700" }}>OCR Scanner</span>
        </div>
      </div>

      <div onClick={() => navigate("/notes")} style={{ background: "#1e293b", border: "1px solid #374151", borderRadius: "20px", padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", marginBottom: "16px" }}>
        <FaStickyNote size={20} style={{ color: "#facc15", marginBottom: "10px" }} />
        <span style={{ fontSize: "15px", fontWeight: "700" }}>My Notes & Flashcards</span>
      </div>

      {/* STREAK COUNTER CARD */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)", border: "1px solid #4338ca", borderRadius: "18px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "rgba(249, 115, 22, 0.2)", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaFire style={{ color: "#f97316" }} size={22} />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>{streakDays} Day Study Streak!</div>
            <div style={{ fontSize: "12px", color: "#a5b4fc" }}>Keep studying daily to hold your flame</div>
          </div>
        </div>
        <span style={{ fontSize: "20px" }}>🔥</span>
      </div>

      {/* ANALYTICS & STUDY PROGRESS BOARD */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "22px", padding: "20px", marginBottom: "28px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a855f7" }}>
            <FaChartLine size={16} />
            <span style={{ fontSize: "15px", fontWeight: "800", color: "#ffffff" }}>Study Analytics</span>
          </div>
          <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600" }}>This Week</span>
        </div>

        {/* STATS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "14px", padding: "12px 8px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#818cf8" }}>{stats.subjectsCount}</div>
            <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px", fontWeight: "700" }}>MODULES</div>
          </div>
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "14px", padding: "12px 8px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#c084fc" }}>{stats.scansCount}</div>
            <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px", fontWeight: "700" }}>SCANS</div>
          </div>
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "14px", padding: "12px 8px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#34d399" }}>{stats.flashcardsCount}</div>
            <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px", fontWeight: "700" }}>CARDS</div>
          </div>
        </div>

        {/* WEEKLY GOAL PROGRESS BAR */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
            <span style={{ color: "#cbd5e1", fontWeight: "600" }}>Weekly Target Progress</span>
            <span style={{ color: "#a855f7", fontWeight: "800" }}>{progressPercent}%</span>
          </div>
          <div style={{ width: "100%", background: "#0f172a", borderRadius: "10px", height: "10px", overflow: "hidden" }}>
            <div 
              style={{ 
                width: `${progressPercent}%`, 
                background: "linear-gradient(90deg, #a855f7 0%, #3b82f6 100%)", 
                height: "100%", 
                borderRadius: "10px", 
                transition: "width 0.5s ease-in-out" 
              }} 
            />
          </div>
        </div>
      </div>

      {/* DAILY REMINDER CARD */}
      <div style={{ background: "#1e293b", border: "1px dashed #4b5563", borderRadius: "20px", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#facc15", marginBottom: "8px" }}>
          <FaQuoteLeft size={12} /> <span style={{ fontSize: "12px", fontWeight: "700" }}>Everyday Reminder</span>
        </div>
        <p style={{ margin: 0, fontSize: "15px", color: "#cbd5e1", fontStyle: "italic" }}>"{dailyQuote}"</p>
      </div>

      <BottomNav />
    </div>
  );
}

export default Home;