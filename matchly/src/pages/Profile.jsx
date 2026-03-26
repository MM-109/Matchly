import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, db, storage } from "../services/firebase";
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
    return typeof answer === "string" ? answer : "";
  };

  return {
    fullName: getFullName(),
    shortBio: getShortBio(),
    profilePhoto: getPhotoUrl(),
  };
}

export default function Profile() {
  const currentUser = auth.currentUser;
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedBio, setEditedBio] = useState("");

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
    const loadProfile = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const docRef = doc(db, "questionnaires", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Profile data not found.");
          return;
        }

        const rawAnswers = parseAnswersJson(docSnap.data().answersJson);
        const data = extractProfileData(rawAnswers);
        setProfile(data);
        setEditedName(data.fullName);
        setEditedBio(data.shortBio);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [currentUser]);

  // --- NEW PHOTO UPLOAD HANDLER ---
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    try {
      setLoading(true);
      // 1. Upload to Storage
      const storageRef = ref(storage, `profilePhotos/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const newPhotoUrl = await getDownloadURL(storageRef);

      // 2. Sync with Firestore 'questionnaires' collection (for SendGrid)
      const docRef = doc(db, "questionnaires", currentUser.uid);
      const docSnap = await getDoc(docRef);
      let rawAnswers = parseAnswersJson(docSnap.data().answersJson);

      Object.keys(rawAnswers).forEach((key) => {
        if (rawAnswers[key].text.toLowerCase().includes("profile photo")) {
          rawAnswers[key].answer = [newPhotoUrl]; 
        }
      });

      await updateDoc(docRef, {
        answersJson: JSON.stringify(rawAnswers)
      });

      // 3. Update Local State
      setProfile({ ...profile, profilePhoto: newPhotoUrl });
      alert("Profile photo updated successfully!");
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Failed to upload photo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "questionnaires", currentUser.uid);
      const docSnap = await getDoc(docRef);
      let rawAnswers = parseAnswersJson(docSnap.data().answersJson);

      Object.keys(rawAnswers).forEach((key) => {
        const questionText = rawAnswers[key].text.toLowerCase();
        if (questionText.includes("full name")) {
          rawAnswers[key].answer = editedName;
          rawAnswers[key].prettyFormat = editedName; 
        }
        if (questionText.includes("short bio")) {
          rawAnswers[key].answer = editedBio;
        }
      });

      await updateDoc(docRef, {
        answersJson: JSON.stringify(rawAnswers)
      });

      setProfile({ ...profile, fullName: editedName, shortBio: editedBio });
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const initiateDelete = () => {
    const confirmFirst = window.confirm("Are you sure you want to delete your profile permanently?");
    if (confirmFirst) {
      setShowAuthModal(true);
    }
  };

  const handleFinalDeletion = async () => {
    if (!password) {
      setAuthError("Password is required to delete account.");
      return;
    }
    try {
      setLoading(true);
      setAuthError("");
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      await deleteDoc(doc(db, "questionnaires", currentUser.uid));
      await deleteUser(currentUser);
      alert("Profile deleted successfully.");
      navigate("/");
    } catch (err) {
      console.error(err);
      setAuthError("Authentication failed. Please check your password.");
      setLoading(false);
    }
  };

  if (loading && !showAuthModal && !isEditing) {
    return (
      <div style={{ backgroundColor: colors.teaLight, minHeight: "100vh" }}>
        <NavBar />
        <p style={{ color: colors.cyclamen, textAlign: "center", marginTop: "2rem" }}>Processing...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.teaLight, minHeight: "100vh", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <NavBar />
      
      <h1 style={{ color: colors.lobelia, marginTop: '2.5rem', marginBottom: '0.5rem' }}>Profile</h1>
      <p style={{ color: colors.cyclamen, marginBottom: '2.5rem' }}>Your personal details appear here.</p>

      {error && <p style={{ color: colors.cyclamen, textAlign: 'center', padding: '0 20px' }}>{error}</p>}

      {!error && profile && (
        <div style={{ width: '100%', maxWidth: '450px', padding: '0 20px', paddingBottom: '40px' }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '32px', 
            padding: '3rem 2rem', 
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(115, 152, 186, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: `1px solid ${colors.alyssum}`
          }}>
            
            {/* PHOTO SECTION WITH UPLOAD BUTTON */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {profile.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt="Profile"
                  onerror="https://firebasestorage.googleapis.com/v0/b/matchly-186f2.firebasestorage.app/o/profilePhotos%2F4MrWk3wcyUMvscoVoWKa4cAXMSH2?alt=media&token=5a72098f-5a14-4780-93ef-0f117103c50c"
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginBottom: '1.5rem',
                    border: `5px solid ${colors.alyssum}`,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                  }}
                />
              ) : (
                <div style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.inThePink}, ${colors.cyclamen})`,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                  fontWeight: '800',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                }}>
                  {profile.fullName?.charAt(0) || "?"}
                </div>
              )}
              
              {/* THE FLOATING CAMERA BUTTON */}
              <label style={{
                position: 'absolute',
                bottom: '25px',
                right: '5px',
                backgroundColor: colors.lobelia,
                color: 'white',
                padding: '8px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '35px',
                height: '35px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}>
                📷
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
            
            {isEditing ? (
              <input 
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: colors.lobelia,
                  textAlign: 'center',
                  border: `1px solid ${colors.alyssum}`,
                  borderRadius: '8px',
                  width: '100%',
                  marginBottom: '1rem'
                }}
              />
            ) : (
              <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800', color: colors.lobelia }}>
                {profile.fullName || "Anonymous User"}
              </h2>
            )}
            
            <span style={{ 
              backgroundColor: colors.lemonMeringue, 
              color: colors.cyclamen, 
              padding: '6px 16px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: '800',
              marginBottom: '2.5rem',
              letterSpacing: '1px'
            }}>
              VERIFIED MEMBER
            </span>
            
            <div style={{ 
              width: '100%', 
              borderTop: `1px solid ${colors.alyssum}`, 
              paddingTop: '2rem',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '900', color: colors.cyclamen, letterSpacing: '1.5px' }}>
                SHORT BIO
              </span>
              {isEditing ? (
                <textarea 
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  style={{
                    width: '100%',
                    height: '100px',
                    marginTop: '8px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.alyssum}`,
                    padding: '8px',
                    fontFamily: 'inherit',
                    color: colors.lobelia
                  }}
                />
              ) : (
                <p style={{ 
                  lineHeight: '1.6', 
                  marginTop: '8px', 
                  fontSize: '1rem', 
                  color: colors.lobelia,
                  fontWeight: '500'
                }}>
                  {profile.shortBio || "No bio added yet."}
                </p>
              )}
            </div>

            <button
              onClick={isEditing ? handleUpdateProfile : () => setIsEditing(true)}
              style={{ 
                marginTop: '3rem', 
                width: '100%', 
                padding: '16px', 
                borderRadius: '14px', 
                backgroundColor: isEditing ? colors.cyclamen : colors.inThePink, 
                color: 'white', 
                border: 'none', 
                fontWeight: '800', 
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: `0 4px 15px rgba(241, 178, 200, 0.4)`
              }}
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>

            {isEditing && (
              <button
                onClick={() => { setIsEditing(false); setEditedName(profile.fullName); setEditedBio(profile.shortBio); }}
                style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: colors.cyclamen, cursor: 'pointer', fontWeight: '600' }}
              >
                Cancel
              </button>
            )}

            {!isEditing && (
              <button
                onClick={initiateDelete}
                style={{ 
                  marginTop: '1rem', 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '14px', 
                  backgroundColor: 'transparent', 
                  color: colors.cyclamen, 
                  border: `1px solid ${colors.alyssum}`, 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Delete Account
              </button>
            )}
          </div>
        </div>
      )}

      {showAuthModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(115, 152, 186, 0.7)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px',
            maxWidth: '400px', width: '90%', textAlign: 'center', border: `2px solid ${colors.alyssum}`
          }}>
            <h3 style={{ color: colors.cyclamen, marginBottom: '1rem' }}>Confirm Deletion</h3>
            <input 
              type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.alyssum}`, marginBottom: '1rem' }}
            />
            {authError && <p style={{ color: 'red', fontSize: '0.8rem' }}>{authError}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAuthModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: colors.agapanthus, color: 'white', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleFinalDeletion} style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: colors.cyclamen, color: 'white', border: 'none', cursor: 'pointer' }}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}