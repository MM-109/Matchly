import NavBar from "../components/NavBar";

export default function About() {
  const colors = {
    pink: "#F1B2C8",
    cyclamen: "#B76A84",
    meringue: "#F9E8C1",
    lobelia: "#7398BA",
    alyssum: "#F3D1D9",
    teaLight: "#FDF1D0"
  };

  return (
    <div style={{ backgroundColor: colors.teaLight, minHeight: "100vh" }}>
      <NavBar />

      <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h1 style={{ color: colors.lobelia, fontSize: '2.8rem', marginBottom: '1rem', fontWeight: '800' }}>
            About Matchly
          </h1>
          <p style={{ maxWidth: "800px", margin: "0 auto", color: colors.cyclamen, fontSize: '1.2rem', fontWeight: '500', lineHeight: '1.6' }}>
            A space where compatibility, sincerity, and emotional alignment matter most.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2.5rem" }}>
          
          {/* Section: Our Mission */}
          <div style={cardStyle(colors)}>
            <span style={badgeStyle(colors)}>OUR MISSION</span>
            <p style={bodyTextStyle(colors)}>
              Matchly was created for people who are tired of shallow interactions and disconnected experiences. 
              Its purpose is to bring warmth, intention, and meaning back into modern matchmaking by creating 
              a space where <strong>compatibility, sincerity, and emotional alignment</strong> matter more than quick impressions. 
              Matchly believes meaningful connection deserves care, depth, and a journey that feels thoughtful 
              from the very beginning.
            </p>
          </div>

          {/* Section: The Difference */}
          <div style={cardStyle(colors)}>
            <span style={badgeStyle(colors)}>THE DIFFERENCE</span>
            <p style={bodyTextStyle(colors)}>
              What makes Matchly different is that it is not built around randomness, noise, or endless 
              surface-level browsing. It is designed around <strong>real alignment</strong>, giving importance to values, 
              personality, lifestyle, and relationship goals. Instead of overwhelming people, Matchly reveals 
              connection gradually, creating space for curiosity, trust, and something more genuine to grow.
            </p>
          </div>

          {/* Section: Why Matchly */}
          <div style={cardStyle(colors)}>
            <span style={badgeStyle(colors)}>WHY MATCHLY</span>
            <p style={bodyTextStyle(colors)}>
              Matchly exists because love and connection should not feel confusing, embarrassing, or emotionally draining. 
              It was created for people who want more than being noticed; they want to <strong>feel understood, valued, and aligned</strong>. 
              Matchly protects emotional energy by making the process more thoughtful, more grounded, and more sincere.
            </p>
          </div>

          {/* Section: How it Works (Functional) */}
          <div style={cardStyle(colors)}>
            <span style={badgeStyle(colors)}>THE EXPERIENCE</span>
            <div style={{ marginTop: "1.5rem", display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {[
                "Intentional preference collection",
                "Deep-dive compatibility scoring",
                "Curated, quality-first matches",
                "Gated, mutual interest exchange"
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={dotStyle(colors)} />
                  <span style={{ color: colors.lobelia, fontSize: '1rem', fontWeight: '600' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Team */}
          <div style={cardStyle(colors)}>
            <span style={badgeStyle(colors)}>THE BUILDERS</span>
            <div style={{ marginTop: "1.5rem" }}>
              <span style={labelStyle(colors)}>LEAD DEVELOPER</span>
              <p style={{ ...bodyTextStyle(colors), marginTop: '4px', marginBottom: '1.5rem' }}>
                Mumtaas Mohamud — Architecture, Logic & UX
              </p>
              <span style={labelStyle(colors)}>PROJECT COLLABORATOR</span>
              <p style={{ ...bodyTextStyle(colors), marginTop: '4px' }}>
                Daniella Salima
              </p>
            </div>
          </div>

          {/* Section: Final Thought */}
          <div style={{ ...cardStyle(colors), background: `linear-gradient(135deg, ${colors.pink}, ${colors.alyssum})`, border: 'none' }}>
            <span style={{ ...badgeStyle(colors), backgroundColor: 'white' }}>A FINAL THOUGHT</span>
            <p style={{ color: colors.cyclamen, lineHeight: "1.6", marginTop: "1.5rem", fontSize: "1.3rem", fontWeight: "800", fontStyle: "italic" }}>
              "Matchly is not about increasing matches. It is about improving the quality of connection."
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// Internal Styles
const cardStyle = (colors) => ({
  backgroundColor: 'white',
  borderRadius: '30px',
  padding: '2.5rem',
  border: `1px solid ${colors.alyssum}`,
  boxShadow: '0 12px 24px rgba(115, 152, 186, 0.08)',
  display: 'flex',
  flexDirection: 'column'
});

const badgeStyle = (colors) => ({
  backgroundColor: colors.meringue,
  color: colors.cyclamen,
  padding: '6px 14px',
  borderRadius: '15px',
  fontSize: '0.7rem',
  fontWeight: '900',
  letterSpacing: '1.5px',
  alignSelf: 'flex-start'
});

const bodyTextStyle = (colors) => ({
  color: colors.lobelia,
  lineHeight: "1.8",
  marginTop: "1.2rem",
  fontSize: "1rem",
  fontWeight: "500"
});

const labelStyle = (colors) => ({
  fontSize: '0.65rem',
  fontWeight: '900',
  color: colors.cyclamen,
  letterSpacing: '1.5px'
});

const dotStyle = (colors) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: colors.pink,
  flexShrink: 0
});