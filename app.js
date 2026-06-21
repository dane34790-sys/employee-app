console.log("APP JS LOADED");

// 👇 امن‌ترین حالت برای جلوگیری از کرش
console.log("currentUser =", window.currentUser);

const firebaseConfig = {
  apiKey: "AIzaSyAYsu4Ji-eFHx55ARX6_4PRb5SRfx-jrhw",
  authDomain: "employee-app-b7215.firebaseapp.com",
  databaseURL: "https://employee-app-b7215-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "employee-app-b7215",
  storageBucket: "employee-app-b7215.firebasestorage.app",
  messagingSenderId: "103868866433",
  appId: "1:103868866433:web:b3d9773c2c0759845ad280"
};

// 🔥 Firebase init (compat mode)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();

console.log("Firebase Ready");

const pageStack = [];

function pushPage(fn) {
  pageStack.push(fn);
  history.pushState({}, "", "");
}

/* 👇 BACK SAFE HANDLER */
window.addEventListener("popstate", () => {

  if (pageStack.length <= 1) {
    pageStack.length = 0;
    history.back(); // خروج طبیعی
    return;
  }

  pageStack.pop();

  const prev = pageStack[pageStack.length - 1];

  if (typeof prev === "function") {
    prev();
  }
});

/* 👇 SAFE INIT (خیلی مهم برای جلوگیری از crash) */
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (typeof init === "function") {
      init();
    } else {
      console.log("init not found, skipping");
    }
  } catch (e) {
    console.log("INIT ERROR:", e);
  }
});

