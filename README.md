# Ethernaut CTF Solutions

[Ethernaut CTF](https://ethernaut.openzeppelin.com/) solutions ⛳️

### Challenges

0. [Hello Ethernaut](https://ethernaut.openzeppelin.com/level/0xBA97454449c10a0F04297022646E7750b8954EE8)
1. [Fallback](#01---fallback)
2. [Fallout](#02---fallout)
3. [Coinflip](#03---coin-flip)
4. [Telephone](#04---telephone)
5. [Token](#05---token)
6. [Delegation](#06---delegation)
7. [Force](#07---force)
8. [Vault](#08---vault)
9. [King](#09---king)
10. [Re-entrancy](#10---re-entrancy)
11. [Elevator](#11---elevator)
12. [Privacy](#12---privacy)
13. [Naught Coin](#13---naught-coin)
    
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

It is guaranteed that the guess we pass will be the same after calculating a new one inside the `flip(bool _guess)`, because **both transactions will be mined in the same block**, so the `block.value`_\_\_the only variable state in the calculus of the `side` state_ will be the same.

The whole attack is around the **Unsecure source of randomness** security concept, [read more about it](https://github.com/Brivan-26/smart-contract-security/tree/master/Insecure-Randomness#smart-contract-security--insecure-randomness)

[Attack contract](./contracts/CoinFlip.sol) | [Test script](./test/Coinflip.test.js)

## 04 - Telephone

To beat this challenge, we need to take ownership. <br />

The solution is straight forward if we know the **difference between `msg.sender` and `tx.origin`**. If you don't already, [read more about them](https://github.com/Brivan-26/smart-contract-security/tree/master/Phishing-with-tx.origin#smart-contract-security---phishing-with-txorigin)

```solidity
function changeOwner(address _owner) public {
    if (tx.origin != msg.sender) {
      owner = _owner;
    }
  }
```

We just need to create another contract that contains a function that calls the `changeOwner(address _owner)` function.

```solidity
function attack() external onlyOwner {
   telephone.changeOwner(owner);
}
```

By invoking the `attack()` function, which calls the `changeOwner()` function in `Telephone` contract, the condition `tx.origin != msg.sender` matches, and as a result the `owner` state will be updated.

[Attack contract](./contracts/Telephone.sol) | [Test script](./test/Telephone.test.js)

## 05 - Token

To pass this challenge, we need to hack the contract by taking a large number of tokens.<br/> The contract is written under version `^0.6.0` of Solidity. After inspecting the `transfer(address _to, uint _value)` function, we can notice a possibility of having an **underflow**, and the contract didn't protect itself from that.

```solidity
function transfer(address _to, uint _value) public returns (bool) {
   require(balances[msg.sender] - _value >= 0);
   balances[msg.sender] -= _value;
   balances[_to] += _value;
   return true;
}
```
We started with **20** tokens, to increase our balance, we can simply transfer **21** tokens to another address which leads to having an **underflow**, so our balance will be set to **2^32 - 1**.<br />
If you are not familiar with underflow/overflow, [read more here](https://github.com/Brivan-26/smart-contract-security/tree/master/Arithmetic-Overflow-Underflow#smart-contract-security---arithmetic-overflow--underflow)

[Test script](./test/Token.test.js)

## 06 - Delegation

To pass this challenge, we need to take ownership of the `Delegation` contract. <br />

The only interesting thing in the contract is the `fallback()` function:
```solidity
fallback() external {
   (bool result,) = address(delegate).delegatecall(msg.data);
   if (result) {
      this;
   }
}
```
We notice that it makes a **delegatecall** to the **Delegate** contract. After inspecting the `Delegate` contract's code, the only interesting thing is the `pwn()` function:
```solidity
function pwn() public {
   owner = msg.sender;
}
```
It simply updates the `owner` state of the `Delegate` contract. We can exploit the `Delegation` contract easily as it is using **unsafe delegatecall**. The steps to take the ownership are:
1. We first encode the signature of `pwn()` function
2. We make a transaction to the `Delegation` contract in order to invoke the `fallback()` method and sending along the encoded signature as `msg.data`
   1. The `fallback()` method will delegatecall the `Delegate` contract passing the signature of `pwn()`, in other words, it is going to call the `pwn()` function of the `Delegate` contract
3. The `pwn()` function inside `Delegate` contract will be executed **in the context of the `Delegation` contract**, so the owner's state update `owner = msg.sender` will be in the context of the `Delegation` contract.

After the transaction is mined, the ownership will be taken.
   
This challenge is straightforward for the ones who know the functionality of `delegatecall`

[Test script](./test/Delegation.test.js)

## 07 - Force

We have a Force contract that has 0 balance, To pass this challenge we need to increase its balance.

For a contract to be able to receive ethers, it must have either a `payable function`, or `payable receive() function`. The given contract doesn't have any. However, it's possible to **forcefully send ether** by creating an other contract that has some ethers and defines a function that causes to its destruct using `sefldestruct`.<br/> `selfdestruct` **does not trigger a Smart Contract’s fallback function**, it removes the contract from the blockchain and **sends the remaining balance to a payable address that is passed as parametere**.<br/>

```solidity
function attack() external {
   selfdestruct(payable(force));
}
```
[Attack Contract](./contracts/Force.sol) | [Test script](./test/Force.test.js)

## 08 - Vault

To pass this challenge we need to unlock the Vault.
```solidity
function unlock(bytes32 _password) public {
   if (password == _password) {
      locked = false;
   }
}
```
The `_password` we pass must match the private password declared
```solidity
bytes32 private password;
```
However, it is possible to read the value of `password` even if it is declared as private if we know the `EVM Storage Layout`. 
> **NOTE**: a variable declared as private means that other contracts can not access it, but it can be read from outside the Blockchain

If you don't know the attack of **Accessing Private Data**, [read more here](https://github.com/Brivan-26/smart-contract-security/tree/master/Accessing-Private-Data#smart-contract-security---accessing-private-data).
To access the value of `password`, we can follow the following reflection:
- The `locked` variable will be stored in the `slot 0`, so **31-bytes** are still available in `slot 0`
- The `password`'s variable size is **32 bytes**, so it can not fit in the available space in *slot 0*, so it will be inserted in `slot 1`

- After we know that the value of `password` is stored in `slot 1`, we can make a simple query to read it, example of that using **ethers.js**: 
   ```javascript
      const storageValue = await ethers.provider.getStorageAt(volt.address, 1)
   ```
After we get the value of the password, we can simply call the `unlock(bytes32 _password)` and the vault will be unlocked.
[Test script](./test/Vault.test.js)

## 09 - King

For this challenge, we need to be the king, once and for all.
After we take the king, someone else can take the king if either:
- he sends an amount of ether greater than our prize
- he is the owner of the contract
```solidity
receive() external payable {
   require(msg.value >= prize || msg.sender == owner);
   payable(king).transfer(msg.value);
   king = msg.sender;
   prize = msg.value;
}
```
After the condition `require(msg.value >= prize || msg.sender == owner)` is verified and **before the new king is set**,we will receive our prize via the `transfer` low-level function
```solidity
payable(king).transfer(msg.value);
```
To prevent someone else to take the king, we can perform a **DOS**(Denial of Service) into the contract, by creating a contract that reverts when it receives some ether. So when `transfer` is executed, the tx will be reverted, hence the king will not be set anymore.

[Attack contract](./contracts/King.sol) | [Test script](./test/King.test.js)

## 10 - Re-entrancy

To solve this challenge, we need to steal all the ether stored in the Smart Contract.<br/>
After inspecting the Smart contracts' code, we notice that it is vulnerable to the **Reentrancy attack**.
```solidity
function withdraw(uint _amount) public {
   if(balances[msg.sender] >= _amount) {
      (bool result,) = msg.sender.call{value:_amount}("");
      if(result) {
        _amount;
      }
      balances[msg.sender] -= _amount;
   }
  }
```
The balance's state is updated *after* an external call.
```solidity
(bool result,) = msg.sender.call{value:_amount}("");
...
balances[msg.sender] -= _amount;
``` 
We can create an attacking contract that performs the **Reentrancy attack**. If you don't know the Reentrancy attack, [read more here](https://github.com/Brivan-26/smart-contract-security/tree/master/Reentrancy#smart-contract-security---reentrancy-attack)

[Attack Contract](./contracts/Re-entrancy.sol) | [Test script](./test/Re-entrancy.test.js)

## 11 - Elevator

We must get to the elevator's top to beat this challenge.<br />
We notice that the contract is using `typecasting`__initiating a contract which  **supposedly** implements the `isLastFloor` function defined in the `Building` interface.
```solidity
function goTo(uint _floor) public {
   Building building = Building(msg.sender);

   if (!building.isLastFloor(_floor)) {
      floor = _floor;
      top = building.isLastFloor(floor);
   }
}
```
We need to satisfy two things:
- `building.isLastFloor(_floor)` returns **true**, to pass the if check.
- The same `building.isLastFloor(floor)` returns **false** this time, to set the `top` value to true and beat the challenge.

So, we can simply create a new contract that implements the `isLastFloot(uint)` and toggles its value to satisfy both conditions.

> I don't see any security or vulnerability issue at this level, instead a simple **wrong** logic implemented in the contract

[Attack Contract](./contracts/Elevator.sol) | [Test script](./test/Elevator.test.js)

## 12 - Privacy

We need to unlock the contract to beat this challenge. <br />

To unlock the smart contract(change the value of `locked` variable to `true`), we need to call the function `unlock(bytes16 _key)` and pass along the correct key.<br />
It may seem hard to know the **correct key value** as it is declared private, but for someone who knows how smart contract states are stored in the EVM storage, the challenge will be easy to solve.
```solidity
bool public locked = true;
uint256 public ID = block.timestamp;
uint8 private flattening = 10;
uint8 private denomination = 255;
uint16 private awkwardness = uint16(block.timestamp);
bytes32[3] private data;
```
After analyzing the size of the contract's states and their declaration order, we conclude that:
- `locked` variable is stored in `slot 0`
- `ID` variable is stored in `slot 1`
- `flattening` variable is stored in `slot 2`
- `denomination` variable is stored in `slot 2`
- `awkwardness` variable is stored in `slot 2`
- `data` array elements are stored in `slot 3`, `slot 4`, `slot 5`
  
The `unlock` function needs the third element of the `data` array which is stored in `slot 5`, **in bytes16 format**.
```solidity
function unlock(bytes16 _key) public {
   require(_key == bytes16(data[2]));
   locked = false;
}
```
We can query `slot 5` to get the value of `data[2]`:
```javascript
const storageValue = await ethers.provider.getStorageAt(contract.address,5);
```
And then, transfer it to `bytes16` format:
```javascript
const key = storageValue.slice(0, 34); // 32 chars + 0x
```
We got our key, we just need to call the `unlock` function and the challenge is solved.

[Test script](./test/Privacy.test.js)

## 13 - Naught Coin
> Due to compatibility errors that occurred because the challenge contract and ERC20 contracts use different breakpoint solidity versions, I downgraded the challenge Contract to 0.6.0. This downgrade doesn't affect the solution, it is only to passe the compilation error.

There are no tricks or backdoors to pass this challenge, we only need to understand the ERC20 available methods.<br>
To solve this challenge, we need to transfer all our tokens(1000000). Apparently, we can not use the `transfer` function as we would need to wait **10 years** because it applies the `lockTokens` modifier. 

```solidity
function transfer(address _to, uint256 _value) override public lockTokens returns(bool) {
    super.transfer(_to, _value);
}

modifier lockTokens() {
   if (msg.sender == player) {
      require(block.timestamp > timeLock);
      _;
   } else {
     _;
   }
} 
```
However, we can use the `approve` method to allow another account to spend all our tokens on our behalf.
```javascript
await naughtCoin.approve(account1.address, ethers.BigNumber.from('1000000').mul(ethers.BigNumber.from('10').pow('18')));
```
Then we need to connect to the `approved account` and call the function `transferFrom`
```javascript
tx = await naughtCoin.connect(account1).transferFrom(
   owner.address,
   account1.address,
   ethers.BigNumber.from('1000000').mul(ethers.BigNumber.from('10').pow('18'))
);
```
For more details concerning the `approve` and `transferFrom` functions, [read the ERC20 openzeppelin implementation](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-approve-address-uint256-)

[Test script](./test/NaughtCoin.test.js)