#!/usr/bin/env node

import { config } from "dotenv";
import fs from "fs";

console.log("\n🔍 Checking Video Integrity System Setup...\n");

// Check .env file
console.log("1. Checking .env file...");
config({ path: './.env' });

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'RPC_URL',
  'PRIVATE_KEY',
  'CONTRACT_ADDRESS'
];

let envErrors = [];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    envErrors.push(`   ❌ ${varName} is missing`);
  } else {
    console.log(`   ✅ ${varName} is set`);
  }
});

if (envErrors.length > 0) {
  console.log("\n⚠️  Missing environment variables:");
  envErrors.forEach(err => console.log(err));
  console.log("\nPlease check your .env file.\n");
  process.exit(1);
}

// Check ABI file
console.log("\n2. Checking VideoHashStoreABI.json...");
try {
  const abi = JSON.parse(fs.readFileSync("./VideoHashStoreABI.json", "utf8"));
  if (abi.length > 0) {
    console.log("   ✅ ABI file loaded successfully");
  } else {
    console.log("   ⚠️  ABI file is empty");
  }
} catch (error) {
  console.log(`   ❌ Error loading ABI: ${error.message}`);
  process.exit(1);
}

// Check dependencies
console.log("\n3. Checking dependencies...");
try {
  const ethersModule = await import("ethers");
  console.log("   ✅ ethers installed");
} catch (error) {
  console.log("   ❌ ethers not found - run: npm install");
  process.exit(1);
}

try {
  const supabaseModule = await import("@supabase/supabase-js");
  console.log("   ✅ @supabase/supabase-js installed");
} catch (error) {
  console.log("   ❌ @supabase/supabase-js not found - run: npm install");
  process.exit(1);
}

// Test blockchain connection
console.log("\n4. Testing blockchain connection...");
try {
  const { ethers } = await import("ethers");
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const network = await provider.getNetwork();
  console.log(`   ✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);
} catch (error) {
  console.log(`   ❌ Blockchain connection failed: ${error.message}`);
  console.log("   Check your RPC_URL in .env file");
}

// Test Supabase connection
console.log("\n5. Testing Supabase connection...");
try {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  // Try to list buckets (this will fail if credentials are wrong)
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.log(`   ⚠️  Supabase connection issue: ${error.message}`);
  } else {
    console.log("   ✅ Supabase connection successful");
  }
} catch (error) {
  console.log(`   ❌ Supabase connection failed: ${error.message}`);
  console.log("   Check your SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file");
}

console.log("\n" + "=".repeat(60));
console.log("✅ Setup check complete!");
console.log("=".repeat(60) + "\n");
