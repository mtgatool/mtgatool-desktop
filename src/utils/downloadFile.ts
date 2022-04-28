import { http, https } from "follow-redirects";

export default async function downloadFile(
  url: string,
  filePath: string
): Promise<any> {
  const proto = !url.charAt(4).localeCompare("s") ? https : http;

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line global-require
    const fs = require("fs");
    const file = fs.createWriteStream(filePath);
    let fileInfo: any = null;

    const request = proto.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 400) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }

      fileInfo = {
        mime: response.headers["content-type"],
        size: parseInt(response.headers["content-length"] || "", 10),
      };

      response.pipe(file);
    });

    // The destination stream is ended by the time it's called
    file.on("finish", () => resolve(fileInfo));

    request.on("error", (err) => {
      fs.unlink(filePath, () => reject(err));
    });

    file.on("error", (err: any) => {
      fs.unlink(filePath, () => reject(err));
    });

    request.end();
  });
}
