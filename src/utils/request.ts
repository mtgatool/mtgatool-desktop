import https from "https";

export default function request(url: string): Promise<string> {
  return new Promise((resolve) => {
    https.get(url, { rejectUnauthorized: false }, (response) => {
      let data = "";
      response.on("data", (_data) => {
        data += _data;
      });
      response.on("end", () => resolve(data));
    });
  });
}