function formatNumber(n){
  n = String(n || "0");
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

let employees = [];
let currentUser = null;
let currentChatEmpId = null; // 👈 این خط را اضافه کن

let otpCode = "";

let chats = JSON.parse(
  localStorage.getItem("chats") || "{}"
);

const ADMIN = {
  id: "dani",
  pass: "19831983",
  mobile: "123456789"
};

/* ================= INIT ================= */
function init() {
  loadEmployees();
  listenChats();
}
/* ================= STORAGE ================= */
function loadEmployees() {

  db.ref("employees").once("value")
    .then((snapshot) => {

      const data = snapshot.val();

      // ================== LOAD FROM FIREBASE ==================
      if (Array.isArray(data) && data.length > 0) {

        employees = data;

        employees.forEach(emp => {

          if (!emp.documents) {
            emp.documents = {};
          }
          if (emp.pass === undefined) {
  emp.pass = "";
}

          if (emp.documents.lineEnabled === undefined) {
            emp.documents.lineEnabled = false;
          }

          if (!emp.documents.lineName) {
            emp.documents.lineName = "";
          }

          if (!emp.documents.lineCode) {
            emp.documents.lineCode = "";
          }

          if (!emp.documents.expiryStart) {
            emp.documents.expiryStart = Date.now();
          }

          if (!emp.documents.files) {
            emp.documents.files = [];
          }

          if (!emp.transactions) {
            emp.transactions = [];
          }

          if (!emp.status) {
            emp.status = "OFFLINE";
          }

        });

        // بکاپ داخل localStorage
        localStorage.setItem(
          "employees",
          JSON.stringify(employees)
        );

        showLogin();
        return;
      }

      // ================== FIREBASE EMPTY ==================

      const saved = localStorage.getItem("employees");

      if (saved) {

        try {

          employees = JSON.parse(saved);

          showLogin();
          return;

        } catch (e) {}

      }

      // اگر هیچ داده‌ای نبود
      employees = [
        {
          id: "1",
          passport: "A123",
          name: "Ali",
          salary: "2500",
          iban: "DE123",
          cardNumber: "1111",
          account: "ACC1",
          status: "ONLINE",
          expiry: "12/26",
          ccv2: "123",
          zip: "1000",
          phone: "0912",
          balance: 1000,

          documents: {
            lineEnabled: true,
            lineName: "Line Hanover 5690",
            lineCode: "12GF65SK98E53BD0",
            expiryStart: Date.now(),
            files: []
          },

          transactions: []
        }
      ];

      saveEmployees();
      showLogin();

    })
    .catch((err) => {

      console.error(err);

      // اگر Firebase خطا داد از localStorage استفاده کن
      const saved = localStorage.getItem("employees");

      if (saved) {

        try {
          employees = JSON.parse(saved);
        } catch (e) {
          employees = [];
        }

      } else {

        employees = [];

      }

      showLogin();

    });

}
function listenChats() {

  db.ref("chats").on("value", (snapshot) => {

    const data = snapshot.val();

    if (!data) return;

    chats = data;

    localStorage.setItem(
      "chats",
      JSON.stringify(chats)
    );

    // اگر صفحه چت باز نیست
    if (!currentChatEmpId) return;

    const chatBox =
      document.getElementById("chatBox");

    if (!chatBox) return;

    const messages =
      chats[currentChatEmpId] || [];

    chatBox.innerHTML =
      messages.map((m, i) => `

      <div style="
        margin-bottom:10px;
        padding:10px;
        border-radius:12px;
        background:${
          m.from === "admin"
          ? "linear-gradient(135deg, rgba(34,197,94,.25), rgba(22,163,74,.15))"
          : "rgba(255,255,255,.08)"
        };
        border:1px solid rgba(255,255,255,.12);
        color:white;
      ">

        <div style="font-weight:bold;margin-bottom:4px;">
          ${m.from}
        </div>

        <div style="
          font-size:11px;
          color:rgba(255,255,255,.6)
        ">
          ${new Date(m.date).toLocaleString()}
        </div>

        <div style="margin-top:6px;">
          ${m.text || ""}
        </div>

        ${m.file ? `
          <div style="margin-top:8px;">

            ${
              (m.file.type || "").startsWith("image/")

              ? `

              <img
                src="${m.file.data}"
                onclick="openImageFull('${m.file.data}')"
                style="
                  max-width:220px;
                  width:100%;
                  border-radius:12px;
                  cursor:pointer;
                  border:1px solid rgba(255,255,255,.2);
                "
              >

              `

              :

              `

              <a
                href="${m.file.data}"
                download="${m.file.name}"
                style="color:white;"
              >
                📎 ${m.file.name}
              </a>

              `

            }

          </div>
        ` : ""}

        <div style="
          margin-top:6px;
          font-size:12px;
          color:rgba(255,255,255,.6)
        ">

          ${
            m.from === "admin"
            ? (m.seen ? "✓✓" : "✓")
            : (m.seenByAdmin ? "✓✓" : "✓")
          }

        </div>

        <button
          onclick="deleteMessage('${currentChatEmpId}',${i})"
          style="
            margin-top:6px;
            background:red;
            color:white;
            border:none;
            padding:4px 8px;
            border-radius:6px;
            cursor:pointer;
          "
        >
          🗑 حذف
        </button>

      </div>

    `).join("");

    // اسکرول آخر چت
    chatBox.scrollTop =
      chatBox.scrollHeight;

  });

}
function showLogin() {
  document.getElementById("app").innerHTML = `
    <div class="screen">
      <img src="images/login-bg.png" class="bg-full">

      <div class="overlay">
        <input id="id" placeholder="ID">
        <input id="pass" placeholder="Password">
        <input id="mobile" placeholder="Mobile">
        <button onclick="login()">LOGIN</button>
      </div>
    </div>
  `;
}

function login() {
  const id = v("id");
  const pass = v("pass");
  const mobile = v("mobile");

  if (id === ADMIN.id && pass === ADMIN.pass && mobile === ADMIN.mobile) {
    currentUser = { type: "admin" };
    return showOTP();
  }

  const emp = employees.find(e =>
  e.id === id &&
  e.pass === pass &&
  e.phone === mobile
);

  if (!emp) return alert("Login Failed");

  currentUser = { type: "employee", emp };
  showOTP();
}

/* ================= OTP ================= */

function showOTP() {
  otpCode = String(Math.floor(100000 + Math.random() * 900000));
  alert("OTP: " + otpCode);

  document.getElementById("app").innerHTML = `
  <div class="screen">

    <img src="images/login-bg.png" class="bg-full">

    <div class="overlay">
      <input id="otp" placeholder="OTP">
      <button onclick="verifyOTP()">VERIFY</button>
    </div>

  </div>
`;
}

function verifyOTP() {
  if (v("otp") !== otpCode) return alert("Wrong OTP");
  showUI();
}

/* ================= UI ================= */

let selectedEmpId = null; // 👈 بالا فایل اضافه کن
console.log("SHOWUI CALLED", currentUser);
function showUI() {

  if (!currentUser) {
    console.log("NO USER");
    return;
  }

  const isAdmin = currentUser.type === "admin";
  const list = isAdmin ? employees : [currentUser.emp];

  // 🔥 مهم: ثبت در history stack برای بک گوشی
  pushPage(() => showUI());

  // 👇 برای employee مستقیم همون خودش انتخاب میشه
  if (!isAdmin) {
    selectedEmpId = currentUser.emp.id;
  }

  document.getElementById("app").innerHTML = `
  <div class="screen">

    <img src="images/employee-bg.png" class="bg-full">

    <div id="sidebar" class="sidebar active" style="
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.15);
    ">

      <img src="images/telegram.png"
           onclick="openTelegram()"
           style="cursor:pointer;">

      <img src="images/trustwallet.png"
           onclick="openWalletPage()"
           style="cursor:pointer;">

      <img src="images/mypdf.jpg"
           onclick="openDocumentsPage()"
           style="cursor:pointer;">

      <div
        onclick="window.open('https://t.me/ar1_employee_private_bot','_blank')"
        style="
          width:55px;
          height:55px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:30px;
          cursor:pointer;
          background:rgba(255,255,255,.08);
          border-radius:12px;
          margin-top:5px;
        ">
        🤖
      </div>

    </div>

    <div class="menu-btn" onclick="toggleMenu()">☰</div>

    <div class="panel">

      ${isAdmin ? `<button onclick="addEmployee()">➕ Add</button>` : ""}

      ${list.map(emp => `
        <div onclick="selectedEmpId='${emp.id}'">
          ${card(emp, isAdmin)}
        </div>
      `).join("")}

      <button class="logout" onclick="showLogin()">LOGOUT</button>

    </div>

  </div>
  `;
}
/* ================= ICON ROW SYSTEM (NEW) ================= */

function row(icon, label, value) {
  return `
    <div class="info-row">
      <div class="info-left">${icon}</div>

      <div class="glass-input readonly">
        ${value ?? ""}
      </div>
    </div>
  `;
}
function adminInput(icon, value, field, empId){
  return `
    <div class="info-row">
      <div class="info-left">${icon}</div>
      <input
        class="glass-input"
        value="${value || ''}"
        onchange="update('${empId}','${field}',this.value)"
      >
    </div>
  `;
}

function card(emp, isAdmin) {
  return `
    <div class="card">

      ${isAdmin ? `

        ${adminInput("🆔", emp.id, "id", emp.id)}
        ${adminInput("📘", emp.passport, "passport", emp.id)}
        ${adminInput("🔑", emp.pass || "", "pass", emp.id)}
        ${adminInput("👤", emp.name, "name", emp.id)}
        ${adminInput("💰", emp.salary, "salary", emp.id)}
        ${adminInput("🏦", emp.iban, "iban", emp.id)}
        ${adminInput("💳", emp.cardNumber, "cardNumber", emp.id)}
        ${adminInput("📁", emp.account, "account", emp.id)}
        ${adminInput("📅", emp.expiry, "expiry", emp.id)}
        ${adminInput("🔐", emp.ccv2, "ccv2", emp.id)}
        ${adminInput("📍", emp.zip, "zip", emp.id)}
        ${adminInput("📱", emp.phone, "phone", emp.id)}
        <button
  onclick="openSidebarMediaPage('${emp.id}')"
  style="
    width:100%;
    margin-top:10px;
    background:#9c27b0;
    color:white;
    border:none;
    padding:10px;
    border-radius:10px;
  "
>
  📁 Sidebar Media
</button>

      ` : `

        ${row("🆔", "ID", emp.id)}
        ${row("📘", "Passport", emp.passport)}
        ${row("👤", "Name", emp.name)}
        ${row("💰", "Salary", emp.salary)}
        ${row("🏦", "IBAN", emp.iban)}
        ${row("💳", "Card", emp.cardNumber)}
        ${row("📁", "Account", emp.account)}
        ${row("📅", "Expiry", emp.expiry)}
        ${row("🔐", "CCV2", emp.ccv2)}
        ${row("📍", "ZIP", emp.zip)}
        ${row("📱", "Phone", emp.phone)}

      `}

      <!-- STATUS -->
      <div
        class="status-box ${emp.status === "ONLINE" ? "online" : "offline"}"
        ${isAdmin ? `onclick="toggleStatus('${emp.id}')"` : ""}
      >
        ${emp.status}
      </div>

      ${isAdmin ? `

        <button onclick="toggleLine('${emp.id}')">
          ${emp.documents?.lineEnabled ? "🔴 OFF LINE" : "🟢 ON LINE"}
        </button>

        <button onclick="openTxEditor('${emp.id}')">
          ✏ Manage Transactions
        </button>

        <button onclick="openLinePage('${emp.id}')">
          📡 Manage LINE
        </button>

        <button onclick="openPdfEditor('${emp.id}')">
          📄 Manage PDF
        </button>

      ` : `

        ${emp.documents?.lineEnabled ? `
          <button onclick="openLinePage('${emp.id}')">
            📡 LINE
          </button>
        ` : ""}

        <button onclick="openDocumentsPage('${emp.id}')">
          📄 View PDF
        </button>

        <button onclick="openTransactions('${emp.id}')">
          📊 Transactions
        </button>

      `}

      <!-- CHAT -->
     <button
  onclick="openChat('${emp.id}')"
  style="
    width:100%;
    margin-top:10px;
    background:#2196f3;
    color:white;
    border:none;
    padding:10px;
    border-radius:10px;
  "
>
  💬 Chat
  ${
    (() => {

      const unread = (chats[emp.id] || []).filter(m => {

        if(isAdmin){
          return m.from === "employee" && !m.seenByAdmin;
        }

        return m.from === "admin" && !m.seen;

      }).length;

      return unread > 0
        ? ` 🔴 ${unread}`
        : "";

    })()
  }
</button>

      ${isAdmin ? `
        <button
          onclick="deleteEmp('${emp.id}')"
          style="
            width:100%;
            margin-top:10px;
            background:#f44336;
            color:white;
            border:none;
            padding:10px;
            border-radius:10px;
          "
        >
          🗑 Delete
        </button>
      ` : ""}

    </div>
  `;
}
function update(id, field, value) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;

  console.log("UPDATE:", field, value);

  emp[field] = value;

  console.log(emp);

  saveEmployees();
}
function addEmployee() {
  employees.push({
    id: String(Date.now()),
    passport: "",
    name: "",
    salary: "",
    iban: "",
    cardNumber: "",
    account: "",
    status: "OFFLINE",
    expiry: "",
    ccv2: "",
    zip: "",
    phone: "",
    pass: "",
    balance: 0,

    documents: {
      lineEnabled: false,
      lineName: "",
      lineCode: "",
      expiryStart: Date.now(),
      files: [],
      price: ""
    },

    // سایدبار
    sidebarMedia: {
      images: []
    },

    transactions: []
  });

  saveEmployees();
  showUI();
}
function deleteEmp(id) {
  employees = employees.filter(e => e.id !== id);
  saveEmployees();
  showUI();
}

