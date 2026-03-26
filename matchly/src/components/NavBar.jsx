import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function NavBar() {
  const navigate = useNavigate();
  const [hasQuestionnaire, setHasQuestionnaire] = useState(null);

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
    const checkQuestionnaire = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setHasQuestionnaire(false);
          return;
        }
        const questionnaireRef = doc(db, "questionnaires", user.uid);
        const questionnaireSnap = await getDoc(questionnaireRef);
        setHasQuestionnaire(questionnaireSnap.exists());
      } catch (error) {
        setHasQuestionnaire(false);
      }
    };
    checkQuestionnaire();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? colors.lobelia : colors.cyclamen,
    fontWeight: "700",
    padding: "10px 20px",
    borderRadius: "25px",
    backgroundColor: isActive ? colors.lemonMeringue : "transparent",
    textAlign: "center",
    transition: "all 0.3s ease",
    fontSize: "0.95rem",
    border: isActive ? `2px solid ${colors.alyssum}` : "2px solid transparent",
  });

  return (
    <nav
      className="navbar"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        justifyContent: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        padding: "16px",
        backgroundColor: colors.teaLight,
        borderBottom: `1px solid ${colors.alyssum}`,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
      }}
    >
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
        <NavLink to="/home" style={linkStyle}>
          Home
        </NavLink>

        <NavLink to="/questionnaire" style={linkStyle}>
          Questionnaire
        </NavLink>

        {hasQuestionnaire && (
          <>
            <NavLink to="/matches" style={linkStyle}>
              Matches
            </NavLink>

            <NavLink to="/offers" style={linkStyle}>
              Offers
            </NavLink>

            <NavLink to="/exchange" style={linkStyle}>
              Exchange
            </NavLink>

            <NavLink to="/profile" style={linkStyle}>
              Profile
            </NavLink>

            <NavLink to="/about" style={linkStyle}>
              About
            </NavLink>
          </>
        )}

        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            borderRadius: "25px",
            border: `2px solid ${colors.cyclamen}`,
            background: "transparent",
            color: colors.cyclamen,
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "0.95rem",
            transition: "all 0.3s ease",
            marginLeft: "10px"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = colors.alyssum;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}