import { useMemo, useState } from "react";
import { BrowserProvider, Contract, type Eip1193Provider, zeroPadValue, toBeArray } from "ethers";
import axios from "axios";
import { ABI, CONTRACT_ADDRESS } from "./contract";
import History from "./History";

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

type InjectedProvider = Eip1193Provider & {
  isMetaMask?: boolean;
  providers?: Array<Eip1193Provider & { isMetaMask?: boolean }>;
};

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

function getMetaMaskProvider(): Eip1193Provider | null {
  const injected = window.ethereum as InjectedProvider | undefined;
  if (!injected) {
    return null;
  }

  if (injected.providers?.length) {
    const metaMask = injected.providers.find((p) => p.isMetaMask);
    return metaMask || null;
  }

  if (injected.isMetaMask) {
    return injected;
  }

  return injected;
}

function getFriendlyErrorMessage(error: unknown, fallback: string): string {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    normalizedMessage.includes("hash already committed") ||
    normalizedMessage.includes("already exists on blockchain") ||
    normalizedMessage.includes("already committed")
  ) {
    return "This document already exists on the blockchain.";
  }

  return rawMessage || fallback;
}

function formatDuplicateDocumentMessage(docHashHex: string): string {
  return `This document already exists on the blockchain. File hash: ${docHashHex}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"commit" | "verify" | "history">("commit");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("Ready.");
  const [txHash, setTxHash] = useState("");
  const [lastCommittedHash, setLastCommittedHash] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [ipfsCID, setIpfsCID] = useState("");

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
    let docHashHex = "";
    let cid = "";

    try {
      setStatus("Uploading to IPFS...");
      setUploadingToIPFS(true);
      const formData = new FormData();
      formData.append("file", file);
      const { data: ipfsData } = await axios.post(`${API}/upload-to-ipfs`, formData);
      docHashHex = normalizeHash(ipfsData.hex);
      cid = ipfsData.cid || "";
      setIpfsCID(cid);

      setStatus("Connecting wallet...");
      const injectedProvider = getMetaMaskProvider();
      if (!injectedProvider) {
        throw new Error(
          "MetaMask was not detected. Open this app in Chrome/Brave/Edge with MetaMask installed and enabled for this site.",
        );
      }
      const provider = new BrowserProvider(injectedProvider);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      setStatus("Committing to blockchain...");
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
      const bytes32Hash = zeroPadValue(toBeArray(docHashHex), 32);
      const tx = await contract.commitHash(bytes32Hash, cid);
      await tx.wait();

      setTxHash(tx.hash);
      setLastCommittedHash(docHashHex);
      setVerifyHash(docHashHex);
      setStatus(`Committed successfully: ${tx.hash}`);
    } catch (error) {
      const duplicateMessage =
        error instanceof Error && error.message.toLowerCase().includes("hash already committed")
          ? formatDuplicateDocumentMessage(docHashHex)
          : "";
      const message = duplicateMessage || getFriendlyErrorMessage(error, "Commit failed");
      setStatus(`Error: ${message}`);
    } finally {
        setUploadingToIPFS(false);
    }
  };

  const handleVerify = async () => {
    try {
      const normalized = normalizeHash(verifyHash);
      const injectedProvider = getMetaMaskProvider();
      if (!injectedProvider) {
        throw new Error(
          "MetaMask was not detected. Open this app in Chrome/Brave/Edge with MetaMask installed and enabled for this site.",
        );
      }
      const provider = new BrowserProvider(injectedProvider);
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
      const message = getFriendlyErrorMessage(error, "Verify failed");
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
        <p className="subtitle">Upload files to IPFS, commit on Sepolia, verify and download receipts.</p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", borderBottom: "1px solid #ccc", paddingBottom: "8px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("commit")}
            style={{
              padding: "8px 16px",
              background: activeTab === "commit" ? "#007bff" : "#ccc",
              color: activeTab === "commit" ? "white" : "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: activeTab === "commit" ? "bold" : "normal",
            }}
          >
            Upload & Commit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("verify")}
            style={{
              padding: "8px 16px",
              background: activeTab === "verify" ? "#007bff" : "#ccc",
              color: activeTab === "verify" ? "white" : "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: activeTab === "verify" ? "bold" : "normal",
            }}
          >
            Verify
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            style={{
              padding: "8px 16px",
              background: activeTab === "history" ? "#007bff" : "#ccc",
              color: activeTab === "history" ? "white" : "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: activeTab === "history" ? "bold" : "normal",
            }}
          >
            History
          </button>
        </div>

        {activeTab === "commit" && (
          <section className="panel">
            <h2>Upload & Commit a Document</h2>
            <label htmlFor="document-file">Select file</label>
            <input
              id="document-file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploadingToIPFS}
            />
            <button type="button" onClick={handleCommit} disabled={uploadingToIPFS}>
              {uploadingToIPFS ? "Uploading..." : "Upload to IPFS & Commit"}
            </button>
            {lastCommittedHash && <p>Last hash: {lastCommittedHash}</p>}
            {ipfsCID && (
              <p>
                IPFS CID: <code style={{ fontSize: "0.85rem" }}>{ipfsCID}</code>
              </p>
            )}
            {txHash && (
              <p>
                Tx: <a href={etherscanTxUrl} target="_blank" rel="noreferrer">{txHash}</a>
              </p>
            )}
          </section>
        )}

        {activeTab === "verify" && (
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
        )}

        {activeTab === "history" && <History />}

        <p className="status">{status}</p>
      </main>
    </div>
  );
}
