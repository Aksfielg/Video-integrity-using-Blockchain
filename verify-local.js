#!/usr/bin/env node

import { config } from "dotenv";
config({ path: './.env' });

import crypto from "crypto";
import fs from "fs";
import path from "path";
import contract from "./blockchain.js";

const videoPath = process.argv[2];
const videoId = process.argv[3];

if (!videoPath || !videoId) {
  console.error("❌ Error: Please provide both video file path and video ID");
  console.log("Usage: node verify-local.js <path/to/video.mp4> <videoId>");
  process.exit(1);
}

if (!fs.existsSync(videoPath)) {
  console.error(`❌ Error: Video file not found: ${videoPath}`);
  process.exit(1);
}

async function verifyLocalVideo(filePath, videoId) {
  try {
    console.log(`\n🔍 Verifying local video: ${path.basename(filePath)}`);
    console.log(`📋 Video ID: ${videoId}\n`);

    // Read and hash local video file
    console.log("📥 Reading local video file...");
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`✅ File loaded (${fileSize} MB)`);

    // Calculate current hash
    console.log("🔐 Calculating current hash...");
    const currentHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");
    console.log(`   Current hash: ${currentHash}`);

    // Get stored hash from blockchain
    console.log("⛓️  Fetching stored hash from blockchain...");
    let storedHash, timestamp;
    try {
      [storedHash, timestamp] = await contract.getVideo(videoId);
      console.log(`   Stored hash: ${storedHash}`);
      console.log(`   Timestamp: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
    } catch (blockchainError) {
      console.error(`❌ Error: Video hash not found on blockchain`);
      console.error(`   ${blockchainError.message}`);
      process.exit(1);
    }

    // Compare hashes
    const isValid = currentHash === storedHash;

    console.log("\n" + "=".repeat(60));
    if (isValid) {
      console.log("✅ VERIFICATION RESULT: Video is AUTHENTIC");
      console.log("   ✓ Video has NOT been tampered with");
      console.log("   ✓ Hash matches blockchain record");
    } else {
      console.log("⚠️  VERIFICATION RESULT: Video has been TAMPERED!");
      console.log("   ✗ Video integrity compromised");
      console.log("   ✗ Hash does NOT match blockchain record");
      console.log("\n   Current hash:  " + currentHash);
      console.log("   Stored hash:   " + storedHash);
    }
    console.log("=".repeat(60) + "\n");

    process.exit(isValid ? 0 : 1);
  } catch (err) {
    console.error("❌ Error during verification:", err.message);
    process.exit(1);
  }
}

verifyLocalVideo(videoPath, videoId);
