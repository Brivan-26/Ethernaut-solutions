# Ethernaut CTF Solutions

[Ethernaut CTF](https://ethernaut.openzeppelin.com/) solutions ⛳️

### Challenges

0. [Hello Ethernaut](https://ethernaut.openzeppelin.com/level/0xBA97454449c10a0F04297022646E7750b8954EE8)
1. [Fallback](#01---fallback)
2. [Fallout](#02---fallout)
3. [Coinflip](#03---coin-flip)

## 01 - Fallback

To solve this challenge we need to claim the contract's ownership and withdraw all its balance.

In order to take the `ownership`, we have **two possible ways**:

1. We send some ethers to the contract, as updating the `owner` state is set on the `receive` fallback

   ```solidity
   receive() external payable {
       require(msg.value > 0 && contributions[msg.sender] > 0);
       owner = msg.sender;
   }
   ```

   Before doing that, we need first to satisfy the condition `contributions[msg.sender] > 0`, to do so, we can just call the function `contribute()` and send at least `1 wei`.

2. We call the `contribute()` function and send an amount of ether that is **greater** than the contribution of the owner, as updating the owner is set if that condition is satisfied:

   ```solidity
    if(contributions[msg.sender] > contributions[owner]) {
       owner = msg.sender;
    }
   ```

After that, we can call the `withdraw` to take all the contract's balance.

[Test script](./test/Fallback.test.js)

## 02 - Fallout

To pass this challenge, we need to take the contract's ownership. <br/>

In old Solidity versions, to create a constructor function, we could declare a function **with the same name of the Contract**. In this challenge, the constructor's function name has a _typo_ error, instead of `Fallout`, they set `Fal1out`. <br/>To take the ownership, we can just call the function `Fal1out()`

```
NOTE: after trying to run the challenge test, you may get an error saying that File @openzeppelin/contracts/math/SafeMath.sol, imported from contracts/Fallout.sol, not found.
, it is maybe because the Math library is deleted from Openzeppelin in newer versions, you can just downgrade the openzeppelin package in package.json to solve this issue
```

[Test script](./test/Fallout.test.js)

## 03 - Coin Flip

To win this challenge, we must guess the correct outcome of the `flip(bool __guess)` function 10 times in a row. <br />

We notice using **unsecured source of randomness** in the `flip(bool _guess)` function. The function uses the `block.number` as a source to generate a random outcome:
```solidity
uint256 blockValue = uint256(blockhash(block.number - 1));
...
lastHash = blockValue;
uint256 coinFlip = blockValue / FACTOR;
bool side = coinFlip == 1 ? true : false;
if (side == _guess) {
   consecutiveWins++;
   return true;
}
```
We must call the `flip(bool _guess)` function 10 times and pass the correct guess value each time. In other words, we need to **pre-calculate** the `blockValue` before and conclude the correct guess each time because `block.value` is the only variable state in the calculus of the `side` in the flip function.<br />
to achieve that, we need to create another contract that contains a function that calculates the guess **the same way the `flip(bool _guess)` does** and call the `flip(bool _guess)` after.
```solidity
function attack() public{
   bool guess = _guess();
   victim.flip(guess);
}

function _guess() private view returns (bool) {
   uint256 blockValue = uint256(blockhash(block.number - 1));
   uint256 coinFlip = blockValue / Factor;
   bool side = coinFlip == 1 ? true : false;

   return side;
}
```
It is guaranteed that the guess we pass will be the same after calculating a new one inside the `flip(bool _guess)`, because **both transactions will be mined in the same block**, so the `block.value`*__the only variable state in the calculus of the `side` state* will be the same.

The whole attack is around the **Unsecure source of randomness** security concept, [read more about it](https://github.com/Brivan-26/smart-contract-security/tree/master/Insecure-Randomness#smart-contract-security--insecure-randomness)

[Attack contract](./contracts/CoinFlip.sol) | [Test script](./test/Coinflip.test.js)
