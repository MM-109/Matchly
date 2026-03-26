import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import NavBar from "../components/NavBar";

export default function Questionnaire() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [hasQuestionnaire, setHasQuestionnaire] = useState(false);

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
    const checkQuestionnaire = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const docRef = doc(db, "questionnaires", user.uid);
        const docSnap = await getDoc(docRef);
        setHasQuestionnaire(docSnap.exists());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkQuestionnaire();
  }, [user, navigate]);

  const formUrl = useMemo(() => {
    const base = "https://form.jotform.com/260515132181143";
    const uid = user?.uid || "";
    return uid ? `${base}?uid=${encodeURIComponent(uid)}` : base;
  }, [user]);

  const openSurvey = () => {
    window.open(formUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ backgroundColor: colors.teaLight, minHeight: "100vh" }}>
      <NavBar />

      <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ color: colors.lobelia, fontSize: "2.5rem", marginBottom: "1rem" }}>Questionnaire</h1>

        {loading ? (
          <p style={{ color: colors.cyclamen, fontSize: "1.1rem", fontWeight: "500" }}>
            Loading questionnaire status...
          </p>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '2rem' }}>
            <div style={{ 
              maxWidth: '500px', 
              width: '100%',
              textAlign: 'center', 
              padding: '3rem', 
              backgroundColor: "white", 
              borderRadius: "30px", 
              boxShadow: `0 10px 30px rgba(183, 106, 132, 0.1)`,
              border: `1px solid ${colors.alyssum}`
            }}>
              
              {hasQuestionnaire ? (
                <>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: colors.lobelia }}>
                    Already Completed
                  </h2>
                  <p style={{ color: colors.cyclamen, opacity: 0.8, lineHeight: '1.6', marginBottom: '2.5rem' }}>
                    Your questionnaire has already been completed. You can retake it anytime to update your answers.
                  </p>
                  <button 
                    style={{
                      backgroundColor: colors.inThePink,
                      color: "white",
                      border: "none",
                      padding: "1rem",
                      borderRadius: "15px",
                      fontWeight: "700",
                      fontSize: "1rem",
                      cursor: "pointer",
                      width: "100%",
                      boxShadow: `0 4px 15px rgba(241, 178, 200, 0.4)`
                    }} 
                    onClick={openSurvey}
                  >
                    Retake Questionnaire
                  </button>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: colors.lobelia }}>
                    Ready to Start?
                  </h2>
                  <p style={{ color: colors.cyclamen, opacity: 0.8, lineHeight: '1.6', marginBottom: '2.5rem' }}>
                    Please complete the survey to help us find your perfect matches.
                  </p>
                  <button 
                    style={{
                      backgroundColor: colors.lobelia,
                      color: "white",
                      border: "none",
                      padding: "1rem",
                      borderRadius: "15px",
                      fontWeight: "700",
                      fontSize: "1rem",
                      cursor: "pointer",
                      width: "100%",
                      boxShadow: `0 4px 15px rgba(115, 152, 186, 0.4)`
                    }} 
                    onClick={openSurvey}
                  >
                    Start Survey
                  </button>
                </>
              )}
              
              <button 
                style={{ 
                  width: '100%', 
                  borderRadius: '15px', 
                  padding: '0.8rem', 
                  marginTop: '12px',
                  backgroundColor: "transparent",
                  color: colors.cyclamen,
                  border: `2px solid ${colors.alyssum}`,
                  fontWeight: "700",
                  fontSize: "1rem",
                  cursor: "pointer"
                }}
                onClick={() => navigate("/home")}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}