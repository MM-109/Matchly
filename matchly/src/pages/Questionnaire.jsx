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
    <div className="matches-container">
      <NavBar />

      <div className="home-content">
        <h1>Questionnaire</h1>

        {loading ? (
          <p className="home-subtitle">Loading questionnaire status...</p>
        ) : (
          <div className="home-card-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '2rem' }}>
            <div className="match-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
              
              {hasQuestionnaire ? (
                <>
                  {/* "Profile Active" badge has been removed from here */}
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'white' }}>
                    Already Completed
                  </h2>
                  <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                    Your questionnaire has already been completed. You can retake it anytime to update your answers.
                  </p>
                  <button className="add-match-btn" onClick={openSurvey}>
                    Retake Questionnaire
                  </button>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'white' }}>
                    Ready to Start?
                  </h2>
                  <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                    Please complete the survey to help us find your perfect matches.
                  </p>
                  <button className="add-match-btn" onClick={openSurvey}>
                    Start Survey
                  </button>
                </>
              )}
              
              <button 
                className="logout-btn" 
                style={{ flex: 'none', width: '100%', borderRadius: '12px', padding: '0.8rem', marginTop: '12px' }}
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