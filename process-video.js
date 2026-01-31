#!/usr/bin/env node

/**
 * Step-by-Step Video Processing Script
 * 1. Calculate hash of video
 * 2. Upload to Supabase database
 * 3. Store hash on blockchain
 * 4. Verify video integrity (check if tampered)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import crypto from "crypto";
import fs from "fs";
import path from "path";
import supabase from "./supabaase.js";
import contract from "./blockchain.js";

// Get video path from command line
const videoPath = process.argv[2];

if (!videoPath) {
  console.error("❌ Error: Please provide a video file path");
  console.log("Usage: node process-video.js <path/to/video.mp4>");
  process.exit(1);
}

if (!fs.existsSync(videoPath)) {
  console.error(`❌ Error: Video file not found: ${videoPath}`);
  process.exit(1);
}

// Helper function to print step headers
function printStep(stepNum, title) {
  console.log("\n" + "=".repeat(70));
  console.log(`STEP ${stepNum}: ${title}`);
  console.log("=".repeat(70) + "\n");
}

// Helper function to print success
function printSuccess(message) {
  console.log("✅ " + message);
}

// Helper function to print error
function printError(message) {
  console.error("❌ " + message);
}

async function processVideo() {
  try {
    const fileName = path.basename(videoPath);
    const fileBuffer = fs.readFileSync(videoPath);
    const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);

    console.log("\n" + "🎬".repeat(35));
    console.log("   VIDEO INTEGRITY PROCESSING SYSTEM");
    console.log("🎬".repeat(35));
    console.log(`\n📹 Video: ${fileName}`);
    console.log(`📊 Size: ${fileSize} MB\n`);

    // ============================================
    // STEP 1: Calculate Hash
    // ============================================
    printStep(1, "CALCULATING VIDEO HASH");
    
    console.log("⏳ Computing SHA-256 hash...");
    const hash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");
    
    printSuccess(`Hash calculated successfully!`);
    console.log(`\n📝 SHA-256 Hash:`);
    console.log(`   ${hash}\n`);

    // ============================================
    // STEP 2: Upload to Supabase Database
    // ============================================
    printStep(2, "UPLOADING VIDEO TO SUPABASE DATABASE");
    
    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'videos');
    
    if (!bucketExists) {
      console.log("⚠️  Bucket 'videos' not found. Creating it...");
      const { error: createError } = await supabase.storage.createBucket('videos', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime']
      });
      
      if (createError && !createError.message.includes('already exists')) {
        printError(`Failed to create bucket: ${createError.message}`);
        throw createError;
      }
      printSuccess("Bucket 'videos' created!");
    }
    
    const videoId = crypto.randomUUID();
    console.log(`🆔 Generated Video ID: ${videoId}`);
    console.log("⏳ Uploading video to Supabase storage...");
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("videos")
      .upload(`${videoId}.mp4`, fileBuffer, {
        contentType: "video/mp4",
      });

    if (uploadError) {
      printError(`Failed to upload video: ${uploadError.message}`);
      throw uploadError;
    }

    printSuccess(`Video uploaded to Supabase successfully!`);
    console.log(`📦 Storage path: ${uploadData.path}`);

    // ============================================
    // STEP 3: Store Hash on Blockchain
    // ============================================
    printStep(3, "STORING HASH ON BLOCKCHAIN");
    
    console.log("⏳ Registering video hash on blockchain...");
    console.log("   This may take a few moments...\n");
    
    const tx = await contract.registerVideo(videoId, hash);
    console.log(`📝 Transaction submitted: ${tx.hash}`);
    console.log("⏳ Waiting for transaction confirmation...");
    
    const receipt = await tx.wait();
    printSuccess(`Hash stored on blockchain successfully!`);
    console.log(`🔗 Transaction hash: ${tx.hash}`);
    console.log(`📊 Block number: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

    // ============================================
    // STEP 4: Verify Video Integrity
    // ============================================
    printStep(4, "VERIFYING VIDEO INTEGRITY");
    
    console.log("⏳ Downloading video from Supabase...");
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from("videos")
      .download(`${videoId}.mp4`);

    if (downloadError || !downloadData) {
      printError(`Failed to download video: ${downloadError?.message || "Unknown error"}`);
      throw downloadError || new Error("Download failed");
    }

    console.log("⏳ Calculating current hash of downloaded video...");
    const buffer = Buffer.from(await downloadData.arrayBuffer());
    const currentHash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    console.log("⏳ Retrieving stored hash from blockchain...");
    const [storedHash, timestamp] = await contract.getVideo(videoId);

    const isValid = currentHash === storedHash;

    console.log("\n" + "-".repeat(70));
    console.log("📊 VERIFICATION RESULTS:");
    console.log("-".repeat(70));
    console.log(`   Current Hash:  ${currentHash}`);
    console.log(`   Stored Hash:   ${storedHash}`);
    console.log(`   Match:          ${isValid ? "✅ YES" : "❌ NO"}`);
    console.log(`   Timestamp:      ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
    console.log("-".repeat(70));

    if (isValid) {
      printSuccess("Video is AUTHENTIC and has NOT been tampered with!");
    } else {
      printError("WARNING: Video has been TAMPERED with!");
      console.log("\n⚠️  The current hash does not match the stored hash on the blockchain.");
      console.log("   This indicates the video file has been modified.");
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log("\n" + "=".repeat(70));
    console.log("📋 PROCESSING SUMMARY");
    console.log("=".repeat(70));
    console.log(`   Video ID:       ${videoId}`);
    console.log(`   Video File:     ${fileName}`);
    console.log(`   File Size:      ${fileSize} MB`);
    console.log(`   Hash:           ${hash}`);
    console.log(`   Blockchain TX:  ${tx.hash}`);
    console.log(`   Status:         ${isValid ? "✅ VERIFIED" : "⚠️  TAMPERED"}`);
    console.log("=".repeat(70) + "\n");

    return {
      success: true,
      videoId,
      hash,
      txHash: tx.hash,
      valid: isValid,
      tampered: !isValid
    };

  } catch (err) {
    printError(`Processing failed: ${err.message}`);
    console.error("\nFull error:", err);
    process.exit(1);
  }
}

// Run the process
processVideo();
