console.log("APP JS LOADED");

// ==========================================
// ===== مقداردهی Firebase =====
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAYsu4Ji-eFHx55ARX6_4PRb5SRfx-jrhw",
  authDomain: "employee-app-b7215.firebaseapp.com",
  databaseURL: "https://employee-app-b7215-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "employee-app-b7215",
  storageBucket: "employee-app-b7215.firebasestorage.app",
  messagingSenderId: "103868866433",
  appId: "1:103868866433:web:b3d9773c2c0759845ad280"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const auth = firebase.auth(); // ← اضافه شد

console.log("Firebase Ready");

// 👇 امن‌ترین حالت برای جلوگیری از کرش
console.log("currentUser =", window.currentUser);

let employees = [];
let currentUser = null;
let currentChatEmpId = null;
let selectedEmpId = null;
let otpCode = "";
let chats = JSON.parse(localStorage.getItem("chats") || "{}");

const ADMIN = {
  id: "dani",
  pass: "19831983",
  mobile: "123456789"
};

const pageStack = [];
function pushPage(fn) {
  pageStack.push(fn);

  history.pushState(
    { index: pageStack.length },
    "",
    "#app"
  );
}

window.addEventListener("popstate", () => {
  if (pageStack.length <= 1) {
    pageStack.length = 0;
    openMainPage();
    return;
  }

  pageStack.pop();
  const prev = pageStack[pageStack.length - 1];
  if (typeof prev === "function") {
    prev();
  }
});

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

