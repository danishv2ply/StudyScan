import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import BottomNav from "../components/BottomNav";
import toast from "react-hot-toast";
import { 
  FaSignOutAlt, 
  FaFolder, 
  FaUserCircle, 
  FaBell, 
  FaCog, 
  FaTimes, 
  FaSave, 
  FaCamera, 
  FaBookOpen, 
  FaFire,
  FaPalette,
  FaCheck,
  FaInfoCircle,
  FaCheckDouble
} from "react-icons/fa";

// Available Accent Themes
const THEMES = [
  { id: "purple", name: "Neon Purple", primary: "#818cf8", gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" },
  { id: "indigo", name: "Cyber Indigo", primary: "#38bdf8", gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" },
  { id: "emerald", name: "Emerald Green", primary: "#34d399", gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)" },
  { id: "gold", name: "Electric Gold", primary: "#facc15", gradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)" }
];

function Profile() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("Student");
  const [profilePic, setProfilePic] = useState(""); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // Enrolled Modules State
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);

  // Streak State
  const [streakDays, setStreakDays] = useState(3);

  // Theme Accent State
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem("appTheme") || "purple";
  });

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "🔥 Keep the Flame Alive!",
      message: "You're on a study streak! Scan a document or review flashcards today to extend it.",
      time: "10 mins ago",
      read: false
    },
    {
      id: 2,
      title: "📚 OCR Tip",
      message: "Ensure good lighting when taking scan photos for maximum text accuracy.",
      time: "2 hours ago",
      read: false
    },
    {
      id: 3,
      title: "✨ Welcome to StudyScan!",
      message: "Your account is active. Start adding your enrolled modules to stay organized.",
      time: "1 day ago",
      read: true
    }
  ]);

  const activeThemeObj = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const fetchProfile = async () => {
      const activeSession = localStorage.getItem("userSession");
      if (!activeSession) {
        navigate("/");
        return;
      }
      const { email: sessionEmail } = JSON.parse(activeSession);
      setEmail(sessionEmail);

      const studentId = sessionEmail.split("@")[0];

      // Fetch Profile Data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("email", sessionEmail)
        .maybeSingle();

      if (userData) {
        const dynamicName = userData.username || studentId;
        setUsername(dynamicName);
        setProfilePic(userData.profilePic || "");
      } else {
        setUsername(studentId);
      }

      // Fetch Modules
      try {
        setLoadingModules(true);
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("*")
          .eq("user_id", studentId);

        if (!subjectsError && subjectsData) {
          setEnrolledModules(subjectsData);
        }
      } catch (err) {
        console.error("Error loading enrolled modules:", err);
      } finally {
        setLoadingModules(false);
      }

      // Fetch Streak
      try {
        const [notesRes, flashcardsRes] = await Promise.all([
          supabase.from("notes").select("id", { count: "exact" }).eq("user_id", studentId),
          supabase.from("flashcards").select("id", { count: "exact" }).eq("user_id", studentId)
        ]);

        const totalScans = notesRes.count || notesRes.data?.length || 0;
        const totalCards = flashcardsRes.count || flashcardsRes.data?.length || 0;
        const activityPoints = totalScans + totalCards;

        setStreakDays(activityPoints > 0 ? Math.min(activityPoints + 1, 14) : 1);
      } catch (err) {
        console.error("Error calculating streak:", err);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    localStorage.setItem("appTheme", themeId);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Saving profile updates...");

    try {
      const { error } = await supabase
        .from("users")
        .update({ username: editUsername, profilePic: profilePic })
        .eq("email", email);

      if (error) throw error;

      setUsername(editUsername);
      setIsModalOpen(false);
      toast.success("✨ Profile & preferences updated!", { id: toastId });
    } catch (error) {
      toast.error(`Update failed: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const markAllNotifsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read! ✔️");
  };

  const handleSignOut = () => {
    localStorage.removeItem("userSession");
    toast.success("Signed out successfully 👋");
    navigate("/");
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#ffffff", padding: "16px 20px", paddingBottom: "120px", boxSizing: "border-box", fontFamily: "-apple-system, sans-serif" }}>
      
      {/* HEADER ROW WITH WORKING NOTIFICATION BELL */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div onClick={() => { setEditUsername(username); setIsModalOpen(true); }} style={{ position: "relative", cursor: "pointer" }}>
            {profilePic ? (
              <img src={profilePic} alt="Avatar" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${activeThemeObj.primary}` }} />
            ) : (
              <FaUserCircle size={36} style={{ color: activeThemeObj.primary }} />
            )}
            <div style={{ position: "absolute", bottom: "-2px", right: "-2px", background: "#312e81", borderRadius: "50%", padding: "3px" }}><FaCog size={10} /></div>
          </div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>My Account</h2>
        </div>

        {/* CLICKABLE BELL WITH UNREAD BADGE */}
        <div 
          onClick={() => setIsNotifOpen(true)}
          style={{ position: "relative", background: "#1e293b", padding: "10px", borderRadius: "50%", color: unreadCount > 0 ? activeThemeObj.primary : "#9ca3af", cursor: "pointer" }}
        >
          <FaBell size={18} />
          {unreadCount > 0 && (
            <div style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "#ffffff", fontSize: "9px", fontWeight: "800", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0f172a" }}>
              {unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* BANNER WITH DYNAMIC ACCENT GRADIENT */}
      <div style={{ width: "100%", background: activeThemeObj.gradient, borderRadius: "24px", padding: "28px 16px", marginBottom: "24px", boxSizing: "border-box", transition: "background 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
          {profilePic ? (
            <img src={profilePic} alt="Avatar" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ffffff" }} />
          ) : (
            <FaUserCircle size={80} style={{ color: "#ffffff", opacity: 0.9 }} />
          )}
        </div>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "26px", fontWeight: "800", textAlign: "center" }}>{username}</h1>
        <p style={{ margin: "6px 0 0 0", color: "#cbd5e1", fontSize: "14px", textAlign: "center" }}>{email}</p>
      </div>

      {/* STREAK COUNTER CARD */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)", border: "1px solid #4338ca", borderRadius: "18px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
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

      {/* ENROLLED MODULES BOX */}
      <div style={{ background: "#1e293b", border: "1px solid #374151", borderRadius: "18px", padding: "20px", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: enrolledModules.length > 0 ? "14px" : "0" }}>
          <FaFolder style={{ color: "#facc15" }} size={18} />
          <span style={{ fontSize: "15px", fontWeight: "700" }}>
            Enrolled Modules ({enrolledModules.length})
          </span>
        </div>

        {loadingModules ? (
          <div style={{ color: "#9ca3af", fontSize: "13px", marginTop: "8px" }}>Loading enrolled modules...</div>
        ) : enrolledModules.length === 0 ? (
          <div style={{ color: "#9ca3af", fontSize: "13px", marginTop: "8px" }}>No modules enrolled yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            {enrolledModules.map((module) => (
              <div 
                key={module.id} 
                style={{ 
                  background: "#0f172a", 
                  border: "1px solid #334155", 
                  borderRadius: "12px", 
                  padding: "12px 14px", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px" 
                }}
              >
                <div style={{ background: "#312e81", color: activeThemeObj.primary, padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center" }}>
                  <FaBookOpen size={14} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: activeThemeObj.primary, fontWeight: "700", textTransform: "uppercase" }}>
                    {module.code || "MODULE"}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
                    {module.name || module.title || "Untitled Course"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SIGN OUT BUTTON */}
      <button onClick={handleSignOut} style={{ width: "100%", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", border: "none", borderRadius: "16px", padding: "16px", color: "#ffffff", fontSize: "15px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
        <FaSignOutAlt size={16} /> Sign Out from StudyScan
      </button>

      {/* 🔔 NOTIFICATIONS MODAL */}
      {isNotifOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 9999 }}>
          <div style={{ background: "#1e293b", border: "1px solid #374151", borderRadius: "24px", width: "100%", maxWidth: "380px", padding: "20px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaBell style={{ color: activeThemeObj.primary }} size={16} />
                <h3 style={{ margin: 0, fontSize: "17px", color: "#ffffff" }}>Notifications</h3>
              </div>
              <button onClick={() => setIsNotifOpen(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}><FaTimes size={18} /></button>
            </div>

            {/* NOTIFICATION LIST */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto", marginBottom: "16px" }}>
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  style={{ 
                    background: n.read ? "#0f172a" : "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)", 
                    border: n.read ? "1px solid #334155" : `1px solid ${activeThemeObj.primary}`, 
                    borderRadius: "12px", 
                    padding: "12px" 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>{n.title}</span>
                    <span style={{ fontSize: "10px", color: "#9ca3af" }}>{n.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: "1.4" }}>{n.message}</p>
                </div>
              ))}
            </div>

            {/* MARK ALL READ BUTTON */}
            {unreadCount > 0 && (
              <button 
                onClick={markAllNotifsAsRead}
                style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "10px", padding: "10px", color: "#a5b4fc", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <FaCheckDouble size={12} /> Mark All as Read
              </button>
            )}
          </div>
        </div>
      )}

      {/* POPUP EDIT MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 9999 }}>
          <div style={{ background: "#1e293b", border: "1px solid #374151", borderRadius: "24px", width: "100%", maxWidth: "380px", padding: "24px", boxSizing: "border-box", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff" }}>Edit Account Profile</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}><FaTimes size={18} /></button>
            </div>
            <form onSubmit={handleSaveChanges} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              
              {/* PHOTO UPLOAD */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <label htmlFor="avatar-upload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {profilePic ? (
                    <img src={profilePic} alt="Preview" style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}><FaCamera size={20} /></div>
                  )}
                  <span style={{ fontSize: "12px", color: activeThemeObj.primary, marginTop: "6px" }}>Change Photo</span>
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </div>

              {/* USERNAME FIELD */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#9ca3af", marginBottom: "6px" }}>Username</label>
                <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required style={{ width: "100%", background: "#0f172a", border: "1px solid #4b5563", borderRadius: "12px", padding: "12px", color: "#ffffff", boxSizing: "border-box" }} />
              </div>

              {/* APP ACCENT THEME PICKER */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <FaPalette style={{ color: activeThemeObj.primary }} size={14} />
                  <label style={{ fontSize: "13px", color: "#9ca3af" }}>App Accent Theme</label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {THEMES.map((theme) => {
                    const isSelected = selectedTheme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        style={{
                          background: "#0f172a",
                          border: isSelected ? `2px solid ${theme.primary}` : "1px solid #334155",
                          borderRadius: "10px",
                          padding: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: theme.primary }} />
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff" }}>{theme.name}</span>
                        </div>
                        {isSelected && <FaCheck size={10} style={{ color: theme.primary }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SAVE BUTTON */}
              <button type="submit" disabled={loading} style={{ width: "100%", background: activeThemeObj.gradient, border: "none", borderRadius: "12px", padding: "14px", color: "#ffffff", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}>
                <FaSave size={14} /> {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default Profile;