import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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

  return {
    score,
    total,
    percentage,
  };
}

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  return (
    <div>
      <NavBar />

      <div style={{ padding: 24 }}>
        <h1>Matches</h1>
        <p>Your potential matches appear below.</p>

        {loading && <p>Loading matches...</p>}

        {error && <p style={{ color: "salmon" }}>{error}</p>}

        {!loading && !error && matches.length === 0 && (
          <p>No matches found yet.</p>
        )}

        {!loading && matches.length > 0 && (
          <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
            {matches.map((match) => (
              <div
                key={match.uid}
                style={{
                  border: "1px solid #374151",
                  borderRadius: 12,
                  padding: 16,
                  background: "#111827",
                }}
              >
                <h3 style={{ marginBottom: 8 }}>Match Candidate</h3>

                <p>
                  <strong>UID:</strong> {match.uid}
                </p>

                <p>
                  <strong>Compatibility:</strong> {match.percentage}%
                </p>

                <p>
                  <strong>Matched Answers:</strong> {match.score} / {match.total}
                </p>

                <div style={{ marginTop: 12, opacity: 0.9 }}>
                  <p>
                    <strong>Personality:</strong>{" "}
                    {String(match.personality || "—")}
                  </p>

                  <p>
                    <strong>Visual Appeal Importance:</strong>{" "}
                    {String(match.visualAppeal || "—")}
                  </p>

                  <p>
                    <strong>Age Importance:</strong>{" "}
                    {String(match.ageImportance || "—")}
                  </p>

                  <p>
                    <strong>Different Cultural Background:</strong>{" "}
                    {String(match.differentCultureDating || "—")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}