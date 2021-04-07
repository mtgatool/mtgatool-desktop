import crypto from "crypto";

export default (d: crypto.BinaryLike) =>
  crypto.createHash("sha256").update(d).digest("hex");
