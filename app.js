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

  // state واقعی برای جلوگیری از خروج اشتباه
  history.pushState(
    { index: pageStack.length },
    "",
    "#app"
  );
}

/* 👇 BACK SAFE HANDLER */
window.addEventListener("popstate", () => {

  // اگر فقط یک صفحه داریم → برگرد به هوم امن
  if (pageStack.length <= 1) {
    pageStack.length = 0;

    // ❌ history.back() ممنوع چون اپ رو می‌بنده
    openMainPage();
    return;
  }

  // حذف صفحه فعلی
  pageStack.pop();

  const prev = pageStack[pageStack.length - 1];

  if (typeof prev === "function") {
    prev();
  }
});

/* 👇 SAFE INIT */
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (typeof init === "function") {
      init();
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

/* ================= UTIL ================= */

function toEnglishDate(dateStr) {
  if (!dateStr) return "";

  const faToEn = {
    "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4",
    "۵":"5","۶":"6","۷":"7","۸":"8","۹":"9"
  };

  return dateStr.replace(/[۰-۹]/g, d => faToEn[d]);
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

  if (v("otp") !== otpCode)
    return alert("Wrong OTP");

  showLoadingScreen();

}

/* ================= UI ================= */

const loadingStyle = document.createElement("style");

loadingStyle.innerHTML = `
@keyframes spin{
  from{transform:rotate(0deg);}
  to{transform:rotate(360deg);}
}

@keyframes pulse{

  0%{
    box-shadow:
    0 0 20px #ffd700,
    0 0 50px #ffd700;
  }

  50%{
    box-shadow:
    0 0 40px #ffd700,
    0 0 100px #ffd700,
    0 0 160px rgba(255,215,0,.8);
  }

  100%{
    box-shadow:
    0 0 20px #ffd700,
    0 0 50px #ffd700;
  }

}
`;

document.head.appendChild(loadingStyle);

let selectedEmpId = null;

function showLoadingScreen(){

  document.getElementById("app").innerHTML = `

  <div style="
    height:100vh;
    background:#030303;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    color:#ffd700;
    font-family:Consolas;
  ">

    <h2>AUTH SUCCESS</h2>
    
<div id="masterLogo"
style="
width:180px;
height:180px;
border-radius:50%;
border:2px solid #ffd700;
display:flex;
align-items:center;
justify-content:center;
margin-bottom:20px;
box-shadow:
0 0 20px #ffd700,
0 0 50px #ffd700;

animation:
spin 8s linear infinite,
pulse 2s ease-in-out infinite;
">

<div style="text-align:center">

<div style="
font-size:22px;
font-weight:bold;
color:#ffd700;
">
MASTERCARD
</div>

<div style="
font-size:12px;
letter-spacing:3px;
color:#00ff88;
margin-top:8px;
">
ARIAN ROY
</div>

</div>

</div>

<div style="
color:#00ff88;
margin-bottom:20px;
text-align:center;
letter-spacing:2px;
">
Arian Urban Development Company
</div>

<div id="secureText"
style="
color:#00ff88;
font-size:12px;
letter-spacing:2px;
margin-bottom:15px;
text-align:center;
text-shadow:
0 0 10px #00ff88,
0 0 20px #00ff88;
">
SYSTEM AUTHENTICATION
</div>

    <div id="percent"
      style="
      font-size:70px;
      margin:20px;
    ">
      0%
    </div>

    <div style="
      width:300px;
      height:12px;
      border:1px solid #ffd700;
    ">
      <div id="fill"
        style="
        width:0%;
        height:100%;
        background:#ffd700;
        box-shadow:
        0 0 10px #ffd700,
        0 0 20px #ffd700,
        0 0 40px #ffd700;
      ">
      </div>
    </div>

  </div>

<div id="secureText"
style="
color:#00ff88;
font-size:12px;
letter-spacing:2px;
margin-bottom:15px;
text-align:center;
text-shadow:
0 0 10px #00ff88,
0 0 20px #00ff88;
">
SYSTEM AUTHENTICATION
</div>

  `;

  const secureText =
    document.getElementById("secureText");
    let blink = true;

setInterval(() => {

  if (!secureText) return;

  if (blink) {
    secureText.innerText += " █";
  } else {
    secureText.innerText =
      secureText.innerText.replace(" █", "");
  }

  blink = !blink;

}, 500);

  let p = 0;

  const timer = setInterval(() => {

    p++;

if(p > 20)
  secureText.innerText =
    "SECURE CONNECTION";

if(p > 50)
  secureText.innerText =
    "ENCRYPTING SESSION";

if(p > 80)
  secureText.innerText =
    "AUTHORIZATION CHECK";

    document.getElementById("percent").innerText =
      p + "%";

    document.getElementById("fill").style.width =
      p + "%";

    if (p >= 100){

  clearInterval(timer);

  document.querySelector("h2").innerText =
    "LOADING COMPLETE";

  setTimeout(() => {

  const txt = "VERIFYING USER...";
  let i = 0;

  document.querySelector("h2").innerText = "";

  const typing = setInterval(() => {

    document.querySelector("h2").innerText +=
      txt.charAt(i);

    i++;

    if(i >= txt.length){
      clearInterval(typing);
    }

  }, 80);

}, 700);

  setTimeout(() => {

    document.querySelector("h2").innerText =
      "✓ VERIFIED";

  }, 1700);

  setTimeout(() => {

  const userName =
    currentUser?.emp?.name ||
    currentUser?.name ||
    "User";

const userRole =
    currentUser?.type === "admin"
      ? "👑 ADMIN"
      : "👤 EMPLOYEE";

document.querySelector("h2").innerHTML =

    "ACCESS GRANTED<br><br>" +
    "Welcome<br>" +
    userName +
    "<br><br>" +
    userRole;

}, 2700);

setTimeout(() => {

  showUI();

}, 5000);

}

  }, 30);

}

function showUI() {

  console.log("SHOWUI CALLED", currentUser);

  if (!currentUser) {
    console.log("NO USER");
    showLogin();
    return;
  }

  const isAdmin = currentUser.type === "admin";
  const list = isAdmin ? employees : [currentUser.emp];

  // ===== کم کردن ۱ تومان به ازای هر بار ورود (فقط برای کارمندان) =====
  if (!isAdmin && currentUser.emp) {
    chargeForLogin(currentUser.emp);
  }
  // ==========================================

  pushPage(() => showUI());

  if (!isAdmin) {
    selectedEmpId = currentUser.emp.id;
  }

  document.getElementById("app").innerHTML = `
    <div class="screen">

      <img src="images/employee-bg.png" class="bg-full">

      <div id="sidebar" class="sidebar">

        <img src="images/telegram.png"
             onclick="openTelegram()">

        <img src="images/trustwallet.png"
             onclick="openWalletPage()">

        <img src="images/mypdf.jpg"
             onclick="openDocumentsPage()">

      </div>

      <div class="menu-btn" onclick="toggleMenu()">
        ☰
      </div>

      <div class="panel">

        ${isAdmin ? `
          <button onclick="addEmployee()" class="btn-add">
            ➕ Add Employee
          </button>
        ` : ""}

        ${list.map(emp => `
          <div style="margin-bottom:10px; padding:8px; border:1px solid rgba(255,215,0,0.1); border-radius:10px;">
            <div onclick="selectedEmpId='${emp.id}'">
              ${card(emp, isAdmin)}
            </div>
            ${isAdmin ? `
              <button onclick="chargeEmployee('${emp.id}')" style="
                width:100%;
                margin-top:6px;
                padding:8px;
                background:#ff9800;
                color:white;
                border:none;
                border-radius:8px;
                font-weight:bold;
                font-size:13px;
                cursor:pointer;
              ">
                💰 شارژ موجودی
              </button>
            ` : ""}
          </div>
        `).join("")}

        <button class="logout" onclick="showLogin()">
          LOGOUT
        </button>

      </div>

    </div>
  `;

  requestAnimationFrame(() => {

    const screen = document.querySelector(".screen");

    if (screen) {
      screen.classList.remove("fade-in");
      void screen.offsetWidth;
      screen.classList.add("fade-in");
    }

  });

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

        <button onclick="
window.isAdmin=true;
openLinePage('${emp.id}');
">
  📡 Manage LINE
</button>

<button onclick="openPdfEditor('${emp.id}')">
  📄 Manage PDF
</button>

` : `

${emp.documents?.lineEnabled ? `
  <button onclick="
  window.isAdmin=false;
  openLinePage('${emp.id}');
  ">
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
    // ۱. گرفتن اطلاعات از کاربر
    const name = prompt("نام کارمند را وارد کنید:");
    if (!name) return;

    const phone = prompt("شماره موبایل را وارد کنید:");
    if (!phone) return;

    const passport = prompt("کد پرسنلی را وارد کنید:");
    if (!passport) return;

    const salary = prompt("حقوق را وارد کنید:") || "0";
    const iban = prompt("شماره شبا را وارد کنید:") || "";
    const cardNumber = prompt("شماره کارت را وارد کنید:") || "";
    const account = prompt("شماره حساب را وارد کنید:") || "";
    const expiry = prompt("تاریخ انقضا (مثلاً 12/26) را وارد کنید:") || "";
    const ccv2 = prompt("کد CCV2 را وارد کنید:") || "";
    const zip = prompt("کد پستی را وارد کنید:") || "";
    const pass = prompt("رمز عبور کارمند را وارد کنید:") || "1234";

    // ۲. ساختن کارمند جدید با همه فیلدها
    employees.push({
        id: String(Date.now()),
        passport: passport,
        name: name,
        salary: salary,
        iban: iban,
        cardNumber: cardNumber,
        account: account,
        status: "OFFLINE",
        expiry: expiry,
        ccv2: ccv2,
        zip: zip,
        phone: phone,
        pass: pass,
        balance: 0,
        documents: {
            lineEnabled: false,
            lineName: "",
            lineCode: "",
            expiryStart: Date.now(),
            files: [],
            price: ""
        },
        sidebarMedia: { images: [] },
        transactions: []
    });

    // ۳. ذخیره در دیتابیس
    saveEmployees();

    // ۴. پیغام موفقیت
    alert("✅ کارمند با موفقیت اضافه شد!");

    // ۵. رفرش صفحه
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
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  sidebar.classList.toggle("active");
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
function openLinePage(empId) {
    const emp = employees.find(
        e => String(e.id) === String(empId)
    );

    if (!emp.documents) {
        emp.documents = {};
    }

    if (emp.documents.stopCPU === undefined) {
        emp.documents.stopCPU = false;
    }

    if (emp.documents.stopRAM === undefined) {
        emp.documents.stopRAM = false;
    }

    if (emp.documents.stopNetwork === undefined) {
        emp.documents.stopNetwork = false;
    }

    if (emp.documents.stopLogs === undefined) {
        emp.documents.stopLogs = false;
    }

    if (emp.documents.stopMovement === undefined) {
        emp.documents.stopMovement = false;
    }

    if (emp.documents.stopSignal === undefined) {
        emp.documents.stopSignal = false;
    }

    if (!emp || !emp.documents?.lineEnabled) {
        alert("LINE Panel Disabled");
        return;
    }

    const start = emp.documents.expiryStart || Date.now();
    const end = start + (5 * 365 * 24 * 60 * 60 * 1000);

    const startText = new Date(start).toLocaleDateString("en-US");
    const endText = new Date(end).toLocaleDateString("en-US");

    pushPage(() => openLinePage(empId));
    document.getElementById("app").innerHTML = `

  <div class="screen">  <img src="images/employee-bg.png" class="bg-full">  

<div class="scan"></div>  

<div class="access">  
  ACCESS GRANTED  
</div>  

<div class="dashboard">  

 <div class="cyber-panel">  

    <div class="cyber-title">  
      SERVER LOAD  
    </div>  

    CPU  

    <div class="bar">  
      <div id="cpu" class="fill"></div>  
    </div>  

    <br>  

    RAM  

    <div class="bar">  
      <div id="ram" class="fill"></div>  
    </div>  

    <br>  

    NETWORK  

    <div class="bar">  
      <div id="network" class="fill"></div>  
    </div>  

  </div>  

  <div class="cyber-panel">  

    <div class="cyber-title">  
      NETWORK ${emp.documents.Codeline || "Hanover 5690"}  
    </div>  

    <div style="margin:6px 0;">

ASIA:
<span class="online-blink">
${emp.documents.stopNetwork ? "STOPPED" : "ONLINE"}
</span>

</div>  <div style="margin:6px 0;">  
  EUROPE:  
  <span class="online-blink">  
    ${emp.documents.stopNetwork ? "STOPPED" : "ONLINE"}  
  </span>  
</div>  <div style="margin:6px 0;">  
  AMERICA:  
  <span class="online-blink">  
    ${emp.documents.stopNetwork ? "STOPPED" : "ONLINE"}  
  </span>  
</div>  <div style="margin:6px 0;">  
  AFRICA:  
  <span class="online-blink">  
    ${emp.documents.stopNetwork ? "STOPPED" : "ONLINE"}  
  </span>  
</div>  </div>  

  <div class="cyber-panel">

<div style="font-size:12px;opacity:.7;">
  START DATE
</div>

<input
id="startDate"
type="text"
${window.isAdmin ? "" : "readonly"}
value="${new Date(start).toISOString().split('T')[0]}"
placeholder="YYYY-MM-DD"
style="
width:100%;
margin-bottom:10px;
background:${window.isAdmin ? '#001f12' : 'transparent'};
border:${window.isAdmin ? '1px solid #00ff88' : 'none'};
outline:none;
box-shadow:none;
color:#00ff88;
padding:6px;
${window.isAdmin ? '' : 'opacity:.8;'}
"
>

<div style="font-size:12px;opacity:.7;">
  END DATE
</div>

<input
id="endDate"
type="text"
${window.isAdmin ? "" : "readonly"}
value="${new Date(end).toISOString().split('T')[0]}"
placeholder="YYYY-MM-DD"
style="
width:100%;
margin-bottom:10px;
background:${window.isAdmin ? '#001f12' : 'transparent'};
border:${window.isAdmin ? '1px solid #00ff88' : 'none'};
outline:none;
box-shadow:none;
color:#00ff88;
padding:6px;
${window.isAdmin ? '' : 'opacity:.8;'}
"
>

<div style="font-size:12px;opacity:.7;">  
  LINE CODE  
</div>  <input
id="lineCodeEdit"
${window.isAdmin ? "" : "disabled"}
value="${emp.documents.lineCode || ''}"
style="
width:100%;
background:${window.isAdmin ? '#001f12' : 'transparent'};
border:${window.isAdmin ? '1px solid #00ff88' : 'none'};
outline:none;
box-shadow:none;
color:#00ff88;
padding:6px;
font-size:14px;
margin-bottom:10px;
${window.isAdmin ? '' : 'opacity:.8;'}
"

> 

${window.isAdmin ? `

<button  
onclick="saveLineData('${emp.id}')"  
style="  
width:100%;  
background:#009944;  
color:white;  
border:none;  
padding:10px;  
border-radius:8px;  
font-size:15px;  
font-weight:bold;  
margin-bottom:8px;  
">
💾 SAVE
</button>

<button  
onclick="toggleCPU('${emp.id}')"  
style="  
width:100%;  
background:#ff9800;  
color:white;  
border:none;  
padding:10px;  
border-radius:8px;  
margin-bottom:8px;  
">
⏸ CPU STOP
</button>

<button  
onclick="toggleRAM('${emp.id}')"  
style="  
width:100%;  
background:#ff5722;  
color:white;  
border:none;  
padding:10px;  
border-radius:8px;  
margin-bottom:8px;  
">
⏸ RAM STOP
</button>

<button  
onclick="toggleNetwork('${emp.id}')"  
style="  
width:100%;  
background:#9c27b0;  
color:white;  
border:none;  
padding:10px;  
border-radius:8px;  
margin-bottom:8px;  
">
⏸ NETWORK STOP
</button>

<button  
onclick="toggleLogs('${emp.id}')"  
style="  
width:100%;  
background:#f44336;  
color:white;  
border:none;  
padding:10px;  
border-radius:8px;  
margin-bottom:8px;  
">
⏸ LOG STOP
</button>

<button  
onclick="toggleMovement('${emp.id}')"  
style="  
width:100%;  
background:#e91e63;  
color:white;  
border:none;  
padding:10px;  
border-radius:8px;  
margin-bottom:8px;  
">
⏸ MOVEMENT STOP
</button>

<button  
onclick="toggleSignal('${emp.id}')"  
style="  
width:100%;  
background:#3f51b5;  
color:white;  
border:none;  
padding:10px;  
border-radius:8px;  
margin-bottom:8px;  
">
📡 SIGNAL STOP
</button>

` : `

<div class="cyber-panel mini-monitor">
    <div class="cyber-title">
        EMPLOYEE STATUS
    </div>
    <div class="status-line">
        ACCESS
        <span style="color:#00ff88;">GRANTED</span>
    </div>
    <div class="status-line">
        SECURITY
        <span style="color:#00ff88;">ACTIVE</span>
    </div>
    <div class="status-line">
        SESSION
        <span id="sessionTime">00:00:00</span>
    </div>
    <div class="status-line">
        SIGNAL
        <span id="signalValue">100%</span>
    </div>
    <div class="signal-bar">
        <div id="signalFill"></div>
    </div>
</div>

<div class="cyber-panel system-health" style="margin-top:10px; padding:8px;">
    <div class="cyber-title" style="font-size:11px; text-align:center; margin-bottom:4px;">
        🛰️ RADAR SCAN
    </div>
    <div style="display:flex; justify-content:center; align-items:center; flex-direction:column;">
        <canvas id="radarCanvas" width="130" height="130" style="background:transparent; max-width:100%;"></canvas>
        <div style="display:flex; justify-content:space-around; width:100%; margin-top:2px; font-size:8px; flex-wrap:wrap; gap:2px;">
            <span style="white-space:nowrap;">TARGETS: <span id="targetCount" style="color:#00ff88;">12</span></span>
            <span style="white-space:nowrap;">SIGNAL: <span id="signalPower" style="color:#00ff88;">94%</span></span>
            <span style="white-space:nowrap;">STATUS: <span id="scanStatus" style="color:#ff9800;">ACTIVE</span></span>
        </div>
    </div>
</div>

`}  </div>  <div class="cyber-panel earth-panel">  <div class="cyber-title">    
    GLOBAL NETWORK    
</div>    <canvas id="earth"></canvas>

<div class="network-status">
    <div class="status-title">
        NETWORK STATUS
    </div>
    <div class="status-online">
        ● ONLINE
    </div>
    <div class="status-grid" style="display:flex; justify-content:center; gap:6px; flex-wrap:wrap;">
        <div class="status-box" style="flex:0 1 auto; min-width:55px; padding:4px 6px; text-align:center; background:rgba(0,255,136,0.05); border:1px solid rgba(0,255,136,0.2); border-radius:4px;">
            <span style="font-size:8px; opacity:0.7; display:block;">NODES</span>
            <b id="nodesCount" style="display:block; font-size:12px; color:#00ff88;">1287</b>
        </div>
        <div class="status-box" style="flex:0 1 auto; min-width:55px; padding:4px 6px; text-align:center; background:rgba(0,255,136,0.05); border:1px solid rgba(0,255,136,0.2); border-radius:4px;">
            <span style="font-size:8px; opacity:0.7; display:block;">LATENCY</span>
            <b id="latency" style="display:block; font-size:12px; color:#00ff88;">48 ms</b>
        </div>
        <div class="status-box" style="flex:0 1 auto; min-width:55px; padding:4px 6px; text-align:center; background:rgba(0,255,136,0.05); border:1px solid rgba(0,255,136,0.2); border-radius:4px;">
            <span style="font-size:8px; opacity:0.7; display:block;">UPTIME</span>
            <b id="uptime" style="display:block; font-size:12px; color:#00ff88;">99.98%</b>
        </div>
    </div>
</div>
</div>  </div> 

  <div class="cyber-panel logs">  <div class="cyber-title">    
    LIVE SERVER LOG    
</div>    <div id="logArea"></div>  </div>  </div>  <div class="led"></div>  </div>    
<!-- NETWORK SIGNAL MONITOR -->
<div class="cyber-panel signal-monitor">

    <div class="signal-header">

        <div class="cyber-title">
            NETWORK SIGNAL MONITOR
        </div>

        <div class="signal-state">
            📶 STRONG SIGNAL
        </div>

    </div>

    <canvas id="signalChart" width="900" height="170"></canvas>

    <div class="signal-info">

        <div class="signal-box">
            <div class="signal-label">SIGNAL STRENGTH</div>
            <div class="signal-value" id="dbmValue">-42 dBm</div>
        </div>

        <div class="signal-box">
            <div class="signal-label">NOISE LEVEL</div>
            <div class="signal-value" id="noiseValue">-92 dBm</div>
        </div>

        <div class="signal-box">
            <div class="signal-label">PACKET LOSS</div>
            <div class="signal-value" id="lossValue">0.00%</div>
        </div>

        <div class="signal-box">
            <div class="signal-label">CONNECTION</div>
            <div class="signal-value">STABLE</div>
        </div>

    </div>

</div>
`;

    if (window.startEarth) {
        startEarth();
    }

    function startSignalChart() {
        const canvas = document.getElementById("signalChart");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let data = [];

        for (let i = 0; i < 120; i++) {
            data.push(60 + Math.random() * 60);
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = "#003d22";
            ctx.lineWidth = 1;

            for (let x = 0; x < canvas.width; x += 30) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            for (let y = 0; y < canvas.height; y += 25) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.strokeStyle = "#00ff88";
            ctx.lineWidth = 2;

            data.forEach((v, i) => {
                let x = i * (canvas.width / data.length);
                let y = canvas.height - v;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });

            ctx.stroke();

            data.shift();
            data.push(40 + Math.random() * 100);

            requestAnimationFrame(draw);
        }

        draw();
    }

    startSignalChart();

    const cpu = document.getElementById("cpu");
    const ram = document.getElementById("ram");
    const network = document.getElementById("network");

    setInterval(() => {
        if (cpu && !emp.documents.stopCPU) {
            cpu.style.width = (40 + Math.random() * 60) + "%";
        }

        if (ram && !emp.documents.stopRAM) {
            ram.style.width = (30 + Math.random() * 60) + "%";
        }

        if (network && !emp.documents.stopMovement) {
            network.style.width = (30 + Math.random() * 60) + "%";
        }
    }, 1000);

    // -------- NETWORK STATUS --------
    const nodesCount = document.getElementById("nodesCount");
    const latency = document.getElementById("latency");
    const uptime = document.getElementById("uptime");

    if (nodesCount) {
        setInterval(() => {
            nodesCount.textContent = 1200 + Math.floor(Math.random() * 400);
            latency.textContent = (20 + Math.floor(Math.random() * 40)) + " ms";
            uptime.textContent = (99.90 + Math.random() * 0.09).toFixed(2) + "%";
        }, 800);
    }

    // -------- EMPLOYEE STATUS --------
    const sessionTime = document.getElementById("sessionTime");
    const signalValue = document.getElementById("signalValue");
    const signalFill = document.getElementById("signalFill");

    let sec = 0;

    setInterval(() => {
        if (sessionTime) {
            sec++;
            const h = String(Math.floor(sec / 3600)).padStart(2, "0");
            const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
            const s = String(sec % 60).padStart(2, "0");
            sessionTime.textContent = `${h}:${m}:${s}`;
        }

        if (signalValue && signalFill) {
            const value = 85 + Math.floor(Math.random() * 16);
            signalValue.textContent = value + "%";
            signalFill.style.width = value + "%";
        }
    }, 1000);

    // -------- LIVE LOG --------
    const logs = [
        "AUTH SUCCESS",
        "DATABASE VERIFIED",
        "FIREBASE CONNECTED",
        "API RESPONSE 200",
        "TOKEN GENERATED",
        "EMPLOYEE SYNC",
        "NETWORK ACTIVE",
        "SERVER READY",
        "ENCRYPTION ENABLED",
        "BACKUP COMPLETED"
    ];

    const logArea = document.getElementById("logArea");

    setInterval(() => {
        if (emp.documents.stopLogs) return;
        if (!logArea) return;

        const div = document.createElement("div");
        div.style.margin = "4px 0";
        div.innerText = "[" + new Date().toLocaleTimeString("en-GB", { hour12: false }) + "] " + logs[Math.floor(Math.random() * logs.length)];

        logArea.appendChild(div);

        if (logArea.children.length > 18) {
            logArea.removeChild(logArea.firstChild);
        }
    }, 400);

    // -------- RADAR --------
    const radar = document.getElementById("radarCanvas");

    if (radar) {
        const ctx = radar.getContext("2d");
        let angle = 0;

        function drawRadar() {
            const w = radar.width;
            const h = radar.height;

            ctx.clearRect(0, 0, w, h);

            const cx = w / 2;
            const cy = h / 2;

            ctx.strokeStyle = "#00ff88";
            ctx.lineWidth = 1;

            for (let r = 30; r <= 90; r += 20) {
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(w, cy);
            ctx.stroke();

            ctx.strokeStyle = "#00ff88";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
                cx + Math.cos(angle) * 90,
                cy + Math.sin(angle) * 90
            );
            ctx.stroke();

            ctx.fillStyle = "#00ff88";

            for (let i = 0; i < 8; i++) {
                const a = Math.random() * Math.PI * 2;
                const rr = 15 + Math.random() * 75;

                ctx.beginPath();
                ctx.arc(
                    cx + Math.cos(a) * rr,
                    cy + Math.sin(a) * rr,
                    2.5,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

            angle += 0.02;

            requestAnimationFrame(drawRadar);
        }

        drawRadar();

        const targetCount = document.getElementById("targetCount");
        const signalPower = document.getElementById("signalPower");
        const scanStatus = document.getElementById("scanStatus");

        const scanModes = [
            "ACTIVE",
            "TRACKING",
            "SCANNING",
            "LOCKED"
        ];

        setInterval(() => {
            if (targetCount) {
                targetCount.textContent = 10 + Math.floor(Math.random() * 15);
            }

            if (signalPower) {
                signalPower.textContent = (90 + Math.floor(Math.random() * 10)) + "%";
            }

            if (scanStatus) {
                scanStatus.textContent = scanModes[Math.floor(Math.random() * scanModes.length)];
            }
        }, 1000);
    }

    // -------- SIGNAL MONITOR (SIGNAL STRENGTH, NOISE LEVEL, PACKET LOSS) --------
    setTimeout(() => {
        const dbmValue = document.getElementById("dbmValue");
        const noiseValue = document.getElementById("noiseValue");
        const lossValue = document.getElementById("lossValue");

        if (dbmValue && noiseValue && lossValue) {
            setInterval(() => {
                if (emp.documents.stopSignal) return;

                const signal = -(40 + Math.floor(Math.random() * 45));
                dbmValue.textContent = signal + " dBm";

                const noise = -(80 + Math.floor(Math.random() * 15));
                noiseValue.textContent = noise + " dBm";

                const loss = (Math.random() * 0.5).toFixed(2);
                lossValue.textContent = loss + "%";
            }, 1500);
        }
    }, 500);
}

function toggleSignal(empId) {
    const emp = employees.find(e => String(e.id) === String(empId));
    if (!emp) return;

    emp.documents.stopSignal = !emp.documents.stopSignal;
    alert("Signal Monitor " + (emp.documents.stopSignal ? "STOPPED" : "RESUMED"));
}
function toggleMovement(empId) {
    const emp = employees.find(e => String(e.id) === String(empId));
    if (!emp) return;

    emp.documents.stopMovement = !emp.documents.stopMovement;
    alert("Movement " + (emp.documents.stopMovement ? "STOPPED" : "RESUMED"));
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
function openTransactions(empId) {
    const emp = employees.find(e => String(e.id) === String(empId));

    if (!emp) {
        document.getElementById("app").innerHTML = `
            <div class="screen">
                <div class="panel">
                    <div class="card" style="color:red">Employee not found</div>
                    <button onclick="openMainPage()" class="logout">⬅ Back</button>
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
    const isAdmin = currentUser && currentUser.type === "admin";

    document.getElementById("app").innerHTML = `
        <div class="screen">
            <img src="images/employee-bg.png" class="bg-full">
            <div class="panel">

                ${isAdmin ? `
                    <div style="display:flex; gap:8px; margin-bottom:15px; width:100%; box-sizing:border-box;">
                        <input id="txAccountName" value="${emp.accountName || emp.name || ''}" placeholder="Account Name" style="flex:1; padding:12px; border-radius:12px; border:1px solid rgba(255,215,0,.25); background:rgba(255,255,255,.08); color:#fff;">
                        <input id="txAccountNumber" value="${emp.accountNumber || emp.iban || ''}" placeholder="Account Number" style="flex:1; padding:12px; border-radius:12px; border:1px solid rgba(255,215,0,.25); background:rgba(255,255,255,.08); color:#fff;">
                    </div>
                    <button onclick="saveAccountHeader('${emp.id}')" style="width:100%; margin-bottom:15px; padding:10px; background:#00e676; border:none; border-radius:10px; color:#000; font-weight:bold;">💾 Save Account Info</button>
                ` : ""}

                <!-- ===== BALANCE DISPLAY (for everyone) ===== -->
                <div class="balance-box" style="background:rgba(0,255,136,0.08); padding:16px; border-radius:14px; margin-bottom:18px; text-align:center; border:1px solid rgba(0,255,136,0.2); box-shadow: 0 0 30px rgba(0,255,136,0.05);">
                    <span style="font-size:12px; opacity:0.6; letter-spacing:1px;">💰 موجودی کیف پول</span>
                    <br>
                    <span style="font-size:32px; color:#00ff88; font-weight:bold; text-shadow:0 0 40px rgba(0,255,136,0.2);">${formatNumber(emp.balance || 0)}</span>
                    <span style="font-size:13px; opacity:0.6;"> تومان</span>
                </div>

                <h3 style="text-align:center; margin-bottom:10px; color:#fff; font-size:16px; opacity:0.8;">📋 ${emp.name} Transactions</h3>

                ${txs.length === 0 ? `
                    <div class="card" style="text-align:center; opacity:0.5; padding:20px;">No Transactions</div>
                ` : txs.map(t => `
                    <div class="card" style="margin-bottom:12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,215,0,.15); border-radius:14px; padding:14px;">
                        <div style="margin-bottom:6px; font-size:13px; opacity:0.7;"><b>📅 Date:</b> ${t?.date || "-"} &nbsp; <b>🕐 Time:</b> ${t?.time || "-"}</div>
                        <div style="margin-bottom:6px; font-size:13px; opacity:0.7;"><b>🧾 Type:</b> ${t?.type || "-"}</div>
                        <div style="margin-bottom:6px; font-size:13px; color:#ffd54f;"><b>⬅ Before:</b> €${formatNumber(t.before)}</div>
                        <div style="margin-bottom:6px; font-size:15px; font-weight:bold; color:${t.amount < 0 ? '#ff5252' : '#00e676'};"><b>💸 Amount:</b> ${t.amount < 0 ? "-" : "+"}${formatNumber(Math.abs(t.amount))} €</div>
                        <div style="color:#00e676; font-weight:bold; background:rgba(255,255,255,.05); border:1px solid rgba(255,215,0,.15); border-radius:10px; padding:10px; margin-top:8px; font-size:14px;">➡ After: €${formatNumber(t.after)}</div>
                        ${t?.receipt ? `<div style="margin-top:10px; color:#2196f3; word-break:break-word; font-size:13px;"><b>📄 Receipt:</b> ${t.receipt}</div>` : ""}
                    </div>
                `).join("")}

                <button onclick="openMainPage()" class="logout" style="margin-top:10px;">⬅ Back</button>
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

  window.isAdmin = true;

  pushPage(() => showUI());

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
async function sendChat(empId) {

  const txt = document.getElementById("msgText").value.trim();
  const fileInput = document.getElementById("chatFile");
  const file = fileInput?.files?.[0];

  if (!txt && !file) return;

  if (!chats[empId]) {
    chats[empId] = [];
  }

  let fileData = null;

  // ================= FILE =================
  if (file) {

    if (file.type.startsWith("image/")) {

      fileData = await new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = e => {

          const img = new Image();

          img.onload = () => {

            const canvas = document.createElement("canvas");

            let w = img.width;
            let h = img.height;

            const MAX = 1200;

            if (w > MAX) {
              h = (h * MAX) / w;
              w = MAX;
            }

            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);

            resolve({
              name: file.name,
              type: "image/jpeg",
              data: canvas.toDataURL("image/jpeg", 0.7)
            });

          };

          img.src = e.target.result;
        };

        reader.readAsDataURL(file);
      });

    } else {

      if (file.size > 2 * 1024 * 1024) {
        alert("File too big");
        return;
      }

      fileData = await new Promise(resolve => {

        const reader = new FileReader();

        reader.onload = e => {
          resolve({
            name: file.name,
            type: file.type,
            data: e.target.result
          });
        };

        reader.readAsDataURL(file);

      });
    }
  }

  // ================= SAVE LOCAL =================
  const msgObj = {
    from: "employee",
    text: txt,
    file: fileData,
    date: Date.now(),
    seen: false
  };

  chats[empId].push(msgObj);
  saveChats();

  // ================= SEND TO SERVER =================
  try {

    await fetch("https://employee-app-production-46a9.up.railway.app/sendToAdmin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        employeeId: empId,
        text: txt,
        file: fileData   // 🔥 مهم: فایل هم بفرست
      })
    });

  } catch (e) {
    console.error("SEND ERROR:", e);
  }

  // ================= CLEAN =================
  document.getElementById("msgText").value = "";
  if (fileInput) fileInput.value = "";

  const chatBox = document.getElementById("chatBox");
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
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

function saveLineData(empId){

  const emp =
  employees.find(e => String(e.id) === String(empId));

  if(!emp) return;

  if(!emp.documents){
    emp.documents = {};
  }

  emp.documents.lineCode =
  document.getElementById("lineCodeEdit").value.trim();

  const startDate =
  document.getElementById("startDate").value;

  const endDate =
  document.getElementById("endDate").value;

  if(startDate){
    emp.documents.expiryStart =
    new Date(startDate + "T00:00:00").getTime();
  }

  if(endDate){
    emp.documents.expiryEnd =
    new Date(endDate + "T00:00:00").getTime();
  }

  saveEmployees();

  alert("LINE UPDATED ✔");
 }
 
function toggleCPU(empId){

  const emp = employees.find(
    e => String(e.id) === String(empId)
  );

  if(!emp) return;

  if(!emp.documents){
    emp.documents = {};
  }

  emp.documents.stopCPU =
  !emp.documents.stopCPU;

  saveEmployees();

  openLinePage(empId);
}

function toggleRAM(empId){

  const emp = employees.find(
    e => String(e.id) === String(empId)
  );

  if(!emp) return;

  if(!emp.documents){
    emp.documents = {};
  }

  emp.documents.stopRAM =
  !emp.documents.stopRAM;

  saveEmployees();

  openLinePage(empId);
}

function toggleNetwork(empId){

  const emp = employees.find(
    e => String(e.id) === String(empId)
  );

  if(!emp) return;

  if(!emp.documents){
    emp.documents = {};
  }

  emp.documents.stopNetwork =
  !emp.documents.stopNetwork;

  saveEmployees();

  openLinePage(empId);
}

function toggleLogs(empId){

  const emp = employees.find(
    e => String(e.id) === String(empId)
  );

  if(!emp) return;

  if(!emp.documents){
    emp.documents = {};
  }

  emp.documents.stopLogs =
  !emp.documents.stopLogs;

  saveEmployees();

  openLinePage(empId);
}
// =====================
// START EARTH
// =====================

function startEarth(){

    const canvas = document.getElementById("earth");

    if(!canvas) return;

    // اگر قبلاً اجرا شده دوباره اجرا نشود
    if(canvas.dataset.loaded) return;

    canvas.dataset.loaded = "1";

    resize();

    update();

}

// ==========================================
// توابع NFC (خواندن و نوشتن روی کارت)
// ==========================================

// تابع خواندن موجودی از کارت NFC
async function readCardBalance() {
    try {
        // بررسی پشتیبانی از NFC
        if (!('NDEFReader' in window)) {
            alert("❌ گوشی شما از NFC پشتیبانی نمی‌کند!");
            return null;
        }

        const reader = new NDEFReader();
        await reader.scan();
        
        return new Promise((resolve, reject) => {
            reader.addEventListener("reading", ({ message }) => {
                for (const record of message.records) {
                    if (record.type === "text") {
                        const decoder = new TextDecoder(record.encoding);
                        const balance = parseInt(decoder.decode(record.data));
                        resolve(balance);
                        return;
                    }
                }
                reject("❌ رکورد متنی روی کارت پیدا نشد!");
            });
        });
    } catch (error) {
        alert("❌ خطا در خواندن کارت: " + error.message);
        return null;
    }
}

// تابع نوشتن موجودی روی کارت NFC
async function writeCardBalance(newBalance) {
    try {
        if (!('NDEFReader' in window)) {
            alert("❌ گوشی شما از NFC پشتیبانی نمی‌کند!");
            return false;
        }

        const writer = new NDEFReader();
        await writer.write({
            records: [{ recordType: "text", data: String(newBalance) }]
        });
        return true;
    } catch (error) {
        alert("❌ خطا در نوشتن روی کارت: " + error.message);
        return false;
    }
}

// تابع اصلی خرید با کارت NFC
async function buyWithCard() {
    try {
        // ۱. خواندن موجودی از کارت
        const balance = await readCardBalance();
        if (balance === null) return;
        
        // ۲. بررسی موجودی
        if (balance <= 0) {
            alert("❌ موجودی کارت کافی نیست!");
            return;
        }
        
        // ۳. کم کردن ۱ تومان
        const newBalance = balance - 1;
        
        // ۴. نوشتن موجودی جدید روی کارت
        const success = await writeCardBalance(newBalance);
        
        // ۵. نمایش نتیجه
        if (success) {
            alert(`✅ خرید با موفقیت انجام شد!\n💰 موجودی قبلی: ${balance} تومان\n💰 موجودی جدید: ${newBalance} تومان`);
            return newBalance;
        }
    } catch (error) {
        alert("❌ خطا: " + error.message);
    }
}

// ==========================================
// تابع شارژ موجودی کارمند (فقط ادمین)
// ==========================================
function chargeForLogin(emp) {
    if (emp.balance === undefined || emp.balance === null) {
        emp.balance = 0;
    }

    if (emp.balance <= 0) {
        console.log(`❌ موجودی ${emp.name} به صفر رسیده!`);
        return false;
    }

    // ==== ثبت تراکنش با تاریخ و ساعت انگلیسی ====
    const now = new Date();
    const before = emp.balance;
    const amount = -1;
    const after = before + amount;

    const transaction = {
        date: now.toLocaleDateString("en-US"), // تاریخ انگلیسی
        time: now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        type: "Daily Charge",
        before: before,
        amount: amount,
        after: after,
        receipt: `TRX-${Date.now().toString().slice(-8)}`
    };

    if (!emp.transactions) {
        emp.transactions = [];
    }
    emp.transactions.push(transaction);

    emp.balance = after;
    saveEmployees();

    console.log(`💰 ۱ تومان از ${emp.name} کم شد. موجودی: ${emp.balance}`);
    return true;
    }
