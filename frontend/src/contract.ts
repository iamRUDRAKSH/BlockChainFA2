export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const ABI = [
  "function commitHash(bytes32 docHash, string calldata ipfsCID) external",
  "function verify(bytes32 docHash) external view returns (address owner, uint256 timestamp, string memory ipfsCID)",
  "event HashCommitted(bytes32 indexed docHash, address indexed owner, uint256 timestamp, string ipfsCID)",
];