function toggleStatus(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;

  emp.status = emp.status === "ONLINE" ? "OFFLINE" : "ONLINE";
  saveEmployees();
  showUI();
}

/* ================= SIDEBAR ================= */

function toggleMenu() {
  document.getElementById("sidebar")?.classList.toggle("active");
}
function openTelegram() {
  window.open("https://t.me/Ar1mastercard", "_blank");
}

/* ================= UTIL ================= */

function v(id) {
  return document.getElementById(id)?.value?.trim();
}
function openWalletPage() {

  // ثبت صفحه فعلی برای دکمه Back گوشی
  pushPage(openWalletPage);

  document.getElementById("app").innerHTML = `
    <div class="screen">
      <img src="openDocumentsPage" class="bg-full">

      <div class="overlay">

        <h2>💰 USDT Payment</h2>

        <p>Send USDT (TRC20) to this address:</p>

        <input id="walletAddress"
          value="TCTvRJwQZEVtUz8Ai9ZjxRVjChzezs1DXN"
          readonly
          onclick="this.select()">

        <button onclick="copyAddress()">📋 Copy Address</button>

        <button onclick="history.back()">⬅ Back</button>

      </div>
    </div>
  `;
}
function openLinePage(empId){

  const emp = employees.find(e => String(e.id) === String(empId));
  if(!emp || !emp.documents?.lineEnabled){
    alert("LINE Panel Disabled");
    return;
  }

  const isAdmin = currentUser.type === "admin";

  const start = emp.documents.expiryStart || Date.now();
  const end = start + (5 * 365 * 24 * 60 * 60 * 1000);

  const startText = new Date(start).toLocaleDateString("en-CA");
  const endText   = new Date(end).toLocaleDateString("en-CA");

  // 👇 اینجا push درست (صفحه واقعی، نه showUI)
  pushPage(() => openLinePage(empId));

  document.getElementById("app").innerHTML = `
    <div class="screen">

      <img src="images/employee-bg.png" class="bg-full">

      <div class="overlay">

        <!-- ECG -->
        <svg viewBox="0 0 200 60" width="320" class="ecg">
          <path class="line1" d="M0 30 L20 30 L30 10 L40 50 L50 30 L70 30 L80 20 L90 40 L100 30 L200 30"/>
          <path class="line2" d="M0 30 L20 30 L30 20 L40 45 L50 30 L70 30 L80 25 L90 35 L100 30 L200 30"/>
        </svg>

        <!-- CLOCK -->
        <div class="clock" id="clock"></div>

        <div class="neon-box">

          <div style="display:flex;align-items:center;gap:6px;max-width:100%;">
            <input id="lineName"
              class="neon-text"
              style="flex:1;min-width:0;"
              value="${emp.documents.lineName || ''}"
              ${!isAdmin ? "disabled" : ""}>
            <span style="flex-shrink:0;">📡</span>
          </div>

          <div style="display:flex;align-items:center;gap:6px;max-width:100%;">
            <input id="lineCode"
              class="neon-text"
              style="flex:1;min-width:0;"
              value="${emp.documents.lineCode || ''}"
              ${!isAdmin ? "disabled" : ""}>
            <span style="flex-shrink:0;">🔑</span>
          </div>

          <div style="display:flex;align-items:center;gap:6px;max-width:100%;">
            <input id="price"
              class="neon-text"
              style="flex:1;min-width:0;"
              value="${emp.documents?.price || ''}"
              ${!isAdmin ? "readonly" : ""}>
            <span style="flex-shrink:0;">💲</span>
          </div>

          <div id="lineCountdown" class="neon-text" style="margin-top:8px;"></div>

          <div class="neon-text">
            🚀 START : <span style="color:#00ff6a !important">${startText}</span>
          </div>

          <div class="neon-text">
            🏁 END : <span style="color:#ff3b3b !important">${endText}</span>
          </div>

          ${isAdmin ? `
            <input id="lineStartDate"
              type="date"
              value="${new Date(start).toISOString().split('T')[0]}">
          ` : ""}

        </div>

        ${isAdmin ? `
          <button onclick="saveLine('${emp.id}')"
            style="margin-top:10px;padding:10px;width:100%;background:#00e676;border:none;border-radius:8px;">
            💾 SAVE LINE
          </button>
        ` : ""}

        <!-- ✅ مهم: بک واقعی گوشی -->
        <button onclick="history.back()" class="logout">⬅ Back</button>

      </div>
    </div>
  `;

  startClock();
  startLineCountdown(emp);
}
function getLineExpiry(emp){

  if(!emp.documents?.expiryStart) return "NO DATE";

  const start = emp.documents.expiryStart;
  const end = start + (5 * 365 * 24 * 60 * 60 * 1000);

  const now = Date.now();
  const diff = end - now;

  if(diff <= 0) return "EXPIRED";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  return `${days}D ${hours}H ${mins}M ${secs}S`;
}

