import getCssQuality from "../../../utils/getCssQuality";

export default function ViewWip() {
  return (
    <>
      <div
        className={`section ${getCssQuality()}`}
        style={{ flexDirection: "column", textAlign: "center" }}
      >
        <div className="wip-sign" />
        <h1>Working on it</h1>
        <p style={{ marginBottom: "16px" }}>
          Our team of expert Goblins are working here.
        </p>
      </div>
    </>
  );
}
