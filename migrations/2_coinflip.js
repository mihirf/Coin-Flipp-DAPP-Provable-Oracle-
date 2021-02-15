const CoinFlip = artifacts.require("CoinFlip");
const Ownable = artifacts.require("Ownable");
const Destroyable = artifacts.require("Destroyable");
const Provable = artifacts.require("usingProvable");
const SafeMath = artifacts.require("SafeMath");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(CoinFlip).then(function(instance){
     instance.depositIntoContract({value: web3.utils.toWei("1", "ether"), from: accounts[0]});
  });
  deployer.deploy(Ownable);
  deployer.deploy(Provable);
  deployer.deploy(Destroyable);
  deployer.deploy(SafeMath);
};
