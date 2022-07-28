import { ParsedKeys, saveKeysComb } from "mtgatool-db";

function getKeysJson(): Promise<ParsedKeys | null> {
  return new Promise((resolve) => {
    if (window.toolDb.user) {
      saveKeysComb(
        window.toolDb.user.keys.signKeys,
        window.toolDb.user.keys.encryptionKeys
      ).then(resolve);
    } else {
      resolve(null);
    }
  });
}

export default function saveKeysCallback() {
  getKeysJson().then((keys) => {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(
        JSON.stringify(keys)
      )}`
    );
    element.setAttribute(
      "download",
      `${window.toolDb.user?.name || "user"}-keys.json`
    );

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  });
}
