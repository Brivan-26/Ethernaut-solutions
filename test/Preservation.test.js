const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "Preservation";
const CONTRACT_ATTACK = "PreservationAttack";

describe(CONTRACT_NAME, () => {
  async function deployLoadFixture() {
    const Library = await ethers.getContractFactory("LibraryContract");
    const library1 = await Library.deploy();
    const library2 = await Library.deploy();

    const [owner, account1] = await ethers.getSigners();
    const Preservation = await ethers.getContractFactory(CONTRACT_NAME);
    const preservation = await Preservation.deploy(
      library1.address,
      library2.address
    );

    return { preservation, owner, account1 };
  }

  it("Challenge solved", async () => {
    const { preservation, owner } = await loadFixture(deployLoadFixture);
    const PreservatoinAttack = await ethers.getContractFactory(CONTRACT_ATTACK);
    const preservationAttack = await PreservatoinAttack.deploy(
      preservation.address
    );

    // Claim ownership
    const tx = await preservationAttack.attack();
    await tx.wait();

    // test
    const PreservationOwner = await preservation.owner()
    expect(PreservationOwner).to.equal(owner.address)
  });
});
