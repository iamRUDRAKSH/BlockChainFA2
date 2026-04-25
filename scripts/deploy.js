const hre = require("hardhat");

async function main() {
  const rpcUrl = (process.env.SEPOLIA_RPC_URL || "").trim();
  const privateKey = (process.env.PRIVATE_KEY || "").trim();

  if (!rpcUrl) {
    throw new Error("SEPOLIA_RPC_URL is missing in root .env");
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error(
      "PRIVATE_KEY in root .env is invalid. It must be a 0x-prefixed 64-hex private key, not a wallet address.",
    );
  }

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer || typeof deployer.sendTransaction !== "function") {
    throw new Error("No deployer signer found. Check PRIVATE_KEY and network config in hardhat.config.js");
  }

  console.log("Deploying with account:", deployer.address);
  const Timestamper = await hre.ethers.getContractFactory("Timestamper");
  const contract = await Timestamper.deploy();
  await contract.waitForDeployment();
  console.log("Deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
