const hre = require("hardhat");

async function main() {
  const Timestamper = await hre.ethers.getContractFactory("Timestamper");
  const contract = await Timestamper.deploy();
  await contract.waitForDeployment();
  console.log("Deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
