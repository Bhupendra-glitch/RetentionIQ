import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Mentor endpoint
  app.post("/api/mentor", async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(200).json({
          reply: "I am ready to act as your Senior D2C Fashion Database & Retention Mentor. However, the `GEMINI_API_KEY` is not currently set in your environment. Let me answer with pre-modeled expert insights until you supply a key!\n\nTo configure your API Key, use the **Settings > Secrets** panel in the AI Studio interface.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = 
        "You are Senior D2C Fashion Mentor, an expert customer analytics strategist, database engineering leader, and growth consultant.\n" +
        "You are helping a junior analyst understand e-commerce retention modeling, SQL data transformations, RFM feature engineering, and executive strategy for a D2C fashion house.\n" +
        "Respond like a senior boardroom consultant: clear, authoritative, practical, and highly strategic. Limit jargon but retain executive rigor.\n" +
        "Keep answers structured, elegant, and beginner-friendly, explaining WHY each SQL metric or Python transformation carries substantial margin and financial value.";

      const contents = [];
      if (history && Array.isArray(history)) {
        // limit history to prevent token overflow
        const activeHistory = history.slice(-6);
        for (const item of activeHistory) {
          contents.push({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.content }]
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: err.message || "Internal server error querying the AI Mentor." });
    }
  });

  // Serve Vite Assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
