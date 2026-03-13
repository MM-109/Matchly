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
    <div>
      <NavBar />

      <div style={{ padding: 24, textAlign: "center" }}>
        <h1>Questionnaire</h1>

        {loading ? (
          <p>Loading questionnaire status...</p>
        ) : hasQuestionnaire ? (
          <>
            <p>Your questionnaire has already been completed.</p>
            <p style={{ opacity: 0.8 }}>
              You can retake the questionnaire anytime to update your answers.
            </p>

            <button onClick={openSurvey} style={{ marginTop: 16 }}>
              Retake Questionnaire
            </button>
          </>
        ) : (
          <>
            <p>Please complete the survey to continue.</p>

            <button onClick={openSurvey} style={{ marginTop: 16 }}>
              Start Survey
            </button>
          </>
        )}
      </div>
    </div>
  );
}