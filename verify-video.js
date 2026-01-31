#!/usr/bin/env node

/**
 * Verify Video Integrity
 * Checks if a video has been tampered with by comparing its hash
 * against the hash stored on the blockchain
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import crypto from "crypto";
import supabase from "./supabaase.js";
import contract from "./blockchain.js";

// Get video ID from command line
const videoId = process.argv[2];

if (!videoId) {
  console.error("❌ Error: Please provide a video ID");
  console.log("Usage: node verify-video.js <videoId>");
  console.log("\nExample:");
  console.log("  node verify-video.js 3293420c-f205-48d1-88be-cefd31fb9019");
  process.exit(1);
}

async function verifyVideo() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🔍 VIDEO INTEGRITY VERIFICATION");
    console.log("=".repeat(70));
    console.log(`\n🆔 Video ID: ${videoId}\n`);

    // Step 1: Download video from Supabase
    console.log("⏳ Step 1: Downloading video from Supabase...");
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from("videos")
      .download(`${videoId}.mp4`);

    if (downloadError || !downloadData) {
      console.error(`❌ Error: Video not found in database`);
      console.error(`   ${downloadError?.message || "Unknown error"}`);
      process.exit(1);
    }

    console.log("✅ Video downloaded successfully");

    // Step 2: Calculate current hash
    console.log("\n⏳ Step 2: Calculating current hash of video...");
    const buffer = Buffer.from(await downloadData.arrayBuffer());
    const currentHash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    console.log(`✅ Current hash: ${currentHash}`);

    // Step 3: Get stored hash from blockchain
    console.log("\n⏳ Step 3: Retrieving stored hash from blockchain...");
    let storedHash, timestamp;
    try {
      [storedHash, timestamp] = await contract.getVideo(videoId);
      console.log(`✅ Stored hash retrieved from blockchain`);
    } catch (blockchainError) {
      console.error(`❌ Error: Video hash not found on blockchain`);
      console.error(`   ${blockchainError.message}`);
      process.exit(1);
    }

    // Step 4: Compare hashes
    console.log("\n⏳ Step 4: Comparing hashes...");
    const isValid = currentHash === storedHash;

    // Display results
    console.log("\n" + "=".repeat(70));
    console.log("📊 VERIFICATION RESULTS");
    console.log("=".repeat(70));
    console.log(`\n   Video ID:       ${videoId}`);
    console.log(`   Current Hash:   ${currentHash}`);
    console.log(`   Stored Hash:    ${storedHash}`);
    console.log(`   Match:          ${isValid ? "✅ YES" : "❌ NO"}`);
    console.log(`   Timestamp:      ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
    console.log("\n" + "-".repeat(70));

    if (isValid) {
      console.log("\n✅ RESULT: Video is AUTHENTIC and has NOT been tampered with!");
      console.log("   The video file matches the original hash stored on the blockchain.");
    } else {
      console.log("\n⚠️  RESULT: WARNING - Video has been TAMPERED with!");
      console.log("   The current hash does not match the stored hash on the blockchain.");
      console.log("   This indicates the video file has been modified since registration.");
    }

    console.log("\n" + "=".repeat(70) + "\n");

    return {
      valid: isValid,
      tampered: !isValid,
      videoId,
      currentHash,
      storedHash,
      timestamp: timestamp.toString()
    };

  } catch (err) {
    console.error("\n❌ Verification failed:", err.message);
    console.error("\nFull error:", err);
    process.exit(1);
  }
}

verifyVideo();
