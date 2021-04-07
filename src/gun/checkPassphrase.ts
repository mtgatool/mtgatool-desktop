/* eslint-disable prefer-promise-reject-errors */
export default function checkPassphrase(alias: string, passphrase: string) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const gunUser = window.gun.user(`@${alias}`) as any;
    const user = await gunUser?.then().catch(reject);

    // console.log(user);
    if (gunUser && user) {
      const pubKey = Object.keys(user._[">"])[0].slice(1);
      // console.log(pubKey);

      const encrypted = await (window.gun.user(pubKey) as any)
        .get("settings")
        .get("recover")
        .then()
        .catch(reject);
      // console.log(encrypted);

      const proofOfWork = await window.SEA.work(passphrase, alias).catch(
        reject
      );
      // console.log(proofOfWork);

      const decrypted = await window.SEA.decrypt(
        encrypted,
        proofOfWork || ""
      ).catch(reject);

      if (decrypted === undefined) reject("Could not decrypt");
      else resolve(decrypted);
    } else {
      reject("Could not fetch user");
    }
  });
}
