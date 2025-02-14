import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import fetch from "node-fetch"; 

dotenv.config();

const app = express();


app.use(
    cors({
      origin: [
        "https://ai-english-learning-assistant.vercel.app", 
        "http://localhost:5173",
      ],
      credentials: true,
    })
  );

app.use(express.json());


app.post("/api/session", async (req, res) => {
  try {
    const { voice, modalities, instructions } = req.body;


    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview-2024-12-17",
        voice: voice || "alloy",
        modalities: modalities || ["text", "audio"],
        instructions:
          instructions || "You are a helpful AI language learning assistant.",
        input_audio_transcription: {
          model: "whisper-1",
        },
        temperature: 0.7,
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
        },
      }),
    });


    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || response.statusText}`
      );
    }

   
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in /api/session endpoint:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "Hello from Mr. Dan Vu", message: "Server is running" });
});


app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});


app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ error: "Internal Server Error" });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
