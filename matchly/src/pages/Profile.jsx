import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import NavBar from "../components/NavBar";

function parseAnswersJson(answersJson) {
  try {
    return JSON.parse(answersJson || "{}");
  } catch {
    return {};
  }
}

function extractProfileData(rawAnswers) {
  const answersArray = Object.values(rawAnswers || {});

  const getAnswerByText = (questionTextPart) => {
    const found = answersArray.find((item) =>
      item?.text?.toLowerCase().includes(questionTextPart.toLowerCase())
    );
    return found?.answer ?? null;
  };

  const getPhotoUrl = () => {
    const found = answersArray.find((item) =>
      item?.text?.toLowerCase().includes("profile photo")
    );
    const answer = found?.answer;
    if (Array.isArray(answer)) return answer[0] || "";
    if (typeof answer === "string") return answer;
    return "";
  };

  const getFullName = () => {
    const answer = getAnswerByText("full name");
    if (!answer) return "";
    if (typeof answer === "string") return answer;
    if (typeof answer === "object") {
      const first = answer.first || "";
      const last = answer.last || "";
      return `${first} ${last}`.trim();
    }
    return "";
  };

  const getShortBio = () => {
    const answer = getAnswerByText("short bio");
    if (typeof answer === "string") return answer;
    return "";
  };

  return {
    fullName: getFullName(),
    shortBio: getShortBio(),
    profilePhoto: getPhotoUrl(),
  };
}

export default function Profile() {
  const currentUser = auth.currentUser;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        setError("");
        const docRef = doc(db, "questionnaires", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Profile data not found.");
          return;
        }

        const data = docSnap.data();
        const rawAnswers = parseAnswersJson(data.answersJson);
        const extracted = extractProfileData(rawAnswers);
        setProfile(extracted);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [currentUser]);

  return (
    <div className="matches-container">
      <NavBar />
      <h1>Profile</h1>
      <p className="home-subtitle">Your personal details appear here.</p>

      {loading && <p>Loading profile...</p>}
      {error && <p style={{ color: "var(--error)" }}>{error}</p>}

      {!loading && !error && profile && (
        <div className="profile-content" style={{ width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'center' }}>
          <div className="match-card" style={{ alignItems: 'center', textAlign: 'center', padding: '3rem', width: '100%' }}>
            
            {profile.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt="Profile"
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginBottom: '1.5rem',
                  border: '4px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                }}
              />
            ) : (
              <div 
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3.5rem',
                  fontWeight: '800',
                  border: '4px solid rgba(255,255,255,0.1)',
                  color: 'white'
                }}
              >
                {profile.fullName?.charAt(0) || "?"}
              </div>
            )}
            
            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '700', color: 'white' }}>
              {profile.fullName || "Anonymous User"}
            </h2>
            <span className="match-badge" style={{ marginBottom: '2.5rem' }}>Verified Profile</span>
            
            <div className="match-stats" style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
              <div className="stat-item" style={{ alignItems: 'center' }}>
                <span className="stat-label">Bio</span>
                <span className="stat-value" style={{ lineHeight: '1.6', marginTop: '10px', fontSize: '1.1rem', color: 'var(--text-dim)' }}>
                  {profile.shortBio || "No bio added yet."}
                </span>
              </div>
            </div>

            <button className="add-match-btn" style={{ marginTop: '2.5rem', maxWidth: '240px' }}>
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}