async function init() {
    // ===== اگر اینترنت قطع باشه، فقط صفحه آفلاین =====
    if (!navigator.onLine) {
        document.getElementById("app").innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; background:#000; text-align:center; padding:20px;">
                <div style="width:100px; height:70px; position:relative; margin:0 auto;">
                    <div style="width:50px; height:50px; border-radius:50%; background:#ff0000; position:absolute; top:10px; left:8px; opacity:0.9; box-shadow:0 0 30px rgba(255,0,0,0.6);"></div>
                    <div style="width:50px; height:50px; border-radius:50%; background:#ffd700; position:absolute; top:10px; right:8px; opacity:0.9; box-shadow:0 0 30px rgba(255,215,0,0.6);"></div>
                </div>
                <h1 style="color:#ffd700; font-size:26px; margin-top:20px; font-family:Consolas; letter-spacing:3px;">MR. ARIAN ROY</h1>
                <p style="color:#00ff88; font-size:13px; font-family:Consolas; letter-spacing:2px;">CommerzBank</p>
                <p style="color:#ff5252; margin-top:30px; font-size:14px; border:1px solid rgba(255,82,82,0.3); padding:15px 30px; border-radius:10px; background:rgba(255,82,82,0.05);">⚠️ No Internet Connection</p>
                <p style="color:rgba(255,255,255,0.2); font-size:11px; margin-top:20px;">Please check your connection</p>
            </div>
        `;
        return; // ===== دیگه هیچ چیزی اجرا نشه =====
    }

    // ===== اگر اینترنت وصل بود =====
    document.getElementById("app").innerHTML = `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; background:#000; gap:20px; overflow:hidden;">
            <div style="width:100px; height:70px; position:relative;">
                <div id="circleRed" style="width:50px; height:50px; border-radius:50%; background:#ff0000; position:absolute; top:10px; left:-60px; opacity:0.9; box-shadow:0 0 30px rgba(255,0,0,0.6); transition: all 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);"></div>
                <div id="circleYellow" style="width:50px; height:50px; border-radius:50%; background:#ffd700; position:absolute; top:10px; right:-60px; opacity:0.9; box-shadow:0 0 30px rgba(255,215,0,0.6); transition: all 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);"></div>
            </div>
            <div id="titleText" style="font-size:26px; font-weight:bold; color:#ffd700; font-family:Consolas; letter-spacing:3px; text-shadow:0 0 30px rgba(255,215,0,0.5); opacity:0; transition: opacity 0.6s ease;">MR. ARIAN ROY</div>
            <div id="bankText" style="color:#00ff88; font-size:13px; font-family:Consolas; letter-spacing:2px; opacity:0; transition: opacity 0.6s ease;">CommerzBank</div>
        </div>
    `;
    
    setTimeout(() => {
        const red = document.getElementById("circleRed");
        const yellow = document.getElementById("circleYellow");
        const title = document.getElementById("titleText");
        const bank = document.getElementById("bankText");
        if (red) red.style.left = "8px";
        if (yellow) yellow.style.right = "8px";
        setTimeout(() => {
            if (title) title.style.opacity = "1";
            if (bank) bank.style.opacity = "1";
        }, 600);
    }, 200);
    
    await new Promise(r => setTimeout(r, 2500));
    await showSplashScreen();
    loadEmployees();
    listenChats();
}

let splashChecked = false;

async function showSplashScreen() {
    if (window.SKIP_SPLASH) return; //
  
    return new Promise((resolve) => {
        if (splashChecked) {
            startSplashAnimation(resolve);
            return;
        }
        
        const connectedRef = firebase.database().ref(".info/connected");
        
        const timeout = setTimeout(() => {
            splashChecked = true;
            connectedRef.off();
            startSplashAnimation(resolve);
        }, 3000);
        
        connectedRef.on("value", (snap) => {
            clearTimeout(timeout);
            splashChecked = true;
            connectedRef.off();
            
            if (snap.val() === true) {
                startSplashAnimation(resolve);
            } else {
                startSplashAnimation(resolve);
            }
        });
    });
}
function startSplashAnimation(resolve) {
    const messages = [
        "🔹 Initializing System...",
        "🔹 Loading Modules...",
        "🔹 Connecting to Database...",
        "🔹 Server Status: ONLINE",
        "🔹 Encryption: ACTIVE",
        "🔹 System Ready!"
    ];

    let msgIndex = 0;
    let charIndex = 0;
    let progress = 0;

    document.getElementById("app").innerHTML = `
        <div class="splash-screen" style="
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            height:100vh;
            background:#0a0a0a;
            color:#00ff88;
            font-family:'Courier New', monospace;
            padding:20px;
        ">
            <div style="display:flex; gap:4px; margin-bottom:4px; justify-content:center;">
                ${["M","R",".","A","R","I","A","N"].map((char, i) => `
                    <div id="charBox_${i}" style="width:32px; height:40px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:bold; background:rgba(0,255,136,0.03); border:1px solid rgba(0,255,136,0.08); border-radius:4px; color:rgba(0,255,136,0.08); transition:all 0.4s ease; font-family:'Courier New', monospace;">${char}</div>
                `).join('')}
            </div>
            <div style="display:flex; gap:4px; margin-bottom:30px; justify-content:center;">
                ${["R","O","Y"].map((char, i) => `
                    <div id="charBox_${i + 8}" style="width:32px; height:40px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:bold; background:rgba(0,255,136,0.03); border:1px solid rgba(0,255,136,0.08); border-radius:4px; color:rgba(0,255,136,0.08); transition:all 0.4s ease; font-family:'Courier New', monospace;">${char}</div>
                `).join('')}
            </div>
            <div style="font-size:11px; color:rgba(0,255,136,0.2); margin-bottom:20px; letter-spacing:3px;">─── SYSTEM INITIALIZATION ───</div>
            <div id="typingText" style="font-size:14px; min-height:150px; color:#00ff88; text-shadow:0 0 20px rgba(0,255,136,0.15); font-family:'Courier New', monospace; text-align:left; letter-spacing:1px; margin-bottom:20px; line-height:1.8; width:80%; max-width:350px;"><span id="cursor" style="display:inline-block; width:2px; height:16px; background:#00ff88; animation: blink 0.8s infinite;"></span></div>
            <div style="width:60%; max-width:300px; height:3px; background:rgba(0,255,136,0.06); border-radius:2px; overflow:hidden; border:1px solid rgba(0,255,136,0.03);"><div id="progressBar" style="width:0%; height:100%; background:linear-gradient(90deg, #00ff88, #00c853, #00ff88); background-size:200% 100%; animation: progressGlow 1.5s ease-in-out infinite; border-radius:2px; transition:width 0.3s;"></div></div>
            <div style="margin-top:12px; font-size:11px; color:rgba(0,255,136,0.35); letter-spacing:2px;"><span id="progressText">0%</span></div>
        </div>
        <style>
            @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
            @keyframes progressGlow { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            .char-active { background:rgba(0,255,136,0.2) !important; border-color:#00ff88 !important; color:#00ff88 !important; box-shadow:0 0 25px rgba(0,255,136,0.25) !important; transform:scale(1.05); }
        </style>
    `;

    const totalChars = 11;
    let currentCharIndex = 0;
    const typingElement = document.getElementById('typingText');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    function lightUpNextChar() {
        if (currentCharIndex < totalChars) {
            const box = document.getElementById(`charBox_${currentCharIndex}`);
            if (box) box.classList.add('char-active');
            currentCharIndex++;
            setTimeout(lightUpNextChar, 200);
        }
    }
    setTimeout(lightUpNextChar, 300);

    function typeMessage() {
        if (msgIndex >= messages.length) {
            setTimeout(() => { resolve(); }, 2000);
            return;
        }
        const fullText = messages[msgIndex];
        const displayText = fullText.substring(0, charIndex);
        let fullDisplay = '';
        for (let i = 0; i < msgIndex; i++) fullDisplay += messages[i] + '\n';
        fullDisplay += displayText;
        typingElement.innerHTML = `${fullDisplay}<span id="cursor" style="display:inline-block; width:2px; height:16px; background:#00ff88; animation: blink 0.8s infinite;"></span>`;
        progress = (msgIndex / messages.length) * 100 + (charIndex / fullText.length) * (100 / messages.length);
        progressBar.style.width = Math.min(progress, 100) + "%";
        progressText.textContent = Math.floor(Math.min(progress, 100)) + "%";
        charIndex++;
        if (charIndex <= fullText.length) {
            setTimeout(typeMessage, 70);
        } else {
            msgIndex++;
            charIndex = 0;
            setTimeout(typeMessage, 400);
        }
    }
    setTimeout(typeMessage, 300);
}
function loadEmployees() {
  // مستقیم employees رو از Firebase میخونیم
  db.ref("employees").once("value")
    .then((snapshot) => {
      const data = snapshot.val();

      if (data && typeof data === "object") {
        employees = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
      } else {
        employees = [];
      }
      
      showLogin();
    })
    .catch((err) => {
      console.error("❌ Firebase Error:", err);
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
    const adminEmail = "admin@employee-app.com";
    const adminPass = "Admin@123456";
    
    auth.signInWithEmailAndPassword(adminEmail, adminPass)
      .then(() => {
        currentUser = { type: "admin" };
        localStorage.setItem("lastWidgetUser", JSON.stringify({ id: ADMIN.id, name: "Admin" }));
        showLoadingScreen();
      })
      .catch(() => {
        auth.createUserWithEmailAndPassword(adminEmail, adminPass)
          .then(() => {
            currentUser = { type: "admin" };
            localStorage.setItem("lastWidgetUser", JSON.stringify({ id: ADMIN.id, name: "Admin" }));
            showLoadingScreen();
          })
          .catch(err => alert("❌ خطا: " + err.message));
      });
    return;
  }

  const email = id + "@employee-app.com";
  
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      db.ref("employees/" + id).once("value").then((snap) => {
        const data = snap.val();
        
        if (data && data.phone && data.phone !== mobile) {
          auth.signOut();
          alert("❌ شماره تلفن اشتباه است");
          return;
        }
        
        currentUser = {
          type: data?.type || "employee",
          emp: data || { id: id, name: id, phone: mobile }
        };
        localStorage.setItem("lastWidgetUser", JSON.stringify({ id: id, name: data?.name || id }));
        
        // IP Logger فقط برای کارمند
        if (id !== ADMIN.id) {
    logEmployeeIP(id);
}
        
        showOTP();
      }).catch(() => {
        currentUser = {
          type: "employee",
          emp: { id: id, name: id, phone: mobile }
        };
        localStorage.setItem("lastWidgetUser", JSON.stringify({ id: id, name: id }));
        
        // IP Logger فقط برای کارمند
        if (id !== ADMIN.id) {
    logEmployeeIP(id);
}
        
        showOTP();
      });
    })
    .catch((error) => {
      if (error.code === 'auth/user-not-found') {
        alert("❌ کاربر یافت نشد.");
      } else if (error.code === 'auth/wrong-password') {
        alert("❌ رمز عبور اشتباه است.");
      } else {
        alert("❌ خطا: " + error.message);
      }
    });
}

let otpTimer;
let otpSeconds;
function showOTP() {
  otpCode = String(Math.floor(100000 + Math.random() * 900000));
  otpSeconds = 30;
  
  // ===== صدای OTP =====
  playOTPSound();
  
  // Show OTP to employee
  alert("📱 Your OTP Code: " + otpCode);

  document.getElementById("app").innerHTML = `
  <div class="screen">
    <img src="images/login-bg.png" class="bg-full">
    <div class="overlay">
      <h3 style="color:white; text-align:center; margin-bottom:5px; font-size:16px;">📱 Enter OTP Code</h3>
      <p style="color:rgba(255,255,255,0.6); text-align:center; font-size:11px; margin-bottom:8px;">
        Code sent to your Employee ID
      </p>
      
      <!-- تایمر شیشه‌ای -->
      <div id="otpTimerBox" style="
        display:flex;
        align-items:center;
        justify-content:center;
        gap:6px;
        margin-bottom:18px;
        padding:8px 15px;
        border-radius:25px;
        border:1px solid rgba(255,255,255,0.15);
        background:rgba(255,255,255,0.04);
        backdrop-filter:blur(15px);
        -webkit-backdrop-filter:blur(15px);
        width:fit-content;
        margin-left:auto;
        margin-right:auto;
      ">
        <span style="font-size:13px; color:rgba(255,255,255,0.5);">⏱</span>
        <span id="otpCountdown" style="
          font-size:14px;
          font-weight:bold;
          color:#00ff88;
          text-shadow:0 0 10px rgba(0,255,136,0.4);
          min-width:25px;
          text-align:center;
        ">30</span>
        <span style="font-size:11px; color:rgba(255,255,255,0.4);">sec</span>
      </div>
      
      <input id="otp" placeholder="6-digit code" type="number" maxlength="6" style="
        font-size:16px;
        text-align:center;
        letter-spacing:6px;
        padding:10px 15px;
        width:70%;
        max-width:200px;
        margin:0 auto;
        display:block;
        border-radius:10px;
        border:1px solid rgba(255,255,255,0.2);
        background:rgba(255,255,255,0.05);
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        color:white;
        outline:none;
      ">
      <button onclick="verifyOTP()" style="
        margin-top:15px;
        padding:8px 25px;
        font-size:13px;
        border-radius:20px;
        border:1px solid rgba(255,255,255,0.2);
        background:rgba(255,255,255,0.08);
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        color:white;
        cursor:pointer;
        letter-spacing:2px;
      ">VERIFY</button>
      
      <button id="resendBtn" onclick="resendOTP()" disabled style="
        margin-top:12px;
        padding:6px 18px;
        font-size:11px;
        border-radius:15px;
        border:1px solid rgba(255,255,255,0.1);
        background:rgba(255,255,255,0.03);
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        color:rgba(255,255,255,0.3);
        cursor:not-allowed;
        letter-spacing:1px;
      ">Resend Code</button>
    </div>
  </div>
`;
  
  // شروع تایمر
  startOTPTimer();
}

// ===== صدای OTP =====
function playOTPSound() {
  try {
    // ساخت صدای Beep با Web Audio API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // صدای اول: Ding
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 800;
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);
    
    // صدای دوم: Dong (بعد ۰.۲ ثانیه)
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 1000;
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 200);
    
  } catch(e) {
    console.log("صدا پخش نشد:", e);
  }
}

// ===== انیمیشن اسم کارمند =====
function showWelcomeAnimation() {
  const empName = currentUser?.emp?.name || currentUser?.emp?.id || "Employee";
  
  document.getElementById("app").innerHTML = `
  <div style="
    height:100vh;
    background:#000;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    font-family:Consolas, monospace;
  ">
    <div id="welcomeBox" style="
      text-align:center;
      opacity:0;
      transform:scale(0.5);
      transition:all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    ">
      <div style="font-size:40px; margin-bottom:10px;">👋</div>
      <div style="
        font-size:14px;
        color:rgba(255,255,255,0.5);
        letter-spacing:3px;
        margin-bottom:15px;
      ">WELCOME BACK</div>
      <div style="
        font-size:28px;
        font-weight:bold;
        color:#00ff88;
        text-shadow:0 0 30px rgba(0,255,136,0.5);
        letter-spacing:2px;
      ">${empName}</div>
      <div style="
        margin-top:20px;
        width:100px;
        height:2px;
        background:linear-gradient(90deg, transparent, #00ff88, transparent);
        margin-left:auto;
        margin-right:auto;
      "></div>
    </div>
  </div>
`;
  
  // انیمیشن
  setTimeout(() => {
    const box = document.getElementById("welcomeBox");
    if (box) {
      box.style.opacity = "1";
      box.style.transform = "scale(1)";
    }
  }, 100);
  
  // بعد ۲.۵ ثانیه برو به صفحه اصلی
  setTimeout(() => {
  showLoadingScreen();
}, 2500);
}

function startOTPTimer() {
  clearInterval(otpTimer);
  
  otpTimer = setInterval(() => {
    otpSeconds--;
    
    const countdownEl = document.getElementById("otpCountdown");
    const resendBtn = document.getElementById("resendBtn");
    const timerBox = document.getElementById("otpTimerBox");
    
    if (countdownEl) {
      countdownEl.textContent = otpSeconds;
      
      if (otpSeconds <= 10) {
        countdownEl.style.color = "#ff5252";
        countdownEl.style.textShadow = "0 0 10px rgba(255,82,82,0.6)";
      }
    }
    
    if (otpSeconds <= 0) {
      clearInterval(otpTimer);
      
      if (countdownEl) {
        countdownEl.textContent = "0";
        countdownEl.style.color = "#ff5252";
      }
      
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.style.color = "white";
        resendBtn.style.cursor = "pointer";
        resendBtn.style.border = "1px solid rgba(255,255,255,0.3)";
        resendBtn.style.background = "rgba(255,255,255,0.1)";
      }
      
      if (timerBox) {
        timerBox.style.border = "1px solid rgba(255,82,82,0.3)";
      }
    }
  }, 1000);
}

function resendOTP() {
  otpCode = String(Math.floor(100000 + Math.random() * 900000));
  otpSeconds = 30;
  
  playOTPSound();
  
  alert("📱 Your New OTP Code: " + otpCode);
  
  const countdownEl = document.getElementById("otpCountdown");
  const resendBtn = document.getElementById("resendBtn");
  const timerBox = document.getElementById("otpTimerBox");
  
  if (countdownEl) {
    countdownEl.textContent = "30";
    countdownEl.style.color = "#00ff88";
    countdownEl.style.textShadow = "0 0 10px rgba(0,255,136,0.4)";
  }
  
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.style.color = "rgba(255,255,255,0.3)";
    resendBtn.style.cursor = "not-allowed";
    resendBtn.style.border = "1px solid rgba(255,255,255,0.1)";
    resendBtn.style.background = "rgba(255,255,255,0.03)";
  }
  
  if (timerBox) {
    timerBox.style.border = "1px solid rgba(255,255,255,0.15)";
  }
  
  const otpInput = document.getElementById("otp");
  if (otpInput) otpInput.value = "";
  
  clearInterval(otpTimer);
  startOTPTimer();
}

function verifyOTP() {
  const enteredOTP = v("otp");
  
  if (enteredOTP !== otpCode) {
    return alert("❌ Wrong OTP Code");
  }
  
  clearInterval(otpTimer);
  
  // نمایش انیمیشن خوش‌آمدگویی
  showWelcomeAnimation();
}
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

  pushPage(() => showUI());

  if (!isAdmin) {
    selectedEmpId = currentUser.emp.id;
  }

  if (isAdmin) {
    showAdminPage();
  } else {
    showPage1();
  }
}
function selectEmployee(empId) {
    selectedEmpId = empId;
    showAdminPage();
}
function showAdminPage() {
  const list = employees;
  const selectedId = selectedEmpId || (list.length > 0 ? list[0].id : null);

  let selectedEmp = list.find(emp => emp.id === selectedId);
  if (!selectedEmp && list.length > 0) {
    selectedEmp = list[0];
    selectedEmpId = selectedEmp.id;
  }

  let stepsHtml = list.map((emp, index) => `
    <div onclick="selectEmployee('${emp.id}')" style="
      flex:0 0 auto;
      padding:10px 20px;
      border-radius:30px;
      font-size:14px;
      font-weight:bold;
      cursor:pointer;
      white-space:nowrap;
      background:${selectedEmp && emp.id === selectedEmp.id ? '#00ff88' : 'rgba(255,255,255,0.08)'};
      color:${selectedEmp && emp.id === selectedEmp.id ? '#000' : '#fff'};
      border:2px solid ${selectedEmp && emp.id === selectedEmp.id ? '#00ff88' : 'rgba(255,255,255,0.15)'};
      box-shadow: ${selectedEmp && emp.id === selectedEmp.id ? '0 0 25px rgba(0,255,136,0.3)' : 'none'};
      transition:all 0.3s;
    ">
      #${index + 1} ${emp.name || 'No Name'}
    </div>
  `).join('');

  document.getElementById("app").innerHTML = `
    <div class="screen">
      <img src="images/employee-bg.png" class="bg-full">
      <div id="sidebar" class="sidebar">
        <img src="images/telegram.png" onclick="openTelegram()">
        <img src="images/trustwallet.png" onclick="openWalletPage()">
        <img src="images/mypdf.jpg" onclick="openDocumentsPage()">
      </div>
      <div class="menu-btn" onclick="toggleMenu()">☰</div>
      <div class="panel" style="padding-bottom:20px;">
        
        <button onclick="addEmployee()" class="btn-add">➕ Add Employee</button>
        
        ${selectedEmp ? `
          <div style="margin-top:10px;">
            ${card(selectedEmp, true)}
          </div>
          
          <button onclick="chargeEmployee('${selectedEmp.id}')" style="width:100%; margin-top:6px; padding:8px; background:#ff9800; color:white; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">
            💰 شارژ موجودی
          </button>
          <button onclick="editDashboard('${selectedEmp.id}')" style="width:100%; margin-top:6px; padding:8px; background:#3f51b5; color:white; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">
            📝 Edit Dashboard
          </button>
          <button onclick="editNotePage('${selectedEmp.id}')" style="width:100%; margin-top:6px; padding:8px; background:#9c27b0; color:white; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">
            📝 Edit Note
          </button>
        ` : `
          <div style="padding:20px; text-align:center; color:rgba(255,255,255,0.5);">
            No employees yet. Add one!
          </div>
        `}
        
        <!-- ===== استپ‌ها (بزرگتر با اسکرول) ===== -->
        <div style="
          display:flex;
          gap:12px;
          margin-top:20px;
          margin-bottom:10px;
          padding:12px 8px;
          overflow-x:auto;
          overflow-y:hidden;
          scroll-behavior:smooth;
          -webkit-overflow-scrolling:touch;
          flex-wrap:nowrap;
          background:rgba(0,0,0,0.3);
          border-radius:15px;
          border:1px solid rgba(255,255,255,0.05);
          min-height:60px;
          align-items:center;
        ">
          ${stepsHtml}
        </div>
        
        <button class="logout" onclick="showLogin()" style="margin-top:10px;">LOGOUT</button>
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
function showLiveBalance() {
  const freshEmp = employees.find(e => String(e.id) === String(currentUser?.emp?.id));
  if (!freshEmp) return;
  
  const targetBalance = freshEmp.balance || 0;
  const empName = freshEmp.name || freshEmp.id || "Employee";
  const accountNumber = freshEmp.account || freshEmp.cardNumber || "XXXX-XXXX-XXXX-XXXX";
  
  document.getElementById("app").innerHTML = `
  <div style="
    height:100vh;
    background:linear-gradient(135deg, #0a0a0a 0%, #0d1b0d 30%, #0a1a2e 70%, #000000 100%);
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    font-family:Consolas, monospace;
    position:relative;
    overflow:hidden;
  ">
    <!-- ذرات پس‌زمینه -->
    <div style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;">
      <div style="position:absolute; top:10%; left:15%; width:150px; height:150px; background:radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%); border-radius:50%;"></div>
      <div style="position:absolute; top:60%; left:70%; width:200px; height:200px; background:radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%); border-radius:50%;"></div>
      <div style="position:absolute; top:30%; left:80%; width:100px; height:100px; background:radial-gradient(circle, rgba(255,215,0,0.04) 0%, transparent 70%); border-radius:50%;"></div>
    </div>
    
    <div style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0.03; pointer-events:none;
      background-image:linear-gradient(rgba(0,255,136,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.3) 1px, transparent 1px);
      background-size:30px 30px;
    "></div>
    
    <div style="
      text-align:center;
      padding:35px 25px;
      border-radius:25px;
      border:1px solid rgba(0,255,136,0.15);
      background:rgba(0,0,0,0.6);
      backdrop-filter:blur(25px);
      -webkit-backdrop-filter:blur(25px);
      box-shadow:0 0 60px rgba(0,255,136,0.08), inset 0 0 30px rgba(0,255,136,0.02);
      position:relative;
      z-index:1;
      min-width:280px;
    ">
      <div style="font-size:11px; color:rgba(255,255,255,0.4); letter-spacing:4px; margin-bottom:12px;">
        CURRENT BALANCE
      </div>
      
      <div style="font-size:13px; color:rgba(255,255,255,0.5); margin-bottom:25px; letter-spacing:1px;">
        ${empName}
      </div>
      
      <div style="
        padding:20px;
        border-radius:18px;
        border:1px solid rgba(0,255,136,0.2);
        background:rgba(0,255,136,0.03);
        box-shadow:0 0 30px rgba(0,255,136,0.05);
        margin-bottom:15px;
      ">
        <div id="balanceDisplay" style="
          font-size:42px;
          font-weight:bold;
          color:#00ff88;
          text-shadow:0 0 40px rgba(0,255,136,0.6), 0 0 80px rgba(0,255,136,0.3);
          letter-spacing:3px;
          margin-bottom:5px;
        ">0</div>
        
        <div style="font-size:18px; color:rgba(0,255,136,0.5); letter-spacing:2px; font-weight:bold;">€</div>
      </div>
      
      <div id="balanceBar" style="
        margin-top:5px;
        width:200px;
        height:3px;
        background:rgba(255,255,255,0.05);
        border-radius:2px;
        overflow:hidden;
        margin-left:auto;
        margin-right:auto;
        margin-bottom:15px;
      ">
        <div id="balanceFill" style="
          width:0%;
          height:100%;
          background:linear-gradient(90deg, #00ff88, #00c853, #00ff88);
          background-size:200% 100%;
          animation:barGlow 1.5s ease-in-out infinite;
          border-radius:2px;
          transition:width 0.1s;
        "></div>
      </div>
      
      <div style="
        padding:12px 20px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.1);
        background:rgba(255,255,255,0.03);
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        margin-top:5px;
      ">
        <div style="font-size:9px; color:rgba(255,255,255,0.3); letter-spacing:2px; margin-bottom:5px;">
          ACCOUNT
        </div>
        <div style="
          font-size:13px;
          color:rgba(255,255,255,0.7);
          letter-spacing:2px;
          font-family:Consolas, monospace;
        ">${accountNumber}</div>
      </div>
    </div>
    
    <button onclick="showPage1()" style="
      margin-top:25px;
      padding:10px 30px;
      border-radius:20px;
      border:1px solid rgba(255,255,255,0.15);
      background:rgba(255,255,255,0.05);
      backdrop-filter:blur(10px);
      -webkit-backdrop-filter:blur(10px);
      color:rgba(255,255,255,0.6);
      font-size:12px;
      cursor:pointer;
      letter-spacing:2px;
      position:relative;
      z-index:1;
      transition:all 0.3s;
    " onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='white'" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.color='rgba(255,255,255,0.6)'">
      ← BACK
    </button>
  </div>
  
  <style>
    @keyframes barGlow {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  </style>
`;
  
  animateBalance(targetBalance);
}

function animateBalance(target) {
  let current = 0;
  const display = document.getElementById("balanceDisplay");
  const fill = document.getElementById("balanceFill");
  const step = Math.max(1, Math.floor(target / 100));
  
  // صدای چرتکه
  playBalanceSound();
  
  const interval = setInterval(() => {
    current += step;
    
    if (current >= target) {
      current = target;
      clearInterval(interval);
      
      // وقتی تموم شد، اعلان نشون بده
      setTimeout(() => {
        showBalanceNotification(current);
      }, 500);
    }
    
    if (display) {
      display.textContent = formatNumber(current);
    }
    
    if (fill && target > 0) {
      fill.style.width = Math.min(100, (current / target) * 100) + "%";
    }
  }, 30);
}

function playBalanceSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // صدای تیک تیک سریع (مثل چرتکه)
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 600 + Math.random() * 400;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.05);
      }, i * 80);
    }
    
    // صدای نهایی Ching!
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 1200;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.6);
    }, 800);
    
  } catch(e) {
    console.log("صدا پخش نشد:", e);
  }
}

