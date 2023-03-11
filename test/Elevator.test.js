const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const CONTRACT_NAME = "Elevator";
const CONTRACT_ATTACK_NAME = "ElevatorAttack";

describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner] = await ethers.getSigners();

    const Elevator = await ethers.getContractFactory(CONTRACT_NAME);
    const elevator = await Elevator.deploy();

    return { elevator, owner };
  }

  it("Challenge Solved", async () => {
    const { elevator, owner } = await loadFixture(deployLoadFixture);

    // deploy the attack contract
    const ElevatorAttack = await ethers.getContractFactory(
      CONTRACT_ATTACK_NAME
    );
    const elevatorAttack = await ElevatorAttack.deploy(elevator.address);
    await elevatorAttack.deployed();

    // let's get to the top of the building!
    const tx = await elevatorAttack.attack(60);
    await tx.wait();

    //test
    const top = await elevator.top();
    expect(top).to.equal(true);
  });
});
