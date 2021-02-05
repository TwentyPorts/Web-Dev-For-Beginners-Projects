const storageKey = 'savedAccount';

let state = Object.freeze({
  account: null
});

const routes = {
  "/login": { templateId: "login" },
  "/dashboard": { templateId: "dashboard", init: refresh },
  "/credits": { templateId: "credits" },
};

function updateRoute(templateId) {
  const path = window.location.pathname;
  const route = routes[path];

  if (!route) {
    // For incorrect url paths
    return navigate('/dashboard'); // dashboard falls back to login if no account is found
  }

  const template = document.getElementById(route.templateId);
  const view = template.content.cloneNode(true);
  const app = document.getElementById("app");
  document.title = route.templateId + " - Bank App"; // Updates browser tab title
  console.log(route.templateId + " is shown");
  app.innerHTML = "";
  app.appendChild(view);

  // If the init attribute of route is the name of a function, call that function
  if (typeof route.init === "function") {
    route.init();
  }
}

function navigate(path) {
  window.history.pushState({}, path, window.location.origin + path);
  // window.location.origin + path allows reconstruction of complete URL
  updateRoute();
}

function onLinkClick(event) {
  event.preventDefault();
  navigate(event.target.href);
}

function updateElement(id, textOrNode) {
  const element = document.getElementById(id);
  element.textContent = ""; // Removes all children
  element.append(textOrNode);
}

function updateState(property, newData) {
  state = Object.freeze({
    ...state,
    [property]: newData
  });
  localStorage.setItem(storageKey, JSON.stringify(state.account));
  //console.log(state);
}

async function updateAccountData() {
  const account = state.account;
  if (!account) {
    return logout();
  }

  const data = await sendRequest(account.user, "login");
  if (data.error) {
    return logout();
  }

  updateState('account', data);
}

async function refresh() {
  await updateAccountData();
  updateDashboard();
}

// ===== LOGIN/REGISTER =====

async function register() {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.innerText = "";
  const registerForm = document.getElementById("registerForm");
  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData);
  const jsonData = JSON.stringify(data);
  const result = await sendRequest(jsonData, "register");

  if (result.error) {
    if ((result.error = "User already exists")) {
      errorMessage.innerText = "Username already exists";
    }
    return console.log("An error occured:", result.error);
  }

  console.log("Account created!", result);

  updateState('account', result);
  navigate("/dashboard");
}

async function login() {
  const loginForm = document.getElementById("loginForm");
  const user = loginForm.user.value;
  const data = await sendRequest(user, "login");

  if (data.error) {
    return updateElement("loginError", data.error);
  }

  updateState('account', data);
  navigate("/dashboard");
}

function logout() {
  updateState('account', null);
  navigate('/login');
}

async function sendRequest(account, requestType, optionalBody = null) {
  try {
    switch (requestType) {
      case "login": {
        const response = await fetch(
          "//localhost:5000/api/accounts/" + encodeURIComponent(account)
        );
        return await response.json();
      }
      case "register": {
        const response = await fetch("//localhost:5000/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: account,
        });
        return await response.json();
      }
      case "addTransaction": {
        console.log(encodeURIComponent(account));
        const response = await fetch("//localhost:5000/api/accounts/" + encodeURIComponent(account) + "/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: optionalBody,
        });
        return await response.json();
      }
      default:
        throw "Unknown request";
    }
  } catch (error) {
    return { error: error.message || "Unknown error" };
  }
}

// ===== DASHBOARD =====

function updateDashboard() {
  const account = state.account;
  if (!account) {
    return logout();
  }

  updateElement("description", account.description);
  updateElement("balance", account.balance.toFixed(2));
  updateElement("currency", account.currency);

  const transactionsRows = document.createDocumentFragment();
  for (const transaction of account.transactions) {
    const transactionRow = createTransactionRow(transaction);
    transactionsRows.appendChild(transactionRow);
  }
  updateElement("transactions", transactionsRows);
}

// Create contents for table of transactions
function createTransactionRow(transaction) {
  const template = document.getElementById("transaction");
  const transactionRow = template.content.cloneNode(true);
  const tr = transactionRow.querySelector("tr");
  tr.children[0].textContent = transaction.date;
  tr.children[1].textContent = transaction.object;
  tr.children[2].textContent = transaction.amount.toFixed(2);
  return transactionRow;
}

function toggleTransactionOverlay() {
  const transacOverlay = document.getElementById("addTransactionOverlay");
  const darkOverlay = document.getElementById("overlay");
  const overlayShown = (transacOverlay.style.display === "block");
  if(overlayShown) {
    transacOverlay.style.display = "none";
    darkOverlay.style.display = "none";
  }
  else {
    transacOverlay.style.display = "block";
    darkOverlay.style.display = "block";
  }
}

function addTransaction() {
  const account = state.account.user;
  const transacForm = document.getElementById("addTransactionForm");
  const formData = new FormData(addTransactionForm);
  const data = Object.fromEntries(formData);
  const jsonData = JSON.stringify(data);
  sendRequest(account, "addTransaction", jsonData);
  /*const newAccount = {
    ...state.account,
    balance: state.account.balance + data.amount,
    transactions: [...state.account.transactions, data]
  };
  updateState('account', newAccount);*/
  updateDashboard();
  toggleTransactionOverlay();
}

// ===== INIT =====

function init() {
  const savedAccount = localStorage.getItem(storageKey);
  if (savedAccount) {
    updateState('account', JSON.parse(savedAccount));
  }

  // Our previous initialization code
  window.onpopstate = () => updateRoute();
  updateRoute();
}

init();