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
    if (!user) {
      navigate("/");
      return;
    }

    const autoSync = async () => {
      try {
        setIsSyncing(true);
        setStatus("Updating your profile data...");

        const result = await syncResponsesToFirestore();

        if (result.written > 0) {
          setStatus("Your profile is up to date.");
        } else {
          setStatus("");
        }
      } catch (err) {
        console.error(err);
        setStatus("");
      } finally {
        setIsSyncing(false);
      }
    };

    autoSync();
  }, [user, navigate]);

  return (
    <div className="home-container">
      <NavBar />

      <div className="home-content">
        <h1>Home</h1>
        <p className="home-subtitle">Welcome back to Matchly.</p>

        <div className="home-card-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div className="match-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
            <div className="match-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>
              Profile Active
            </div>
            
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'white' }}>
              Everything is set!
            </h2>
            
            <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '2rem' }}>
              Your profile is currently active and being matched with others. 
              You can view your potential connections or manage requests you've received.
            </p>

            {/* Status updates for syncing kept here */}
            {status && (
              <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--accent)', opacity: 0.8 }}>
                {status}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="add-match-btn" onClick={() => navigate("/matches")}>
                Explore Matches
              </button>
              <button 
                className="logout-btn" 
                style={{ flex: 'none', width: '100%', borderRadius: '12px', padding: '0.8rem' }} 
                onClick={() => navigate("/offers")}
              >
                View Offers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}