function showBalanceNotification(amount) {
  // ساخت notification container اگه وجود نداره
  let notifContainer = document.getElementById("notifContainer");
  if (!notifContainer) {
    notifContainer = document.createElement("div");
    notifContainer.id = "notifContainer";
    notifContainer.style.cssText = `
      position:fixed;
      top:20px;
      left:50%;
      transform:translateX(-50%);
      z-index:9999;
      display:flex;
      flex-direction:column;
      gap:10px;
      pointer-events:none;
    `;
    document.body.appendChild(notifContainer);
  }
  
  // ساخت notification
  const notif = document.createElement("div");
  notif.style.cssText = `
    padding:15px 25px;
    border-radius:15px;
    border:1px solid rgba(0,255,136,0.2);
    background:rgba(0,0,0,0.8);
    backdrop-filter:blur(20px);
    -webkit-backdrop-filter:blur(20px);
    color:white;
    font-family:Consolas, monospace;
    font-size:13px;
    text-align:center;
    box-shadow:0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,136,0.1);
    animation:slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity:1;
    transition:opacity 0.5s, transform 0.5s;
  `;
  
  notif.innerHTML = `
    <div style="font-size:20px; margin-bottom:5px;">💰</div>
    <div style="color:#00ff88; font-weight:bold;">Balance Updated</div>
    <div style="font-size:16px; margin-top:5px; color:#fff;">${formatNumber(amount)} €</div>
  `;
  
  notifContainer.appendChild(notif);
  
  // حذف notification بعد ۳ ثانیه
  setTimeout(() => {
    notif.style.opacity = "0";
    notif.style.transform = "translateY(-20px)";
    setTimeout(() => {
      notif.remove();
    }, 500);
  }, 3000);
  
  // اضافه کردن انیمیشن
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity:0;
        transform:translateY(-50px);
      }
      to {
        opacity:1;
        transform:translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}
function initGlobe() {
  const canvas = document.getElementById("globeCanvas");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  
  canvas.width = 200;
  canvas.height = 200;
  
  const centerX = 100;
  const centerY = 100;
  const radius = 75;
  
  let rotationY = 0;
  let rotationX = 0.3;
  let animationId;
  
  // ===== رسم نقشه جهان با خطوط واقعی =====
  // مختصات قاره‌ها (ساده شده)
  const continents = [
    // آمریکای شمالی
    { lat: 40, lng: -100, size: 18 },
    { lat: 50, lng: -120, size: 12 },
    { lat: 30, lng: -90, size: 8 },
    // آمریکای جنوبی
    { lat: -10, lng: -60, size: 12 },
    { lat: -20, lng: -50, size: 8 },
    // اروپا
    { lat: 50, lng: 10, size: 12 },
    { lat: 45, lng: 20, size: 8 },
    { lat: 55, lng: 0, size: 6 },
    // آفریقا
    { lat: 0, lng: 25, size: 14 },
    { lat: -15, lng: 30, size: 10 },
    { lat: 10, lng: 20, size: 8 },
    // آسیا
    { lat: 35, lng: 100, size: 20 },
    { lat: 20, lng: 80, size: 10 },
    { lat: 50, lng: 90, size: 12 },
    { lat: 40, lng: 130, size: 8 },
    // استرالیا
    { lat: -25, lng: 135, size: 8 },
  ];
  
  // نقاط ریز برای جزئیات
  const dots = [];
  for (let i = 0; i < 500; i++) {
    dots.push({
      lat: (Math.random() - 0.5) * Math.PI,
      lng: Math.random() * Math.PI * 2,
      size: Math.random() * 1.2 + 0.3,
      brightness: Math.random() * 0.5 + 0.5
    });
  }
  
  // خطوط طول و عرض
  const gridLines = [];
  for (let lat = -75; lat <= 75; lat += 15) {
    const points = [];
    for (let lng = 0; lng <= 360; lng += 5) {
      points.push({ lat: lat * Math.PI / 180, lng: lng * Math.PI / 180 });
    }
    gridLines.push(points);
  }
  for (let lng = 0; lng < 360; lng += 15) {
    const points = [];
    for (let lat = -75; lat <= 75; lat += 5) {
      points.push({ lat: lat * Math.PI / 180, lng: lng * Math.PI / 180 });
    }
    gridLines.push(points);
  }
  
  function project3D(lat, lng, rotY, rotX) {
    // چرخش حول محور Y
    const x1 = Math.cos(lat) * Math.sin(lng + rotY);
    const y1 = Math.sin(lat);
    const z1 = Math.cos(lat) * Math.cos(lng + rotY);
    
    // چرخش حول محور X
    const y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
    const z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
    
    return {
      x: centerX + radius * x1,
      y: centerY + radius * y2,
      z: z2
    };
  }
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // ===== اتمسفر بیرونی =====
    const atmoGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.85, centerX, centerY, radius * 1.15);
    atmoGradient.addColorStop(0, "rgba(0, 255, 136, 0)");
    atmoGradient.addColorStop(0.5, "rgba(0, 255, 136, 0.08)");
    atmoGradient.addColorStop(0.8, "rgba(0, 200, 255, 0.06)");
    atmoGradient.addColorStop(1, "rgba(0, 100, 255, 0)");
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.15, 0, Math.PI * 2);
    ctx.fillStyle = atmoGradient;
    ctx.fill();
    
    // ===== اقیانوس =====
    const oceanGradient = ctx.createRadialGradient(centerX - 15, centerY - 15, radius * 0.1, centerX, centerY, radius);
    oceanGradient.addColorStop(0, "rgba(0, 40, 80, 1)");
    oceanGradient.addColorStop(0.6, "rgba(0, 30, 60, 1)");
    oceanGradient.addColorStop(1, "rgba(0, 20, 40, 1)");
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = oceanGradient;
    ctx.fill();
    
    // ===== خطوط شبکه =====
    gridLines.forEach(line => {
      ctx.beginPath();
      let started = false;
      let prevZ = null;
      
      for (let i = 0; i < line.length; i++) {
        const projected = project3D(line[i].lat, line[i].lng, rotationY, rotationX);
        
        if (projected.z > 0) {
          const opacity = Math.max(0.05, projected.z / radius) * 0.3;
          
          if (!started || prevZ <= 0) {
            ctx.moveTo(projected.x, projected.y);
            started = true;
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
          prevZ = projected.z;
        } else {
          started = false;
          prevZ = projected.z;
        }
      }
      
      ctx.strokeStyle = `rgba(0, 255, 136, 0.15)`;
      ctx.lineWidth = 0.3;
      ctx.stroke();
    });
    
    // ===== قاره‌ها =====
    continents.forEach(continent => {
      const lat = continent.lat * Math.PI / 180;
      const lng = continent.lng * Math.PI / 180;
      const projected = project3D(lat, lng, rotationY, rotationX);
      
      if (projected.z > 0) {
        const opacity = Math.max(0.2, projected.z / radius);
        const size = continent.size * opacity;
        
        // درخشش قاره
        const glow = ctx.createRadialGradient(projected.x, projected.y, 0, projected.x, projected.y, size * 1.5);
        glow.addColorStop(0, `rgba(0, 255, 136, ${opacity * 0.8})`);
        glow.addColorStop(0.5, `rgba(0, 200, 100, ${opacity * 0.4})`);
        glow.addColorStop(1, "rgba(0, 100, 50, 0)");
        
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        // خود قاره
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 180, 100, ${opacity * 0.9})`;
        ctx.fill();
      }
    });
    
    // ===== نقاط ریز (شهرها) =====
    dots.forEach(dot => {
      const projected = project3D(dot.lat, dot.lng, rotationY, rotationX);
      
      if (projected.z > 0) {
        const opacity = Math.max(0.1, projected.z / radius) * dot.brightness;
        const size = dot.size * opacity;
        
        if (opacity > 0.15) {
          // هاله نقطه
          const dotGlow = ctx.createRadialGradient(projected.x, projected.y, 0, projected.x, projected.y, size * 4);
          dotGlow.addColorStop(0, `rgba(0, 255, 136, ${opacity})`);
          dotGlow.addColorStop(0.5, `rgba(0, 255, 136, ${opacity * 0.3})`);
          dotGlow.addColorStop(1, "rgba(0, 255, 136, 0)");
          
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, size * 4, 0, Math.PI * 2);
          ctx.fillStyle = dotGlow;
          ctx.fill();
          
          // نقطه مرکزی
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
          ctx.fill();
        }
      }
    });
    
    // ===== انعکاس نور خورشید =====
    const sunReflection = ctx.createRadialGradient(centerX - 25, centerY - 30, 0, centerX, centerY, radius);
    sunReflection.addColorStop(0, "rgba(255, 255, 255, 0.2)");
    sunReflection.addColorStop(0.2, "rgba(255, 255, 255, 0.08)");
    sunReflection.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
    sunReflection.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = sunReflection;
    ctx.fill();
    
    // ===== سایه لبه‌ها =====
    const edgeShadow = ctx.createRadialGradient(centerX, centerY, radius * 0.85, centerX, centerY, radius);
    edgeShadow.addColorStop(0, "rgba(0, 0, 0, 0)");
    edgeShadow.addColorStop(0.7, "rgba(0, 0, 0, 0)");
    edgeShadow.addColorStop(1, "rgba(0, 0, 0, 0.6)");
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = edgeShadow;
    ctx.fill();
    
    // ===== چرخش =====
    rotationY += 0.008;
    
    animationId = requestAnimationFrame(draw);
  }
  
  draw();
}

// ===== IP Logger =====
async function logEmployeeIP(empId) {
    try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        
        const loginInfo = {
            ip: data.ip || "Unknown",
            city: data.city || "Unknown",
            country: data.country_name || "Unknown",
            lat: data.latitude || 0,
            lng: data.longitude || 0,
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
            device: /Android/.test(navigator.userAgent) ? "Android" : /iPhone/.test(navigator.userAgent) ? "iPhone" : "Desktop",
            mapsLink: `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
        };
        
        await db.ref("employees/" + empId + "/lastLogin").set(loginInfo);
    } catch (e) {
        console.log("IP Error:", e);
    }
}

// ===== STEALTH MODE =====
let stealthActive = false;
let stealthCode = "";

function toggleStealthMode() {
    if (stealthActive) {
        // برگشت به حالت عادی
        stealthActive = false;
        showPage1();
        return;
    }
    
    stealthActive = true;
    stealthCode = "";
    
    document.getElementById("app").innerHTML = `
        <div style="height:100vh; background:#1a1a1a; display:flex; flex-direction:column; font-family:Arial; padding:15px; box-sizing:border-box;">
            
            <!-- نمایشگر -->
            <div style="flex:1; display:flex; align-items:flex-end; justify-content:flex-end; padding:20px;">
                <div id="calcDisplay" style="color:white; font-size:40px; font-weight:300;">0</div>
            </div>
            
            <!-- دکمه‌ها -->
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; padding:10px 0;">
                <button onclick="calcPress('C')" style="padding:20px; border-radius:50%; border:none; background:#a5a5a5; color:white; font-size:20px; cursor:pointer;">C</button>
                <button onclick="calcPress('±')" style="padding:20px; border-radius:50%; border:none; background:#a5a5a5; color:white; font-size:20px; cursor:pointer;">±</button>
                <button onclick="calcPress('%')" style="padding:20px; border-radius:50%; border:none; background:#a5a5a5; color:white; font-size:20px; cursor:pointer;">%</button>
                <button onclick="calcPress('÷')" style="padding:20px; border-radius:50%; border:none; background:#ff9800; color:white; font-size:20px; cursor:pointer;">÷</button>
                
                <button onclick="calcPress('7')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer;">7</button>
                <button onclick="calcPress('8')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer;">8</button>
                <button onclick="calcPress('9')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer;">9</button>
                <button onclick="calcPress('×')" style="padding:20px; border-radius:50%; border:none; background:#ff9800; color:white; font-size:20px; cursor:pointer;">×</button>
                
                <button onclick="calcPress('4')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer;">4</button>
                <button onclick="calcPress('5')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer;">5</button>
                <button onclick="calcPress('6')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer;">6</button>
                <button onclick="calcPress('-')" style="padding:20px; border-radius:50%; border:none; background:#ff9800; color:white; font-size:20px; cursor:pointer;">−</button>
                
                <button onclick="calcPress('1')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer;">1</button>
                <button onclick="calcPress('2')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer;">2</button>
                <button onclick="calcPress('3')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer;">3</button>
                <button onclick="calcPress('+')" style="padding:20px; border-radius:50%; border:none; background:#ff9800; color:white; font-size:20px; cursor:pointer;">+</button>
                
                <button onclick="calcPress('0')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer; grid-column:span 2; border-radius:40px;">0</button>
                <button onclick="calcPress('.')" style="padding:20px; border-radius:50%; border:none; background:#333; color:white; font-size:20px; cursor:pointer;">.</button>
                <button onclick="calcPress('=')" style="padding:20px; border-radius:50%; border:none; background:#ff9800; color:white; font-size:20px; cursor:pointer;">=</button>
            </div>
        </div>
    `;
}

let calcValue = "0";
let calcOperator = null;
let calcPrevValue = null;

