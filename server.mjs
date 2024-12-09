import { createReadStream, existsSync } from "fs";
import { createServer } from "http";
import { extname, join, normalize } from "path";
import stats from "./stats.mjs";

const cwd = process.cwd();
const port = Number(process.env.PORT || 5747);

const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
};

function notFound(res) {
  res.writeHead(404).end("Not found");
}

createServer(function (request, response) {
  if (request.url === "favicon.ico" || request.method !== "GET") {
    return notFound(response);
  }

  const url = new URL(request.url, "http://local");
  const [cmd, ...parts] = url.pathname.slice(1).split("/");

  if (url.pathname === "/") {
    response.setHeader("location", "/ui/index.html");
    response.end();
    return;
  }

  if (url.pathname.startsWith("/ui/")) {
    const file = join(
      cwd,
      "public",
      normalize(url.pathname.replace("/ui/", ""))
    );

    if (!existsSync(file)) {
      return notFound(response);
    }

    const extension = extname(file);
    response.setHeader("content-type", mime[extension] || "text/plain");
    createReadStream(file).pipe(response);
    return;
  }

  if (stats[cmd]) {
    return response.end(stats[cmd](...parts));
  }

  notFound(response);
}).listen(port, "0.0.0.0", () => {
  console.log("Service started on http://localhost:" + port);
});
