const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "Force";
const ATTACK_CONTRACT_NAME = "AttackForce";
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner] = await ethers.getSigners();

    const Force = await ethers.getContractFactory(CONTRACT_NAME);
    const force = await Force.deploy();

    const AttackContract = await ethers.getContractFactory(
      ATTACK_CONTRACT_NAME
    );
    const attackContract = await AttackContract.deploy(force.address, {value: 3000});

    return { force, attackContract };
  }

  it("Challenge Solved", async function () {
    const { force, attackContract } = await loadFixture(deployLoadFixture);

    // forcefully sending Ether
    const tx = await attackContract.attack();
    await tx.wait();

    // test
    const balance = await ethers.provider.getBalance(force.address);
    expect(balance).to.be.greaterThan(0);
  });
});
