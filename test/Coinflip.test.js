const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const CONTRACT_NAME = "CoinFlip";
const ATTACK_CONTRACT_NAME = "Attack";
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();

    const CoinFlip = await ethers.getContractFactory(CONTRACT_NAME);
    const coinFlip = await CoinFlip.deploy();

    const AttackContract = await ethers.getContractFactory(
      ATTACK_CONTRACT_NAME
    );
    const attackContract = await AttackContract.deploy(coinFlip.address);

    return { coinFlip, attackContract, attacker };
  }

  it("Challenge Solved", async function () {
    let tx;
    let { coinFlip, attackContract, attacker } = await loadFixture(deployLoadFixture);
    attackContract = attackContract.connect(attacker);

    // guess 10 times correctly in a row

    for (let i = 0; i <= 9; i++) {
      tx = await attackContract.attack();
      await tx.wait();
    }

    // test

    tx = await coinFlip.consecutiveWins();
    expect(tx).to.equal(10);
  });
});
