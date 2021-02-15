const CoinFlip = artifacts.require("CoinFlip");
const truffleAssert = require("truffle-assertions");

contract("CoinFlip", async function(accounts){
let instance;
before(async function(){
  instance = await CoinFlip.deployed();
});

it("shouldn't allow betting amounts lower than 0.1 ether", async function(){
  await truffleAssert.fails(instance.betAmount("Heads", {from: accounts[1], value: web3.utils.toWei("0.01","ether")}));
})

it("shouldn't allow betting amounts greater than contract balance", async function(){
  await truffleAssert.fails(instance.betAmount("Heads", {from: accounts[1], value: web3.utils.toWei("6","ether")}));
})

it("shouldn't allow betting amounts equal to the contract balance", async function(){
  await truffleAssert.fails(instance.betAmount("Heads", {from: accounts[1], value: web3.utils.toWei("5","ether")}));
})

it("shouldn't allow contract owner to place bets", async function(){
  await truffleAssert.fails(instance.betAmount("Heads", {from: accounts[0], value: web3.utils.toWei("1","ether")}));
})

it("shouldn't allow players to place bets if their claimable rewards will exceed the contract balance", async function(){
  await instance.betAmount("Tails", {from: accounts[1], value: web3.utils.toWei("4","ether")});
  await truffleAssert.fails(instance.betAmount("Heads", {from: accounts[1], value: web3.utils.toWei("2","ether")}));
})

it("should check that the balance of the contract was correctly increased after placing a bet", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("5", "ether")});
  var beforeBal = await instance.checkContractBalance();
  await instance.betAmount("Tails", {from: accounts[1], value: web3.utils.toWei("1", "ether")});
  var newBal = await instance.checkContractBalance();
  var difference = newBal - beforeBal;
  assert(difference == web3.utils.toWei("1", "ether"));
})

it("should check that account's balance was reduced after placing the bet", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("2", "ether")});
  var beforeBal = await web3.eth.getBalance(accounts[1]);
  await instance.betAmount("Tails", {from: accounts[1], value: web3.utils.toWei("0.1", "ether")});
  var afterBal = await web3.eth.getBalance(accounts[1]);
  assert(afterBal < beforeBal);
})

it("should check that the update function works correctly", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("2", "ether")});
  await instance.betAmount("Heads", {from: accounts[1], value: web3.utils.toWei("0.1", "ether")});
  var randomInt = await instance.getRandomNumber();
  assert (randomInt == 1);
})

it("should check that if the player loses, the amount of claimable rewards doesn't increase", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("3", "ether")});
  await instance.betAmount("Heads", {from: accounts[1], value: web3.utils.toWei("0.1", "ether")});
  var balWon = await instance.getAccountBalance({from: accounts[1]});
  assert (balWon == web3.utils.toWei("0", "ether"));
})

it("should check that if the player wins, the amount of claimable rewards increases correctly", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("3", "ether")});
  await instance.betAmount("Tails", {from: accounts[1], value: web3.utils.toWei("0.1", "ether")});
  var balWon = await instance.getAccountBalance({from: accounts[1]});
  assert (balWon == web3.utils.toWei("0.2", "ether"));
})

it("should check that multiple players can place bets", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("2", "ether")});
  await instance.betAmount("Heads", {from: accounts[1], value: web3.utils.toWei("0.1", "ether")});
  var playerOneRandomInt = await instance.getRandomNumber();
  var playerTwoRandomInt = await instance.getRandomNumber({from: accounts[2]});
  assert(playerOneRandomInt == 1 && playerTwoRandomInt == 0);
})

it("should check that the player cannot claim empty rewards", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("2", "ether")});
  await truffleAssert.fails(instance.claimRewards({from: accounts[1]}));
})

it("should check that the player can claim rewards if rewards are available", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("2", "ether")});
  await instance.betAmount("Tails", {from: accounts[1], value: web3.utils.toWei("0.1", "ether")});
  await truffleAssert.passes(instance.claimRewards({from: accounts[1]}));
})

it("should check that the player's account balance was correctly increased after withdrawing", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("2", "ether")});
  await instance.betAmount("Tails", {from: accounts[1], value: web3.utils.toWei("0.1", "ether")});
  var accountBalBefore = await web3.eth.getBalance(accounts[1]);
  await instance.claimRewards({from: accounts[1]});
  var accountBalAfter = await web3.eth.getBalance(accounts[1]);
  assert(accountBalAfter > accountBalBefore);
})

it("should only allow the owner to widthdraw funds from the contract", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("2", "ether")});
  await truffleAssert.passes(instance. withdrawAll({from: accounts[0]}));
})

it("shouldn't allow the player to widthdraw funds from the contract", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("2", "ether")});
  await truffleAssert.fails(instance. withdrawAll({from: accounts[1]}));
})

it("should check that the owner's account balance was correctly increased after widthdrawing", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("2", "ether")});
  let beforeBal = await web3.eth.getBalance(accounts[0]);
  await instance.betAmount("Tails", {from: accounts[1], value: web3.utils.toWei("0.6", "ether")});
  await instance.withdrawAll({from: accounts[0]});
  let afterBal = await web3.eth.getBalance(accounts[0]);
  assert(beforeBal < afterBal);
})

it("should check that the contract has been destroyed correctly", async function(){
  let instance = await CoinFlip.new();
  await instance.depositIntoContract({from: accounts[0], value: web3.utils.toWei("2", "ether")});
  await instance.destroy({from: accounts[0]});
  await truffleAssert.fails(instance.owner());
})


}) // DO NOT DELETE THESE BRACKETS
