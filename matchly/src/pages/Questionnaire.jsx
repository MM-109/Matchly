import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";

export default function Questionnaire() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Force login before questionnaire
  useEffect(() => {
    if (!user) navigate("/");
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
    <div style={{ padding: 24 }}>
      <h1>Questionnaire</h1>
      <p>Please complete the survey to continue.</p>

      {user ? (
        <>
          <p style={{ opacity: 0.8, marginTop: 12 }}>
            Your UID (saved with the form): <strong>{user.uid}</strong>
          </p>

          <button onClick={openSurvey} style={{ marginTop: 12 }}>
            Start Survey
          </button>

          <p style={{ marginTop: 12, opacity: 0.7 }}>
            The form will automatically include your UID.
          </p>
        </>
      ) : (
        <p style={{ color: "salmon" }}>
          You must be logged in to take the survey.
        </p>
      )}
    </div>
  );
}