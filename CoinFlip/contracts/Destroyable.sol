pragma solidity 0.5.12;
import "./Ownable.sol";

/**
 * @title Destroyable
 * @notice Allows the contract's owner
 * @notice to destroy the it.
 */
contract Destroyable is Ownable {

  function destroy() public onlyOwner {
    address payable receiver = msg.sender;
    selfdestruct(receiver);
  }
}
