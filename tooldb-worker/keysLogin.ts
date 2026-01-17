/* eslint-disable no-restricted-globals */
import { arrayBufferToHex } from "tool-db";

import afterLogin from "./afterLogin";
import reduxAction from "./reduxAction";

// Define the keys format for the new tool-db
// HexedKeys contains public and private keys in hex format
export interface HexedKeys {
  pub: string;
  priv: string;
}

export interface ParsedKeys {
  skpub: string;
  skpriv: string;
  ekpub: string;
  ekpriv: string;
}

// Convert old ParsedKeys format to new HexedKeys format
// Old format: skpub (base64 spki), skpriv (base64 pkcs8), etc.
// New format: pub (hex), priv (hex)
async function convertParsedKeysToHexed(keys: ParsedKeys): Promise<HexedKeys> {
  // Import the sign key pair
  const skpubBuffer = Uint8Array.from(atob(keys.skpub), (c) => c.charCodeAt(0));
  const skprivBuffer = Uint8Array.from(atob(keys.skpriv), (c) =>
    c.charCodeAt(0)
  );

  return {
    pub: arrayBufferToHex(skpubBuffer.buffer),
    priv: arrayBufferToHex(skprivBuffer.buffer),
  };
}

// Compute the address (pubKey) from a public key in hex format
// This mimics what pubkeyToBase64 does in the ecdsa-user adapter
async function computeAddressFromHexedKeys(hexedKeys: HexedKeys): Promise<string> {
  // Import the public key
  const pubBuffer = new Uint8Array(
    (hexedKeys.pub.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16))
  );

  const publicKey = await crypto.subtle.importKey(
    "spki",
    pubBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );

  // Export as JWK to get the x and y coordinates
  const jwk = await crypto.subtle.exportKey("jwk", publicKey);
  return `${jwk.x}${jwk.y}`;
}

export default async function keysLogin(keys: ParsedKeys): Promise<void> {
  try {
    // Convert old key format to new format
    const hexedKeys = await convertParsedKeysToHexed(keys);
    const pubKey = await computeAddressFromHexedKeys(hexedKeys);

    console.log("keys", keys);
    console.log("pubKey", pubKey);

    // Get the username associated with this public key
    const username = await self.toolDb.getData<string>(
      `:${pubKey}.username`,
      false,
      5000
    );
    console.log("username", username);

    // Set the user directly on the userAccount adapter
    // The ecdsa-user adapter's setUser expects an ECDSAUser object
    const userAccount = self.toolDb.userAccount as any;
    if (userAccount && userAccount.setUser) {
      await userAccount.setUser(
        {
          name: username || "",
          pub: hexedKeys.pub,
          priv: hexedKeys.priv,
        },
        username || ""
      );
    }

    self.postMessage({ type: "LOGIN_OK" });
    reduxAction("SET_PUBKEY", pubKey);
    reduxAction("SET_MY_USERNAME", username);
    afterLogin();
  } catch (err) {
    console.error("keysLogin error:", err);
    throw new Error("Something went wrong when importing the keys");
  }
}