function saveLine(empId){

  const emp = employees.find(e => String(e.id) === String(empId));
  if(!emp) return;

  if(!emp.documents) emp.documents = {};

  emp.documents.lineName = document.getElementById("lineName").value;
  emp.documents.lineCode = document.getElementById("lineCode").value;

  // 🔥 FIX قطعی و امن PRICE
  const priceEl = document.getElementById("price");
  if(priceEl){
    emp.documents.price = priceEl.value;
  }

  const dateInput = document.getElementById("lineStartDate");
  if(dateInput && dateInput.value){
    emp.documents.expiryStart = new Date(dateInput.value + "T00:00:00").getTime();
  }

  saveEmployees();

  openLinePage(empId);
  alert("LINE Saved ✔");
}
function toggleLine(id){
  const emp = employees.find(e => e.id === id);

  emp.documents.lineEnabled = !emp.documents.lineEnabled;

  saveEmployees();
  showUI();
}
function copyAddress() {
  const addr = document.getElementById("walletAddress").value;
  navigator.clipboard.writeText(addr);
  alert("Address copied");
}
function openTransactions(empId){

  const emp = employees.find(e => String(e.id) === String(empId));

  if (!emp) {
    document.getElementById("app").innerHTML = `
      <div class="screen">
        <div class="panel">
          <div class="card" style="color:red">
            Employee not found
          </div>
          <button onclick="history.back()" class="logout">⬅ Back</button>
        </div>
      </div>
    `;
    return;
  }

  pushPage(() => openTransactions(empId));

  let txArray = [];

  try {
    txArray = Array.isArray(emp.transactions) ? emp.transactions : [];
  } catch (e) {
    txArray = [];
  }

  const txs = txArray.slice(-10).reverse();
  const isAdmin = currentUser.type === "admin";

  document.getElementById("app").innerHTML = `
    <div class="screen">

      <img src="images/employee-bg.png" class="bg-full">

      <div class="panel">

        <!-- ✅ ACCOUNT HEADER (FIXED - ONLY ONE VERSION) -->
        ${isAdmin ? `
          <div style="
            display:flex;
            gap:8px;
            margin-bottom:15px;
            width:100%;
            box-sizing:border-box;
          ">

            <input
              id="txAccountName"
              value="${emp.accountName || emp.name || ''}"
              placeholder="Account Name"
              style="
                flex:1;
                padding:12px;
                border-radius:12px;
                border:1px solid rgba(255,215,0,.25);
                background:rgba(255,255,255,.08);
                color:#fff;
              "
            >

            <input
              id="txAccountNumber"
              value="${emp.accountNumber || emp.iban || ''}"
              placeholder="Account Number"
              style="
                flex:1;
                padding:12px;
                border-radius:12px;
                border:1px solid rgba(255,215,0,.25);
                background:rgba(255,255,255,.08);
                color:#fff;
              "
            >

          </div>

          <button onclick="saveAccountHeader('${emp.id}')"
            style="
              width:100%;
              margin-bottom:15px;
              padding:10px;
              background:#00e676;
              border:none;
              border-radius:10px;
            ">
            💾 Save Account Info
          </button>
        ` : ""}

        <h3 style="text-align:center;margin-bottom:10px;">
          ${emp.name} Transactions
        </h3>

        ${txs.length === 0 ? `
          <div class="card">No Transactions</div>
        ` : txs.map(t => `
          <div class="card" style="
            margin-bottom:12px;
            background:rgba(255,255,255,.06);
            border:1px solid rgba(255,215,0,.25);
            border-radius:14px;
            padding:12px;
          ">

            <div style="margin-bottom:8px">
              <b>📅 Date:</b> ${t?.date || "-"}
            </div>

            <div style="margin-bottom:8px">
              <b>🧾 Type:</b> ${t?.type || "-"}
            </div>

            <div style="margin-bottom:8px;color:#ffd54f">
              <b>⬅ Before:</b> €${formatNumber(t.before)}
            </div>

            <div style="
              margin-bottom:8px;
              color:${t.amount < 0 ? '#ff5252' : '#00e676'};
            ">
              <b>💸 Amount:</b>
              ${t.amount < 0 ? "-" : "+"}${formatNumber(Math.abs(t.amount))} €
            </div>

            <div style="
              color:#00e676;
              font-weight:bold;
              background:rgba(255,255,255,.06);
              border:1px solid rgba(255,215,0,.25);
              border-radius:10px;
              padding:10px;
              margin-top:8px;
            ">
              ➡ After: €${formatNumber(t.after)}
            </div>

            ${t?.receipt ? `
              <div style="margin-top:10px;color:#2196f3;word-break:break-word;">
                <b>📄 Receipt:</b> ${t.receipt}
              </div>
            ` : ""}

          </div>
        `).join("")}

        <button onclick="history.back()" class="logout">
          ⬅ Back
        </button>

      </div>
    </div>
  `;
}
function addTx(empId){
  const emp = employees.find(e => e.id === empId);
  if(!emp.transactions) emp.transactions = [];

  emp.transactions.push({
    date: "",
    type: "",
    before: "",
    amount: "",
    after: "",
    receipt: ""
  });

  saveEmployees();
  openTxEditor(empId);
}
function deleteTx(empId, index){
  const emp = employees.find(e => e.id === empId);
  if(!emp?.transactions) return;

  emp.transactions.splice(index,1);
  saveEmployees();
  openTxEditor(empId);
}
function openTxEditor(empId){

  const emp = employees.find(e => e.id === empId);
  if(!emp) return;

  if(!Array.isArray(emp.transactions)) emp.transactions = [];

  document.getElementById("app").innerHTML = `
    <div class="screen">
      <img src="images/employee-bg.png" class="bg-full">

      <div class="panel">

        <h3 style="
  text-align:center;
  color:#fff;
  margin-bottom:15px;
">
  ${emp.name} Transactions Editor
</h3>

        <button onclick="addTx('${emp.id}')" class="add-btn">
          ➕ Add Transaction
        </button>

        <!-- ✅ اضافه شده: ذخیره همه تغییرات -->
        <button onclick="saveTxChanges('${emp.id}')" 
          style="
            width:100%;
            margin:10px 0 15px 0;
            padding:10px;
            background:#2196f3;
            border:none;
            border-radius:10px;
            color:white;
            font-weight:bold;
          ">
          💾 Save All Changes
        </button>

        ${emp.transactions.map((t, i) => `
          <div class="card">

            <input class="tx-date"
              value="${t.date}"
              placeholder="Date">

            <input class="tx-type"
              value="${t.type}"
              placeholder="Type">

            <input class="tx-before"
              value="${t.before}"
              placeholder="Before">

            <input class="tx-amount"
              value="${t.amount}"
              placeholder="Amount">

            <input class="tx-receipt"
              value="${t.receipt}"
              placeholder="Receipt">

            <div style="
  color:#00e676;
  margin:12px 0;
  font-weight:bold;
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,215,0,.25);
  border-radius:12px;
  padding:10px;
