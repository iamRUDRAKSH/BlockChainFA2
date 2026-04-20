require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

process.env.HARDHAT_DISABLE_TELEMETRY_PROMPT = "true";

const privateKey = process.env.PRIVATE_KEY?.trim() || "";
const hasValidPrivateKey = /^0x[a-fA-F0-9]{64}$/.test(privateKey);
const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL?.trim();

const networks = {};
if (sepoliaRpcUrl) {
  networks.sepolia = {
    url: sepoliaRpcUrl,
    accounts: hasValidPrivateKey ? [privateKey] : [],
  };
}

module.exports = {
  solidity: "0.8.20",
  networks,
};
