import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
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

function extractFirstName(rawAnswers) {
  const answersArray = Object.values(rawAnswers || {});
  const nameQuestion = answersArray.find((item) =>
    item?.text?.toLowerCase().includes("full name")
  );
  const answer = nameQuestion?.answer;
  if (!answer) return "Unknown";

  if (typeof answer === "object") {
    const first = answer.first || "";
    const last = answer.last || "";
    if (last) return `${first} ${last.charAt(0)}.`;
    return first;
  }

  return answer;
}

export default function Offers() {
  const currentUser = auth.currentUser;
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [nameCache, setNameCache] = useState({});
  const [loading, setLoading] = useState(true);

  const colors = {
    inThePink: "#F1B2C8",
    cyclamen: "#B76A84",
    lemonMeringue: "#F9E8C1",
    lobelia: "#7398BA",
    agapanthus: "#B4C3E1",
    alyssum: "#F3D1D9",
    teaLight: "#FDF1D0",
  };

  const loadOffers = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const receivedQuery = query(
        collection(db, "offers"),
        where("toUid", "==", currentUser.uid)
      );

      const sentQuery = query(
        collection(db, "offers"),
        where("fromUid", "==", currentUser.uid)
      );

      const [receivedSnap, sentSnap] = await Promise.all([
        getDocs(receivedQuery),
        getDocs(sentQuery),
      ]);

      const received = receivedSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const sent = sentSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setReceivedOffers(received);
      setSentOffers(sent);

      const uids = new Set();
      received.forEach((o) => uids.add(o.fromUid));
      sent.forEach((o) => uids.add(o.toUid));

      const names = {};
      for (const uid of uids) {
        const ref = doc(db, "questionnaires", uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const raw = parseAnswersJson(snap.data().answersJson);
          names[uid] = extractFirstName(raw);
        } else {
          names[uid] = "Unknown";
        }
      }

      setNameCache(names);
    } catch (err) {
      console.error("Error loading offers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, [currentUser]);

  const createExchangeIfMissing = async (offer) => {
    try {
      const exchangeQuery1 = query(
        collection(db, "exchanges"),
        where("offerId", "==", offer.id)
      );

      const exchangeSnap1 = await getDocs(exchangeQuery1);

      if (!exchangeSnap1.empty) return;

      await addDoc(collection(db, "exchanges"), {
        offerId: offer.id,
        user1Uid: offer.fromUid,
        user2Uid: offer.toUid,
        user1MovedForward: false,
        user2MovedForward: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error creating exchange:", err);
    }
  };

  const handleStatus = async (offer, newStatus) => {
    try {
      const offerRef = doc(db, "offers", offer.id);

      await updateDoc(offerRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      if (newStatus === "accepted") {
        await createExchangeIfMissing(offer);
      }

      await loadOffers();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleResolve = async (offer) => {
    try {
      const offerRef = doc(db, "offers", offer.id);

      await updateDoc(offerRef, {
        status: "resolved",
        resolved: true,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await loadOffers();
    } catch (err) {
      console.error("Error resolving offer:", err);
    }
  };

  const sectionStyle = {
    marginTop: "3rem",
    padding: "0 2rem",
    maxWidth: "1200px",
    margin: "3rem auto 0",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "2rem",
    marginTop: "1.5rem",
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "25px",
    padding: "2rem",
    border: `1px solid ${colors.alyssum}`,
    boxShadow: `0 8px 20px rgba(183, 106, 132, 0.05)`,
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  };

  return (
    <div
      style={{
        backgroundColor: colors.teaLight,
        minHeight: "100vh",
        paddingBottom: "4rem",
      }}
    >
      <NavBar />

      <div style={{ textAlign: "center", paddingTop: "3rem" }}>
        <h1
          style={{
            color: colors.lobelia,
            fontSize: "2.5rem",
            marginBottom: "0.5rem",
          }}
        >
          Offers
        </h1>
        <p style={{ color: colors.cyclamen, fontWeight: "500" }}>
          Manage your connections and pending requests.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2
          style={{
            color: colors.lobelia,
            fontSize: "1.5rem",
            borderBottom: `2px solid ${colors.alyssum}`,
            paddingBottom: "0.5rem",
          }}
        >
          Received Offers
        </h2>

        <div style={gridStyle}>
          {receivedOffers.length === 0 && !loading && (
            <p style={{ color: colors.cyclamen, opacity: 0.7 }}>
              No received offers yet.
            </p>
          )}

          {receivedOffers.map((offer) => (
            <div key={offer.id} style={{ maxWidth: "320px" }}>
              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background:
                        offer.status === "accepted"
                          ? colors.lemonMeringue
                          : colors.alyssum,
                      color: colors.cyclamen,
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: "800",
                      textTransform: "uppercase",
                    }}
                  >
                    {offer.status}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      color: colors.cyclamen,
                      opacity: 0.7,
                      fontWeight: "600",
                    }}
                  >
                    From
                  </span>
                  <span
                    style={{
                      fontWeight: "700",
                      color: colors.lobelia,
                      fontSize: "1.2rem",
                    }}
                  >
                    {nameCache[offer.fromUid] || "Loading..."}
                  </span>
                </div>

                {offer.status === "pending" ? (
                  <>
                    <button
                      style={{
                        marginTop: "auto",
                        width: "100%",
                        backgroundColor: colors.inThePink,
                        color: "white",
                        border: "none",
                        padding: "10px",
                        borderRadius: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                      onClick={() => handleStatus(offer, "accepted")}
                    >
                      Accept
                    </button>

                    <button
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        color: colors.cyclamen,
                        border: `2px solid ${colors.alyssum}`,
                        padding: "10px",
                        borderRadius: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        marginTop: "-0.5rem",
                      }}
                      onClick={() => handleStatus(offer, "declined")}
                    >
                      Decline
                    </button>
                  </>
                ) : offer.status === "accepted" ? (
                  <button
                    style={{
                      marginTop: "auto",
                      width: "100%",
                      background: "transparent",
                      border: `1px solid ${colors.alyssum}`,
                      color: colors.cyclamen,
                      padding: "10px",
                      borderRadius: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                    onClick={() => handleResolve(offer)}
                  >
                    Resolve
                  </button>
                ) : (
                  <button
                    disabled
                    style={{
                      marginTop: "auto",
                      width: "100%",
                      background: "transparent",
                      border: `1px solid ${colors.alyssum}`,
                      color: colors.cyclamen,
                      padding: "10px",
                      borderRadius: "12px",
                      fontWeight: "700",
                      opacity: 0.6,
                    }}
                  >
                    Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...sectionStyle, marginTop: "4rem" }}>
        <h2
          style={{
            color: colors.lobelia,
            fontSize: "1.5rem",
            borderBottom: `2px solid ${colors.alyssum}`,
            paddingBottom: "0.5rem",
          }}
        >
          Sent Offers
        </h2>

        <div style={gridStyle}>
          {sentOffers.length === 0 && !loading && (
            <p style={{ color: colors.cyclamen, opacity: 0.7 }}>
              No sent offers yet.
            </p>
          )}

          {sentOffers.map((offer) => (
            <div key={offer.id} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: colors.cyclamen,
                    background:
                      offer.status === "accepted"
                        ? colors.lemonMeringue
                        : colors.alyssum,
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    textTransform: "uppercase",
                  }}
                >
                  {offer.status}
                </span>
              </div>

              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: colors.cyclamen,
                    opacity: 0.7,
                    fontWeight: "600",
                  }}
                >
                  To
                </span>
                <span
                  style={{
                    fontWeight: "700",
                    color: colors.lobelia,
                    fontSize: "1.2rem",
                  }}
                >
                  {nameCache[offer.toUid] || "Loading..."}
                </span>
              </div>

              <button
                disabled
                style={{
                  marginTop: "auto",
                  width: "100%",
                  background: "transparent",
                  border: `2px solid ${colors.agapanthus}`,
                  color: colors.lobelia,
                  padding: "10px",
                  borderRadius: "12px",
                  fontWeight: "700",
                }}
              >
                {offer.status === "pending"
                  ? "Awaiting Response"
                  : offer.status === "resolved"
                  ? "Resolved"
                  : "Completed"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}