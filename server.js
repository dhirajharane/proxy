import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const MAX_RETRIES = 2;
const TIMEOUT = 10000; // 10 seconds

// helper to fetch with timeout
const fetchWithTimeout = async (url, options = {}) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), TIMEOUT)
    )
  ]);
};

app.get("/api/swiggy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    Origin: "https://www.swiggy.com",
    Referer: "https://www.swiggy.com/",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9"
  };

  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      console.log(`Fetching URL: ${url} (attempt ${attempt + 1})`);
      const response = await fetchWithTimeout(url, { headers });
      const text = await response.text();

      if (!response.ok) {
        console.error(`Swiggy API error (${response.status}): ${text}`);
        return res.status(response.status).json({
          error: "Swiggy API error",
          details: text
        });
      }

      if (!text || text.length === 0) {
        console.warn(`Empty response from Swiggy (attempt ${attempt + 1})`);
        attempt++;
        if (attempt > MAX_RETRIES)
          return res.status(500).json({
            error: "Empty response from Swiggy after retries"
          });
        continue; // retry
      }

      try {
        const data = JSON.parse(text);
        return res.json(data);
      } catch (parseError) {
        console.error("JSON parsing error:", parseError.message);
        return res.status(500).json({
          error: "Failed to parse JSON from Swiggy",
          details: parseError.message,
          body: text
        });
      }

    } catch (err) {
      console.error(`Proxy fetch error (attempt ${attempt + 1}):`, err.message);
      attempt++;
      if (attempt > MAX_RETRIES)
        return res.status(500).json({ error: "Proxy failed", details: err.message });
    }
  }
});

const PORT =4000;
app.listen(PORT, () => console.log(`✅ Proxy running on port ${PORT}`));
