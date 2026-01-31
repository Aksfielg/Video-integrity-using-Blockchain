#!/usr/bin/env node

import { config } from "dotenv";
config({ path: './.env' });

import crypto from "crypto";
import fs from "fs";
import path from "path";
import supabase from "./supabaase.js";
import contract from "./blockchain.js";

const videoPath = process.argv[2] || "./video/test.mp4";

if (!fs.existsSync(videoPath)) {
  console.error(`❌ Error: Video file not found: ${videoPath}`);
  console.log("Usage: node test-video.js [path/to/video.mp4]");
  process.exit(1);
}

async function testVideo(filePath) {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🎬 VIDEO INTEGRITY TEST - Complete Workflow");
    console.log("=".repeat(70) + "\n");

    const fileName = path.basename(filePath);
    console.log(`📹 Testing video: ${fileName}\n`);

    // Step 1: Read and calculate hash
    console.log("Step 1: Calculating video hash...");
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`   File size: ${fileSize} MB`);
    
    const hash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");
    console.log(`   ✅ Hash: ${hash}\n`);

    // Step 2: Upload to Supabase
    console.log("Step 2: Uploading to Supabase...");
    const videoId = crypto.randomUUID();
    console.log(`   Video ID: ${videoId}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("videos")
      .upload(`${videoId}.mp4`, fileBuffer, {
        contentType: "video/mp4",
      });

    if (uploadError) {
      console.error(`   ❌ Upload error: ${uploadError.message}`);
      throw uploadError;
    }
    console.log(`   ✅ Uploaded successfully\n`);

    // Step 3: Store hash on blockchain
    console.log("Step 3: Storing hash on blockchain...");
    try {
      const tx = await contract.registerVideo(videoId, hash);
      console.log(`   Transaction hash: ${tx.hash}`);
      console.log("   ⏳ Waiting for confirmation...");
      await tx.wait();
      console.log(`   ✅ Hash stored on blockchain\n`);
    } catch (blockchainError) {
      console.error(`   ❌ Blockchain error: ${blockchainError.message}`);
      throw blockchainError;
    }

    // Step 4: Verify immediately
    console.log("Step 4: Verifying video integrity...");
    const { data: verifyData, error: verifyError } = await supabase.storage
      .from("videos")
      .download(`${videoId}.mp4`);

    if (verifyError || !verifyData) {
      throw new Error("Failed to download video for verification");
    }

    const verifyBuffer = Buffer.from(await verifyData.arrayBuffer());
    const verifyHash = crypto
      .createHash("sha256")
      .update(verifyBuffer)
      .digest("hex");

    const [storedHash, timestamp] = await contract.getVideo(videoId);
    const isValid = verifyHash === storedHash;

    console.log("\n" + "=".repeat(70));
    if (isValid) {
      console.log("✅ VERIFICATION SUCCESSFUL!");
      console.log("   ✓ Video is authentic");
      console.log("   ✓ Hash matches blockchain record");
    } else {
      console.log("⚠️  VERIFICATION FAILED!");
      console.log("   ✗ Hashes do not match");
    }
    console.log("=".repeat(70));
    console.log(`\n📋 Summary:`);
    console.log(`   Video ID: ${videoId}`);
    console.log(`   Hash: ${hash}`);
    console.log(`   Timestamp: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
    console.log(`\n💡 To verify later, run:`);
    console.log(`   npm run verify ${videoId}`);
    console.log(`   OR`);
    console.log(`   node verify-local.js "${filePath}" ${videoId}\n`);

  } catch (err) {
    console.error("\n❌ Error:", err.message);
    if (err.stack) {
      console.error("\nStack trace:", err.stack);
    }
    process.exit(1);
  }
}

testVideo(videoPath);
