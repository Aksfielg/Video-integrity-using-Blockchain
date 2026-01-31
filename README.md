# Video Integrity Verification System

A blockchain-based video integrity verification system that stores videos in a central database (Supabase) and their hashes on the blockchain to detect tampering.

## Features

- ✅ Upload videos to Supabase storage
- ✅ Store video hashes on blockchain (immutable)
- ✅ Verify video integrity by comparing current hash with blockchain hash
- ✅ Detect tampering automatically
- ✅ CLI tool for easy verification

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
RPC_URL=your_blockchain_rpc_url
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_contract_address
PORT=5000
```

3. Make sure you have:
   - A Supabase project with a storage bucket named "videos"
   - A deployed smart contract with `registerVideo` and `getVideo` functions
   - The contract ABI in `VideoHashStoreABI.json`

## Usage

### Start the Server

```bash
npm start
```

The server will run on `http://localhost:5000`

### Upload a Video

```bash
curl -X POST http://localhost:5000/upload \
  -F "video=@path/to/your/video.mp4"
```

Response:
```json
{
  "success": true,
  "videoId": "uuid-here",
  "hash": "sha256-hash",
  "txHash": "blockchain-transaction-hash"
}
```

### Verify a Video (API)

```bash
curl http://localhost:5000/verify/{videoId}
```

Response (if valid):
```json
{
  "valid": true,
  "tampered": false,
  "message": "✅ Video is authentic and has not been tampered with",
  "storedHash": "hash-from-blockchain",
  "currentHash": "calculated-hash",
  "timestamp": "1234567890",
  "videoId": "uuid-here"
}
```

Response (if tampered):
```json
{
  "valid": false,
  "tampered": true,
  "message": "⚠️ WARNING: Video has been tampered with!",
  "storedHash": "original-hash",
  "currentHash": "different-hash",
  "timestamp": "1234567890",
  "videoId": "uuid-here"
}
```

### Verify a Video (CLI)

```bash
npm run verify <videoId>
```

Example:
```bash
npm run verify abc123-def456-ghi789
```

The CLI will show:
- ✅ If video is authentic
- ⚠️ If video has been tampered with
- ❌ If video is not found

### Calculate Hash for Local Video

```bash
npm run hash <path/to/video.mp4>
```

Example:
```bash
npm run hash video/test.mp4
```

This calculates and displays the SHA-256 hash without uploading.

### Verify Local Video File Against Blockchain

```bash
npm run verify-local <path/to/video.mp4> <videoId>
```

Example:
```bash
npm run verify-local video/test.mp4 abc123-def456-ghi789
```

This verifies a local video file against the hash stored on blockchain.

### Complete Test Workflow

```bash
npm run test [path/to/video.mp4]
```

Example:
```bash
npm run test video/test.mp4
```

This runs the complete workflow:
1. Calculates hash
2. Uploads to Supabase
3. Stores hash on blockchain
4. Verifies immediately

## How It Works

1. **Upload Process:**
   - Video is uploaded via API
   - SHA-256 hash is calculated
   - Video is stored in Supabase
   - Hash is stored on blockchain

2. **Verification Process:**
   - Video is downloaded from Supabase
   - Current hash is calculated
   - Stored hash is retrieved from blockchain
   - Hashes are compared
   - If they match → Video is authentic
   - If they don't match → Video has been tampered

## API Endpoints

- `POST /upload` - Upload a video and store its hash on blockchain
- `GET /verify/:videoId` - Verify if a video has been tampered with

## Available Scripts

- `npm start` - Start the API server
- `npm run verify <videoId>` - Verify video from database
- `npm run hash <file>` - Calculate hash for local video file
- `npm run verify-local <file> <videoId>` - Verify local file against blockchain
- `npm run test [file]` - Complete workflow test (upload + verify)

## Security

- Videos are stored in Supabase (central database)
- Hashes are stored on blockchain (immutable, tamper-proof)
- Any modification to the video will result in a different hash
- The system can detect even the smallest changes to the video file
