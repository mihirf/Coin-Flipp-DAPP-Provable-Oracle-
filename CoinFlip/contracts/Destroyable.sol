pragma solidity 0.5.12;
import "./Ownable.sol";

contract Destroyable is Ownable {

  function destroy() public onlyOwner {
    address payable receiver = msg.sender;
    selfdestruct(receiver);
  }
}