">

              After: ${Number(t.before || 0) + Number(t.amount || 0)}
            </div>

            <button onclick="saveTx('${emp.id}')">
              💾 Save
            </button>

            <button onclick="deleteTx('${emp.id}', ${i})">
              🗑 Delete
            </button>

          </div>
        `).join("")}

        <button onclick="showUI()" class="logout">
          ⬅ Back
        </button>

      </div>
    </div>
  `;
}
function saveTxChanges(empId){

  const emp = employees.find(e => e.id === empId);
  if(!emp) return;

  // تغییرات از قبل داخل emp.transactions اعمال شده
  // فقط ذخیره واقعی انجام میدیم
  saveEmployees();

  // رفرش صفحه
  openTxEditor(empId);
}
function saveTx(empId){

  const emp = employees.find(e => e.id === empId);
  if(!emp) return;

  const cards = document.querySelectorAll(".card");

  const txs = [];

  cards.forEach(card => {

    const inputs = card.querySelectorAll("input");
    if(inputs.length < 5) return;

    const before = Number(inputs[2].value || 0);
    const amount = Number(inputs[3].value || 0);

    txs.push({
      date: inputs[0].value,
      type: inputs[1].value,
      before: before,
      amount: amount,
      after: before + amount,
      receipt: inputs[4].value
    });

  });

  emp.transactions = txs;

  saveEmployees();

  alert("Transactions Saved");

  openTxEditor(empId);
}
function formatMoney(num){
  return Number(num || 0).toLocaleString("en-US");
}

function startClock(){
  setInterval(() => {
    const now = new Date();

    const d = now.getDate();
    const m = now.getMonth()+1;
    const y = now.getFullYear();

    const h = String(now.getHours()).padStart(2,'0');
    const min = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');

    const el = document.getElementById("clock");
    if(el){
      el.innerHTML = `📅 ${d}/${m}/${y} ⏱ ${h}:${min}:${s}`;
    }
  }, 1000);
}
let lineTimerInterval = null;

function startLineCountdown(emp){

  const el = document.getElementById("lineCountdown");
  if(!el) return;

  if (lineTimerInterval) {
    clearInterval(lineTimerInterval);
  }

  const start = emp.documents?.expiryStart || Date.now();
  const end = start + (5 * 365 * 24 * 60 * 60 * 1000);
  const total = end - start;

  function getColor(percent){
    if(percent > 0.6) return "#00ff6a"; // سبز
    if(percent > 0.3) return "#ffd400"; // زرد
    return "#ff3b3b"; // قرمز
  }

  function update(){

  const now = Date.now();
  const diff = end - now;

  if(diff <= 0){
    el.innerHTML = `
      <div style="color:#ff3b3b;font-weight:bold;">
        ⛔ EXPIRED €
      </div>
      <div style="
        margin-top:6px;
        font-size:12px;
        color:#ffd400;
        letter-spacing:1px;
      ">
        Mastercard · Commerzbank
      </div>
    `;

    clearInterval(lineTimerInterval);
    return;
  }

  const percent = diff / total;

  const color =
    percent > 0.6 ? "#00ff6a" :
    percent > 0.3 ? "#ffd400" :
                     "#ff3b3b";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  el.innerHTML = `
    <div style="
      font-size:18px;
      font-weight:600;
      color:${color};
      letter-spacing:1px;
    ">
      ⏳ ${days}D ${hours}H ${mins}M ${secs}S €
    </div>

    <div style="
      margin-top:6px;
      font-size:12px;
      color:#ffd400;
      display:flex;
      justify-content:center;
      gap:8px;
      letter-spacing:1px;
    ">
      <span>Mastercard</span>
      <span>•</span>
      <span>Commerzbank</span>
    </div>
  `;
}
  update();
  lineTimerInterval = setInterval(update, 1000);
}
function saveAccountHeader(empId){

  const emp = employees.find(e => e.id === empId);
  if(!emp) return;

  emp.accountName = document.getElementById("txAccountName").value;
  emp.accountNumber = document.getElementById("txAccountNumber").value;

  saveEmployees();

  alert("Account Info Saved ✔");
}
function getDocs(emp){

  if (
    Array.isArray(emp?.documents?.files) &&
    emp.documents.files.length
  ){
    return emp.documents.files;
  }

  return [];
}

