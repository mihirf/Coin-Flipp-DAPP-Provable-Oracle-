pragma solidity 0.5.12;

/**
 * @title Ownable
 * @notice Verifies whether the
 * @notice caller is the contract's owner.
 */
contract Ownable{
    address public owner;

    modifier onlyOwner(){
        require(msg.sender == owner);
        _; //Continue execution
    }

    constructor() public{
        owner = msg.sender;
    }
}
