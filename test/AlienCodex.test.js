const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "AlienCodex";
const ATTACK_CONTRACT_NAME = "AlienCodexAttack";
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();
    const AlienCodex = await ethers.getContractFactory(CONTRACT_NAME);
    const alienCodex = await AlienCodex.deploy();

    return { owner, attacker, alienCodex };
  }

  it("Challenge Solved", async function () {
    const { attacker, alienCodex } = await loadFixture(
      deployLoadFixture
    );

    const AttackContract = await ethers.getContractFactory(ATTACK_CONTRACT_NAME)
    const attack = await AttackContract.connect(attacker).deploy(alienCodex.address)
    await attack.deployed()

    // test
    const alienCodexOwner = await alienCodex.owner()
    expect(alienCodexOwner).to.equal(attacker.address)
  });
});