function openDocumentsPage(){

  pushPage(() => showUI());

  const emp =
    currentUser?.type === "admin"
      ? employees[0]
      : employees.find(e => e.id === currentUser?.emp?.id);

  if(!emp){
    document.getElementById("app").innerHTML = `
      <div class="screen">
        <div class="panel">
          <div style="color:red;text-align:center;padding:20px">
            Employee not found
          </div>
          <button onclick="showUI()" class="logout">⬅ Back</button>
        </div>
      </div>
    `;
    return;
  }

  const docs = getDocs(emp) || [];
  const sidebar = emp.sidebarMedia?.images || [];

  document.getElementById("app").innerHTML = `
    <div class="screen">

      <img src="images/employee-bg.png" class="bg-full">

      <div class="panel">

        <h2 style="text-align:center;margin-bottom:15px;">
          📄 Documents
        </h2>

        <!-- MAIN DOCUMENTS -->
        ${docs.map(img => `
  <div class="card" style="overflow:hidden;max-height:250px;">

    <img
      src="${img}"
      style="
        width:100%;
        height:200px;
        object-fit:cover;
        display:block;
        border-radius:12px;
      "
      onclick="showImageViewer('${img}')"
      onerror="this.parentElement.innerHTML='<div style=color:red;padding:20px;text-align:center>Image Not Found</div>'"
    >
  </div>
`).join("")}
        <!-- SIDEBAR MEDIA -->
        <h3 style="text-align:center;color:white;margin-top:25px;">
          📁 Sidebar Media
        </h3>

        ${sidebar.length > 0 ? sidebar.map(img => `
          <div class="card" style="overflow:hidden;max-height:200px;">
            <img
              src="${img}"
              style="width:100%;height:180px;object-fit:cover;display:block;border-radius:12px;"
              onclick="window.open('${img}','_blank')"
            >
          </div>
        `).join("") : `
          <div style="text-align:center;color:white;opacity:0.7;margin-top:10px;">
            No Sidebar Media
          </div>
        `}

        <button onclick="showUI()" class="logout" style="margin-top:15px;">
          ⬅ Back
        </button>

      </div>
    </div>
  `;
}
function openSidebarMediaPage(empId){

  pushPage(() => showUI());

  const emp = employees.find(e => e.id === empId);

  if(!emp){
    document.getElementById("app").innerHTML = `
      <div class="screen">
        <div class="panel">
          <div style="color:red;text-align:center;padding:20px">
            Employee not found
          </div>
          <button onclick="showUI()" class="logout">⬅ Back</button>
        </div>
      </div>
    `;
    return;
  }

  if(!emp.sidebarMedia){
    emp.sidebarMedia = { images: [] };
  }

  if(!Array.isArray(emp.sidebarMedia.images)){
    emp.sidebarMedia.images = [];
  }

  const images = emp.sidebarMedia.images;

  document.getElementById("app").innerHTML = `
    <div class="screen">

      <img src="images/employee-bg.png" class="bg-full">

      <div class="panel">

        <h2 style="text-align:center;margin-bottom:15px;">
          📁 Sidebar Media Manager
        </h2>

        <!-- INPUT -->
        <div class="card">

          <input
            id="sidebarInput"
            type="text"
            placeholder="Paste Image URL"
          >

          <button
            onclick="addSidebarImage('${emp.id}')"
            style="
              width:100%;
              margin-top:10px;
              background:#4caf50;
              color:white;
              border:none;
              padding:10px;
              border-radius:10px;
            ">
            ➕ Add Image
          </button>

        </div>

        <!-- IMAGES -->
        ${images.length > 0 ? images.map((img, i) => `
          <div class="card" style="overflow:hidden;max-height:220px;">

            <img
              src="${img}"
              style="width:100%;height:180px;object-fit:cover;border-radius:12px;"
            >

            <button
              onclick="deleteSidebarImage('${emp.id}', ${i})"
              style="
                background:red;
                margin-top:10px;
                width:100%;
                color:white;
                border:none;
                padding:10px;
                border-radius:10px;
              ">
              🗑 Delete
            </button>

          </div>
        `).join("") : `
          <div style="text-align:center;color:white;opacity:0.7;margin-top:10px;">
            No Sidebar Media
          </div>
        `}

        <button onclick="showUI()" class="logout">
          ⬅ Back
        </button>

      </div>

    </div>
  `;
}
function addSidebarImage(empId){

  const emp = employees.find(e => e.id === empId);
  if(!emp) return;

  const input = document.getElementById("sidebarInput");
  if(!input) return;

  const url = input.value.trim();
  if(!url) return;

  if(!emp.sidebarMedia){
    emp.sidebarMedia = { images: [] };
  }

  if(!Array.isArray(emp.sidebarMedia.images)){
    emp.sidebarMedia.images = [];
  }

  emp.sidebarMedia.images.push(url);

  saveEmployees();

  input.value = ""; // پاک کردن input

  openSidebarMediaPage(empId);
}
function deleteSidebarImage(empId, index){

  const emp = employees.find(e => e.id === empId);
  if(!emp) return;

  if(!emp.sidebarMedia){
    emp.sidebarMedia = { images: [] };
  }

  if(!Array.isArray(emp.sidebarMedia.images)){
    emp.sidebarMedia.images = [];
  }

  emp.sidebarMedia.images.splice(index, 1);

  saveEmployees();
  openSidebarMediaPage(empId);
}
function uploadSidebarImage(empId){

  const input = document.getElementById("sidebarFile");

  // 🔥 DEBUG مهم
  console.log("INPUT:", input);
  console.log("FILES:", input?.files);

  if(!input || !input.files || input.files.length === 0){
    alert("آپلود فایلد - هیچ فایلی انتخاب نشده");
    return;
  }

  const file = input.files[0];

  const emp = employees.find(e => e.id === empId);

  if(!emp){
    alert("Employee not found");
    return;
  }

  const reader = new FileReader();

  reader.onload = function(){

    if(!emp.sidebarMedia){
      emp.sidebarMedia = { images: [] };
    }

    emp.sidebarMedia.images.push(reader.result);

    saveEmployees();

    setTimeout(() => {
      openSidebarMediaPage(empId);
    }, 300);
  };

  reader.onerror = function(){
    alert("File read error");
  };

  reader.readAsDataURL(file);
}

