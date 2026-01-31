import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { ethers } from "ethers";
import fs from "fs";

// Validate environment variables
if (!process.env.RPC_URL) {
  throw new Error("RPC_URL is not set in .env file");
}
if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is not set in .env file");
}
if (!process.env.CONTRACT_ADDRESS) {
  throw new Error("CONTRACT_ADDRESS is not set in .env file");
}

// Load ABI
let abi;
try {
  abi = JSON.parse(fs.readFileSync("./VideoHashStoreABI.json", "utf8"));
} catch (error) {
  throw new Error("Failed to load VideoHashStoreABI.json: " + error.message);
}

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Initialize contract
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  wallet
);

export default contract;
