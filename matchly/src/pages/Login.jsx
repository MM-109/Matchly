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
    <div className="matches-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="home-content" style={{ marginTop: 0 }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Matchly</h1>
        <p className="home-subtitle">Find your perfect connection.</p>

        <div className="home-card-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '2rem' }}>
          <div className="match-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
            
            <h2 style={{ color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>Welcome</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <button className="add-match-btn" onClick={login}>
                  Login
                </button>
                <button className="logout-btn" style={{ flex: 'none', width: '100%', borderRadius: '12px' }} onClick={register}>
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