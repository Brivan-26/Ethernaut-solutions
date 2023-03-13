const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "Privacy";

describe(CONTRACT_NAME, () => {
  async function deployLoadFixture() {
    const data = [
      ethers.utils.formatBytes32String("this is"),
      ethers.utils.formatBytes32String("top secret"),
      ethers.utils.formatBytes32String("is it?"),
    ];
    const Privacy = await ethers.getContractFactory(CONTRACT_NAME);
    const privacy = await Privacy.deploy(data);

    return { privacy };
  }

  it("Challenge solved", async () => {
    const { privacy } = await loadFixture(deployLoadFixture);

    // calculate the storage indexes
    /* 
        locked => slot 0
        ID => slot 1
        flattening => slot 2
        denomination => slot 2
        awkwardness => slot 2
        data[0] => slot 3
        data[1] => slot 4
        data [2] => slot 5
    */
    const dataSlot = 5;
    const storageValue = await ethers.provider.getStorageAt(
      privacy.address,
      dataSlot
    );
    const key = storageValue.slice(0, 34); // 32 chars + 0x
    const tx = await privacy.unlock(key);
    await tx.wait();
    //test
    const locked = await privacy.locked();
    expect(locked).to.be.false;
  });
});
