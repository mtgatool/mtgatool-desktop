import { ParsedKeys } from "mtgatool-db";

function getKeysJson(): Promise<{ keys: ParsedKeys; userName: string }> {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "GET_SAVE_KEYS_JSON",
      });

      const listener = (e: any) => {
        const { type, value } = e.data;
        if (type === `SAVE_KEYS_JSON`) {
          resolve(value);
          window.toolDbWorker.removeEventListener("message", listener);
        }
      };
      window.toolDbWorker.addEventListener("message", listener);
    } else {
      reject();
    }
  });
}

export default function saveKeysCallback() {
  getKeysJson().then((value: { keys: ParsedKeys; userName: string }) => {
    const { keys, userName } = value;
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(
        JSON.stringify(keys)
      )}`
    );
    element.setAttribute("download", `${userName || "user"}-keys.json`);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  });
}
