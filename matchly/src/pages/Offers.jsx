import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
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

  const loadOffers = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const receivedQuery = query(collection(db, "offers"), where("toUid", "==", currentUser.uid));
      const sentQuery = query(collection(db, "offers"), where("fromUid", "==", currentUser.uid));

      const [receivedSnap, sentSnap] = await Promise.all([getDocs(receivedQuery), getDocs(sentQuery)]);

      const received = receivedSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const sent = sentSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

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

  const handleStatus = async (offerId, newStatus) => {
    try {
      const offerRef = doc(db, "offers", offerId);
      await updateDoc(offerRef, { status: newStatus });
      await loadOffers(); 
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  return (
    <div className="matches-container">
      <NavBar />
      <h1>Offers</h1>
      <p className="home-subtitle">Manage your connections and pending requests.</p>

      <div className="offers-section">
        <h2 className="section-title">Received Offers</h2>
        <div className="matches-grid">
          {receivedOffers.length === 0 && !loading && (
            <p className="text-dim">No received offers yet.</p>
          )}
          {receivedOffers.map((offer) => (
            <div key={offer.id} className="match-card">
              <div className="match-header">
                <span className="match-badge" style={{ 
                  background: offer.status === 'accepted' ? 'rgba(0, 245, 212, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  color: offer.status === 'accepted' ? 'var(--accent)' : 'var(--text)'
                }}>
                  {offer.status}
                </span>
              </div>
              <div className="match-stats">
                <div className="stat-item">
                  <span className="stat-label">From</span>
                  <span className="stat-value">{nameCache[offer.fromUid] || "Loading..."}</span>
                </div>
              </div>
              
              {offer.status === "pending" ? (
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button 
                    className="add-match-btn" 
                    onClick={() => handleStatus(offer.id, "accepted")}
                  >
                    Accept
                  </button>
                  <button 
                    className="logout-btn" 
                    style={{ flex: 1, borderRadius: '12px' }}
                    onClick={() => handleStatus(offer.id, "declined")}
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <button className="add-match-btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', cursor: 'default' }}>
                  Resolved
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="offers-section" style={{ marginTop: '4rem' }}>
        <h2 className="section-title">Sent Offers</h2>
        <div className="matches-grid">
          {sentOffers.length === 0 && !loading && (
            <p className="text-dim">No sent offers yet.</p>
          )}
          {sentOffers.map((offer) => (
            <div key={offer.id} className="match-card">
              <div className="match-header">
                <span className="match-badge" style={{ 
                  color: offer.status === 'accepted' ? 'var(--accent)' : 'var(--text-dim)', 
                  background: offer.status === 'accepted' ? 'rgba(0, 245, 212, 0.1)' : 'rgba(160, 160, 192, 0.1)' 
                }}>
                  {offer.status}
                </span>
              </div>
              <div className="match-stats">
                <div className="stat-item">
                  <span className="stat-label">To</span>
                  <span className="stat-value">{nameCache[offer.toUid] || "Loading..."}</span>
                </div>
              </div>
              <button className="add-match-btn" style={{ background: 'transparent', border: '1px solid var(--primary)', cursor: 'default' }}>
                {offer.status === 'pending' ? 'Awaiting Response' : 'Completed'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}