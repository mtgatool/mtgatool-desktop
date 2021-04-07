import randomWords from "random-words";

export default function newResetPassphrase(reminder: string): Promise<string> {
  const passphrase = randomWords({
    exactly: 12,
    maxLength: 6,
    join: " ",
    formatter: (word) => word.toUpperCase(),
  });

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const user = window.gun.user();
    if (!user) {
      reject(new Error("Failed to fetch user data"));
    } else {
      const alias = await (user.get("alias") as any).then();
      const work = await window.SEA.work(passphrase, alias);
      if (work) {
        const recover = await window.SEA.encrypt(reminder, work);

        user.get("settings").put(
          {
            recover: recover,
          } as never,
          () => resolve(passphrase)
        );
      } else {
        reject(new Error("Proof of work failed"));
      }
    }
  });
}
