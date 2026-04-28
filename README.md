*** Begin Replacement Content
# Blockchain File Timestamping dApp

This project is a file timestamping application built with three parts:

- A React + Vite frontend for uploading files to IPFS, hashing them, and sending the hash to Sepolia through MetaMask.
- A FastAPI backend for uploading files to IPFS via web3.storage, hashing files, and generating downloadable PDF receipts.
- A Solidity smart contract called `Timestamper` that stores document hashes on-chain together with the owner, timestamp, and IPFS CID.

## Workflow (with IPFS)

1. User selects a file in the frontend.
2. The frontend sends the file to the backend `/upload-to-ipfs` endpoint.
3. The backend uploads the file to IPFS (via web3.storage) and gets back a CID.
4. The backend also calculates a SHA-256 hash of the file.
5. Both hash and CID are returned to the frontend.
6. The frontend shows a "Upload to IPFS & Commit" button.
7. MetaMask asks the user to approve the transaction.
8. The app calls `commitHash(hash, cid)` on the `Timestamper` contract on Sepolia.
9. The contract stores hash, owner, timestamp, and IPFS CID on-chain.
10. User can immediately see the file in the **History** tab.
11. User can download the file back from IPFS anytime.
12. User can verify the hash and download a PDF receipt with full proof.

## Contract Behavior

The `Timestamper` contract supports two main actions:

- `commitHash(bytes32 docHash, string ipfsCID)` stores a new document hash if it has not been committed before.
- `verify(bytes32 docHash)` returns the recorded owner, timestamp, and IPFS CID for a committed hash.

The contract prevents duplicate commits for the same hash by rejecting hashes that already exist.

## Prerequisites

- Node.js and npm
- Python 3.10+ with `pip`
- A MetaMask wallet connected to Sepolia testnet
- Sepolia ETH for gas fees (get free from Sepolia faucet: https://sepoliafaucet.com)
- A deployed `Timestamper` contract on Sepolia
- A free web3.storage account (for IPFS storage)

## Environment Setup

### 1. Get a web3.storage Token (Free)

1. Go to https://web3.storage
2. Sign up with your email (free account with 20GB storage)
3. Click "Create API Token" in your account dashboard
4. Copy the token

### 2. Set up .env Files

**Root `.env` (for backend and contract deployment):**
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=0xyour_private_key_from_metamask
WEB3_STORAGE_TOKEN=your_web3_storage_api_token_here
ETHERSCAN_API_KEY=your_etherscan_api_key_optional
```

**`frontend/.env` (for the UI):**
```
VITE_CONTRACT_ADDRESS=0xdeployed_contract_address_on_sepolia
VITE_BACKEND_URL=http://localhost:8000
VITE_WEB3_STORAGE_TOKEN=your_web3_storage_api_token_here
```

## Installation

### Backend Dependencies

From the project root:
```bash
pip install -r backend/requirements.txt
```

### Frontend Dependencies

```bash
npm install
cd frontend
npm install
```

## Running the Application

### Step 1: Compile the Smart Contract

```bash
npm run compile
```

### Step 2: Deploy to Sepolia

```bash
npm run deploy:sepolia
```

This prints the deployed contract address. **Copy this address and paste it into `frontend/.env` as `VITE_CONTRACT_ADDRESS`.**

### Step 3: Start the Backend

```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Start the Frontend

From the `frontend` folder:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

### Step 5: Open in Browser

1. Open http://localhost:5173 in Chrome, Brave, or Edge (with MetaMask installed)
2. Connect MetaMask to Sepolia testnet
3. You're ready to upload files!

## Using the App

### Upload & Commit Tab
1. Select a file
2. Click "Upload to IPFS & Commit"
3. Approve the transaction in MetaMask
4. Wait for confirmation (~30 seconds)
5. See the IPFS CID and transaction hash

### Verify Tab
1. Paste a SHA-256 hash
2. Click "Verify"
3. See owner, timestamp, and IPFS CID
4. Click "Download Receipt" for PDF proof

### History Tab
1. Click "Refresh" to fetch all uploads
2. See all files uploaded with timestamps
3. Click "Download" to get files back from IPFS
4. Click "View Tx" to see blockchain proof on Etherscan

## Important Notes

- **IPFS Storage**: Files are uploaded to web3.storage (free 20GB). If CID is empty in History, the upload failed—check backend logs.
- **Blockchain Proof**: The History tab queries the blockchain for all `HashCommitted` events, so it works for files uploaded from any address.
- **IPFS Gateway**: Downloads use the Dweb.link gateway. If slow, try `ipfs.io` gateway manually.
- **Contract Address**: Make sure `VITE_CONTRACT_ADDRESS` is set to your deployed contract, not a wallet address.
- **MetaMask**: Requires Chrome, Brave, or Edge with MetaMask extension enabled.
- **Gas Fees**: Each upload costs ~$0.50-$2 in Sepolia ETH (testnet, fake money for testing).

## Troubleshooting

**"MetaMask not detected"**: Open the app in Chrome/Brave/Edge with MetaMask installed and enabled for the site.

**"Contract address not set"**: Copy the deployed contract address into `frontend/.env` as `VITE_CONTRACT_ADDRESS` and restart frontend.

**"WEB3_STORAGE_TOKEN not set"**: Add your token to root `.env` and restart the backend.

**IPFS upload fails**: Check backend logs for web3.storage API errors. Verify your token is correct.

**Slow IPFS downloads**: Try manual IPFS download using `https://ipfs.io/ipfs/{CID}` instead of dweb.link.

## Future Enhancements

- User authentication and accounts
- Bulk uploads
- File preview in History
- Production deployment to mainnet
- Advanced search and filtering

## License

ISC

*** End Replacement Content