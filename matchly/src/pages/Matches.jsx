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
    gender: getAnswerByText("gender"),
    relationshipGoal: getAnswerByText("relationship goal"),
    personality: getAnswerByText("best describe your personality"),
    visualAppeal: getAnswerByText("visual appeal"),
    ageImportance: getAnswerByText("age to ask them for a date"),
    differentCultureDating: getAnswerByText(
      "would you date someone from a different cultural background"
    ),
    idealHoliday: getAnswerByText("ideal holiday"),
    goodNightOut: getAnswerByText("idea of a good night out"),
    importantCharacteristics: getAnswerByText(
      "most important characteristics you are looking for in a partner"
    ),
  };
}

function valuesMatch(a, b) {
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function calculateMatchScore(userA, userB) {
  const fields = [
    "gender",
    "relationshipGoal",
    "personality",
    "visualAppeal",
    "ageImportance",
    "differentCultureDating",
    "idealHoliday",
    "goodNightOut",
    "importantCharacteristics",
  ];

  let score = 0;
  let total = 0;

  for (const field of fields) {
    if (userA[field] && userB[field]) {
      total++;
      if (valuesMatch(userA[field], userB[field])) {
        score++;
      }
    }
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  return { score, total, percentage };
}

function formatValue(value) {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingToUid, setSendingToUid] = useState("");
  const [message, setMessage] = useState("");
  const [sentOffers, setSentOffers] = useState([]);
  const [flippedCards, setFlippedCards] = useState({});

  const currentUser = auth.currentUser;

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

  const toggleFlip = (uid) => {
    setFlippedCards((prev) => ({
      ...prev,
      [uid]: !prev[uid],
    }));
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "2rem", backgroundColor: colors.teaLight }}>
      <NavBar />
      <h1 style={{ marginTop: "2.5rem", textAlign: "center", color: colors.lobelia, fontSize: "2.5rem" }}>Matches</h1>
      <p style={{ textAlign: "center", color: colors.cyclamen, fontWeight: "500", marginBottom: "2rem" }}>Your potential matches appear below.</p>

      {loading && <p style={{ textAlign: "center", color: colors.cyclamen }}>Loading matches...</p>}
      {error && <p style={{ color: "#e74c3c", textAlign: "center" }}>{error}</p>}

      {message && (
        <p style={{ marginBottom: "1rem", color: colors.lobelia, textAlign: "center", fontWeight: "bold" }}>{message}</p>
      )}

      {!loading && !error && matches.length === 0 && <p style={{ textAlign: "center", color: colors.cyclamen }}>No matches found yet.</p>}

      {!loading && matches.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2.5rem",
            padding: "2rem",
            maxWidth: "1400px",
            margin: "0 auto"
          }}
        >
          {matches.map((match) => (
            <div
              key={match.uid}
              style={{ perspective: "1000px", width: "100%" }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: "480px",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: flippedCards[match.uid]
                    ? "rotateY(180deg)"
                    : "rotateY(0deg)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <div
                    style={{
                      minHeight: "480px",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      borderRadius: "30px",
                      padding: "2rem",
                      backgroundColor: "white",
                      border: `1px solid ${colors.alyssum}`,
                      boxShadow: `0 10px 25px rgba(183, 106, 132, 0.08)`
                    }}
                    onClick={() => toggleFlip(match.uid)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                      <span style={{ 
                        background: colors.lemonMeringue, 
                        color: colors.cyclamen, 
                        padding: "6px 14px", 
                        borderRadius: "20px", 
                        fontSize: "0.75rem", 
                        fontWeight: "800",
                        textTransform: "uppercase" 
                      }}>
                        {match.percentage >= 75 ? "Strong Match" : "Possible Match"}
                      </span>
                      <span style={{ fontWeight: "800", fontSize: "1.3rem", color: colors.lobelia }}>{match.percentage}%</span>
                    </div>

                    <div style={{ display: "grid", gap: "1.2rem" }}>
                      <div className="stat-item">
                        <span style={{ display: "block", fontSize: "0.8rem", color: colors.cyclamen, opacity: 0.7, fontWeight: "600" }}>Gender</span>
                        <span style={{ fontWeight: "700", color: colors.lobelia }}>{formatValue(match.gender)}</span>
                      </div>
                      <div className="stat-item">
                        <span style={{ display: "block", fontSize: "0.8rem", color: colors.cyclamen, opacity: 0.7, fontWeight: "600" }}>Relationship Goal</span>
                        <span style={{ fontWeight: "700", color: colors.lobelia }}>{formatValue(match.relationshipGoal)}</span>
                      </div>
                      <div className="stat-item">
                        <span style={{ display: "block", fontSize: "0.8rem", color: colors.cyclamen, opacity: 0.7, fontWeight: "600" }}>Personality</span>
                        <span style={{ fontWeight: "700", color: colors.lobelia }}>{formatValue(match.personality)}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: "auto", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: colors.cyclamen, marginBottom: "1rem", fontWeight: "800", letterSpacing: "1px" }}>TAP TO REVEAL DETAILS</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendOffer(match.uid);
                        }}
                        disabled={sendingToUid === match.uid || sentOffers.includes(match.uid)}
                        style={{
                          width: "100%",
                          background: sentOffers.includes(match.uid)
                            ? colors.alyssum
                            : colors.inThePink,
                          color: "white",
                          border: "none",
                          padding: "14px",
                          borderRadius: "15px",
                          fontWeight: "800",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: sentOffers.includes(match.uid) ? "none" : `0 4px 15px rgba(241, 178, 200, 0.4)`
                        }}
                      >
                        {sentOffers.includes(match.uid) ? "Connection Sent" : sendingToUid === match.uid ? "Sending..." : "Connect"}
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div
                    style={{
                      minHeight: "480px",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      backgroundColor: "white",
                      borderRadius: "30px",
                      padding: "2rem",
                      border: `2px solid ${colors.inThePink}`,
                      boxShadow: `0 10px 25px rgba(115, 152, 186, 0.1)`
                    }}
                    onClick={() => toggleFlip(match.uid)}
                  >
                    <div style={{ marginBottom: "1.5rem" }}>
                      <span style={{ background: colors.lobelia, color: "white", padding: "6px 14px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "800" }}>FULL PROFILE</span>
                    </div>

                    <div style={{ display: "grid", gap: "1rem", fontSize: "0.95rem" }}>
                      <div className="stat-item">
                        <span style={{ display: "block", fontSize: "0.8rem", color: colors.cyclamen, opacity: 0.7, fontWeight: "600" }}>Visual Appeal</span>
                        <div style={{ fontWeight: "700", color: colors.lobelia }}>{formatValue(match.visualAppeal)}</div>
                      </div>
                      <div className="stat-item">
                        <span style={{ display: "block", fontSize: "0.8rem", color: colors.cyclamen, opacity: 0.7, fontWeight: "600" }}>Cultural Background</span>
                        <div style={{ fontWeight: "700", color: colors.lobelia }}>{formatValue(match.differentCultureDating)}</div>
                      </div>
                      <div className="stat-item">
                        <span style={{ display: "block", fontSize: "0.8rem", color: colors.cyclamen, opacity: 0.7, fontWeight: "600" }}>Ideal Holiday</span>
                        <div style={{ fontWeight: "700", color: colors.lobelia }}>{formatValue(match.idealHoliday)}</div>
                      </div>
                      <div className="stat-item">
                        <span style={{ display: "block", fontSize: "0.8rem", color: colors.cyclamen, opacity: 0.7, fontWeight: "600" }}>Good Night Out</span>
                        <div style={{ fontWeight: "700", color: colors.lobelia }}>{formatValue(match.goodNightOut)}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: "auto", textAlign: "center", fontSize: "10px", color: colors.cyclamen, fontWeight: "800", letterSpacing: "1px" }}>
                      TAP TO CLOSE
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}