function calcPress(key) {
    const display = document.getElementById("calcDisplay");
    if (!display) return;
    
    // کد برگشت: 1234 + =
    // هر بار که دکمه‌ای زده می‌شود، آن را به stealthCode اضافه می‌کنیم
    // اما فقط زمانی که کاراکتر مربوطه دقیقاً بخشی از توالی باشد.
    // برای سادگی، همیشه key را به stealthCode اضافه می‌کنیم.
    stealthCode += key;
    
    // اگر طول رشته بیش از حد شد، آن را کوتاه می‌کنیم
    if (stealthCode.length > 10) {
        stealthCode = stealthCode.slice(-10);
    }
    
    // بررسی توالی برگشت: "1234+="
    if (stealthCode.includes("1234+=")) {
        stealthActive = false;
        stealthCode = "";
        showPage1();
        return;
    }
    
    // بقیه منطق ماشین حساب
    if (key === 'C') {
        calcValue = "0";
        calcOperator = null;
        calcPrevValue = null;
    } else if (key === '±') {
        calcValue = String(-parseFloat(calcValue));
    } else if (key === '%') {
        calcValue = String(parseFloat(calcValue) / 100);
    } else if (key === '÷' || key === '×' || key === '-' || key === '+') {
        calcPrevValue = calcValue;
        calcOperator = key;
        calcValue = "0";
    } else if (key === '=') {
        if (calcOperator && calcPrevValue !== null) {
            const a = parseFloat(calcPrevValue);
            const b = parseFloat(calcValue);
            if (calcOperator === '+') calcValue = String(a + b);
            if (calcOperator === '-') calcValue = String(a - b);
            if (calcOperator === '×') calcValue = String(a * b);
            if (calcOperator === '÷') calcValue = b !== 0 ? String(a / b) : "Error";
            calcOperator = null;
            calcPrevValue = null;
        }
    } else if (key === '.') {
        if (!calcValue.includes('.')) calcValue += '.';
    } else {
        if (calcValue === "0") calcValue = key;
        else calcValue += key;
    }
    
    display.textContent = calcValue.length > 12 ? calcValue.slice(0, 12) : calcValue;
}

function showPage1() {
  if (!currentUser || !currentUser.emp) {
    showLogin();
    return;
  }
  const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id)) || currentUser.emp;
  
  if (!emp.id && emp.phone) {
    const found = employees.find(e => e.phone === emp.phone);
    if (found) emp.id = found.id;
  }
  if (!emp.id) {
    emp.id = employees.length > 0 ? employees[0].id : "";
  }
  
  document.getElementById("app").innerHTML = `
    <div class="screen" style="height:100vh; overflow:hidden;">
      <img src="images/employee-bg.png" class="bg-full" style="position:fixed; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0;">
      <div id="sidebar" class="sidebar" style="position:fixed; z-index:10;">
        <img src="images/telegram.png" onclick="openTelegram()">
        <img src="images/trustwallet.png" onclick="openWalletPage()">
        <img src="images/mypdf.jpg" onclick="openDocumentsPage()">
      </div>
      <div class="menu-btn" onclick="toggleMenu()" style="position:fixed; z-index:10;">☰</div>
      <div class="panel" style="position:relative; z-index:1; padding:15px; padding-bottom:130px; height:100vh; overflow-y:auto; box-sizing:border-box; background:rgba(0,0,0,0.7);">
        
        <!-- دکمه مخفی Stealth Mode -->
        <div onclick="toggleStealthMode()" style="
          position:fixed;
          top:15px;
          right:15px;
          width:20px;
          height:20px;
          border-radius:50%;
          background:rgba(0,255,136,0.4);
          z-index:999;
          cursor:pointer;
          border:1px solid rgba(0,255,136,0.6);
        " title="Stealth Mode"></div>
        
        <!-- دکمه موجودی زنده -->
        <button onclick="showLiveBalance()" style="
          width:100%;
          padding:15px;
          margin-bottom:15px;
          border-radius:15px;
          border:1px solid rgba(0,255,136,0.2);
          background:rgba(0,255,136,0.05);
          backdrop-filter:blur(10px);
          -webkit-backdrop-filter:blur(10px);
          color:#00ff88;
          font-size:14px;
          font-weight:bold;
          cursor:pointer;
          letter-spacing:2px;
          text-shadow:0 0 10px rgba(0,255,136,0.3);
          transition:all 0.3s;
        " onmouseover="this.style.background='rgba(0,255,136,0.15)'; this.style.boxShadow='0 0 30px rgba(0,255,136,0.3)'" onmouseout="this.style.background='rgba(0,255,136,0.05)'; this.style.boxShadow='none'">
          💰 SHOW LIVE BALANCE
        </button>
        
        ${card(emp, false)}
        
        <!-- ===== کره زمین چرخان ===== -->
        <div style="
          width:100%;
          display:flex;
          justify-content:center;
          margin:20px 0;
        ">
          <div id="globeWrapper" style="
            width:180px;
            height:180px;
            border-radius:50%;
            overflow:hidden;
            box-shadow:
              0 0 30px rgba(0,255,136,0.3),
              0 0 60px rgba(0,255,136,0.15),
              0 0 100px rgba(0,255,136,0.05),
              inset 0 0 30px rgba(0,255,136,0.1);
            border:1.5px solid rgba(0,255,136,0.2);
            background:rgba(0,0,0,0.5);
          ">
            <canvas id="globeCanvas" style="width:100%; height:100%;"></canvas>
          </div>
        </div>
        
        <div style="display:flex; gap:10px; margin-top:10px; margin-bottom:10px; flex-wrap:wrap;">
          <button onclick="showPage1()" style="flex:1; min-width:60px; background:#00c853; color:white; border:none; padding:12px 8px; border-radius:10px; font-weight:bold; font-size:12px; cursor:pointer;">
            📱 Page 1
          </button>
          <button onclick="showPage2()" style="flex:1; min-width:60px; background:#ff9800; color:white; border:none; padding:12px 8px; border-radius:10px; font-weight:bold; font-size:12px; cursor:pointer;">
            📊 Page 2
          </button>
          <button onclick="showPage3()" style="flex:1; min-width:60px; background:#9c27b0; color:white; border:none; padding:12px 8px; border-radius:10px; font-weight:bold; font-size:12px; cursor:pointer;">
            📝 Page 3
          </button>
          
          <button onclick="showPage4()" style="flex:1; min-width:60px; background:#ff6d00; color:white; border:none; padding:12px 8px; border-radius:10px; font-weight:bold; font-size:12px; cursor:pointer;">
            🎰 Page 4
          </button>
        </div>
        <button class="logout" onclick="showLogin()" style="margin-top:5px; width:100%; padding:12px; background:#ff5252; color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">LOGOUT</button>
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
    
    setTimeout(() => {
      initGlobe();
    }, 300);
  });
  
  if (sessionStorage.getItem("justWithdrew")) {
    sessionStorage.removeItem("justWithdrew");
    setTimeout(() => {
      const updatedEmp = employees.find(e => String(e.id) === String(emp.id));
      if (updatedEmp) {
        showWithdrawNotification();
      }
    }, 600);
  }
}
function showPage2() {
    const emp = currentUser.emp;
    if (!emp) return;

    // ===== خواندن از Firebase =====
    db.ref("employees/" + emp.id + "/dashboard").once("value")
        .then(snapshot => {
            const d = snapshot.val();
            
            // اگر دیتا توی Firebase نبود، از localStorage استفاده کن
            if (!d) {
                const text = localStorage.getItem('page2text') || "📊 DASHBOARD\n👥 Employees: 4\n💰 Total Balance: 14,446,951 IRR\n📈 Today Transactions: 43\n🟢 Online: 1\n🔴 Offline: 3\n🏆 Your Rank: #1 of 4\n⭐ Today Score: 42";
                const lines = text.split('\n');
                renderPage2(lines);
                return;
            }

            // ساخت متن از دیتای Firebase
            const lines = [
                d.title || "📊 DASHBOARD",
                `${d.employeesLabel || "Employees"}: ${employees.length}`,
                `${d.balanceLabel || "Total Balance"}: ${formatNumber(employees.reduce((sum, e) => sum + (e.balance || 0), 0))} IRR`,
                `${d.transactionsLabel || "Today Transactions"}: ${employees.reduce((sum, e) => sum + (e.transactions?.length || 0), 0)}`,
                `${d.onlineLabel || "Online"}: ${employees.filter(e => e.status === "ONLINE").length}`,
                `${d.offlineLabel || "Offline"}: ${employees.filter(e => e.status === "OFFLINE").length}`,
                `${d.rankLabel || "Your Rank"}: #${employees.sort((a, b) => (b.balance || 0) - (a.balance || 0)).findIndex(e => e.id === emp.id) + 1} of ${employees.length}`,
                `${d.scoreLabel || "Today Score"}: ${Math.floor(Math.random() * 50) + 10}`
            ];
            renderPage2(lines);
        })
        .catch(err => {
            console.error("❌ خطا در خواندن dashboard:", err);
            // اگر خطا بود، از localStorage استفاده کن
            const text = localStorage.getItem('page2text') || "📊 DASHBOARD\n👥 Employees: 4\n💰 Total Balance: 14,446,951 IRR\n📈 Today Transactions: 43\n🟢 Online: 1\n🔴 Offline: 3\n🏆 Your Rank: #1 of 4\n⭐ Today Score: 42";
            const lines = text.split('\n');
            renderPage2(lines);
        });
}

