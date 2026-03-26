import { useState } from "react";
import { auth, db } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const register = async () => {
    if (!email || !password) {
      alert("Please enter an email and password.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile doc in Firestore (Keeping your logic)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
        surveyCompleted: false
      });

      navigate("/questionnaire");
    } catch (err) {
      alert(err.message);
    }
  };

  const login = async () => {
    if (!email || !password) {
      alert("Please enter an email and password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="matches-container" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      background: '#E1F0FF' // Lightest blue from your palette
    }}>
      <div className="home-content" style={{ marginTop: 0, width: '100%' }}>
        {/* Title in the Deep Gold */}
        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', color: '#D4BC8D' }}>Matchly</h1>
        <p className="home-subtitle" style={{ color: '#8E9AAF' }}>Find your perfect connection.</p>

        <div className="home-card-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '2rem' }}>
          <div className="match-card" style={{ 
            maxWidth: '400px', 
            width: '100%', 
            padding: '2.5rem', 
            background: '#FFFFFF', // Clean white card
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(194, 203, 229, 0.4)' // Soft Periwinkle shadow
          }}>
            
            {/* Header in Lavender */}
            <h2 style={{ color: '#CDC1E5', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '600' }}>Welcome</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ color: '#A0AEC0', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#F8F9FF', // Very light tint
                    border: '1px solid #C2CBE5', // Periwinkle border
                    color: '#4A5568',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ color: '#A0AEC0', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#F8F9FF',
                    border: '1px solid #C2CBE5',
                    color: '#4A5568',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {/* Primary Login Button in Gold */}
                <button 
                  className="add-match-btn" 
                  onClick={login}
                  style={{
                    backgroundColor: '#D4BC8D',
                    color: 'white',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Login
                </button>
                {/* Secondary Register Button in Lavender */}
                <button 
                  className="logout-btn" 
                  style={{ 
                    flex: 'none', 
                    width: '100%', 
                    borderRadius: '12px',
                    backgroundColor: '#CDC1E5',
                    color: '#5B5470',
                    border: 'none',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }} 
                  onClick={register}
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}