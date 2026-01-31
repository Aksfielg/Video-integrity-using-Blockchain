#!/usr/bin/env node

import { config } from "dotenv";
config({ path: './.env' });

import crypto from "crypto";
import fs from "fs";
import supabase from "./supabaase.js";
import contract from "./blockchain.js";

const videoId = process.argv[2];

if (!videoId) {
  console.error("❌ Error: Please provide a video ID");
  console.log("Usage: node verify.js <videoId>");
  process.exit(1);
}

async function verifyVideo(videoId) {
  try {
    console.log(`\n🔍 Verifying video: ${videoId}\n`);

    // Download video from Supabase
    console.log("📥 Downloading video from database...");
    const { data, error: downloadError } = await supabase.storage
      .from("videos")
      .download(`${videoId}.mp4`);

    if (downloadError || !data) {
      console.error(`❌ Error: Video not found in database`);
      console.error(`   Video ID: ${videoId}`);
      process.exit(1);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    console.log(`✅ Video downloaded (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Calculate current hash
    console.log("🔐 Calculating current hash...");
    const currentHash = crypto
      .createHash("sha256")
      .update(buffer)
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

verifyVideo(videoId);
