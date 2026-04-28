import { useEffect, useState } from "react";
import { BrowserProvider, Contract, type Eip1193Provider } from "ethers";
import { ABI, CONTRACT_ADDRESS } from "./contract";

type Eip1193ProviderWithMM = Eip1193Provider & {
  isMetaMask?: boolean;
  providers?: Array<Eip1193Provider & { isMetaMask?: boolean }>;
};

type HistoryEntry = {
  docHash: string;
  owner: string;
  timestamp: number;
  timestampIso: string;
  ipfsCID: string;
  txHash?: string;
};

function getMetaMaskProvider(): Eip1193Provider | null {
  const injected = window.ethereum as Eip1193ProviderWithMM | undefined;
  if (!injected) return null;

  if (injected.providers?.length) {
    const metaMask = injected.providers.find((p) => p.isMetaMask);
    return metaMask || null;
  }

  if (injected.isMetaMask) return injected;
  return injected;
}

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const injectedProvider = getMetaMaskProvider();
      if (!injectedProvider) {
        setError("MetaMask not detected");
        return;
      }

      const provider = new BrowserProvider(injectedProvider);
      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);

      // Get all HashCommitted events from the beginning
      const filter = contract.filters.HashCommitted();
      const logs = await contract.queryFilter(filter);

      const historyData: HistoryEntry[] = logs.map((log) => {
        const args = log.args as any;
        return {
          docHash: args.docHash || "",
          owner: args.owner || "",
          timestamp: Number(args.timestamp || 0),
          timestampIso: new Date(Number(args.timestamp || 0) * 1000).toISOString(),
          ipfsCID: args.ipfsCID || "",
          txHash: log.transactionHash,
        };
      });

      // Sort by timestamp descending
      historyData.sort((a, b) => b.timestamp - a.timestamp);
      setEntries(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (CONTRACT_ADDRESS && !/^0x0{40}$/i.test(CONTRACT_ADDRESS)) {
      fetchHistory();
    }
  }, []);

  const downloadFromIPFS = (cid: string) => {
    if (!cid) {
      alert("No IPFS CID available for this file");
      return;
    }
    window.open(`https://${cid}.ipfs.w3s.link`, "_blank");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <section className="panel">
      <h2>Upload History</h2>
      <button type="button" onClick={fetchHistory} disabled={loading}>
        {loading ? "Loading..." : "Refresh"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {entries.length === 0 ? (
        <p>No uploads yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ccc" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Timestamp</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Owner</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Hash</th>
                <th style={{ textAlign: "center", padding: "8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.docHash} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px", fontSize: "0.9rem" }}>{entry.timestampIso}</td>
                  <td style={{ padding: "8px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                    {entry.owner.slice(0, 10)}...
                  </td>
                  <td style={{ padding: "8px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                    {entry.docHash.slice(0, 16)}...
                    <button
                      onClick={() => copyToClipboard(entry.docHash)}
                      style={{
                        marginLeft: "8px",
                        padding: "2px 6px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      Copy
                    </button>
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    {entry.ipfsCID ? (
                      <button
                        onClick={() => downloadFromIPFS(entry.ipfsCID)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          marginRight: "4px",
                        }}
                      >
                        Download
                      </button>
                    ) : (
                      <span style={{ color: "gray" }}>No file</span>
                    )}
                    {entry.txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ marginLeft: "8px", fontSize: "0.9rem" }}
                      >
                        View Tx
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
