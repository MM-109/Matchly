import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import { syncResponsesToFirestore } from "../services/saveResponses";
import NavBar from "../components/NavBar";

export default function Home() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [status, setStatus] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const handleSync = async () => {
    setIsSyncing(true);
    setStatus("Syncing Jotform → Firestore...");

    try {
      const result = await syncResponsesToFirestore();
      setStatus(
        `Done. Pulled ${result.totalFetched} submissions, saved/updated ${result.written} docs in Firestore.`
      );
    } catch (err) {
      console.error(err);
      setStatus(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <NavBar />

      <div style={{ padding: 24 }}>
        <h1>Home</h1>
        <p>You are logged in.</p>

        {user && (
          <p style={{ opacity: 0.85 }}>
            UID: <strong>{user.uid}</strong>
          </p>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <button onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? "Syncing..." : "Sync Jotform → Firestore"}
          </button>

          <button onClick={() => navigate("/questionnaire")}>
            Open Questionnaire Page
          </button>
        </div>

        {status && (
          <p style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{status}</p>
        )}
      </div>
    </div>
  );
}