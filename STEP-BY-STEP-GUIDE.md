# Step-by-Step Video Processing Guide

This guide walks you through the complete process of:
1. Converting a video to hash
2. Uploading to database (Supabase)
3. Storing hash on blockchain
4. Verifying if video is tampered

## Prerequisites

- Node.js installed
- Environment variables configured in `.env` file
- Supabase bucket created (run `npm run setup-bucket` if needed)

## Quick Start

### Option 1: Complete Process (All Steps at Once)

Process a video through all steps automatically:

```bash
node process-video.js <path/to/video.mp4>
```

**Example:**
```bash
node process-video.js video/test.mp4
```

This will:
- ✅ Calculate SHA-256 hash
- ✅ Upload video to Supabase
- ✅ Store hash on blockchain
- ✅ Verify video integrity

### Option 2: Step-by-Step Manual Process

#### Step 1: Calculate Hash Only

```bash
node calculate-hash.js <path/to/video.mp4>
```

**Example:**
```bash
node calculate-hash.js video/test.mp4
```

#### Step 2: Upload via API (Server Required)

Start the server:
```bash
npm start
```

Then upload using curl or Postman:
```bash
curl -X POST http://localhost:5000/upload \
  -F "video=@video/test.mp4"
```

#### Step 3: Verify Video Integrity

```bash
node verify-video.js <videoId>
```

**Example:**
```bash
node verify-video.js 3293420c-f205-48d1-88be-cefd31fb9019
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Process Video** | `npm run process <video>` | Complete process: hash → upload → blockchain → verify |
| **Calculate Hash** | `npm run hash <video>` | Calculate SHA-256 hash only |
| **Verify Video** | `npm run verify-video <videoId>` | Verify video integrity by video ID |
| **Setup Bucket** | `npm run setup-bucket` | Create Supabase storage bucket |
| **Start Server** | `npm start` | Start Express API server |

## Example Workflow

### 1. Setup (First Time Only)

```bash
# Create Supabase bucket
npm run setup-bucket
```

### 2. Process a Video

```bash
# Complete process
node process-video.js video/test.mp4
```

**Output:**
```
🎬 VIDEO INTEGRITY PROCESSING SYSTEM
📹 Video: test.mp4
📊 Size: 1.50 MB

======================================================================
STEP 1: CALCULATING VIDEO HASH
======================================================================
✅ Hash calculated successfully!
📝 SHA-256 Hash: 71944d7430c461f0cd6e7fd10cee7eb72786352a3678fc7bc0ae3d410f72aece

======================================================================
STEP 2: UPLOADING VIDEO TO SUPABASE DATABASE
======================================================================
✅ Video uploaded to Supabase successfully!
🆔 Video ID: 3293420c-f205-48d1-88be-cefd31fb9019

======================================================================
STEP 3: STORING HASH ON BLOCKCHAIN
======================================================================
✅ Hash stored on blockchain successfully!
🔗 Transaction hash: 0xe50f465ae47bd99500dc262b313591eb944014a848e2922ed60542960325ba2f

======================================================================
STEP 4: VERIFYING VIDEO INTEGRITY
======================================================================
✅ Video is AUTHENTIC and has NOT been tampered with!
```

### 3. Verify Later

```bash
# Verify by video ID
node verify-video.js 3293420c-f205-48d1-88be-cefd31fb9019
```

## Understanding the Process

### Step 1: Hash Calculation
- Uses SHA-256 algorithm
- Creates a unique fingerprint of the video file
- Any change to the video will produce a different hash

### Step 2: Database Upload
- Uploads video file to Supabase storage
- Generates unique Video ID (UUID)
- Stores video for later retrieval

### Step 3: Blockchain Storage
- Stores the hash on Polygon blockchain
- Creates immutable record with timestamp
- Transaction hash provides proof of registration

### Step 4: Verification
- Downloads video from database
- Calculates current hash
- Compares with blockchain-stored hash
- Detects any tampering

## Troubleshooting

### Bucket Not Found
```bash
npm run setup-bucket
```

### Environment Variables Not Loading
- Ensure `.env` file exists in project root
- Check that all required variables are set:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `RPC_URL`
  - `PRIVATE_KEY`
  - `CONTRACT_ADDRESS`

### Blockchain Transaction Fails
- Check RPC URL is correct
- Ensure wallet has sufficient funds for gas
- Verify contract address is correct

## Security Notes

- ✅ Hash is stored on immutable blockchain
- ✅ Video file stored in private Supabase bucket
- ✅ Any tampering will be detected during verification
- ⚠️ Keep your `.env` file secure and never commit it to git