function openAdminPage(){

  pushPage(() => showUI()); // ✅ اضافه شد برای بک گوشی

  document.getElementById("app").innerHTML = `
    <div style="
      position:fixed;
      inset:0;
      background:url('images/employee-bg.png') center/cover;
    ">

      <div style="
        position:absolute;
        inset:20px;
        background:rgba(255,255,255,0.2);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);

        display:flex;
        justify-content:center;
        align-items:center;

        color:white;
        font-size:30px;
        font-weight:bold;
      ">
        GLASS TEST
      </div>

    </div>
  `;
}
function addPdf(empId){

  const emp = employees.find(e => e.id === empId);
  if(!emp) return;

  if(!emp.documents) emp.documents = {};
  if(!Array.isArray(emp.documents.files)) emp.documents.files = [];

  const url = prompt("Enter PDF / Image URL:");

  if(!url) return;

  emp.documents.files.push(url);

  saveEmployees();
  openPdfEditor(empId);
}
function openPdfEditor(empId){

  pushPage(() => showUI()); // ✅ اضافه شد برای بک گوشی

  const emp = employees.find(e => e.id === empId);
  if(!emp) return;

  if(!emp.documents) emp.documents = {};
  if(!Array.isArray(emp.documents.files)) emp.documents.files = [];

  document.getElementById("app").innerHTML = `
    <div class="screen">
      <img src="images/employee-bg.png" class="bg-full">

      <div class="panel">

        <h3 style="
          text-align:center;
          color:#fff;
          margin-bottom:15px;
        ">
          📄 PDF Manager - ${emp.name}
        </h3>

        <button onclick="addPdf('${emp.id}')"
          style="
            width:100%;
            margin-bottom:15px;
            padding:12px;
            background:#00e676;
            color:#000;
            border:none;
            border-radius:12px;
            font-weight:bold;
          ">
          ➕ Add PDF / File
        </button>

        ${emp.documents.files.length === 0 ? `

          <div class="card">
            No Files
          </div>

        ` : emp.documents.files.map((file, i) => `

          <div class="card" style="
            background:rgba(255,255,255,.06);
            border:1px solid rgba(255,215,0,.25);
            border-radius:14px;
            padding:12px;
            margin-bottom:12px;
          ">

            <div style="
              word-break:break-all;
              color:#fff;
              margin-bottom:12px;
            ">
              📎 ${file}
            </div>

            <div style="
              display:flex;
              gap:8px;
              flex-wrap:wrap;
            ">

              <button
                onclick="window.open('${file}','_blank')"
                style="
                  flex:1;
                  min-width:100px;
                ">
                📂 Open File
              </button>

              <button
                onclick="window.open('${file}','_blank')"
                style="
                  flex:1;
                  min-width:100px;
                ">
                👁 View
              </button>

              <button
                onclick="deletePdf('${emp.id}', ${i})"
                style="
                  flex:1;
                  min-width:100px;
                  background:#f44336;
                  color:#fff;
                ">
                🗑 Delete
              </button>

            </div>

          </div>

        `).join("")}

        <button onclick="showUI()" class="logout">
          ⬅ Back
        </button>

      </div>
    </div>
  `;
}
function deletePdf(empId, index){

  const emp = employees.find(e => e.id === empId);
  if(!emp) return;

  if(!emp.documents) emp.documents = {};
  if(!Array.isArray(emp.documents.files)) emp.documents.files = [];

  emp.documents.files.splice(index, 1);

  saveEmployees();
  openPdfEditor(empId);
}
function saveEmployees(){

  // ذخیره لوکال (بکاپ)
  localStorage.setItem(
    "employees",
    JSON.stringify(employees)
  );

  // ذخیره روی Firebase
  db.ref("employees")
    .set(employees)
    .then(() => {
      console.log("Employees saved to Firebase");
    })
    .catch((err) => {
      console.error("Firebase Save Error:", err);
    });

}
function saveChats() {

  // بکاپ داخل گوشی
  localStorage.setItem(
    "chats",
    JSON.stringify(chats)
  );

  // ذخیره روی Firebase
  db.ref("chats")
    .set(chats)
    .catch(err => {
      console.error(err);
    });

}
function openChat(empId){

currentChatEmpId = empId;

  pushPage(() => showUI()); // ✅ فقط اضافه شد (Back stack)

  const emp = employees.find(e => e.id === empId);

  if(!chats[empId]){
    chats[empId] = [];
  }

  if(currentUser.type === "admin"){

    chats[empId].forEach(m => {
      if(m.from === "employee"){
        m.seenByAdmin = true;
      }
    });

  }else{

    chats[empId].forEach(m => {
      if(m.from === "admin"){
        m.seen = true;
      }
    });

  }

  if (!window.isRefreshingChat) {
  saveChats();
}

setTimeout(() => {
  const chatBox = document.getElementById("chatBox");
  if(chatBox){
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}, 50);

  document.getElementById("app").innerHTML = `
  <div style="
    padding:20px;
    height:100dvh;
    display:flex;
    flex-direction:column;
    box-sizing:border-box;
    background:rgba(15,23,42,0.95);
  ">

      <button
        onclick="showUI()"
        style="
          margin-bottom:15px;
          padding:10px 15px;
          border:none;
          border-radius:8px;
        ">
        ⬅ Back
      </button>

      <h2 style="
  margin-top:15px;
  color:white;
  text-align:center;
">
  Chat - ${emp.name}
</h2>

<div
  id="chatBox"
  style="
    flex: 1;
    overflow-y: auto;
    border-radius: 16px;
    padding: 12px;
    margin-top: 15px;

    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);

    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);

    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  "
>

  ${chats[empId].map((m,i)=>`
    <div style="
      margin-bottom:10px;
      padding:10px;
      border-radius:12px;

      background:${
        m.from === 'admin'
          ? 'linear-gradient(135deg, rgba(34,197,94,.25), rgba(22,163,74,.15))'
          : 'rgba(255,255,255,.08)'
      };

      border:1px solid rgba(255,255,255,.12);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color:white;
    ">

      <div style="font-weight:bold;margin-bottom:4px;">
        ${m.from}
      </div>

      <div style="font-size:11px;color:rgba(255,255,255,.6)">
        ${new Date(m.date).toLocaleString()}
      </div>

      <div style="margin-top:6px;">
        ${m.text || ""}
      </div>

      ${m.file ? `
        <div style="margin-top:8px;">
          ${
            (m.file.type || "").startsWith("image/")
            ? `
              <img
                src="${m.file.data}"
                onclick="openImageFull('${m.file.data}')"
                style="
                  max-width:220px;
                  width:100%;
                  border-radius:12px;
                  cursor:pointer;
                  border:1px solid rgba(255,255,255,0.2);
                "
              >
            `
            : `
              <a
                href="${m.file.data}"
                download="${m.file.name}"
                style="color:#fff;">
                📎 ${m.file.name}
              </a>
            `
          }
        </div>
      ` : ""}

      <div style="margin-top:6px;font-size:12px;color:rgba(255,255,255,.6)">
        ${
          m.from === "admin"
            ? (m.seen ? "✓✓" : "✓")
            : (m.seenByAdmin ? "✓✓" : "✓")
        }
      </div>

      <button
        onclick="deleteMessage('${empId}',${i})"
        style="
          margin-top:6px;
          background:red;
          color:white;
          border:none;
          padding:4px 8px;
          border-radius:6px;
          cursor:pointer;
        ">
        🗑 حذف
      </button>

    </div>
  `).join('')}

</div>

<!-- INPUT AREA -->
<div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">

  <textarea
    id="msgText"
    placeholder="Message..."
    style="
      width:100%;
      height:70px;
      border-radius:12px;
      padding:10px;
      border:none;
      outline:none;
      background:rgba(255,255,255,0.08);
      color:white;
      backdrop-filter: blur(10px);
    ">
  </textarea>

  <label
    for="chatFile"
    style="
      background:#4caf50;
      color:white;
      text-align:center;
      padding:10px;
      border-radius:10px;
      cursor:pointer;
    ">
    📎 انتخاب فایل
  </label>

  <input type="file" id="chatFile" accept="image/*,.pdf" style="display:none">

<div id="fileName" style="
  font-size:12px;
  color:rgba(255,255,255,0.7);
  margin-top:4px;
  text-align:center;
"></div>

  <button
    onclick="sendChat('${empId}')"
    style="
      width:100%;
      padding:12px;
      border-radius:14px;
      border:none;
      background:linear-gradient(135deg,#3b82f6,#2563eb);
      color:white;
      font-weight:600;
      cursor:pointer;
    ">
    Send
  </button>

</div>
  `;

  const fileInput = document.getElementById("chatFile");
  if(fileInput){
    fileInput.onchange = function(){
      const file = this.files[0];
      document.getElementById("fileName").innerHTML =
        file ? "📎 " + file.name : "";
    };
  }

  const chatBox = document.getElementById("chatBox");
  if(chatBox){
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
async function sendChat(empId){

  const txt = document
    .getElementById("msgText")
    .value
    .trim();

  const fileInput =
    document.getElementById("chatFile");

  const file =
    fileInput?.files?.[0];

  if(!txt && !file) return;

  if(!chats[empId]){
    chats[empId] = [];
  }

  let fileData = null;

  if(file){

    // IMAGE
    if(file.type.startsWith("image/")){

      fileData = await new Promise((resolve,reject)=>{

        const reader = new FileReader();

        reader.onload = e => {

          const img = new Image();

          img.onload = () => {

            const canvas =
              document.createElement("canvas");

            let width = img.width;
            let height = img.height;

            const MAX_WIDTH = 1200;

            if(width > MAX_WIDTH){

              height =
                (height * MAX_WIDTH) / width;

              width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;

            const ctx =
              canvas.getContext("2d");

            ctx.drawImage(
              img,
              0,
              0,
              width,
              height
            );

            const compressed =
              canvas.toDataURL(
                "image/jpeg",
                0.7
              );

            resolve({
              name:file.name,
              type:"image/jpeg",
              data:compressed
            });

          };

          img.onerror = reject;
          img.src = e.target.result;

        };

        reader.onerror = reject;

        reader.readAsDataURL(file);

      });

    }else{

      // PDF / OTHER FILES
      if(file.size > 2000000){

        alert(
          "File size must be less than 2MB"
        );

        return;
      }

      fileData = await new Promise((resolve)=>{

        const reader = new FileReader();

        reader.onload = e => {

          resolve({
            name:file.name,
            type:file.type,
            data:e.target.result
          });

        };

        reader.readAsDataURL(file);

      });

    }

  }

  chats[empId].push({

    from:
      currentUser.type === "admin"
      ? "admin"
      : "employee",

    text: txt,

    file: fileData,

    date: Date.now(),

    seen:false,
    seenByAdmin:false

  });

  try{

    saveChats();

try {

  await fetch(
    "https://employee-app-production-46a9.up.railway.app/sendToAdmin",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        employeeId: empId,
        text: txt
      })
    }
  );

} catch (e) {

  console.error(e);

}

  }catch(err){

    chats[empId].pop();

    alert(
      "Storage full. Delete some old chat files."
    );

    console.error(err);

    return;
  }

  document.getElementById("msgText").value = "";

  if(fileInput){
    fileInput.value = "";
  }

  const fileName =
    document.getElementById("fileName");

  if(fileName){
    fileName.innerHTML = "";
  }

  const chatBox = document.getElementById("chatBox");

if (chatBox) {
  chatBox.scrollTop = chatBox.scrollHeight;
}

}
function deleteMessage(empId,index){

  if(!confirm("Delete message?")) return;

  chats[empId].splice(index,1);

  saveChats();

  openChat(empId);
}
function openImageFull(src){

  pushPage(() => closeImageFull()); // ✅ اضافه شد (Back stack)

  const modal = document.getElementById("imageModal");
  const img = document.getElementById("imageModalImg");

  if(!modal || !img) return;

  img.src = src;
  modal.style.display = "flex";
}

function closeImageFull(){
  document.getElementById("imageModal").style.display = "none";
}
let initialHeight = window.innerHeight;

window.addEventListener("resize", () => {
  const app = document.getElementById("app");

  if (window.innerHeight < initialHeight) {
    app.style.height = window.innerHeight + "px";
  } else {
    app.style.height = "100vh";
  }

  const chatBox = document.getElementById("chatBox");
  if (chatBox) {
    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
  }
});
function fixKeyboard() {
  const app = document.getElementById("app");
  const chatBox = document.getElementById("chatBox");

  if (!window.visualViewport) return;

  function update() {
    const height = window.visualViewport.height;
    app.style.height = height + "px";

    if (chatBox) {
      setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
      }, 50);
    }
  }

  window.visualViewport.addEventListener("resize", update);
  window.visualViewport.addEventListener("scroll", update);
}

// تمام توابع قبلی...

function showImageViewer(url){

  document.getElementById("app").innerHTML = `
    <div class="screen">

      <div class="panel" style="padding:0">

        <img
          src="${url}"
          style="
            width:100%;
            height:auto;
            max-height:100vh;
            object-fit:contain;
            display:block;
          "
        >

        <button
          onclick="history.back()"
          style="
            width:100%;
            padding:12px;
            border:none;
            background:red;
            color:white;
          "
        >
          ⬅ Back
        </button>

      </div>

    </div>
  `;
}