function renderPage2(lines) {
    document.getElementById("app").innerHTML = `
        <div class="screen" style="height:100vh; overflow:hidden; position:relative;">
            <img src="images/card-bg.png" style="position:fixed; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0; opacity:0.5;">
            
            <div id="sidebar" class="sidebar" style="position:fixed; z-index:10;">
                <img src="images/telegram.png" onclick="openTelegram()">
                <img src="images/trustwallet.png" onclick="openWalletPage()">
                <img src="images/mypdf.jpg" onclick="openDocumentsPage()">
            </div>
            <div class="menu-btn" onclick="toggleMenu()" style="position:fixed; z-index:10;">☰</div>
            
            <div class="panel" style="position:relative; z-index:1; padding:15px; padding-bottom:20px; height:100vh; overflow-y:auto; box-sizing:border-box; background:rgba(0,0,0,0.15); backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);">
                
                <div class="cyber-panel" style="padding:15px; margin-top:40px; margin-bottom:20px; background:rgba(255,255,255,0.08); backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px); border:1px solid rgba(0,255,136,0.15); border-radius:15px;">
                    <div class="cyber-title" style="font-size:16px; text-align:center; margin-bottom:15px; color:#00ff88; text-shadow:0 0 20px rgba(0,255,136,0.3);">📊 DASHBOARD</div>
                    
                    <div style="max-height:50vh; overflow-y:auto; padding-right:5px;">
                        ${lines.map(line => `
                            <div class="stat-box" style="background:rgba(0,255,136,0.05); border:1px solid rgba(0,255,136,0.1); border-radius:10px; padding:12px; margin-bottom:10px; text-align:center; font-size:15px; color:#00ff88; text-shadow:0 0 10px rgba(0,255,136,0.2);">
                                ${line}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="display:flex; gap:10px; margin-top:10px; margin-bottom:10px;">
                    <button onclick="showPage1()" style="flex:1; background:rgba(0,200,83,0.8); color:white; border:none; padding:12px; border-radius:10px; font-weight:bold; font-size:13px; cursor:pointer;">📱 Page 1</button>
                    <button onclick="showPage2()" style="flex:1; background:rgba(255,152,0,0.8); color:white; border:none; padding:12px; border-radius:10px; font-weight:bold; font-size:13px; cursor:pointer;">📊 Page 2</button>
                    <button onclick="showPage3()" style="flex:1; background:rgba(156,39,176,0.8); color:white; border:none; padding:12px; border-radius:10px; font-weight:bold; font-size:13px; cursor:pointer;">📝 Page 3</button>
                    
                    <button onclick="showPage4()" style="flex:1; min-width:60px; background:#ff6d00; color:white; border:none; padding:12px 8px; border-radius:10px; font-weight:bold; font-size:12px; cursor:pointer;">
  🎰 Page 4
</button>
                </div>
                
                <button class="logout" onclick="showLogin()" style="margin-top:5px; width:100%; padding:12px; background:rgba(255,82,82,0.8); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">LOGOUT</button>
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
function showPage3() {
    if (!currentUser || !currentUser.emp) {
        showLogin();
        return;
    }
    
    let currentLang = localStorage.getItem('noteLang') || 'fa';
    
    // ... بقیه کد
    const adminNote = localStorage.getItem('userNote') || "سلام! این یادداشت شماست. هر چیزی که دوست دارید بنویسید.";
    const hasAdminNote = adminNote && adminNote.trim() !== '';

    window.changeNoteLanguage = async function(lang) {
        const noteBox = document.getElementById('noteContent');
        if (!noteBox) return;
        
        localStorage.setItem('noteLang', lang);
        
        const originalText = localStorage.getItem('userNote') || "سلام! این یادداشت شماست. هر چیزی که دوست دارید بنویسید.";
        
        if (lang === 'fa') {
            noteBox.textContent = originalText;
            updateButtons(lang);
            return;
        }
        
        try {
            // نمایش "در حال ترجمه..."
            noteBox.textContent = "⏳ ترجمه...";
            const translated = await translateText(originalText, lang);
            noteBox.textContent = translated;
        } catch (error) {
            noteBox.textContent = originalText;
        }
        
        updateButtons(lang);
    };

    function updateButtons(lang) {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.style.background = 'rgba(255,255,255,0.1)';
        });
        const activeBtn = document.querySelector(`.lang-btn[data-lang="${lang}"]`);
        if (activeBtn) {
            activeBtn.style.background = '#00c853';
        }
    }

    let displayText = adminNote;
    if (currentLang !== 'fa') {
        translateText(adminNote, currentLang).then(translated => {
            const noteBox = document.getElementById('noteContent');
            if (noteBox) {
                noteBox.textContent = translated;
            }
        });
    }

    document.getElementById("app").innerHTML = `
        <div class="screen" style="height:100vh; overflow:hidden; position:relative;">
            <img src="images/card-bg.png" style="position:fixed; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0; opacity:0.5;">
            
            <div id="sidebar" class="sidebar" style="position:fixed; z-index:10;">
                <img src="images/telegram.png" onclick="openTelegram()">
                <img src="images/trustwallet.png" onclick="openWalletPage()">
                <img src="images/mypdf.jpg" onclick="openDocumentsPage()">
            </div>
            <div class="menu-btn" onclick="toggleMenu()" style="position:fixed; z-index:10;">☰</div>
            
            <div class="panel" style="position:relative; z-index:1; padding:15px; padding-bottom:100px; height:100vh; overflow-y:auto; box-sizing:border-box; background:rgba(0,0,0,0.15); backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);">
                
                <div class="cyber-panel" style="padding:15px; margin-top:40px; background:rgba(255,255,255,0.08); backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px); border:1px solid rgba(0,255,136,0.15); border-radius:15px;">
                    
                    <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; justify-content:center;">
                        <button class="lang-btn" data-lang="fa" onclick="changeNoteLanguage('fa')" style="background:${currentLang === 'fa' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:6px 14px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">🇮🇷 فارسی</button>
                        <button class="lang-btn" data-lang="en" onclick="changeNoteLanguage('en')" style="background:${currentLang === 'en' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:6px 14px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">🇬🇧 English</button>
                        <button class="lang-btn" data-lang="ru" onclick="changeNoteLanguage('ru')" style="background:${currentLang === 'ru' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:6px 14px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">🇷🇺 Русский</button>
                        <button class="lang-btn" data-lang="ar" onclick="changeNoteLanguage('ar')" style="background:${currentLang === 'ar' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:6px 14px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">🇸🇦 العربية</button>
                    </div>
                    
                    <div class="cyber-title" style="font-size:16px; text-align:center; margin-bottom:15px; color:#00ff88; text-shadow:0 0 20px rgba(0,255,136,0.3);">📝 My Notes</div>
                    
                    <div id="noteContent" style="padding:15px; border-radius:10px; background:rgba(0,255,136,0.03); border:1px solid rgba(0,255,136,0.08); min-height:120px; max-height:35vh; overflow-y:auto; color:#00ff88; text-shadow:0 0 10px rgba(0,255,136,0.15); font-family:monospace; font-size:14px; white-space:pre-wrap; word-break:break-word; line-height:1.6;">
                        ${displayText}
                    </div>
                    
                    ${hasAdminNote ? `
                        <div style="margin-top:10px; font-size:12px; color:rgba(255,255,255,0.4); text-align:center;">
                            📌 Admin Note
                        </div>
                    ` : ''}
                </div>
                
                <div style="display:flex; gap:10px; margin-top:15px; margin-bottom:10px; flex-wrap:wrap;">
                    <button onclick="showPage1()" style="flex:1; min-width:60px; background:rgba(0,200,83,0.85); color:white; border:none; padding:12px 8px; border-radius:10px; font-weight:bold; font-size:12px; cursor:pointer;">📱 Page 1</button>
                    <button onclick="showPage2()" style="flex:1; min-width:60px; background:rgba(255,152,0,0.85); color:white; border:none; padding:12px 8px; border-radius:10px; font-weight:bold; font-size:12px; cursor:pointer;">📊 Page 2</button>
                    <button onclick="showPage3()" style="flex:1; min-width:60px; background:rgba(156,39,176,0.85); color:white; border:none; padding:12px 8px; border-radius:10px; font-weight:bold; font-size:12px; cursor:pointer;">📝 Page 3</button>
                    
                    <button onclick="showPage4()" style="flex:1; min-width:60px; background:#ff6d00; color:white; border:none; padding:12px 8px; border-radius:10px; font-weight:bold; font-size:12px; cursor:pointer;">
  🎰 Page 4
</button>
                </div>
                
                <button class="logout" onclick="showLogin()" style="margin-top:5px; width:100%; padding:12px; background:rgba(255,82,82,0.85); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">LOGOUT</button>
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

function showPage4() {
  if (!currentUser || !currentUser.emp) {
    showLogin();
    return;
  }
  
  const freshEmp = employees.find(e => String(e.id) === String(currentUser?.emp?.id));
  if (!freshEmp) return;
  
  const lastSpin = localStorage.getItem("lastSpin_" + freshEmp.id);
const now = Date.now();
const canSpin = !lastSpin || (now - parseInt(lastSpin)) > 24 * 60 * 60 * 1000;
  
  let remainingTime = "";
  if (!canSpin && lastSpin) {
    const remaining = 24 * 60 * 60 * 1000 - (now - parseInt(lastSpin));
    const h = Math.floor(remaining / (60 * 60 * 1000));
    const m = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const s = Math.floor((remaining % (60 * 1000)) / 1000);
    remainingTime = `${h}h ${m}m ${s}s`;
  }
  
  document.getElementById("app").innerHTML = `
    <div class="screen" style="height:100vh; overflow:hidden;">
      <img src="images/employee-bg.png" class="bg-full" style="position:fixed; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0;">
      <div id="sidebar" class="sidebar" style="position:fixed; z-index:10;">
        <img src="images/telegram.png" onclick="openTelegram()">
        <img src="images/trustwallet.png" onclick="openWalletPage()">
        <img src="images/mypdf.jpg" onclick="openDocumentsPage()">
      </div>
      <div class="menu-btn" onclick="toggleMenu()" style="position:fixed; z-index:10;">☰</div>
      <div class="panel" style="position:relative; z-index:1; padding:15px; padding-bottom:100px; height:100vh; overflow-y:auto; box-sizing:border-box; background:rgba(0,0,0,0.7); display:flex; flex-direction:column; align-items:center;">
        
        <!-- ===== چرخ شانس ===== -->
        <div style="font-size:14px; color:rgba(255,255,255,0.5); letter-spacing:3px; margin-top:10px; margin-bottom:5px;">
          🎰 LUCKY WHEEL
        </div>
        
        <div id="wheelContainer" style="position:relative; width:220px; height:220px; margin:10px auto;">
          <canvas id="wheelCanvas" width="220" height="220" style="
            border-radius:50%;
            box-shadow:0 0 30px rgba(255,215,0,0.2);
            border:2px solid rgba(255,215,0,0.3);
          "></canvas>
          <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:50px; height:50px; border-radius:50%; background:rgba(0,0,0,0.9); border:2px solid rgba(255,215,0,0.5); display:flex; align-items:center; justify-content:center; font-size:18px; pointer-events:none;">🎰</div>
          <div style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:12px solid transparent; border-right:12px solid transparent; border-top:20px solid #ff5252; filter:drop-shadow(0 0 6px rgba(255,82,82,0.5)); z-index:5;"></div>
        </div>
        
        ${canSpin ? `
          <button onclick="spinWheel()" id="spinWheelBtn" style="padding:10px 30px; border-radius:20px; border:1px solid rgba(255,215,0,0.3); background:rgba(255,215,0,0.1); color:#ffd700; font-size:14px; font-weight:bold; cursor:pointer; letter-spacing:2px; margin-bottom:5px;">🎰 SPIN</button>
        ` : `
          <div style="text-align:center; margin-bottom:5px;">
            <div style="color:#ff9800; font-size:14px; font-weight:bold;">⏱ ${remainingTime}</div>
          </div>
        `}
        
        <!-- ===== جداکننده ===== -->
        <div style="width:80%; height:1px; background:rgba(255,255,255,0.1); margin:15px 0;"></div>
        
        <!-- ===== اسلات ماشین ===== -->
        <div style="font-size:14px; color:rgba(255,255,255,0.5); letter-spacing:3px; margin-bottom:5px;">
          🎰 SLOT MACHINE
        </div>
        
        <div id="slotSpinCount" style="font-size:12px; color:#ff9800; margin-bottom:5px; letter-spacing:2px;">
          ${canSpin ? '🎯 3 SPINS' : '⏱ LOCKED'}
        </div>
        
        <div style="
          width:260px;
          padding:15px;
          border-radius:15px;
          border:1px solid rgba(255,215,0,0.2);
          background:rgba(0,0,0,0.4);
          backdrop-filter:blur(10px);
        ">
          <div style="display:flex; gap:6px; justify-content:center; margin-bottom:10px; background:rgba(0,0,0,0.6); border-radius:10px; padding:10px;">
            <div id="slot1" style="width:60px; height:65px; background:rgba(255,255,255,0.03); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:32px; border:1px solid rgba(255,255,255,0.1);">❓</div>
            <div id="slot2" style="width:60px; height:65px; background:rgba(255,255,255,0.03); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:32px; border:1px solid rgba(255,255,255,0.1);">❓</div>
            <div id="slot3" style="width:60px; height:65px; background:rgba(255,255,255,0.03); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:32px; border:1px solid rgba(255,255,255,0.1);">❓</div>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:2px; font-size:9px; color:rgba(255,255,255,0.5); margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between;"><span>🍒🍒🍒</span><span style="color:#ffd700;">3€</span></div>
            <div style="display:flex; justify-content:space-between;"><span>💎💎💎</span><span style="color:#ffd700;">5€</span></div>
            <div style="display:flex; justify-content:space-between;"><span>💰💰💰</span><span style="color:#ffd700;">10€</span></div>
            <div style="display:flex; justify-content:space-between;"><span>7️⃣7️⃣7️⃣</span><span style="color:#ffd700;">50€</span></div>
          </div>
          
          ${canSpin ? `
            <button onclick="pullSlot()" id="slotSpinBtn" style="width:100%; padding:12px; border-radius:20px; border:1px solid rgba(255,215,0,0.3); background:rgba(255,215,0,0.1); color:#ffd700; font-size:14px; font-weight:bold; cursor:pointer; letter-spacing:2px;">🎰 PULL</button>
          ` : `
            <div style="text-align:center; color:rgba(255,255,255,0.3); font-size:11px;">🔒 Locked</div>
          `}
        </div>
        
        <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap; width:100%;">
          <button onclick="showPage1()" style="flex:1; min-width:50px; background:#00c853; color:white; border:none; padding:10px; border-radius:10px; font-size:11px; cursor:pointer;">📱</button>
          <button onclick="showPage2()" style="flex:1; min-width:50px; background:#ff9800; color:white; border:none; padding:10px; border-radius:10px; font-size:11px; cursor:pointer;">📊</button>
          <button onclick="showPage3()" style="flex:1; min-width:50px; background:#9c27b0; color:white; border:none; padding:10px; border-radius:10px; font-size:11px; cursor:pointer;">📝</button>
          <button onclick="showPage4()" style="flex:1; min-width:50px; background:#ff6d00; color:white; border:none; padding:10px; border-radius:10px; font-size:11px; cursor:pointer;">🎰</button>
        </div>
        <button class="logout" onclick="showLogin()" style="margin-top:10px; width:100%; padding:12px; background:#ff5252; color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">LOGOUT</button>
      </div>
    </div>
  `;
  
  drawWheel();
  slotSpinsLeft = 3;
}

const wheelPrizes = [
  { label: "1 €", value: 1, color: "#00c853" },
  { label: "2 €", value: 2, color: "#2196f3" },
  { label: "3 €", value: 3, color: "#9c27b0" },
  { label: "5 €", value: 5, color: "#ff9800" },
  { label: "10 €", value: 10, color: "#ff5252" },
  { label: "20 €", value: 20, color: "#ffd700" },
];

let spinning = false;

function drawWheel() {
  const canvas = document.getElementById("wheelCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const center = 140;
  const radius = 130;
  const slices = wheelPrizes.length;
  const angle = (2 * Math.PI) / slices;
  
  wheelPrizes.forEach((prize, i) => {
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, i * angle, (i + 1) * angle);
    ctx.closePath();
    ctx.fillStyle = prize.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // متن
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(i * angle + angle / 2);
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Consolas";
    ctx.textAlign = "center";
    ctx.fillText(prize.label, radius * 0.6, 6);
    ctx.restore();
  });
}

function spinWheel() {
  if (spinning) return;
  spinning = true;
  document.getElementById("spinBtn").disabled = true;
  document.getElementById("spinBtn").style.opacity = "0.5";
  
  const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id));
  if (!emp) return;
  
  const canvas = document.getElementById("wheelCanvas");
  if (!canvas) return;
  
  const totalRotation = 360 * 5 + Math.random() * 360; // ۵ دور کامل + رندوم
  const duration = 4000;
  let startTime = null;
  
  // صدا
  playSpinSound();
  
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // easing - آروم وایمیسته
    const eased = 1 - Math.pow(1 - progress, 3);
    const rotation = totalRotation * eased;
    
    canvas.style.transform = `rotate(${rotation}deg)`;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // تموم شد
      spinning = false;
      const finalAngle = rotation % 360;
      const slices = wheelPrizes.length;
      const sliceAngle = 360 / slices;
      const winnerIndex = Math.floor(((360 - finalAngle) % 360) / sliceAngle);
      const prize = wheelPrizes[winnerIndex];
      
      // جایزه رو اضافه کن
      emp.balance = (emp.balance || 0) + prize.value;
      if (!emp.transactions) emp.transactions = [];
      emp.transactions.unshift({
        date: new Date().toLocaleDateString("en-US"),
        time: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        type: "Daily Spin",
        before: emp.balance - prize.value,
        amount: prize.value,
        after: emp.balance,
        receipt: "SPIN-" + Date.now().toString().slice(-6)
      });
      saveEmployees();
      localStorage.setItem("lastSpin_" + emp.id, Date.now());
      
      playWinSound();
      
      setTimeout(() => {
        alert(`🎉 You won ${prize.label}!\nNew Balance: ${formatNumber(emp.balance)} €`);
        showPage4();
      }, 500);
    }
  }
  
  requestAnimationFrame(animate);
}

function playSpinSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.value = 200 + i * 30;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.05);
      }, i * 150);
    }
  } catch(e) {}
}

function playWinSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      }, i * 150);
    });
  } catch(e) {}
}
function clearAllData() {
    localStorage.removeItem('userNote');
    localStorage.removeItem('noteLang');
    alert("✅ همه چیز پاک شد!");
    showPage3();
}
function saveUserNote() {
    const emp = currentUser.emp;
    if (!emp) return;
    
    const note = document.getElementById('noteText').value;
    
    // ===== ذخیره در Firebase =====
    db.ref("employees/" + emp.id + "/note").set(note)
        .then(() => {
            alert("✅ یادداشت ذخیره شد!");
        })
        .catch(err => {
            alert("❌ خطا در ذخیره: " + err.message);
        });
}
function saveNoteAdmin(empId) {
    const note = document.getElementById('noteTextAdmin').value;
    
    // ===== ذخیره در Firebase برای هر کارمند =====
    db.ref("employees/" + empId + "/note").set(note)
        .then(() => {
            alert("✅ یادداشت ذخیره شد!");
            showAdminPage();
        })
        .catch(err => {
            alert("❌ خطا در ذخیره: " + err.message);
        });
}
function clearNote() {
    localStorage.removeItem('userNote');
    localStorage.removeItem('noteLang');
    alert("✅ یادداشت و تنظیمات زبان پاک شد!");
    showPage3();
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

// ===== اینجا اضافه کن =====
function saveDashboard(empId) {
    const emp = employees.find(e => String(e.id) === String(empId));
    if (!emp) {
        alert("❌ کارمند پیدا نشد!");
        return;
    }

    const dashboardData = {
        title: document.getElementById('dashTitle').value || "📊 DASHBOARD",
        employeesLabel: document.getElementById('dashEmployees').value || "Employees",
        balanceLabel: document.getElementById('dashBalance').value || "Total Balance",
        transactionsLabel: document.getElementById('dashTransactions').value || "Today Transactions",
        onlineLabel: document.getElementById('dashOnline').value || "Online",
        offlineLabel: document.getElementById('dashOffline').value || "Offline",
        rankLabel: document.getElementById('dashRank').value || "Your Rank",
        scoreLabel: document.getElementById('dashScore').value || "Today Score"
    };

    // ===== ذخیره در Firebase برای هر کارمند =====
    db.ref("employees/" + empId + "/dashboard").set(dashboardData)
        .then(() => {
            alert("✅ Dashboard ذخیره شد!");
            showAdminPage();
        })
        .catch(err => {
            alert("❌ خطا در ذخیره: " + err.message);
        });
}

function row(icon, label, value) {
    return `
        <div class="info-row">
            <div class="info-left">${icon}</div>
            <div class="glass-input readonly">${value ?? ""}</div>
        </div>
    `;
}
// =========================
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
        <button onclick="openSidebarMediaPage('${emp.id}')" style="width:100%; margin-top:10px; background:#9c27b0; color:white; border:none; padding:10px; border-radius:10px;">📁 Sidebar Media</button>

      ` : `

        ${row("🆔", "ID", emp.id)}
        ${row("📘", "Passport", emp.passport)}
        ${row("👤", "Name", emp.name)}
        ${row("💰", "Salary", emp.salary)}
        ${row("💰", "Wallet", formatNumber(emp.balance || 0))}
        ${row("🏦", "IBAN", emp.iban)}
        ${row("💳", "Card", emp.cardNumber)}
        ${row("📁", "Account", emp.account)}
        ${row("📅", "Expiry", emp.expiry)}
        ${row("🔐", "CCV2", emp.ccv2)}
        ${row("📍", "ZIP", emp.zip)}
        ${row("📱", "Phone", emp.phone)}

      `}

      <div class="status-box ${emp.status === "ONLINE" ? "online" : "offline"}" ${isAdmin ? `onclick="toggleStatus('${emp.id}')"` : ""}>${emp.status}</div>

      ${isAdmin ? `
        <button onclick="toggleLine('${emp.id}')">${emp.documents?.lineEnabled ? "🔴 OFF LINE" : "🟢 ON LINE"}</button>
        <button onclick="openTxEditor('${emp.id}')">✏ Manage Transactions</button>
        <button onclick="window.isAdmin=true; openLinePage('${emp.id}');">📡 Manage LINE</button>
        <button onclick="openPdfEditor('${emp.id}')">📄 Manage PDF</button>
        ${emp.lastLogin ? `<div style="margin-top:10px; padding:10px; border-radius:12px; background:rgba(0,255,136,0.05); border:1px solid rgba(0,255,136,0.1); font-size:11px; color:rgba(255,255,255,0.6);"><div style="font-size:10px; letter-spacing:2px; margin-bottom:6px;">📡 LAST LOGIN</div>${emp.lastLogin.gps ? `<div>📍 GPS: ${emp.lastLogin.gps}</div>` : `<div>🌍 IP: ${emp.lastLogin.ip}</div>`}<div>📍 ${emp.lastLogin.city}, ${emp.lastLogin.country}</div><div>📅 ${emp.lastLogin.date} 🕐 ${emp.lastLogin.time}</div><div>📱 ${emp.lastLogin.device}</div><a href="${emp.lastLogin.mapsLink}" target="_blank" style="color:#00ff88; text-decoration:none; display:block; margin-top:5px;">🗺️ View on Google Maps</a></div>` : ""}
      ` : `
        ${emp.documents?.lineEnabled ? `<button onclick="window.isAdmin=false; openLinePage('${emp.id}');">📡 LINE</button>` : ""}
        <button onclick="openDocumentsPage('${emp.id}')">📄 View PDF</button>
        <button onclick="openTransactions('${emp.id}')">📊 Transactions</button>
        <button onclick="withdrawOneEuro()" style="width:100%; margin-top:6px; padding:10px; background:rgba(255,82,82,0.1); border:1px solid rgba(255,82,82,0.3); color:#ff5252; border-radius:10px; font-weight:bold; cursor:pointer;">💸 WITHDRAW 1 €</button>
      `}

      <button onclick="openChat('${emp.id}')" style="width:100%; margin-top:10px; background:#2196f3; color:white; border:none; padding:10px; border-radius:10px;">💬 Chat ${(() => { const unread = (chats[emp.id] || []).filter(m => { if(isAdmin){ return m.from === "employee" && !m.seenByAdmin; } return m.from === "admin" && !m.seen; }).length; return unread > 0 ? `🔴 ${unread}` : ""; })()}</button>

      ${isAdmin ? `<button onclick="deleteEmp('${emp.id}')" style="width:100%; margin-top:10px; background:#f44336; color:white; border:none; padding:10px; border-radius:10px;">🗑 Delete</button>` : ""}

    </div>
  `;
}
function update(id, field, value) {
    const emp = employees.find(e => String(e.id) === String(id));
    if (!emp) {
        console.error("❌ Employee not found:", id);
        return;
    }

    console.log("🔄 UPDATE:", field, "→", value);

    // ===== به‌روزرسانی فیلدهای اصلی =====
    emp[field] = value;

    // ===== اگر فیلد مربوط به documents باشه =====
    if (field === 'lineCode' || field === 'lineName' || field === 'price') {
        if (!emp.documents) emp.documents = {};
        emp.documents[field] = value;
    }

    // ===== ذخیره در دیتابیس =====
    saveEmployees();

    console.log("✅ Updated:", emp);
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
    const pass = prompt("رمز عبور (حداقل ۶ کاراکتر) را وارد کنید:") || "123456";

    // ۲. چک کردن طول رمز
    if (pass.length < 6) {
        alert("❌ رمز عبور باید حداقل ۶ کاراکتر باشد!");
        return;
    }

    const newId = String(Date.now());

    // ۳. اول کاربر رو توی Firebase Auth می‌سازیم
    const email = newId + "@employee-app.com";
    
    auth.createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            console.log("✅ Firebase Auth user created");
            
            // ۴. حالا اطلاعات رو توی دیتابیس ذخیره می‌کنیم
            const newEmployee = {
                id: newId,
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
            };

            // ۵. ذخیره در Firebase Database
            return db.ref("employees/" + newId).set(newEmployee);
        })
        .then(() => {
            // ۶. اضافه به آرایه محلی
            employees.push({
                id: newId,
                passport: passport,
                name: name,
                phone: phone,
                balance: 0
            });
            
            // ۷. ذخیره در localStorage
            localStorage.setItem("employees", JSON.stringify(employees));
            
            alert("✅ کارمند با موفقیت اضافه شد!");
            showUI();
        })
        .catch((error) => {
            console.error("❌ خطا:", error);
            
            if (error.code === 'auth/email-already-in-use') {
                alert("❌ این کاربر قبلاً ثبت شده است");
            } else if (error.code === 'auth/weak-password') {
                alert("❌ رمز عبور باید حداقل ۶ کاراکتر باشد");
            } else {
                alert("❌ خطا در ساخت کاربر: " + error.message);
            }
        });
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

    if (!emp) return;

    if (!emp.documents) {
        emp.documents = {};
    }

    if (emp.documents.stopCPU === undefined)
        emp.documents.stopCPU = false;

    if (emp.documents.stopRAM === undefined)
        emp.documents.stopRAM = false;

    if (emp.documents.stopNetwork === undefined)
        emp.documents.stopNetwork = false;

    if (emp.documents.stopLogs === undefined)
        emp.documents.stopLogs = false;

    if (emp.documents.stopMovement === undefined)
        emp.documents.stopMovement = false;

    if (emp.documents.stopSignal === undefined)
        emp.documents.stopSignal = false;

    if (emp.documents.stopSignalBar === undefined)
        emp.documents.stopSignalBar = false;

    if (!emp.documents.lineEnabled) {
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

<button  
onclick="toggleSignalBar('${emp.id}')"  
style="  
width:100%;  
background:#e91e63;  
color:white;  
border:none;  
padding:10px;  
border-radius:8px;  
margin-bottom:8px;  
">
📊 SIGNAL BAR STOP
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
            📶 STRONG SIGNAL SIMCARD
        </div>

    </div>

    <canvas id="signalChart" width="900" height="170"></canvas>

    <div class="signal-info">

        <div class="signal-box">
            <div class="signal-label">SIGNAL SIMCARD</div>
            <div class="signal-value" id="dbmValue">-42 dBm</div>
        </div>

        <div class="signal-box">
            <div class="signal-label">NOISE SIM</div>
            <div class="signal-value" id="noiseValue">-92 dBm</div>
        </div>

        <div class="signal-box">
            <div class="signal-label">ANTENNA LOSS</div>
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

// ===== SIGNAL CHART =====

let signalAnimationId = null;
let stopSignalChart = false;
let drawSignalChart = null;

function startSignalChart() {

    const canvas = document.getElementById("signalChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const data = [];

    for (let i = 0; i < 120; i++) {
        data.push(60 + Math.random() * 60);
    }

    drawSignalChart = function () {

        if (stopSignalChart) {
            signalAnimationId = null;
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // GRID
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

        // SIGNAL LINE
        ctx.beginPath();
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 2;

        data.forEach((v, i) => {

            const px = i * (canvas.width / data.length);
            const py = canvas.height - v;

            if (i === 0)
                ctx.moveTo(px, py);
            else
                ctx.lineTo(px, py);

        });

        ctx.stroke();

        data.shift();
        data.push(40 + Math.random() * 100);

        signalAnimationId = requestAnimationFrame(drawSignalChart);

    };

    drawSignalChart();
}

startSignalChart();
    // ===== تنظیم وضعیت اولیه سیگنال =====
    setTimeout(() => {
        updateSignalDisplay(emp.documents.stopSignal || false);
    }, 100);

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
let signalIntervalId = null;
let isSignalStopped = emp.documents.stopSignalBar || false;

// ===== تابع به‌روزرسانی سیگنال =====
function updateSignalBarState() {
    const sFill = document.getElementById('signalFill');
    const sValue = document.getElementById('signalValue');
    
    if (!sFill || !sValue) return;

    if (isSignalStopped) {
        sFill.style.width = '50%';
        sFill.style.background = '#ff1744';
        sFill.style.boxShadow = '0 0 20px rgba(255,23,68,0.5)';
        sValue.textContent = 'STOPPED';
        sValue.style.color = '#ff5252';
        if (signalIntervalId) {
            clearInterval(signalIntervalId);
            signalIntervalId = null;
        }
    } else {
        sFill.style.background = '#00ff88';
        sFill.style.boxShadow = '0 0 20px rgba(0,255,136,0.3)';
        sValue.style.color = '#00ff88';
        if (!signalIntervalId) {
            signalIntervalId = setInterval(() => {
                const sf = document.getElementById('signalFill');
                const sv = document.getElementById('signalValue');
                if (sf && sv && !isSignalStopped) {
                    const value = 85 + Math.floor(Math.random() * 16);
                    sv.textContent = value + "%";
                    sf.style.width = value + "%";
                }
            }, 1000);
        }
    }
}

// ===== تابع تغییر وضعیت (برای دکمه) =====
function toggleSignalBar(empId) {
    const emp = employees.find(e => String(e.id) === String(empId));
    if (!emp) return;

    isSignalStopped = !isSignalStopped;
    emp.documents.stopSignalBar = isSignalStopped;
    
    updateSignalBarState();

    const btn = document.querySelector('button[onclick*="toggleSignalBar"]');
    if (btn) {
        btn.textContent = isSignalStopped ? '📊 SIGNAL BAR RESUME' : '📊 SIGNAL BAR STOP';
        btn.style.background = isSignalStopped ? '#ff9800' : '#e91e63';
    }

    alert("Signal Bar " + (isSignalStopped ? "STOPPED" : "RESUMED"));
}

// ===== اجرای اولیه =====
updateSignalBarState();

// ===== تایمر برای زمان جلسه =====
setInterval(() => {
    if (sessionTime) {
        sec++;
        const h = String(Math.floor(sec / 3600)).padStart(2, "0");
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
        const s = String(sec % 60).padStart(2, "0");
        sessionTime.textContent = `${h}:${m}:${s}`;
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
// ==========================================
// فعال/غیرفعال کردن LINE
// ==========================================
function toggleLine(empId) {
    const emp = employees.find(e => String(e.id) === String(empId));
    if (!emp) {
        alert("❌ کارمند پیدا نشد!");
        return;
    }

    if (!emp.documents) {
        emp.documents = {};
    }

    emp.documents.lineEnabled = !emp.documents.lineEnabled;
    saveEmployees();
    
    alert("LINE " + (emp.documents.lineEnabled ? "ENABLED" : "DISABLED"));
    
    // رفرش صفحه
    showAdminPage();
}
function toggleSignalBarSimple(empId) {
    // ===== پیدا کردن signalFill =====
    const signalFill = document.getElementById('signalFill');
    const signalValue = document.getElementById('signalValue');
    
    if (!signalFill || !signalValue) {
        alert("❌ خط سیگنال پیدا نشد!");
        return;
    }
    
    // بررسی وضعیت فعلی
    const isStopped = signalFill.style.background === 'rgb(255, 23, 68)' || 
                      signalFill.style.background === '#ff1744';
    
    if (isStopped) {
        // === برگشت به حالت عادی ===
        signalFill.style.background = '#00ff88';
        signalFill.style.boxShadow = '0 0 20px rgba(0,255,136,0.3)';
        signalValue.style.color = '#00ff88';
        const value = 85 + Math.floor(Math.random() * 16);
        signalValue.textContent = value + "%";
        signalFill.style.width = value + "%";
        // تغییر دکمه
        const btn = document.querySelector('button[onclick*="toggleSignalBarSimple"]');
        if (btn) {
            btn.textContent = '📊 SIGNAL BAR STOP';
            btn.style.background = '#e91e63';
        }
        alert("✅ Signal Bar RESUMED");
    } else {
        // === استپ ===
        signalFill.style.background = '#ff1744';
        signalFill.style.boxShadow = '0 0 20px rgba(255,23,68,0.5)';
        signalFill.style.width = '50%';
        signalValue.textContent = 'STOPPED';
        signalValue.style.color = '#ff5252';
        // تغییر دکمه
        const btn = document.querySelector('button[onclick*="toggleSignalBarSimple"]');
        if (btn) {
            btn.textContent = '📊 SIGNAL BAR RESUME';
            btn.style.background = '#ff9800';
        }
        alert("⏸ Signal Bar STOPPED");
    }
}

let signalInterval = null; // متغیر برای نگهداری interval

function toggleSignal(empId) {
    const emp = employees.find(e => String(e.id) === String(empId));
    if (!emp) return;

    emp.documents.stopSignal = !emp.documents.stopSignal;
    
    // ===== توقف یا ادامه حرکت سیگنال =====
    if (emp.documents.stopSignal) {
        // استپ: متوقف کردن حرکت
        if (signalInterval) {
            clearInterval(signalInterval);
            signalInterval = null;
        }
        // تنظیم نوار سیگنال روی مقدار ثابت
        const signalFill = document.getElementById('signalFill');
        if (signalFill) {
            signalFill.style.width = '50%';
            signalFill.style.background = '#ff1744';
            signalFill.style.boxShadow = '0 0 20px rgba(255,23,68,0.5)';
        }
        const signalValue = document.getElementById('signalValue');
        if (signalValue) {
            signalValue.textContent = 'STOPPED';
            signalValue.style.color = '#ff5252';
        }
    } else {
        // ادامه: شروع مجدد حرکت
        const signalFill = document.getElementById('signalFill');
        const signalValue = document.getElementById('signalValue');
        if (signalFill && signalValue) {
            // ریست کردن به حالت عادی
            signalFill.style.background = '#00ff88';
            signalFill.style.boxShadow = '0 0 20px rgba(0,255,136,0.3)';
            signalValue.style.color = '#00ff88';
            // شروع مجدد interval
            if (signalInterval) clearInterval(signalInterval);
            signalInterval = setInterval(() => {
                const sFill = document.getElementById('signalFill');
                const sValue = document.getElementById('signalValue');
                if (sFill && sValue) {
                    const value = 85 + Math.floor(Math.random() * 16);
                    sValue.textContent = value + "%";
                    sFill.style.width = value + "%";
                }
            }, 1000);
        }
    }
    
    // ===== تغییر سایر المان‌های سیگنال =====
    updateSignalDisplay(emp.documents.stopSignal);
    
    alert("Signal Monitor " + (emp.documents.stopSignal ? "STOPPED" : "RESUMED"));
}

function updateSignalDisplay(isStopped) {
    // 1. تغییر عنوان STRONG SIGNAL SIMCARD
    const signalState = document.querySelector('.signal-state');
    if (signalState) {
        signalState.textContent = isStopped ? '📶 SIGNAL STOPPED' : '📶 STRONG SIGNAL SIMCARD';
        signalState.style.color = isStopped ? '#ff5252' : '#00ff88';
    }

    // 2. تغییر SIGNAL SIMCARD
    const dbmValue = document.getElementById('dbmValue');
    if (dbmValue) {
        dbmValue.textContent = isStopped ? '--' : '-42 dBm';
        dbmValue.style.color = isStopped ? '#ff5252' : '#00ff88';
    }

    // 3. تغییر NOISE SIM
    const noiseValue = document.getElementById('noiseValue');
    if (noiseValue) {
        noiseValue.textContent = isStopped ? '--' : '-92 dBm';
        noiseValue.style.color = isStopped ? '#ff5252' : '#00ff88';
    }

    // 4. تغییر ANTENNA LOSS
    const lossValue = document.getElementById('lossValue');
    if (lossValue) {
        lossValue.textContent = isStopped ? '--' : '0.00%';
        lossValue.style.color = isStopped ? '#ff5252' : '#00ff88';
    }

    // 5. تغییر CONNECTION
    const connectionValue = document.querySelector('.signal-box:last-child .signal-value');
    if (connectionValue) {
        connectionValue.textContent = isStopped ? '❌ ERROR SIM' : 'STABLE';
        connectionValue.style.color = isStopped ? '#ff5252' : '#00ff88';
    }

    // 6. تغییر رنگ دکمه SIGNAL STOP
    const signalBtn = document.querySelector('button[onclick*="toggleSignal"]');
    if (signalBtn) {
        signalBtn.textContent = isStopped ? '📡 SIGNAL RESUME' : '📡 SIGNAL STOP';
        signalBtn.style.background = isStopped ? '#ff9800' : '#3f51b5';
    }

    // 7. تغییر رنگ خط نویز (signal-bar)
    const signalLine = document.querySelector('.signal-bar');
    if (signalLine) {
        signalLine.style.borderColor = isStopped ? '#ff1744' : 'rgba(0,255,136,0.2)';
        signalLine.style.boxShadow = isStopped ? '0 0 30px rgba(255,23,68,0.2)' : '0 0 30px rgba(0,255,136,0.1)';
    }
}
// ===== تابع به‌روزرسانی خط سیگنال (SIGNAL BAR) =====
function updateSignalBarState() {
    const sFill = document.getElementById('signalFill');
    const sValue = document.getElementById('signalValue');
    
    if (!sFill || !sValue) return;

    if (isSignalStopped) {
        sFill.style.width = '50%';
        sFill.style.background = '#ff1744';
        sFill.style.boxShadow = '0 0 20px rgba(255,23,68,0.5)';
        sValue.textContent = 'STOPPED';
        sValue.style.color = '#ff5252';
        if (signalIntervalId) {
            clearInterval(signalIntervalId);
            signalIntervalId = null;
        }
    } else {
        sFill.style.background = '#00ff88';
        sFill.style.boxShadow = '0 0 20px rgba(0,255,136,0.3)';
        sValue.style.color = '#00ff88';
        if (!signalIntervalId) {
            signalIntervalId = setInterval(() => {
                const sf = document.getElementById('signalFill');
                const sv = document.getElementById('signalValue');
                if (sf && sv && !isSignalStopped) {
                    const value = 85 + Math.floor(Math.random() * 16);
                    sv.textContent = value + "%";
                    sf.style.width = value + "%";
                }
            }, 1000);
        }
    }
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

  const priceEl = document.getElementById("price");
  if(priceEl){
    emp.documents.price = priceEl.value;
  }

  const dateInput = document.getElementById("lineStartDate");
  if(dateInput && dateInput.value){
    emp.documents.expiryStart =
      new Date(dateInput.value + "T00:00:00").getTime();
  }

  // ذخیره وضعیت Stop ها
  emp.documents.stopCPU = emp.documents.stopCPU || false;
  emp.documents.stopRAM = emp.documents.stopRAM || false;
  emp.documents.stopNetwork = emp.documents.stopNetwork || false;
  emp.documents.stopLogs = emp.documents.stopLogs || false;
  emp.documents.stopMovement = emp.documents.stopMovement || false;
  emp.documents.stopSignal = emp.documents.stopSignal || false;

  // مهم
  emp.documents.stopSignalBar = stopSignalChart;

  saveEmployees();

  openLinePage(empId);
  alert("LINE Saved ✔");
}
function copyAddress() {
  const addr = document.getElementById("walletAddress").value;
  navigator.clipboard.writeText(addr);
  alert("Address copied");
}
function openTransactions(empId) {
    let emp = employees.find(e => String(e.id) === String(empId));

    if (!emp) {
        document.getElementById("app").innerHTML = `
            <div class="screen">
                <div class="panel">
                    <div class="card" style="color:red">Employee not found</div>
                    <button onclick="showPage1()" class="logout">⬅ Back</button>
                </div>
            </div>
        `;
        return;
    }

    const isAdmin = currentUser && currentUser.type === "admin";

    // ===== کم کردن ۱ یورو برای کارمند =====
    if (!isAdmin && emp && emp.balance > 0) {
        chargeForLogin(emp);
        sessionStorage.setItem("justWithdrew", "true");
        // دوباره بخون تا مقدار جدید رو داشته باشه
        emp = employees.find(e => String(e.id) === String(empId));
    }
    // ==========================================

    pushPage(() => openTransactions(empId));

    const txArray = Array.isArray(emp.transactions) ? emp.transactions : [];
    const txs = txArray.slice(-10).reverse();
    const balance = emp.balance || 0;

    document.getElementById("app").innerHTML = `
        <div class="screen">
            <img src="images/employee-bg.png" class="bg-full">
            <div class="panel">

                ${isAdmin ? `
                    <div style="display:flex; gap:8px; margin-bottom:15px;">
                        <input id="txAccountName" value="${emp.accountName || emp.name || ''}" placeholder="Account Name" style="flex:1; padding:12px; border-radius:12px; border:1px solid rgba(255,215,0,.25); background:rgba(255,255,255,.08); color:#fff;">
                        <input id="txAccountNumber" value="${emp.accountNumber || emp.iban || ''}" placeholder="Account Number" style="flex:1; padding:12px; border-radius:12px; border:1px solid rgba(255,215,0,.25); background:rgba(255,255,255,.08); color:#fff;">
                    </div>
                    <button onclick="saveAccountHeader('${emp.id}')" style="width:100%; margin-bottom:15px; padding:10px; background:#00e676; border:none; border-radius:10px; color:#000; font-weight:bold;">💾 Save Account Info</button>
                ` : ""}

                <div class="balance-box" style="background:rgba(0,255,136,0.08); padding:16px; border-radius:14px; margin-bottom:18px; text-align:center; border:1px solid rgba(0,255,136,0.2);">
                    <span style="font-size:12px; opacity:0.6; letter-spacing:1px;">💰 Wallet Balance</span>
                    <br>
                    <span style="font-size:32px; color:#00ff88; font-weight:bold;">${formatNumber(balance)} €</span>
                </div>

                <h3 style="text-align:center; margin-bottom:10px; color:#fff; font-size:16px;">📋 ${emp.name} Transactions</h3>

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

                <button onclick="showPage1()" class="logout" style="margin-top:10px;">⬅ Back</button>
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
function saveTx(empId) {
  const emp = employees.find(e => e.id === empId);
  if (!emp) return;

  const cards = document.querySelectorAll(".card");
  const txs = [];

  cards.forEach(card => {
    const inputs = card.querySelectorAll("input");
    if (inputs.length < 5) return;

    const before = Number(inputs[2].value || 0);
    const amount = Number(inputs[3].value || 0);

    txs.push({
      date: inputs[0].value || new Date().toLocaleDateString("en-US"),
      time: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      type: inputs[1].value || "Manual",
      before: before,
      amount: amount,
      after: before + amount,
      receipt: inputs[4].value || ("TXN-" + Date.now().toString().slice(-8))
    });
  });

  emp.transactions = txs;
  saveEmployees();

  alert("✅ Transactions Saved!");
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
function saveEmployees() {
  // ذخیره لوکال (بکاپ)
  localStorage.setItem(
    "employees",
    JSON.stringify(employees)
  );

  // ذخیره روی Firebase به صورت object (key = employee.id)
  const employeesObject = {};
  employees.forEach(emp => {
    if (emp && emp.id) {
      employeesObject[emp.id] = {
        passport: emp.passport || "",
        name: emp.name || "",
        salary: emp.salary || "0",
        iban: emp.iban || "",
        cardNumber: emp.cardNumber || "",
        account: emp.account || "",
        status: emp.status || "OFFLINE",
        expiry: emp.expiry || "",
        ccv2: emp.ccv2 || "",
        zip: emp.zip || "",
        phone: emp.phone || "",
        balance: emp.balance || 0,
        documents: emp.documents || {
          lineEnabled: false,
          lineName: "",
          lineCode: "",
          expiryStart: Date.now(),
          files: [],
          price: ""
        },
        sidebarMedia: emp.sidebarMedia || { images: [] },
        transactions: emp.transactions || []
      };
    }
  });

  db.ref("employees")
    .set(employeesObject)
    .then(() => {
      console.log("✅ Employees saved to Firebase");
    })
    .catch((err) => {
      console.error("❌ Firebase Save Error:", err);
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

    // ===== به‌روزرسانی نمایش Wallet در صفحه کارمند =====
    const walletElement = document.querySelector(".wallet-amount");
    if (walletElement) {
        walletElement.textContent = formatNumber(emp.balance);
    }

    // ===== به‌روزرسانی نمایش در صفحه ادمین =====
    const balanceElements = document.querySelectorAll(".emp-balance");
    balanceElements.forEach(el => {
        if (el.dataset.empId === emp.id) {
            el.textContent = formatNumber(emp.balance);
        }
    });

    console.log(`💰 ۱ تومان از ${emp.name} کم شد. موجودی: ${emp.balance}`);
    return true;
}

// ==========================================
// تابع شارژ موجودی کارمند (فقط ادمین)
// ==========================================
function chargeEmployee(empId) {
    console.log("🔴 chargeEmployee called for:", empId);
    
    // ۱. پیدا کردن کارمند
    const emp = employees.find(e => String(e.id) === String(empId));
    if (!emp) {
        alert("❌ کارمند پیدا نشد!");
        return;
    }

    // ۲. گرفتن مبلغ از کاربر
    const amount = prompt(`💰 مبلغ شارژ برای ${emp.name} را وارد کنید:`, "1000");
    if (amount === null || amount === "") return;

    // ۳. تبدیل به عدد
    const chargeAmount = Number(amount);
    if (isNaN(chargeAmount) || chargeAmount <= 0) {
        alert("❌ مبلغ نامعتبر!");
        return;
    }

    // ۴. اضافه کردن به موجودی
    emp.balance = (emp.balance || 0) + chargeAmount;

    // ۵. ذخیره در دیتابیس
    saveEmployees();

    // ۶. نمایش پیغام موفقیت
    alert(`✅ ${chargeAmount.toLocaleString()} تومان به حساب ${emp.name} اضافه شد!\n💰 موجودی جدید: ${emp.balance.toLocaleString()} تومان`);

    // ۷. رفرش صفحه
    showUI();
}
function chargeEmployee(empId) {
    console.log("🔴 chargeEmployee called for:", empId);
    
    // ۱. پیدا کردن کارمند
    const emp = employees.find(e => String(e.id) === String(empId));
    if (!emp) {
        alert("❌ کارمند پیدا نشد!");
        return;
    }

    // ۲. گرفتن مبلغ از کاربر
    const amount = prompt(`💰 مبلغ شارژ برای ${emp.name} را وارد کنید:`, "1000");
    if (amount === null || amount === "") return;

    // ۳. تبدیل به عدد
    const chargeAmount = Number(amount);
    if (isNaN(chargeAmount) || chargeAmount <= 0) {
        alert("❌ مبلغ نامعتبر!");
        return;
    }

    // ۴. اضافه کردن به موجودی
    emp.balance = (emp.balance || 0) + chargeAmount;

    // ۵. ذخیره در دیتابیس
    saveEmployees();

    // ۶. نمایش پیغام موفقیت
    alert(`✅ ${chargeAmount.toLocaleString()} تومان به حساب ${emp.name} اضافه شد!\n💰 موجودی جدید: ${emp.balance.toLocaleString()} تومان`);

    // ۷. رفرش صفحه
    showUI();
}

// ==========================================
// صفحه دوم: داشبورد آمار
// ==========================================

// ==========================================
// تابع برداشت ۱ یورو
// ==========================================
function withdrawOneEuro() {
    if (!currentUser || !currentUser.emp) return;
    
    let emp = employees.find(e => String(e.id) === String(currentUser.emp.id));
    if (!emp) return alert("❌ Employee not found");
    
    if (!emp.balance || emp.balance < 1) {
        return alert("❌ Insufficient balance");
    }
    
    // کم کردن ۱ یورو
    chargeForLogin(emp);
    
    // دوباره بخون
    emp = employees.find(e => String(e.id) === String(currentUser.emp.id));
    
    // آپدیت Live Balance اگه باز باشه
    const balanceDisplay = document.getElementById("balanceDisplay");
    if (balanceDisplay) {
        animateBalance(emp.balance);
    }
    
    // اعلان
    showBalanceNotification(emp.balance);
    showWithdrawNotification();
    
    // آپدیت صفحه
    showPage1();
}

function showWithdrawNotification() {
    const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id));
    const balance = emp?.balance || 0;
    
    let notifContainer = document.getElementById("notifContainer");
    if (!notifContainer) {
        notifContainer = document.createElement("div");
        notifContainer.id = "notifContainer";
        notifContainer.style.cssText = `
            position:fixed;
            top:20px;
            left:50%;
            transform:translateX(-50%);
            z-index:9999;
            display:flex;
            flex-direction:column;
            gap:10px;
            pointer-events:none;
        `;
        document.body.appendChild(notifContainer);
    }
    
    const notif = document.createElement("div");
    notif.style.cssText = `
        padding:15px 25px;
        border-radius:15px;
        border:1px solid rgba(255,82,82,0.4);
        background:rgba(0,0,0,0.9);
        backdrop-filter:blur(20px);
        -webkit-backdrop-filter:blur(20px);
        color:white;
        font-family:Consolas, monospace;
        font-size:13px;
        text-align:center;
        box-shadow:0 10px 30px rgba(255,82,82,0.2);
        animation:slideFromTop 0.5s ease-out;
        opacity:1;
        transition:opacity 0.5s, transform 0.5s;
    `;
    
    notif.innerHTML = `
        <div style="font-size:24px; margin-bottom:5px;">💸</div>
        <div style="color:#ff5252; font-weight:bold; font-size:15px;">-1 € Withdrawn</div>
        <div style="color:rgba(255,255,255,0.6); font-size:11px; margin-top:5px;">
            Balance: ${formatNumber(balance)} €
        </div>
    `;
    
    notifContainer.appendChild(notif);
    
    // اضافه کردن انیمیشن
    if (!document.getElementById("notifStyle")) {
        const style = document.createElement("style");
        style.id = "notifStyle";
        style.textContent = `
            @keyframes slideFromTop {
                from { opacity:0; transform:translateX(-50%) translateY(-60px); }
                to { opacity:1; transform:translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        notif.style.opacity = "0";
        notif.style.transform = "translateX(-50%) translateY(-30px)";
        setTimeout(() => notif.remove(), 500);
    }, 3000);
}
let currentPage = 1;

// ==========================================
// صفحه دوم کارمند (داشبورد) - انگلیسی
// ==========================================

function editDashboard(empId) {
    // خواندن متن فعلی از localStorage
    const currentText = localStorage.getItem('page2text') || "📊 DASHBOARD\n👥 Employees: 4\n💰 Total Balance: 14,446,951 IRR\n📈 Today Transactions: 43\n🟢 Online: 1\n🔴 Offline: 3\n🏆 Your Rank: #1 of 4\n⭐ Today Score: 42";

    pushPage(() => editDashboard(empId));

    document.getElementById("app").innerHTML = `
        <div class="screen" style="height:100vh; overflow:hidden;">
            <img src="images/employee-bg.png" class="bg-full" style="position:fixed; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0;">
            <div class="panel" style="position:relative; z-index:1; padding:15px; padding-bottom:120px; height:100vh; overflow-y:auto; box-sizing:border-box; background:rgba(0,0,0,0.7);">
                <div class="cyber-panel" style="padding:15px; margin-bottom:20px;">
                    <div class="cyber-title" style="font-size:16px; text-align:center; margin-bottom:15px;">
                        📝 Edit Page 2 (Fake)
                    </div>
                    
                    <div class="stat-box" style="margin-bottom:10px;">
                        <label style="color:#00ff88;">Write your text (each line = one box):</label>
                        <textarea id="page2text" rows="10" style="width:100%; padding:8px; border-radius:8px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(0,255,136,0.2); font-family:monospace; font-size:14px;">${currentText}</textarea>
                    </div>
                </div>
                
                <button onclick="savePage2()" style="width:100%; padding:12px; background:#00c853; color:white; border:none; border-radius:10px; font-weight:bold; margin-top:10px;">
                    💾 Save Page 2
                </button>
                
                <button onclick="showAdminPage()" style="width:100%; padding:12px; background:#ff5252; color:white; border:none; border-radius:10px; font-weight:bold; margin-top:10px;">
                    ⬅ Back
                </button>
            </div>
        </div>
    `;
}
function savePage2() {
    const text = document.getElementById('page2text').value;
    localStorage.setItem('page2text', text);
    alert("✅ Page 2 ذخیره شد!");
    showAdminPage();
}

function editNotePage(empId) {
    const currentNote = localStorage.getItem('userNote') || "";

    pushPage(() => editNotePage(empId));

    document.getElementById("app").innerHTML = `
        <div class="screen" style="height:100vh; overflow:hidden;">
            <img src="images/employee-bg.png" class="bg-full" style="position:fixed; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0;">
            <div class="panel" style="position:relative; z-index:1; padding:15px; padding-bottom:120px; height:100vh; overflow-y:auto; box-sizing:border-box; background:rgba(0,0,0,0.7);">
                <div class="cyber-panel" style="padding:15px; margin-bottom:20px;">
                    <div class="cyber-title" style="font-size:16px; text-align:center; margin-bottom:15px;">
                        📝 Edit Note (for all employees)
                    </div>
                    
                    <div class="stat-box" style="margin-bottom:10px;">
                        <label style="color:#00ff88;">Write your note:</label>
                        <textarea id="noteTextAdmin" rows="10" style="width:100%; padding:12px; border-radius:10px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(0,255,136,0.2); font-family:monospace; font-size:14px; resize:vertical;">${currentNote}</textarea>
                    </div>
                </div>
                
                <button onclick="saveNoteAdmin()" style="width:100%; padding:12px; background:#00c853; color:white; border:none; border-radius:10px; font-weight:bold; margin-top:10px;">
                    💾 Save Note
                </button>
                
                <button onclick="showAdminPage()" style="width:100%; padding:12px; background:#ff5252; color:white; border:none; border-radius:10px; font-weight:bold; margin-top:10px;">
                    ⬅ Back
                </button>
            </div>
        </div>
    `;
}
function saveNoteAdmin() {
    const note = document.getElementById('noteTextAdmin').value;
    localStorage.setItem('userNote', note);
    alert("✅ یادداشت ذخیره شد!");
    showAdminPage();
}

// ==========================================
// تابع ترجمه با MyMemory API (کامل‌تر)
// ==========================================
async function translateText(text, targetLang) {
    try {
        // کدهای زبان برای MyMemory
        const langMap = {
            'fa': 'fa',
            'en': 'en',
            'ru': 'ru',
            'ar': 'ar'
        };
        
        const lang = langMap[targetLang] || 'en';
        
        // MyMemory میتونه متن‌های بلند رو بهتر ترجمه کنه
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fa|${lang}&de=demo@example.com`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData) {
            return data.responseData.translatedText || text;
        } else {
            // اگر MyMemory جواب نداد، از Google Translate استفاده کن
            return await translateWithGoogle(text, targetLang);
        }
    } catch (error) {
        console.error("خطا در ترجمه:", error);
        return text;
    }
}

