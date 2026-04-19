export const CONTRACT_ADDRESS = "0x008d31f27a48eBedEf1E7C0569c9994059412B72";

export const ABI = [
  "function commitHash(bytes32 docHash, string calldata ipfsCID) external",
  "function verify(bytes32 docHash) external view returns (address owner, uint256 timestamp, string memory ipfsCID)",
  "event HashCommitted(bytes32 indexed docHash, address indexed owner, uint256 timestamp, string ipfsCID)",
];
