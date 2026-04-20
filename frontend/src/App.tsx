import { useMemo, useState } from "react";
import { BrowserProvider, Contract, type Eip1193Provider, zeroPadValue, toBeArray } from "ethers";
import axios from "axios";
import { ABI, CONTRACT_ADDRESS } from "./contract";

const DEFAULT_API = (() => {
  const url = new URL(window.location.origin);
  url.port = import.meta.env.VITE_BACKEND_PORT || "8000";
  return url.toString().replace(/\/$/, "");
})();

const API = (import.meta.env.VITE_BACKEND_URL || DEFAULT_API).replace(/\/$/, "");

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

type VerifyResult = {
  owner: string;
  timestampIso: string;
  timestampUnix: number;
  ipfsCID: string;
};

function normalizeHash(hash: string): string {
  const clean = hash.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(clean)) {
    throw new Error("Hash must be 64 hex characters (SHA-256)");
  }
  return `0x${clean}`;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("Ready.");
  const [txHash, setTxHash] = useState("");
  const [lastCommittedHash, setLastCommittedHash] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  const etherscanTxUrl = useMemo(
    () => (txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : ""),
    [txHash],
  );

  const handleCommit = async () => {
    if (!file) {
      setStatus("Select a file first.");
      return;
    }
    if (/^0x0{40}$/i.test(CONTRACT_ADDRESS)) {
      setStatus("Set CONTRACT_ADDRESS in src/contract.ts first.");
      return;
    }

    try {
      setStatus("Hashing document...");
      const formData = new FormData();
      formData.append("file", file);
      const { data: hashData } = await axios.post(`${API}/hash`, formData);
      const docHashHex: string = normalizeHash(hashData.hex);

      setStatus("Connecting wallet...");
      if (!window.ethereum) {
        throw new Error("MetaMask not detected");
      }
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      setStatus("Committing to blockchain...");
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
      const bytes32Hash = zeroPadValue(toBeArray(docHashHex), 32);
      const tx = await contract.commitHash(bytes32Hash, "");
      await tx.wait();

      setTxHash(tx.hash);
      setLastCommittedHash(docHashHex);
      setVerifyHash(docHashHex);
      setStatus(`Committed successfully: ${tx.hash}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Commit failed";
      setStatus(`Error: ${message}`);
    }
  };

  const handleVerify = async () => {
    try {
      const normalized = normalizeHash(verifyHash);
      if (!window.ethereum) {
        throw new Error("MetaMask not detected");
      }
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
      const bytes32Hash = zeroPadValue(toBeArray(normalized), 32);
      const result = await contract.verify(bytes32Hash);

      setVerifyResult({
        owner: result[0],
        timestampIso: new Date(Number(result[1]) * 1000).toISOString(),
        timestampUnix: Number(result[1]),
        ipfsCID: result[2],
      });
      setStatus("Verification succeeded.");
    } catch (error) {
      setVerifyResult(null);
      const message = error instanceof Error ? error.message : "Verify failed";
      setStatus(`Error: ${message}`);
    }
  };

  const downloadReceipt = () => {
    if (!verifyResult) {
      setStatus("Verify a hash before downloading receipt.");
      return;
    }
    const params = new URLSearchParams({
      doc_hash: normalizeHash(verifyHash),
      owner: verifyResult.owner,
      tx_hash: txHash || "N/A",
      timestamp: String(verifyResult.timestampUnix),
      ipfs_cid: verifyResult.ipfsCID,
    });
    window.open(`${API}/receipt?${params.toString()}`, "_blank");
  };

  return (
    <div className="page">
      <div className="backdrop" />
      <main className="card">
        <h1>Academic IP Timestamper</h1>
        <p className="subtitle">Hash to commit on Sepolia, then verify and download receipt.</p>

        <section className="panel">
          <h2>Commit a Document</h2>
          <label htmlFor="document-file">Select file</label>
          <input
            id="document-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button type="button" onClick={handleCommit}>
            Hash + Commit
          </button>
          {lastCommittedHash && <p>Last hash: {lastCommittedHash}</p>}
          {txHash && (
            <p>
              Tx: <a href={etherscanTxUrl} target="_blank" rel="noreferrer">{txHash}</a>
            </p>
          )}
        </section>

        <section className="panel">
          <h2>Verify a Hash</h2>
          <label htmlFor="verify-hash">Document hash</label>
          <input
            id="verify-hash"
            placeholder="Paste SHA-256 hash"
            value={verifyHash}
            onChange={(e) => setVerifyHash(e.target.value)}
          />
          <div className="row">
            <button type="button" onClick={handleVerify}>
              Verify
            </button>
            <button type="button" onClick={downloadReceipt}>
              Download Receipt
            </button>
          </div>

          {verifyResult && (
            <pre>
{JSON.stringify(verifyResult, null, 2)}
            </pre>
          )}
        </section>

        <p className="status">{status}</p>
      </main>
    </div>
  );
}
