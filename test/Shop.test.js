const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "Shop";
const ATTACK_CONTRACT_NAME = "ShopAttack";
describe(CONTRACT_NAME, function () {
  async function deployLoadFixture() {
    const [owner] = await ethers.getSigners()
    const Shop = await ethers.getContractFactory(CONTRACT_NAME);
    const shop = await Shop.deploy();

    return { shop };
  }

  it("Challenge Solved", async function () {
    const {  shop } = await loadFixture(
      deployLoadFixture
    );
    
    // deploy attack contract
    const ShopAttack = await ethers.getContractFactory(ATTACK_CONTRACT_NAME)
    const shopAttack = await ShopAttack.deploy(shop.address)
    await shopAttack.deployed()
    
    // attack
    const tx = await shopAttack.attack()
    await tx.wait()

    // test
    const price = await shop.price()
    expect(price).to.equal(1)
  });
});
