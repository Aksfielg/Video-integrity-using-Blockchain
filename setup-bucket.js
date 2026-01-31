#!/usr/bin/env node

/**
 * Setup Supabase Storage Bucket
 * Creates the 'videos' bucket if it doesn't exist
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import supabase from "./supabaase.js";

async function setupBucket() {
  try {
    console.log("🔧 Setting up Supabase storage bucket...\n");

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("❌ Error listing buckets:", listError.message);
      throw listError;
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'videos');

    if (bucketExists) {
      console.log("✅ Bucket 'videos' already exists!");
      return;
    }

    // Create the bucket
    console.log("⏳ Creating 'videos' bucket...");
    const { data, error } = await supabase.storage.createBucket('videos', {
      public: false, // Private bucket
      fileSizeLimit: 52428800, // 50MB limit
      allowedMimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime']
    });

    if (error) {
      console.error("❌ Error creating bucket:", error.message);
      throw error;
    }

    console.log("✅ Bucket 'videos' created successfully!");
    console.log("\n📋 Bucket configuration:");
    console.log("   - Name: videos");
    console.log("   - Public: false (private)");
    console.log("   - File size limit: 50MB");
    console.log("   - Allowed types: video/mp4, video/mpeg, video/quicktime\n");

  } catch (err) {
    console.error("❌ Setup failed:", err.message);
    process.exit(1);
  }
}

setupBucket();