// ==========================================
// تابع پشتیبان: Google Translate
// ==========================================
async function translateWithGoogle(text, targetLang) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fa&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data[0]) {
            // استخراج تمام بخش‌های ترجمه
            let fullText = '';
            for (const part of data[0]) {
                if (part[0]) {
                    fullText += part[0];
                }
            }
            return fullText || text;
        }
        return text;
    } catch (error) {
        console.error("خطا در ترجمه گوگل:", error);
        return text;
    }
}
function testLogin() {
  const testId = "1783035875011";
  const testPass = "333333";
  const testMobile = "333333333";
  const testEmail = testId + "@employee-app.com";
  
  console.log("===== تست لاگین =====");
  console.log("ایمیل:", testEmail);
  console.log("رمز:", testPass);
  console.log("تلفن:", testMobile);
  
  auth.signInWithEmailAndPassword(testEmail, testPass)
    .then((user) => {
      console.log("✅ Firebase Auth OK!", user.user.uid);
      return db.ref("employees/" + testId).once("value");
    })
    .then((snap) => {
      const data = snap.val();
      console.log("✅ دیتابیس:", data);
      console.log("تلفن دیتابیس:", data?.phone);
      alert("✅ لاگین موفق! چک کن کنسول رو");
    })
    .catch((err) => {
      console.log("❌ خطا:", err.code);
      alert("❌ خطا: " + err.code);
    });
}
  
