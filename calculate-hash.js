#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import crypto from "crypto";
import fs from "fs";
import path from "path";

const videoPath = process.argv[2];

if (!videoPath) {
  console.error("❌ Error: Please provide a video file path");
  console.log("Usage: node calculate-hash.js <path/to/video.mp4>");
  process.exit(1);
}

if (!fs.existsSync(videoPath)) {
  console.error(`❌ Error: Video file not found: ${videoPath}`);
  process.exit(1);
}

function calculateHash(filePath) {
  try {
    console.log(`\n🔐 Calculating hash for: ${path.basename(filePath)}\n`);
    
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);
    
    console.log(`📊 File size: ${fileSize} MB`);
    console.log("⏳ Computing SHA-256 hash...");
    
    const hash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Hash calculated successfully!");
    console.log("=".repeat(60));
    console.log(`\n📝 SHA-256 Hash:`);
    console.log(`   ${hash}\n`);
    console.log("=".repeat(60) + "\n");
    
    return hash;
  } catch (err) {
    console.error("❌ Error calculating hash:", err.message);
    process.exit(1);
  }
}

const hash = calculateHash(videoPath);
console.log("💡 Tip: Use this hash to verify video integrity against blockchain\n");
