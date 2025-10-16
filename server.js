import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/api/swiggy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    Origin: "https://www.swiggy.com",
    Referer: "https://www.swiggy.com/"
  };

  try {
    const response = await fetch(url, { headers });
    const text = await response.text();

    if (!response.ok)
      return res
        .status(response.status)
        .json({ error: "Swiggy API error", details: text });

    if (!text)
      return res.status(500).json({ error: "Empty response from Swiggy" });

    try {
      const data = JSON.parse(text);
      return res.json(data);
    } catch (e) {
      return res.status(500).json({
        error: "Failed to parse Swiggy response",
        details: e.message
      });
    }
  } catch (err) {
    console.error("Proxy Error:", err.message);
    return res
      .status(500)
      .json({ error: "Proxy failed", details: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Proxy running on port ${PORT}`));
