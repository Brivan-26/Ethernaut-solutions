const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "Denial";
const CONTRACT_ATTACK_NAME = "DenialAttack";
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner] = await ethers.getSigners();

    const Denial = await ethers.getContractFactory(CONTRACT_NAME);
    const denial = await Denial.deploy();

    return { owner, denial };
  }

  it("Challenge Solved", async function () {
    const { owner, denial } = await loadFixture(deployLoadFixture);
    const AttackContract = await ethers.getContractFactory(
      CONTRACT_ATTACK_NAME
    );

    // fund the contract with some ether
    await owner.sendTransaction({
        to: denial.address,
        value: ethers.utils.parseEther("1")
    });

    // deploy the attack contract
    const attackContract = await AttackContract.deploy(denial.address);
    await attackContract.deployed()

    // test denying the owner to receive ether
    const tx = denial.withdraw({gasLimit: 1000000})
    await expect(tx).to.be.reverted;
    
  });
});
