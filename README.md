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
15. [Naught Coin](#15---naught-coin)
16. [Preservation](#16---preservation)
17. [Recovery](#17---recovery)
18. [MagicNumber](#18---magicnumber)
    
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

## 15 - Naught Coin
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

## 16 - Preservation

To pass this challenge, we need to claim ownership of the contract. After carefully reading the contract code, we notice using **unsafe delegatecall**.<br />
We can exploit the contract as following:
1. Update the delegatecall target(timeZone1Library) address to our own `PreservationAttack`'s address.
2. Re-call the `setFirstTime` of the `Preservation` contract, **and this time, it will delegatecall our own `PreservationAttack`**
3. Create the `setTime` function with the same signature and update the owner.

To update the delegatecall target and the owner states, we need to pay attention to the storage layout of both contracts.

`Preservation` contract:
```solidity
address public timeZone1Library;
address public timeZone2Library;
address public owner; 
uint storedTime;
```
`LibraryContract` contract:
```solidity
uint storedTime; 
```
The `Preservation` contract calls an external library in a **Delegatecall**:
```solidity
function setFirstTime(uint _timeStamp) public {
    timeZone1Library.delegatecall(abi.encodePacked(setTimeSignature, _timeStamp));
}
```
the `setTimeSignature` is given: ` bytes4(keccak256("setTime(uint256)"));`
So the `Preservation` contract delegatescall the `setTime` function in `Library contract`, the function code is:
```solidity
function setTime(uint _time) public {
   storedTime = _time;
}

```
So, after the `Preservation` contract `delegatecall` the LibraryContract, **the `setTime` function will be exectued in the context of the Preservation contract**. The `LibraryContract` updates the `storedTime` state which is declared first.(**slot0**) inside the contract. So the first state declared in **slot0** in `Preservation` contract will be updated, Hence, the **timeZone1Library**.
The `attack` function in our `PreservaionAttack` contract:
```solidity
function attack() external {
   preservation.setFirstTime(uint256(uint160(address(this))));
   preservation.setFirstTime(2);
}
```
> Note that we cast the address of the contract to uint because the setTime function requires a uint parameter

So, further delegatescall: `timeZone1Library.delegatecall(abi.encodePacked(setTimeSignature, _timeStamp));` will refer to our `PreservationAttack` contract.<br />
To update the owner, we simply need to create the same storage of `Preservation` in our `PreservationAttack` via declaring states **with the same name, and in the same order**. And then create the `setTime` function **with the same signature** that updates the owner state:
```solidity
contract PreservationAttack {
    address public timeZone1Library;
    address public timeZone2Library;
    address public owner; 
    uint storedTime;

    Preservation public preservation;

    constructor(Preservation _address) {
        preservation = Preservation(_address);
    }

    function attack() external {
        preservation.setFirstTime(uint256(uint160(address(this))));
        preservation.setFirstTime(2);
    }

    function setTime(uint _time) public {
        owner = tx.origin;
    }

}
```
To make a long story short, we only need to call the `attack` function in our `PreservationAttack`, and the ownership will be claimed.
[Attack Contract](./contracts/Preservation.sol) | [Test script](./test/Preservation.test.js)

## 17 - Recovery

To solve this challenge, we need to steal the 0.001 ETH stored inside the first initialized `SimpleToken` contract. We notice the presence of `destroy(address payable _to)` that calls the low level function `selfdestruct`
```solidity
function destroy(address payable _to) public {
   selfdestruct(_to);
}
```
We can call the `destroy` function and pass our address as an argument, and the ether stored inside the contract will be transferred to us. The issue is that the smart contract address is lost, so we need somehow to get it.

##### First approach: using Etherscan
To get the smart contract's address, we just need to use `Etherscan` as we already have the address of the `Factory` contract, and we can check the `internal transactions` and get **the first `SimpleToken` contract deployed**.<br>
After getting the contract's address, we can simply interact with the `destroy` function after initiating an instance of the contract, an example using ethers.js:
```js
await contract.destroy(0x622900E44841219EcE6CD973Beae9eB79E044a47)
```

##### Second approach: Calculate the lost address
**Contract addresses are deterministic** and are calculated by `keccak256(address, nonce)` where the *address* is the address of the creator(a smart contract, or EOA), and the *nonce* is the number of the contracts created by the *address* in case of smart contracts, or the number of transactions made by the *address* in case of EOA.<br />
According to the Ethereum Yellow Paper: 
> The address of the new account is defined as being the rightmost 160 bits of the Keccak hash of the RLP encoding of the structure containing only the sender and the account nonce.

`RLP` is the primary encoding method used to serialize objects in Etherem's execution layer, its purpose is to encode arbitrarily nested arrays of binary data.
`ethers.js` has a built in function to calculate the address of a contract:
```js
const nonce = 1 // nonce 1 refers to the first contract created by the Recovery contract
const lostAddress = ethers.utils.getContractAddress({
   from: Recovery.address,
   nonce,
});
```
Or, we can use solidity language to calculate the address from scratch:
```sol
address lostcontract = address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xd6), bytes1(0x94), address(<Recovery address>), bytes1(0x01))))));
```
`0xd6`, `0x94` refer to the RLP for 20 byte address. And `0x01` refers to the nonce 1
## 18 - MagicNumber

To solve this level, we need to provide the Ethernaut with a `Solver`, a contract that responds to `whatIsTheMeaningOfLife()` with the right number. **The smart contract must have at most 10 opcodes**
The right number is obviously `42`. A straightforward approach is to write a function that returns 42:
```solidity
function whatIsTheMeaningOfLife() external pure returns(uint) {
   return 42;
}
```
However, if we compile this smart contract, we will have diffinetly more than 10 opcodes. *It is time to get out of the comfort zone of solidity and build our smart contract using bytecodes*.
We need a contract that returns 42. Smart contracts run on the Ethereum Virtual Machine(EVM), the EVM understands smart contracts as bytecodes. Contract creation bytecode contains 2 different parts of code that we need to write:
- **Create bytecode**: only executed at deployment, it tells the EVM to run the constructor to init the contract and store the remaining runtime bytecode in memory
- **runtime bytecode**: this is what lives in the blockchain, users, and dapps interact with this bytecode. It is where we need to write the logic to return 42.

We know the EVM is a stack-based machine. It contains besides the stack, the **memory** which is used and cleared after each message call, and a **storage** which is like the memory but it persists between message calls. `Opcodes` are what control the EVM and tell what to execute. Each opcode has a corresponding bytecode. The list of available bytecodes is mentioned in the [**Ethereum Yellow Paper**](https://ethereum.github.io/yellowpaper/paper.pdf)
##### Let's start by writing the `runtime bytecode`
We need to return `42`, returning values is handled by the `RETURN` opcode, which takes two arguments:
- `p`: the position where the value is stored in memory
- `s`: the size of the value to be returned

This means we need first to store the value in memory before returning it. Here is the sequence of the bytescodes:
| bytecode | Opcode   | Meaning                                                         |
|----------|----------|-----------------------------------------------------------------|
| 602a     | PUSH1 2a | Push 2a(42 in decimals) to the stack                            |
| 6000     | PUSH 00  | Push 00 to the stack(this will be the memory location)          |
| 52       | MSTORE   | mstore(0, 2a): store the value 0x2a in the memory location 0x00 |

After storing the value in the memory, we can return it. The sequence of bytecodes:
| bytecode | Opcode   | Meaning                                                |
|----------|----------|--------------------------------------------------------|
| 6020     | PUSH1 2a | Push 0x20(32 in decimals) to the stack                 |
| 6000     | PUSH 00  | Push 00 to the stack(this will be the memory location) |
| f3       | RETURN   | return the 32 bytes stored in in memory position 0     |

**The sequence of bytescode is: `602a60005260206000f3`**

##### The `creation bytecode`

We need to replicate the `runtime code` to memory, before returning to EVM. The sequence of bytecodes:

| bytecode               | Opcode                      | Meaning                                                                                                |
|------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------|
| 69602a60005260206000f3 | PUSH10 602a60005260206000f3 | Push 10 bytes of code to the stack                                                                     |
| 6000                   | PUSH 00                     | Push 00 to the stack(this will be the memory location)                                                 |
| 52                     | MSTORE                      | mstore(0,0x602a60005260206000f3) // this will store the 10 bytescode  padded with 22 zeros on the left |
| 600a                   | PUSH1 0a                    | Push 0x0a(10 in decimals) to the stack                                                                 |
| 6016                   | PUSH1 16                    | Push 0x16(22 in decimals) to the stack                                                                 |
| f3                     | RETURN                      | Return 10bytes stored in memory position 22       

**The final sequence of bytescode is: `0x69602a60005260206000f3600052600a6016f3`**

Finally we need to deploy the smart contract bytescode using a simple transaction:
```js
web3.eth.sendTransaction({ from: account_address,data: '0x69602a60005260206000f3600052600a6016f3' })
```
and pass the contract's address to the `setSolver` function of the contract challenge:
```js
await contract.setSolver(contract_address)
```