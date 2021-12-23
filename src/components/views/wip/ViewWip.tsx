import Section from "../../ui/Section";

export default function ViewWip() {
  return (
    <>
      <Section
        style={{
          marginTop: "16px",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <div className="wip-sign" />
        <h1>Working on it</h1>
        <p style={{ marginBottom: "16px" }}>
          Our team of expert Goblins are working here.
        </p>
      </Section>
    </>
  );
}
