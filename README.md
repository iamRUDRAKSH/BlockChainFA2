# Blockchain File Timestamping dApp

This project is a file timestamping application built with three parts:

- A React + Vite frontend for uploading files, hashing them, and sending the hash to Sepolia through MetaMask.
- A FastAPI backend for hashing files and generating downloadable PDF receipts.
- A Solidity smart contract called `Timestamper` that stores document hashes on-chain together with the owner and timestamp.

## What happens when a file is uploaded

1. The frontend sends the selected file to the backend `/hash` endpoint.
2. The backend calculates a SHA-256 hash of the file.
3. The frontend converts that hash to a `bytes32` value.
4. MetaMask asks the user to approve the transaction.
5. The app calls the `commitHash` function on the deployed `Timestamper` contract on Sepolia.
6. The contract stores the hash, sender address, timestamp, and optional IPFS CID.
7. The frontend shows the committed hash and transaction hash.
8. The user can later verify a hash and download a PDF receipt from the backend.

## Contract behavior

The `Timestamper` contract supports two main actions:

- `commitHash(bytes32 docHash, string ipfsCID)` stores a new document hash if it has not been committed before.
- `verify(bytes32 docHash)` returns the recorded owner, timestamp, and IPFS CID for a committed hash.

The contract prevents duplicate commits for the same hash by rejecting hashes that already exist.

## Prerequisites

- Node.js and npm
- Python 3.10+ with `pip`
- A MetaMask wallet connected to Sepolia
- Sepolia ETH for gas
- A deployed `Timestamper` contract address

## Environment files

Create or update these files before running the app:

- Root `.env` for Hardhat deployment:
	- `SEPOLIA_RPC_URL=your_rpc_url`
	- `PRIVATE_KEY=0xyour_private_key`
- `frontend/.env` for the UI:
	- `VITE_CONTRACT_ADDRESS=0xdeployed_contract_address`
	- `VITE_BACKEND_URL=http://localhost:8000`

## Commands

### Install dependencies

From the project root:

```bash
npm install
```

From the frontend folder:

```bash
cd frontend
npm install
```

### Compile the smart contract

```bash
npm run compile
```

### Deploy `Timestamper` to Sepolia

```bash
npm run deploy:sepolia
```

This prints the deployed contract address. Put that address in `frontend/.env` as `VITE_CONTRACT_ADDRESS`.

### Start the backend

```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Start the frontend

From the `frontend` folder:

```bash
npm run dev -- --host 0.0.0.0 --port 5178
```

## Typical workflow

1. Deploy the contract to Sepolia.
2. Copy the deployed contract address into `frontend/.env`.
3. Start the backend.
4. Start the frontend.
5. Open the app in a browser with MetaMask.
6. Upload a file.
7. Approve the blockchain transaction in MetaMask.
8. Verify the hash later or download a receipt.

## Notes

- The app hashes files in the backend before committing the hash on-chain.
- The transaction is only valid if `VITE_CONTRACT_ADDRESS` points to the deployed contract, not to a wallet address.
- If MetaMask is not detected, use Chrome, Brave, or Edge with the extension enabled.