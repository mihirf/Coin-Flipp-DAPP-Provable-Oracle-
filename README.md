# Coin-Flipp-DAPP-Provable-Oracle-
Coin Flipp is a decentralized application where the player can bet Ether by selecting a coin side (either heads or tails). If the player wins, they can claim double the amount of Ether placed as a bet. However, if they lose, their deposit remains in the contract.   This DAPP utilizes the Provable Oracle for achieving randomness. It has been tested on the Ropsten Test Network without any issues. 

# Testing
The truffle framework used for testing the functionalities of the DAPP. Before conducting unit tests, the commands "npm i -g truffle@nodeLTS" and "npm install truffle-assertions" were used. The following steps are to be performed after the installation is completed:

1) Set the directory to the project's folder
2) Type "truffle init" in the powershell window
3) Type "truffle compile" in powershell
4) Link the project to Ganache
5) Type "truffle migrate" in powershell
6) Type "truffle console" in powershell and then after "truffle(ganache)>" type "let instance = await ContractName.deployed()"
8) On the next line, type "instance" or Type "instance.nameOfTheFunction()"
