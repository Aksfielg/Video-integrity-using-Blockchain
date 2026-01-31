import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

console.log("🔥 server.js loaded");

import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import cors from "cors";


import supabase from "./supabaase.js";
import contract from "./blockchain.js";

const app = express();
app.use(cors());
app.use(express.json());

// Ensure temp directory exists
if (!fs.existsSync("temp")) {
  fs.mkdirSync("temp", { recursive: true });
}

const upload = multer({ dest: "temp/" });


/**
 * Upload video → hash → Supabase → blockchain
 */
app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const videoId = crypto.randomUUID();
    const fileBuffer = fs.readFileSync(req.file.path);

    // Hash video
    const hash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from("videos")
      .upload(`${videoId}.mp4`, fileBuffer, {
        contentType: "video/mp4",
      });

    if (error) {
      return res.status(500).json({ error: "Error uploading video to Supabase" });
    }

    // Store hash on blockchain
    const tx = await contract.registerVideo(videoId, hash);
    await tx.wait();

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      videoId,
      hash,
      txHash: tx.hash,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Verify video (anti-tampering)
 */
app.get("/verify/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;

    // Download video from Supabase
    const { data, error: downloadError } = await supabase.storage
      .from("videos")
      .download(`${videoId}.mp4`);

    if (downloadError || !data) {
      return res.status(404).json({ 
        error: "Video not found in database",
        videoId 
      });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    // Calculate current hash
    const newHash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    // Get stored hash from blockchain
    let storedHash, timestamp;
    try {
      [storedHash, timestamp] = await contract.getVideo(videoId);
    } catch (blockchainError) {
      return res.status(404).json({ 
        error: "Video hash not found on blockchain",
        videoId,
        details: blockchainError.message 
      });
    }

    const isValid = newHash === storedHash;

    res.json({
      valid: isValid,
      tampered: !isValid,
      message: isValid 
        ? "✅ Video is authentic and has not been tampered with" 
        : "⚠️ WARNING: Video has been tampered with!",
      storedHash,
      currentHash: newHash,
      timestamp: timestamp.toString(),
      videoId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
