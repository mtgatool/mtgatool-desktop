export default function login(username: string, password: string) {
  return window.toolDb.signIn(username, password).then((keys) => {
    window.toolDb
      .getData("matchesIndex", true)
      .then((data) => console.log("matchesIndex", data))
      .catch(console.warn);

    window.toolDb
      .getData("decksIndex", true)
      .then((data) => console.log("decksIndex", data))
      .catch(console.warn);

    window.toolDb
      .getData("uuidData", true)
      .then((data) => console.log("uuidData", data))
      .catch(console.warn);

    window.toolDb
      .getData("cards", true)
      .then((data) => console.log("matchescardsIndex", data))
      .catch(console.warn);
    return keys;
  });
}
