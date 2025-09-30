// server.js
import express from "express";
import fetch from "node-fetch"; // make sure node-fetch@2 is installed
import cors from "cors";

const app = express();
app.use(cors()); // allow all origins

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

    // Forward status
    res.status(upstream.status);

    // Forward critical headers
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

    // Add CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range");

    // Stream response
    upstream.body.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(502).send("Proxy error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server running on ${PORT}`));
