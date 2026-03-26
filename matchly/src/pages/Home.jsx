import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { syncResponsesToFirestore } from "../services/saveResponses";
import NavBar from "../components/NavBar";
import { lyricsData } from "../data/lyricsData";

export default function Home() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [status, setStatus] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasQuestionnaire, setHasQuestionnaire] = useState(null);
  
// This will pick a lyric and "lock" it for the session
const [dailyLyric] = useState(() => {
  const savedLyric = sessionStorage.getItem("activeLyric");
  if (savedLyric) {
    return JSON.parse(savedLyric);
  } else {
    const random = lyricsData[Math.floor(Math.random() * lyricsData.length)];
    sessionStorage.setItem("activeLyric", JSON.stringify(random));
    return random;
  }
});

  const colors = {
    inThePink: "#F1B2C8",
    cyclamen: "#B76A84",
    lemonMeringue: "#F9E8C1",
    lobelia: "#7398BA",
    agapanthus: "#B4C3E1",
    alyssum: "#F3D1D9",
    teaLight: "#FDF1D0"
  };

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const checkQuestionnaire = async () => {
      try {
        setIsSyncing(true);
        setStatus("Checking your profile setup...");
        await syncResponsesToFirestore();
        const questionnaireRef = doc(db, "questionnaires", user.uid);
        const questionnaireSnap = await getDoc(questionnaireRef);

        if (questionnaireSnap.exists()) {
          setHasQuestionnaire(true);
          setStatus("Your profile is up to date.");
        } else {
          setHasQuestionnaire(false);
          setStatus("");
        }
      } catch (err) {
        setHasQuestionnaire(false);
        setStatus("");
      } finally {
        setIsSyncing(false);
      }
    };

    checkQuestionnaire();
  }, [user, navigate]);

  const renderContent = (title, subtitle, badgeText, description) => (
  <div style={{ backgroundColor: colors.teaLight, minHeight: "100vh" }}>
    <NavBar />
    <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      {/* Main Title & Subtitle */}
      <h1 style={{ color: colors.lobelia, fontSize: "2.5rem", marginBottom: "0.5rem" }}>{title}</h1>
      <p style={{ color: colors.cyclamen, fontSize: "1.1rem", marginBottom: "2rem", fontWeight: "500" }}>{subtitle}</p>

      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <div style={{ 
          maxWidth: "500px", 
          width: "100%",
          textAlign: "center", 
          padding: "3rem", 
          backgroundColor: "white", 
          borderRadius: "30px", 
          boxShadow: `0 10px 30px rgba(183, 106, 132, 0.1)`,
          border: `1px solid ${colors.alyssum}`
        }}>
          {/* Badge */}
          <div style={{ 
            marginBottom: "1.5rem", 
            display: "inline-block",
            padding: "6px 16px",
            backgroundColor: colors.lemonMeringue,
            color: colors.cyclamen,
            borderRadius: "20px",
            fontWeight: "700",
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            {badgeText}
          </div>

          <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem", color: colors.lobelia }}>
            {title === "Home" ? (hasQuestionnaire ? "Everything is set!" : "Complete your questionnaire") : "Getting things ready..."}
          </h2>

          <p style={{ color: colors.cyclamen, opacity: 0.8, lineHeight: "1.6", marginBottom: "1.5rem" }}>
            {description}
          </p>

          {/* --- INTEGRATED LYRIC BOX --- */}
          <div style={{
            padding: "20px",
            marginBottom: "2.2rem",
            background: `linear-gradient(135deg, rgba(241, 178, 200, 0.1), rgba(253, 241, 208, 0.3))`,
            borderRadius: "20px",
            border: `1px solid ${colors.alyssum}`,
          }}>
            <p style={{ 
              color: colors.cyclamen, 
              fontSize: "1.1rem", 
              fontStyle: "italic", 
              marginBottom: "8px",
              lineHeight: "1.4"
            }}>
              "{dailyLyric.text}"
            </p>
            <p style={{ 
              color: colors.lobelia, 
              fontSize: "0.75rem", 
              fontWeight: "700", 
              textTransform: "uppercase" 
            }}>
              — {dailyLyric.artist}
            </p>
          </div>

          {/* Buttons Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {hasQuestionnaire ? (
              <>
                <button 
                  onClick={() => navigate("/matches")}
                  style={{
                    backgroundColor: colors.inThePink,
                    color: "white",
                    border: "none",
                    padding: "1rem",
                    borderRadius: "15px",
                    fontWeight: "700",
                    fontSize: "1rem",
                    cursor: "pointer",
                    boxShadow: `0 4px 15px rgba(241, 178, 200, 0.4)`
                  }}
                >
                  Explore Matches
                </button>
                <button 
                  onClick={() => navigate("/offers")}
                  style={{
                    backgroundColor: "transparent",
                    color: colors.lobelia,
                    border: `2px solid ${colors.agapanthus}`,
                    padding: "0.8rem",
                    borderRadius: "15px",
                    fontWeight: "700",
                    fontSize: "1rem",
                    cursor: "pointer"
                  }}
                >
                  View Offers
                </button>
              </>
            ) : hasQuestionnaire === false ? (
              <button 
                onClick={() => navigate("/questionnaire")}
                style={{
                  backgroundColor: colors.lobelia,
                  color: "white",
                  border: "none",
                  padding: "1rem",
                  borderRadius: "15px",
                  fontWeight: "700",
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: `0 4px 15px rgba(115, 152, 186, 0.4)`
                }}
              >
                Go to Questionnaire
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  </div>
);

  if (hasQuestionnaire === null) {
    return renderContent("Home", "Welcome back to Matchly.", "Checking Profile", "We’re checking whether your questionnaire is complete.");
  }

  return renderContent(
    "Home",
    "Welcome back to Matchly.",
    hasQuestionnaire ? "Profile Active" : "Profile Incomplete",
    hasQuestionnaire
      ? "Your profile is currently active and being matched with others. You can view potential connections or manage requests."
      : "Your questionnaire must be completed before Matchly can activate your profile."
  );
}