// ===== تابع چک کردن اینترنت =====
function checkAndShowPage() {
    if (!navigator.onLine) {
        // نمایش صفحه آفلاین
        document.getElementById("app").innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; background:#000; gap:20px; overflow:hidden; text-align:center; padding:20px;">
                <div style="width:100px; height:70px; position:relative;">
                    <div style="width:50px; height:50px; border-radius:50%; background:#ff0000; position:absolute; top:10px; left:8px; opacity:0.9; box-shadow:0 0 30px rgba(255,0,0,0.6);"></div>
                    <div style="width:50px; height:50px; border-radius:50%; background:#ffd700; position:absolute; top:10px; right:8px; opacity:0.9; box-shadow:0 0 30px rgba(255,215,0,0.6);"></div>
                </div>
                <div style="font-size:26px; font-weight:bold; color:#ffd700; font-family:Consolas; letter-spacing:3px; text-shadow:0 0 30px rgba(255,215,0,0.5);">MR. ARIAN ROY</div>
                <div style="color:#00ff88; font-size:13px; font-family:Consolas; letter-spacing:2px;">CommerzBank</div>
                <div style="color:#ff5252; font-size:14px; border:1px solid rgba(255,82,82,0.3); padding:15px 30px; border-radius:10px; background:rgba(255,82,82,0.05); margin-top:20px;">⚠️ No Internet Connection</div>
            </div>
        `;
    } else {
        // اینترنت وصل هست
        if (currentUser) {
            showUI(); // صفحه اصلی
        } else {
            // صفحه لاگین رو نشون بده
            document.getElementById("app").innerHTML = `
                <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; background:#000; padding:20px;">
                    <h2 style="color:#fff;">CommerzBank</h2>
                    <p style="color:#ffd700;">URBAN DEVELOPMENT</p>
                    <p style="color:#fff;">ARIAN</p>
                    <div style="margin-top:30px; width:100%; max-width:300px;">
                        <input id="loginId" placeholder="ID" style="width:100%; padding:12px; margin-bottom:10px; border-radius:8px; border:1px solid #333; background:#111; color:#fff;">
                        <input id="loginPassword" type="password" placeholder="Password" style="width:100%; padding:12px; margin-bottom:10px; border-radius:8px; border:1px solid #333; background:#111; color:#fff;">
                        <input id="loginMobile" placeholder="Mobile" style="width:100%; padding:12px; margin-bottom:10px; border-radius:8px; border:1px solid #333; background:#111; color:#fff;">
                        <button onclick="loginUser()" style="width:100%; padding:12px; background:#ffd700; border:none; border-radius:8px; color:#000; font-weight:bold;">LOGIN</button>
                    </div>
                </div>
            `;
        }
    }
}
// ===== مدیریت قطع و وصل اینترنت =====
window.addEventListener('online', function() {
    location.reload();
});

window.addEventListener('offline', function() {
    checkAndShowPage();
});
