import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import NavBar from "../components/NavBar";

function parseAnswersJson(answersJson) {
  try {
    return JSON.parse(answersJson || "{}");
  } catch {
    return {};
  }
}

function normalizeAnswers(rawAnswers) {
  const answersArray = Object.values(rawAnswers || {});
  const getAnswerByText = (questionTextPart) => {
    const found = answersArray.find((item) =>
      item?.text?.toLowerCase().includes(questionTextPart.toLowerCase())
    );
    return found?.answer ?? null;
  };

  return {
    personality: getAnswerByText("best describe your personality"),
    visualAppeal: getAnswerByText("visual appeal"),
    ageImportance: getAnswerByText("age to ask them for a date"),
    differentCultureDating: getAnswerByText(
      "would you date someone from a different cultural background"
    ),
  };
}

function calculateMatchScore(userA, userB) {
  let score = 0;
  let total = 0;
  const fields = [
    "personality",
    "visualAppeal",
    "ageImportance",
    "differentCultureDating",
  ];

  for (const field of fields) {
    if (userA[field] && userB[field]) {
      total++;
      if (String(userA[field]).trim() === String(userB[field]).trim()) {
        score++;
      }
    }
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  return { score, total, percentage };
}

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingToUid, setSendingToUid] = useState("");
  const [message, setMessage] = useState("");
  const [sentOffers, setSentOffers] = useState([]);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        setError("");
        const snapshot = await getDocs(collection(db, "questionnaires"));
        const allUsers = snapshot.docs.map((doc) => {
          const data = doc.data();
          const rawAnswers = parseAnswersJson(data.answersJson);
          return {
            uid: doc.id,
            ...normalizeAnswers(rawAnswers),
            rawAnswers,
          };
        });

        const me = allUsers.find((user) => user.uid === currentUser?.uid);
        if (!me) {
          setError("Your questionnaire data was not found in Firestore yet.");
          setMatches([]);
          return;
        }

        const otherUsers = allUsers.filter((user) => user.uid !== currentUser.uid);
        const scoredMatches = otherUsers.map((user) => {
          const result = calculateMatchScore(me, user);
          return {
            ...user,
            score: result.score,
            total: result.total,
            percentage: result.percentage,
          };
        });

        scoredMatches.sort((a, b) => b.percentage - a.percentage);
        setMatches(scoredMatches);
      } catch (err) {
        console.error(err);
        setError("Failed to load matches.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadMatches();
    }
  }, [currentUser]);

  const sendOffer = async (targetUid) => {
    if (!currentUser) return;
    if (currentUser.uid === targetUid) return;

    try {
      setSendingToUid(targetUid);
      setMessage("");
      const existingQuery = query(
        collection(db, "offers"),
        where("fromUid", "==", currentUser.uid),
        where("toUid", "==", targetUid),
        where("status", "==", "pending")
      );

      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        setMessage("You already sent a pending offer to this match.");
        setSentOffers((prev) =>
          prev.includes(targetUid) ? prev : [...prev, targetUid]
        );
        return;
      }

      await addDoc(collection(db, "offers"), {
        fromUid: currentUser.uid,
        toUid: targetUid,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSentOffers((prev) => [...prev, targetUid]);
      setMessage("Offer sent successfully.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to send offer.");
    } finally {
      setSendingToUid("");
    }
  };

  return (
    <div className="matches-container">
      <NavBar />
      <h1>Matches</h1>
      <p className="home-subtitle">Your potential matches appear below.</p>

      {loading && <p>Loading matches...</p>}
      {error && <p style={{ color: "var(--error)" }}>{error}</p>}
      {message && <p style={{ marginBottom: "1rem", color: "var(--accent)" }}>{message}</p>}

      {!loading && !error && matches.length === 0 && (
        <p>No matches found yet.</p>
      )}

      {!loading && matches.length > 0 && (
        <div className="matches-grid">
          {matches.map((match) => (
            <div className="match-card" key={match.uid}>
              <div className="match-header">
                <span className="match-badge">
                  {match.percentage >= 75 ? "Strong Match" : "Possible Match"}
                </span>
                <span className="compatibility-score">{match.percentage}%</span>
              </div>

              <div className="match-stats">
                <div className="stat-item">
                  <span className="stat-label">Personality</span>
                  <span className="stat-value">{String(match.personality || "—")}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Matched</span>
                  <span className="stat-value">{match.score} / {match.total}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Visual Appeal</span>
                  <span className="stat-value">{String(match.visualAppeal || "—")}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Culture Mix</span>
                  <span className="stat-value">{String(match.differentCultureDating || "—")}</span>
                </div>
              </div>

              <button
                className="add-match-btn"
                onClick={() => sendOffer(match.uid)}
                disabled={sendingToUid === match.uid || sentOffers.includes(match.uid)}
                style={{
                  background: sentOffers.includes(match.uid) ? "var(--accent)" : "var(--primary)",
                  color: sentOffers.includes(match.uid) ? "black" : "white",
                  opacity: (sendingToUid === match.uid) ? 0.7 : 1
                }}
              >
                {sentOffers.includes(match.uid)
                  ? "Added"
                  : sendingToUid === match.uid
                  ? "Sending..."
                  : "Add"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}