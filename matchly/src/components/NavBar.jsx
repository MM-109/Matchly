import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";

export default function NavBar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#ffffff" : "#e5e7eb",
    fontWeight: isActive ? "700" : "500",
    padding: "8px 12px",
    borderRadius: "8px",
    backgroundColor: isActive ? "#374151" : "transparent",
  });

  return (
    <nav
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        padding: "16px 24px",
        backgroundColor: "#111827",
      }}
    >
      <NavLink to="/home" style={linkStyle}>
        Home
      </NavLink>

      <NavLink to="/questionnaire" style={linkStyle}>
        Questionnaire
      </NavLink>

      <NavLink to="/matches" style={linkStyle}>
        Matches
      </NavLink>

      <NavLink to="/profile" style={linkStyle}>
        Profile
      </NavLink>

      <button
        onClick={handleLogout}
        style={{
          marginLeft: "auto",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </nav>
  );
}