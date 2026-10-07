const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

function safePath(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(PUBLIC_DIR, normalized);
  return full.startsWith(PUBLIC_DIR) ? full : null;
}

const server = http.createServer((req, res) => {
  const rawPathname = url.parse(req.url).pathname || "/";
  let pathname;
  try {
    pathname = decodeURIComponent(rawPathname);
  } catch {
    pathname = rawPathname;
  }
  let filePath;

  if (pathname === "/") {
    filePath = path.join(PUBLIC_DIR, "index.html");
  } else {
    const clean = pathname.replace(/^\/+/, "");
    const candidates = [
      path.join(PUBLIC_DIR, clean),
      path.join(PUBLIC_DIR, `${clean}.html`),
      path.join(PUBLIC_DIR, clean, "index.html"),
    ];
    filePath = candidates.find((p) => {
      try { return fs.statSync(p).isFile(); } catch { return false; }
    });
  }

  if (!filePath || !filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>404</h1><p>Page not found.</p>");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal server error");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Y N Classes static website running at http://localhost:${PORT}`);
});
