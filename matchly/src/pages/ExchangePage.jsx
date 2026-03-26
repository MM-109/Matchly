import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  or,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import NavBar from "../components/NavBar";

function formatAnswer(answer) {
  if (!answer) return "Not provided";
  if (typeof answer === "string") return answer;
  if (typeof answer === "number") return String(answer);
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "object") {
    if (answer.prettyFormat) return answer.prettyFormat;
    if (answer.first && answer.last) return `${answer.first} ${answer.last}`;
    return JSON.stringify(answer);
  }
  return String(answer);
}

function getAnswerByText(answersJson, questionTextPart) {
  try {
    const rawAnswers = JSON.parse(answersJson || "{}");
    const answersArray = Object.values(rawAnswers);
    const found = answersArray.find((item) =>
      item?.text?.toLowerCase().includes(questionTextPart.toLowerCase())
    );
    return formatAnswer(found?.answer);
  } catch {
    return "Not provided";
  }
}

export default function ExchangePage() {
  const [loading, setLoading] = useState(true);
  const [exchanges, setExchanges] = useState([]);
  const [updatingId, setUpdatingId] = useState("");
  const [flippedCards, setFlippedCards] = useState({});

  const colors = {
    inThePink: "#F1B2C8",
    cyclamen: "#B76A84",
    lemonMeringue: "#F9E8C1",
    lobelia: "#7398BA",
    agapanthus: "#B4C3E1",
    alyssum: "#F3D1D9",
    teaLight: "#FDF1D0"
  };

  const loadExchanges = async () => {
    try {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) return;

      const q = query(
        collection(db, "exchanges"),
        or(
          where("user1Uid", "==", currentUid),
          where("user2Uid", "==", currentUid)
        )
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setExchanges([]);
        setLoading(false);
        return;
      }

      const rawDocs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const uniqueExchangesMap = new Map();
      rawDocs.forEach(doc => {
        const otherUid = doc.user1Uid === currentUid ? doc.user2Uid : doc.user1Uid;
        if (!uniqueExchangesMap.has(otherUid)) {
          uniqueExchangesMap.set(otherUid, doc);
        }
      });

      const uniqueDocs = Array.from(uniqueExchangesMap.values());

      const exchangeDataList = await Promise.all(
        uniqueDocs.map(async (exData) => {
          const otherUid = exData.user1Uid === currentUid ? exData.user2Uid : exData.user1Uid;

          const [meSnap, themSnap] = await Promise.all([
            getDoc(doc(db, "questionnaires", currentUid)),
            getDoc(doc(db, "questionnaires", otherUid)),
          ]);

          const meRaw = meSnap.data()?.answersJson;
          const themRaw = themSnap.data()?.answersJson;

          return {
            ...exData,
            userData: {
              me: {
                name: getAnswerByText(meRaw, "Full Name"),
                age: getAnswerByText(meRaw, "Age"),
                location: getAnswerByText(meRaw, "Location"),
                bio: getAnswerByText(meRaw, "Short Bio"),
                relocating: getAnswerByText(meRaw, "open to relocating"),
                dealbreakers: getAnswerByText(meRaw, "dealbreakers or must-have qualities"),
                extra: getAnswerByText(meRaw, "anything else you'd like us to know"),
              },
              them: {
                name: getAnswerByText(themRaw, "Full Name"),
                age: getAnswerByText(themRaw, "Age"),
                location: getAnswerByText(themRaw, "Location"),
                bio: getAnswerByText(themRaw, "Short Bio"),
                relocating: getAnswerByText(themRaw, "open to relocating"),
                dealbreakers: getAnswerByText(themRaw, "dealbreakers or must-have qualities"),
                extra: getAnswerByText(themRaw, "anything else you'd like us to know"),
              },
            },
          };
        })
      );

      setExchanges(exchangeDataList);
    } catch (err) {
      console.error("Exchange Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExchanges();
  }, []);

  const handleMoveForward = async (exchange) => {
    if (!exchange || updatingId) return;
    setUpdatingId(exchange.id);
    try {
      const currentUid = auth.currentUser.uid;
      const isUser1 = exchange.user1Uid === currentUid;
      const fieldToUpdate = isUser1 ? "user1MovedForward" : "user2MovedForward";
      await updateDoc(doc(db, "exchanges", exchange.id), { [fieldToUpdate]: true });
      await loadExchanges();
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      setUpdatingId("");
    }
  };

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: colors.teaLight, minHeight: "100vh" }}>
        <NavBar />
        <p style={{ color: colors.cyclamen, textAlign: "center", marginTop: "2rem" }}>Loading Exchange...</p>
      </div>
    );
  }

  if (!exchanges.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: colors.teaLight }}>
        <NavBar />
        <div style={{ maxWidth: "550px", textAlign: "center", padding: "60px 40px", border: `2px dashed ${colors.cyclamen}`, borderRadius: "24px", backgroundColor: "#FFFFFF" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "20px" }}>✨</div>
          <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem", color: colors.lobelia }}>Your Next Chapter Awaits</h1>
          <p style={{ color: colors.cyclamen, fontWeight: "600", marginBottom: "2.5rem" }}>You don’t have an active exchange right now.</p>
          <button onClick={() => (window.location.href = "/matches")} style={{ width: "100%", padding: "16px", backgroundColor: colors.inThePink, color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
            Browse New Matches
          </button>
        </div>
      </div>
    );
  }

  const currentUid = auth.currentUser?.uid;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: colors.teaLight, minHeight: "100vh" }}>
      <NavBar />
      <h1 style={{ textAlign: "center", width: "100%", marginTop: "2rem", color: colors.lobelia }}>Exchange</h1>
      <p style={{ textAlign: "center", width: "100%", marginBottom: "2rem", color: colors.cyclamen }}>Review your connections and decide whether to move forward</p>

      <div style={{ width: "100%", maxWidth: "1000px", display: "flex", flexDirection: "column", gap: "5rem", paddingBottom: "4rem" }}>
        {exchanges.map((exchange) => {
          const myStatus = exchange.user1Uid === currentUid ? exchange.user1MovedForward : exchange.user2MovedForward;
          const theirStatus = exchange.user1Uid === currentUid ? exchange.user2MovedForward : exchange.user1MovedForward;

          return (
            <div key={exchange.id} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "fit-content", padding: "10px 30px", backgroundColor: "white", borderRadius: "50px", marginBottom: "2rem", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", display: "flex", gap: "20px", border: `1px solid ${colors.alyssum}` }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: myStatus ? colors.lobelia : colors.cyclamen }}>YOU: {myStatus ? "READY" : "WAITING"}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: theirStatus ? colors.lobelia : colors.cyclamen, opacity: theirStatus ? 1 : 0.5 }}>THEM: {theirStatus ? "READY" : "WAITING"}</span>
              </div>

              <div style={{ display: "flex", gap: "2rem", width: "100%", flexWrap: "wrap", justifyContent: "center" }}>
                <div style={{ flex: "1", minWidth: "320px", backgroundColor: "white", borderRadius: "24px", padding: "30px", border: `1px solid ${colors.alyssum}`, boxShadow: `0 8px 20px rgba(0,0,0,0.05)` }}>
                  <span style={{ backgroundColor: colors.lemonMeringue, color: colors.cyclamen, padding: "4px 12px", borderRadius: "8px", fontWeight: "800", fontSize: "0.7rem" }}>YOU</span>
                  <div style={{ marginTop: "20px" }}>
                    <p style={{ fontSize: "0.65rem", fontWeight: "800", color: colors.cyclamen, margin: 0 }}>FULL NAME</p>
                    <p style={{ color: colors.lobelia, fontSize: "1.2rem", fontWeight: "700" }}>{exchange.userData.me.name}</p>
                    <p style={{ fontSize: "0.65rem", fontWeight: "800", color: colors.cyclamen, margin: "15px 0 0 0" }}>LOCATION</p>
                    <p style={{ color: colors.lobelia, fontSize: "1.1rem" }}>{exchange.userData.me.location}</p>
                    <p style={{ fontSize: "0.65rem", fontWeight: "800", color: colors.cyclamen, margin: "15px 0 0 0" }}>BIO</p>
                    <p style={{ color: colors.lobelia, fontSize: "0.95rem", lineHeight: "1.4" }}>{exchange.userData.me.bio}</p>
                  </div>
                </div>

                <div style={{ flex: "1", minWidth: "320px", perspective: "1000px" }}>
                  <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "400px", transformStyle: "preserve-3d", transition: "transform 0.6s", transform: flippedCards[exchange.id] ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                    <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", backgroundColor: "white", borderRadius: "24px", padding: "30px", border: `1px solid ${colors.inThePink}`, cursor: "pointer" }} onClick={() => toggleFlip(exchange.id)}>
                      <span style={{ backgroundColor: colors.inThePink, color: "white", padding: "4px 12px", borderRadius: "8px", fontWeight: "800", fontSize: "0.7rem" }}>THEM</span>
                      <div style={{ marginTop: "20px" }}>
                        <p style={{ fontSize: "0.65rem", fontWeight: "800", color: colors.cyclamen, margin: 0 }}>FULL NAME</p>
                        <p style={{ color: colors.lobelia, fontSize: "1.2rem", fontWeight: "700" }}>{exchange.userData.them.name}</p>
                        <p style={{ fontSize: "0.65rem", fontWeight: "800", color: colors.cyclamen, margin: "15px 0 0 0" }}>LOCATION</p>
                        <p style={{ color: colors.lobelia, fontSize: "1.1rem" }}>{exchange.userData.them.location}</p>
                        <p style={{ fontSize: "0.65rem", fontWeight: "800", color: colors.cyclamen, margin: "15px 0 0 0" }}>BIO</p>
                        <p style={{ color: colors.lobelia, fontSize: "0.95rem", lineHeight: "1.4" }}>{exchange.userData.them.bio}</p>
                      </div>
                      <p style={{ position: "absolute", bottom: "20px", width: "calc(100% - 60px)", textAlign: "center", fontSize: "0.6rem", fontWeight: "800", color: colors.cyclamen }}>TAP TO SEE PREFERENCES</p>
                    </div>

                    <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundColor: "white", borderRadius: "24px", padding: "30px", border: `2px solid ${colors.lobelia}`, cursor: "pointer" }} onClick={() => toggleFlip(exchange.id)}>
                      <p style={{ fontSize: "0.65rem", fontWeight: "800", color: colors.cyclamen, margin: 0 }}>DEALBREAKERS</p>
                      <p style={{ color: colors.lobelia, fontSize: "0.9rem", lineHeight: "1.4" }}>{exchange.userData.them.dealbreakers}</p>
                      <p style={{ fontSize: "0.65rem", fontWeight: "800", color: colors.cyclamen, margin: "20px 0 0 0" }}>EXTRA PREFERENCES</p>
                      <p style={{ color: colors.lobelia, fontSize: "0.9rem", lineHeight: "1.4" }}>{exchange.userData.them.extra}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button disabled={myStatus || updatingId === exchange.id} onClick={() => handleMoveForward(exchange)} style={{ marginTop: "2rem", width: "320px", padding: "14px", borderRadius: "12px", backgroundColor: myStatus ? colors.agapanthus : colors.inThePink, color: "white", border: "none", fontWeight: "800", cursor: myStatus ? "default" : "pointer", boxShadow: myStatus ? "none" : `0 4px 15px rgba(241, 178, 200, 0.4)` }}>
                {myStatus ? "Already Moved Forward" : updatingId === exchange.id ? "Updating..." : "Move Forward"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}