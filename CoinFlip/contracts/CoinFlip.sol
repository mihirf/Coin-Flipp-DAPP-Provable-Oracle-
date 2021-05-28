pragma solidity 0.5.12;
import "./Ownable.sol";
import "./Destroyable.sol";
import "./SafeMath.sol";
import "./provableAPI.sol";


/**
 * @title CoinFlip
 * @notice Allows the player to bet Ether
 * @notice by choosing the coin's side.
 */
contract CoinFlip is Ownable, Destroyable, usingProvable{

    uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;

    mapping(address => Player) _Players;
    mapping(bytes32 => address) public queryIds;

    event betPlaced(string message);
    event LogNewProvableQuery(string description);
    event generatedRandomNumber (string message, uint256 num);
    event result(string message);
    event success(uint256 num);

    struct Player{
        uint256 balanceDeposited;
        uint256 balanceWon;
        uint256 wins;
        uint256 losses;
        uint256 randomInt;
        string coinSide;
    }

    constructor() public {
        provable_setProof(proofType_Ledger);
    }

    modifier validity{
        require(msg.value >= 0.1 ether, "You need to place a bet greater than or equal to 0.1 ether.");
        require(SafeMath.mul(msg.value, 2) < address(this).balance, "Betting amount is greater than contract balance.");
        require(SafeMath.add(_Players[msg.sender].balanceWon, (SafeMath.mul(2, msg.value))) < address(this).balance, "Withdraw balance exceeds contract's balance.");
        require(_Players[msg.sender].balanceDeposited == 0, "Cannot place a new bet until the result from the previous bet has been finalized.");
        require(msg.sender != owner, "Contract owner cannot place bets.");
        _;
    }

    /**
     * @dev Deposits the betting amount and
     * @dev places a bet.
     * @param "Heads" or "Tails"
     */
    function betAmount(string memory option) public payable validity{
        _Players[msg.sender].balanceDeposited = msg.value;
        _Players[msg.sender].coinSide = option;
        update();
        emit betPlaced("Bet has been placed");
    }

    /**
     * @dev Checks if the player lost or won.
     * @param Player's address
     */
    function headsOrTails(address person) private {
        uint256 value =  _Players[person].randomInt;
        if(value == 0 && keccak256(abi.encodePacked( _Players[person].coinSide)) == keccak256(abi.encodePacked("Heads"))){
            _Players[person].balanceWon = SafeMath.add(_Players[person].balanceWon, SafeMath.mul(2, _Players[person].balanceDeposited));
            _Players[person].balanceDeposited = 0;
            _Players[person].wins++;
            emit result("Player had won.");
        }
        else if (value == 1 && keccak256(abi.encodePacked( _Players[person].coinSide)) == keccak256(abi.encodePacked("Tails"))){
            _Players[person].balanceWon = SafeMath.add(_Players[person].balanceWon, SafeMath.mul(2, _Players[person].balanceDeposited));
            _Players[person].balanceDeposited = 0;
            _Players[person].wins++;
            emit result("Player had won.");
        }
        else{
            _Players[address(this)].balanceDeposited = _Players[person].balanceDeposited;
            _Players[person].balanceDeposited = 0;
            _Players[person].losses++;
            emit result("Player had lost.");
        }
        emit success(value);
    }

    /**
     * @dev This function that is called by the Provable oracle.
     * @param Query's unique id
     * @param Random string
     * @param Proof whether the result is from the Provable oracle
     */
    function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public{
        require(msg.sender == provable_cbAddress());
        if (provable_randomDS_proofVerify__returnCode(_queryId, _result, _proof) == 0){
            _Players[queryIds[_queryId]].randomInt = uint256(keccak256(abi.encodePacked(_result))) % 2;
            headsOrTails(queryIds[_queryId]);
            emit generatedRandomNumber("Random number was successfully retrieved from the Orcale.", _Players[queryIds[_queryId]].randomInt);
            delete queryIds[_queryId];
        }
        else{
            emit result("Callback function failed proof verification.");
            uint256 playerBal = _Players[queryIds[_queryId]].balanceDeposited;
            _Players[queryIds[_queryId]].balanceDeposited = 0;
            _Players[queryIds[_queryId]].balanceWon = playerBal;
        }
    }

    /**
     * @dev Sends a query to the Provable oracle.
     */
    function update() payable public{
        uint256 QUERY_EXECUTION_DELAY = 0;
        uint256 GAS_FOR_CALLBACK = 200000;
        bytes32 query = provable_newRandomDSQuery(QUERY_EXECUTION_DELAY, NUM_RANDOM_BYTES_REQUESTED, GAS_FOR_CALLBACK);
        queryIds[query] = msg.sender;
        emit LogNewProvableQuery ("Provable query was sent, standing by for the answer...");
    }

    /**
     * @dev Transfers the player's winnings to
     * @dev their wallet.
     */
    function claimRewards() public payable{
        require (_Players[msg.sender].balanceWon >= 0.1 ether, "You have no rewards to claim.");
        uint256 amount = _Players[msg.sender].balanceWon;
        _Players[msg.sender].balanceWon = 0;
        _Players[msg.sender].balanceDeposited =0;
        msg.sender.transfer(amount);
    }

    /**
     * @dev Transfers all the deposited
     * @dev ether to the owner's wallet.
     */
    function WithdrawAll() public onlyOwner payable{
        msg.sender.transfer(address(this).balance);
    }

    /**
     * @dev Getter for the contract's balance.
     * @return Contract's balance.
     */
    function checkContractBalance() public view returns(uint256){
        return address(this).balance;
    }

    /**
     * @dev Setter for the contract's balance.
     */
    function depositIntoContract() public payable onlyOwner{
         _Players[address(this)].balanceDeposited = msg.value;
    }

    /**
     * @dev Getter for the player's rewards won
     * @dev (amount of Ether).
     * @return Total amount of winnings
     */
    function getAccountBalance() public view returns(uint256){
        return _Players[msg.sender].balanceWon;
    }

    /**
     * @dev Getter for the player's information.
     * @return Deposited balance
     * @return Total amount of winnings
     * @return Number of wins
     * @return Number of losses
     * @return Random number retrieved from the Provable oracle
     * @return Selected coinside ("Heads or "Tails")
     */
    function getPlayer() public view returns(uint256, uint256, uint256, uint256, uint256, string memory){
        return (_Players[msg.sender].balanceDeposited, _Players[msg.sender].balanceWon, _Players[msg.sender].wins, _Players[msg.sender].losses, _Players[msg.sender].randomInt, _Players[msg.sender].coinSide);
    }
}
