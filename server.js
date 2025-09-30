// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve static files (index.html, css, js, etc.)
app.use(express.static(path.join(__dirname, "public")));

app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("Missing url param");

  try {
    const upstream = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        ...(req.headers.range ? { Range: req.headers.range } : {})
      }
    });

    res.status(upstream.status);

    const passthru = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges"
    ];
    passthru.forEach(h => {
      const val = upstream.headers.get(h);
      if (val) res.setHeader(h, val);
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range");

    upstream.body.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(502).send("Proxy error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
