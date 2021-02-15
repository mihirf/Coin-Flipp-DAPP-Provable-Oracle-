var web3 = new Web3(Web3.givenProvider);
var contractInstance;
$(document).ready(function () {
  startApp();
});

async function startApp() {
  await ethereum
    .request({ method: "eth_requestAccounts" })
    .then(function (accounts) {
      contractInstance = new web3.eth.Contract(
        window.abi,
        "0x9F32D02c6664e5DEBb8BaD1C7ecC0fddBE45686D",
        { from: accounts[0] }
      );
      console.log(contractInstance);
      updateValues();
    });
  $("#place_bet_button").click(betAnAmount);
  $("#claim_rewards_button").click(claimEther);
  $("#deposit_in_contract").click(deposit);
  $("#widthdraw_from_contract").click(withdraw);
  $("#destroy_contract").click(destroy);
}

function check() {
  contractInstance.methods
    .checkContractBalance()
    .call()
    .then(function (bal) {
      let returnValue = web3.utils.fromWei(bal, "ether");
    });
}

function updateValues() {
  contractInstance.methods
    .checkContractBalance()
    .call()
    .then(function (bal) {
      let returnValue = web3.utils.fromWei(bal, "ether");
      $("#balance_output").text(" " + returnValue);
    });
  contractInstance.methods
    .getAccountBalance()
    .call()
    .then(function (val) {
      let balancewon = web3.utils.fromWei(val, "ether");
      $("#rewards_output").text(" " + balancewon);
    });
  contractInstance.methods
    .owner()
    .call()
    .then(function (owner) {
      getAccounts(function (result) {
        var admin = document.getElementById("adminfunctions");
        if (owner == result[0]) {
          admin.style.display = "block";
          activateAdminFunctions();
        } else {
          admin.style.display = "none";
        }
      });
    });
}

function getAccounts(callback) {
  web3.eth.getAccounts((error, result) => {
    if (error) {
      console.log(error);
    } else {
      callback(result);
    }
  });
}

function activateAdminFunctions() {
  $("#admin-commands").click(function () {
    var tools = document.getElementById("commands");
    tools.style.display = "block";
  });
}

function betAnAmount() {
  var amount = $("#bet_amount_input").val();
  var config = {
    value: web3.utils.toWei(amount.toString(), "ether"),
  };

  contractInstance.methods
    .checkContractBalance()
    .call()
    .then(function (bal) {
      var contractBal = {value: web3.utils.fromWei(bal, "ether"),};
      if (amount > contractBal.value) {
        displayPopUp();
        $("#result_output").text(
          "Betting amount is greater than rewards available"
        );
        return;
      }
      if (amount < 0.1) {
        displayPopUp();
        $("#result_output").text(
          "Betting amount is too low, 0.1 ETH is at least required"
        );
        return;
      }
      contractInstance.methods
        .getPlayer()
        .call()
        .then(function (val) {
          if (val[0] != 0) {
            displayPopUp();
            $("#result_output").text(
              "Cannot place a new bet until the result from the previous bet has been finalized."
            );
            return;
          } else {
            count = 1;
            displayResult(count);
          }
        });
    });
}

async function displayResult(count) {
  var amount = $("#bet_amount_input").val();
  var option = $("#coinsides").val();
  var config = {
    value: web3.utils.toWei(amount.toString(), "ether"),
  };
  var image1 = document.getElementById("coin-flip-anim");
  image1.src = "Graphics/coin-flip-59.gif";
  contractInstance.methods
    .betAmount(option)
    .send(config)
    .on("transactionHash", function (hash) {
      console.log(hash);
    })
    .on("confirmation", function (confirmationNr) {
      console.log(confirmationNr);
      updateValues();
      checkIfWonOrLost(option, amount, count);
    })
    .on("receipt", function (receipt) {
      console.log(receipt);
    })
    .then(async function () {
      updateValues();
      await contractInstance.getPastEvents(
        "LogNewProvableQuery",
        {
          fromBlock: "latest",
          toBlock: "latest",
        },
        async function (error, events) {
          console.log(events);
        }
      );
    });
}

function checkIfWonOrLost(option, amount, count) {
  var image1 = document.getElementById("coin-flip-anim");
  contractInstance.methods
    .getPlayer()
    .call()
    .then(function (val) {
      if (val[0] == 0 && count == 1) {
        if (val[4] == 0 && option == "Heads") {
          image1.src = "Graphics/161283461031218797.png";
          displayPopUp();
          $("#result_output").text(
            "Congatulations! You won " + amount * 2 + " ETH!"
          );
          count = 0;
        } else if (val[4] == 1 && option == "Tails") {
          image1.src = "Graphics/161283461031218797.png";
          displayPopUp();
          $("#result_output").text(
            "Congatulations! You won " + amount * 2 + " ETH!"
          );
          count = 0;
        } else {
          image1.src = "Graphics/161283461031218797.png";
          displayPopUp();
          $("#result_output").text("Sorry, you lost. Better luck next time!");
          count = 0;
        }
      }
    });
}

function claimEther() {
  contractInstance.methods
    .getAccountBalance()
    .call()
    .then(function (val) {
      if (val == 0) {
        displayPopUp();
        $("#result_output").text("You have no rewards to claim.");
        return;
      }
      let balancewon = web3.utils.fromWei(val, "ether");
      contractInstance.methods
        .claimRewards()
        .send()
        .then(function () {
          updateValues();
        });
    });
}

function displayPopUp() {
  var modal = document.getElementById("myModal");
  var span = document.getElementsByClassName("close")[0];
  modal.style.display = "block";
  span.onclick = function () {
    modal.style.display = "none";
    location.reload();
  };
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
      location.reload();
    }
  };
}

function deposit() {
  var amount = $("#deposit_amount_input").val();
  var config = {
    value: web3.utils.toWei(amount.toString(), "ether"),
  };
  contractInstance.methods
    .depositIntoContract()
    .send(config)
    .then(function () {
      updateValues();
    });
}

function withdraw() {
  contractInstance.methods
    .WithdrawAll()
    .send()
    .then(function () {
      updateValues();
    });
}

function destroy() {
  contractInstance.methods.destroy().send();
  updateValues();
}
