let balance = Number(localStorage.getItem("walletBalance")) || 0;
let transactions = JSON.parse(localStorage.getItem("walletTransactions")) || [];
const currentUser = "BO";


const balanceDisplay = document.getElementById("balance");
const transactionList = document.getElementById("transaction-list");
balanceDisplay.textContent = formatMoney(balance);
const addMoneyButton = document.getElementById("add-money-btn");
const sendForm = document.getElementById("send-form");
const recipientInput = document.getElementById("recipient");
const sendAmountInput = document.getElementById("send-amount");
const clearTransactionsBtn = document.getElementById("clear-transactions-btn");
const transactionCount = document.getElementById("transaction-count");
const Greeting = document.getElementById("greeting");
const transactionDetails = document.getElementById("transaction-details");
const closeTransactionDetails = document.getElementById("close-transaction-details");
const copyTransactionId = document.getElementById("copy-transaction-id");

const detailsName = document.getElementById("details-name");
const detailsType = document.getElementById("details-type");
const detailsAmount = document.getElementById("details-amount");
const detailsDate = document.getElementById("details-date");
const detailsId = document.getElementById("details-id");

function updateGreeting() {
    Greeting.textContent = `${getGreeting()}, ${currentUser}`;
}
updateGreeting();
setInterval(updateGreeting, 60000);


function formatDate() {
    const date = new Date();
    const datePart = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
    
    const timePart = date.toLocaleTimeString("en-US", {
         hour: "numeric",
        minute: "2-digit"
    });
    return `${datePart} • ${timePart}`;
}

function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
        return "Good morning";
    }

    if (hour < 18) {
        return "Good afternoon";
    }

    return "Good evening";
}

function getTimestamp() {
    return Date.now();
}

function formatMoney(amount) {
    return `₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function fixOldTransactions() {
    let changed = false;

    transactions = transactions.map(function (transaction) {
        if (typeof transaction.amount === "string") {
            transaction.amount = Number(
                transaction.amount.replace(/[₦, +]/g, "")
            );

            changed = true;
        }

        if (!transaction.timestamp && transaction.date) {
            const oldDate = new Date(transaction.date);

            if (!isNaN(oldDate.getTime())) {
                transaction.timestamp = oldDate.getTime();
                changed = true;
            }
        }

        if (!transaction.id) {
            transaction.id = crypto.randomUUID();
            changed = true;
        }

        return transaction;
    });

    if (changed) {
        saveTransactions();
    }
}

function saveTransactions() {
    localStorage.setItem(
        "walletTransactions",
        JSON.stringify(transactions)
    );
}

function saveBalance() {
    localStorage.setItem("walletBalance", balance);
}

function updateBalance(amount) {
    balance = balance + amount;
    saveBalance();
    balanceDisplay.textContent = formatMoney(balance);
}

function addTransaction(name, amount, type) {
    transactions.push({
        id: crypto.randomUUID(),
        name: name,
        amount: amount,
        type: type,
        date: formatDate(),
        timestamp: getTimestamp()
    });
    
    saveTransactions();
    displayTransactions();
}

function displayTransactions() {
    transactionList.innerHTML = "";
    

    if (transactions.length === 0) {
        transactionCount.textContent = "";
        transactionList.innerHTML = `
            <div class="empty-transactions">
                <p>No transaction yet.</p>
                <span>Your recent activity will appear here.</span>
            </div>
        `;

        return;
    }

    if (transactions.length === 1) {
        transactionCount.textContent = "(1 transaction)";
    } else {
        transactionCount.textContent = `(${transactions.length} transactions)`;
    }

    [...transactions]
        .sort(function (a, b) {
            return (b.timestamp || 0) - (a.timestamp || 0);
        })
        .forEach(function (transaction) {
    
            const transactionElement = document.createElement("div");
            transactionElement.classList.add("transaction");
            transactionElement.dataset.transactionId = transaction.id;

            transactionElement.classList.add(transaction.type.toLowerCase());
            transactionElement.innerHTML = `
                <div>
                    <h3>${transaction.name}</h3>
                    <p>${transaction.type} • ${transaction.date}</p>
                </div>
                <span class="transaction-amount">${transaction.amount >= 0 ? "+" : "-"}${formatMoney(Math.abs(transaction.amount))}</span>
            `;

            transactionElement.addEventListener("click", function () {
                const transactionId = transactionElement.dataset.transactionId;
                const selectedTransaction = transactions.find(function (item) {
                    return item.id === transactionId;
                });

                if (!selectedTransaction) {
                    return;
                }

                detailsName.textContent = selectedTransaction.name;
                detailsType.textContent = selectedTransaction.type;

                detailsAmount.textContent = 
                    `${selectedTransaction.amount >= 0 ? "+" : "-"}${formatMoney(Math.abs(selectedTransaction.amount))}`;

                detailsDate.textContent = selectedTransaction.date;

                detailsId.textContent = `Transaction ID: ${selectedTransaction.id}`;

                transactionDetails.classList.remove("deposit", "withdrawal", "transfer");
                transactionDetails.classList.add(selectedTransaction.type.toLowerCase());

                transactionDetails.classList.remove("hidden");
            });
            
            transactionList.appendChild(transactionElement);
        });

}         

closeTransactionDetails.addEventListener("click", function () {
    transactionDetails.classList.add("hidden")
});

fixOldTransactions();

transactionDetails.addEventListener("click", function (event) {
    if (event.target === transactionDetails) {
        transactionDetails.classList.add("hidden");
    }
});
  


copyTransactionId.addEventListener("click", function () {
    const transactionId = detailsId.textContent.replace(
        "Transaction ID: ",
        ""
    );

    navigator.clipboard.writeText(transactionId);
    copyTransactionId.textContent = "Copied!";

    setTimeout(function () {
        copyTransactionId.textContent = "Copy";
    }, 1500);
});



addMoneyButton.addEventListener("click", function () {
    const amount = prompt("How much money do you want to add?");
    const money= Number(amount);

    if (!money || money <= 0) {
        alert("Please enter a valid amount.")
        return;
    }

    updateBalance(money);

    addTransaction("Money Added", money, "Deposit")
});

const withdrawButton = document.getElementById("withdraw-btn")
withdrawButton.addEventListener("click", function () {
    const amount = prompt("How much do you want to withdraw?");
    const money = Number(amount);

    if (!money || money <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (money > balance) {
        alert("Insufficient balance.");
        return;
    }

    updateBalance(-money);

    addTransaction("Money Withdrawn", -money, "Withdrawal");

});

sendForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const recipient = recipientInput.value.trim();
    const money = Number(sendAmountInput.value);

    if (recipient === "") {
        alert("Please enter a recipient.");
        return;
    }

    if (recipient.toLowerCase() === currentUser.toLowerCase()) {
        alert("You cannot send money to yourself.")
        return;
    }

    if (!money || money <= 0) {
        alert("Please enter a valid number.");
        return
    }

    if (money > balance) {
        alert("Insufficient balance.");
        return;
    }

    updateBalance(-money);

    addTransaction(`Sent to ${recipient}`, -money, "Transfer");

    
    sendForm.reset();

    console.log(recipient);
    console.log(money);
});

displayTransactions();

clearTransactionsBtn.addEventListener("click", function () {
    const confirmClear = confirm(
        "Are you sure you want to clear all transactions?"
    );

    if (!confirmClear) {
        return;
    }
    transactions = [];
    saveTransactions();
    displayTransactions();
});