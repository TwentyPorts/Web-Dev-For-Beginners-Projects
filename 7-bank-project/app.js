let account = null;

const routes = {
  "/login": { templateId: "login" },
  "/dashboard": { templateId: "dashboard", init: updateDashboard },
  "/credits": { templateId: "credits" },
};

function updateRoute(templateId) {
  const path = window.location.pathname;
  const route = routes[path];

  if (!route) {
    //for incorrect url paths
    return navigate("/login");
  }

  const template = document.getElementById(route.templateId);
  const view = template.content.cloneNode(true);
  const app = document.getElementById("app");
  document.title = route.templateId + " - Bank App";
  console.log(route.templateId + " is shown");
  app.innerHTML = "";
  app.appendChild(view);

  //if the init attribute of route is the name of a function, call that function
  if (typeof route.init === "function") {
    route.init();
  }
}

function navigate(path) {
  window.history.pushState({}, path, window.location.origin + path);
  //window.location.origin + path allows reconstruction of complete URL
  updateRoute();
}

updateRoute("login");

function onLinkClick(event) {
  event.preventDefault();
  navigate(event.target.href);
}

window.onpopstate = () => updateRoute();
updateRoute();

async function register() {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.innerText = "";
  const registerForm = document.getElementById("registerForm");
  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData);
  const jsonData = JSON.stringify(data);
  const result = await createAccount(jsonData);

  if (result.error) {
    if ((result.error = "User already exists")) {
      errorMessage.innerText = "Username already exists";
    }
    return console.log("An error occured:", result.error);
  }

  console.log("Account created!", result);

  account = result;
  navigate("/dashboard");
}

async function createAccount(account) {
  try {
    const response = await fetch("//localhost:5000/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: account,
    });
    return await response.json();
  } catch (error) {
    return { error: error.message || "Unknown error" };
  }
}

async function login() {
  const loginForm = document.getElementById("loginForm");
  const user = loginForm.user.value;
  const data = await getAccount(user);

  if (data.error) {
    return updateElement("loginError", data.error);
  }

  account = data;
  navigate("/dashboard");
}

async function getAccount(user) {
  try {
    const response = await fetch(
      "//localhost:5000/api/accounts/" + encodeURIComponent(user)
    );
    return await response.json();
  } catch (error) {
    return { error: error.message || "Unknown error" };
  }
}

function updateElement(id, textOrNode) {
  const element = document.getElementById(id);
  element.textContent = ''; // Removes all children
  element.append(textOrNode);
}

function updateDashboard() {
  if (!account) {
    return navigate("/login");
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

function createTransactionRow(transaction) {
  const template = document.getElementById("transaction");
  const transactionRow = template.content.cloneNode(true);
  const tr = transactionRow.querySelector("tr");
  tr.children[0].textContent = transaction.date;
  tr.children[1].textContent = transaction.object;
  tr.children[2].textContent = transaction.amount.toFixed(2);
  return transactionRow;
}
