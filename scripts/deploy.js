const hre = require("hardhat");
const CONTRACT_NAME = "Fallback";

async function main() {
  // const Fallback = await hre.ethers.getContractFactory(CONTRACT_NAME);
  // const fallback = await Fallback.deploy();
  // await fallback.deployed();
  // console.log(`${CONTRACT_NAME} is deployed to ${fallback.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
