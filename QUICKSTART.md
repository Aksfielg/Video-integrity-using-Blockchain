# Quick Start Guide - Video Integrity Verification

## 🚀 Quick Commands

### 1. Calculate Hash for Any Video
```bash
npm run hash video/test.mp4
```
or
```bash
node calculate-hash.js video/test.mp4
```

This will generate and display the SHA-256 hash of your video file.

### 2. Test Complete Workflow (Upload + Verify)
```bash
npm run test video/test.mp4
```
or
```bash
node test-video.js video/test.mp4
```

This will:
- Calculate hash
- Upload to Supabase
- Store hash on blockchain
- Verify immediately

### 3. Verify Video from Database (by Video ID)
```bash
npm run verify <videoId>
```
or
```bash
node verify.js <videoId>
```

### 4. Verify Local Video File Against Blockchain
```bash
npm run verify-local video/test.mp4 <videoId>
```
or
```bash
node verify-local.js video/test.mp4 <videoId>
```

## 📝 Example Workflow

### Step 1: Start the Server
```bash
npm start
```

### Step 2: Upload a Video
```bash
curl -X POST http://localhost:5000/upload -F "video=@video/test.mp4"
```

You'll get a response like:
```json
{
  "success": true,
  "videoId": "abc123-def456-ghi789",
  "hash": "a1b2c3d4e5f6...",
  "txHash": "0x1234..."
}
```

### Step 3: Verify the Video
```bash
npm run verify abc123-def456-ghi789
```

### Step 4: Test Tampering Detection

1. Modify the video file (add text, crop, etc.)
2. Run verification again:
```bash
npm run verify-local video/test.mp4 abc123-def456-ghi789
```

You should see: ⚠️ **Video has been TAMPERED!**

## 🔍 What Each Script Does

| Script | Purpose |
|--------|---------|
| `calculate-hash.js` | Calculate SHA-256 hash for any video file |
| `test-video.js` | Complete workflow: upload + verify |
| `verify.js` | Verify video from database using video ID |
| `verify-local.js` | Verify local video file against blockchain |
| `server.js` | Start API server for upload/verify endpoints |

## ⚠️ Troubleshooting

### Error: "RPC_URL is not set"
- Make sure your `.env` file exists and has all required variables

### Error: "Video not found in database"
- The video hasn't been uploaded yet, or the video ID is incorrect

### Error: "Video hash not found on blockchain"
- The video hash wasn't stored on blockchain, or the video ID is incorrect

### Error: "Failed to load VideoHashStoreABI.json"
- Make sure the ABI file exists in the project root

## 💡 Tips

1. **Always save the videoId** after uploading - you'll need it for verification
2. **Test with small videos first** to avoid long upload times
3. **Check your .env file** if you get connection errors
4. **Use `calculate-hash.js`** to quickly check a video's hash without uploading
