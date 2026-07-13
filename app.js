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
// ========== TRANSLATE FUNCTION ==========
async function translateText(text, targetLang) {
  try {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
    const data = await response.json();
    return data[0].map(item => item[0]).join('');
  } catch (error) {
    return text;
  }
}

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
          .catch(err => showModal("Login Error", err.message, "error"));
      });
    return;
  }

  const email = id + "@employee-app.com";
  
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      db.ref("employees/" + id).once("value").then((snap) => {
        const data = snap.val();
        
        // چک قفل لاگین
        if (data && data.loginLocked) {
          auth.signOut();
          showModal("Login", "Your account has been locked by admin!", "locked");
          return;
        }
        
        if (data && data.phone && data.phone !== mobile) {
          auth.signOut();
          showModal("Login", "Phone number is wrong", "error");
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
        
        if (id !== ADMIN.id) {
          logEmployeeIP(id);
        }
        
        showOTP();
      });
    })
    .catch((error) => {
      if (error.code === 'auth/user-not-found') {
        showModal("Login", "User not found", "error");
      } else if (error.code === 'auth/wrong-password') {
        showModal("Login", "Wrong password", "error");
      } else {
        showModal("Login Error", error.message, "error");
      }
    });
}

let otpTimer;
let otpSeconds;
function showOTP() {
  otpCode = String(Math.floor(100000 + Math.random() * 900000));
  otpSeconds = 30;
  
  playOTPSound();
  showModal("OTP Code", "📱 Your OTP Code: " + otpCode, "info");

  document.getElementById("app").innerHTML = `
  <div class="screen">
    <img src="images/login-bg.png" class="bg-full">
    <div class="overlay">
      <h3 style="color:white; text-align:center; margin-bottom:5px; font-size:16px;">📱 Enter OTP Code</h3>
      <p style="color:rgba(255,255,255,0.6); text-align:center; font-size:11px; margin-bottom:8px;">
        Code sent to your Employee ID
      </p>
      
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
  
  showModal("OTP Code", "📱 Your New OTP Code: " + otpCode, "info");
  
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
  return showModal("OTP", "Wrong OTP Code", "error");
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
        <img src="images/bitcoin.png" onclick="openBitcoinPage()">
        <img src="images/exchange.png" onclick="openExchangePage()">
        <img src="images/nearby.png" onclick="openNearbyBanks()">
        <img src="images/vault.png" onclick="openVaultWallet()">
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
          <button onclick="openExchangeAdmin()" style="width:100%; margin-top:6px; padding:8px; background:#00c8ff; color:white; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">💱 Set Exchange Rates</button>
          <button onclick="editVault()" style="width:100%; margin-top:6px; padding:8px; background:#ffd700; color:black; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">✏️ Edit Vault</button>
          <button onclick="sendStatementToEmployee('${selectedEmp.id}')" style="width:100%; margin-top:6px; padding:8px; background:#1a1a1a; color:#ffd700; border:1px solid #ffd700; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">🏦 Send Statement</button>
          <button onclick="editEmployeeStatement('${selectedEmp.id}')" style="width:100%; margin-top:6px; padding:8px; background:#1a1a1a; color:#ffd700; border:1px solid #ffd700; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">✏️ Edit Statement</button>
        ` : `
          <div style="padding:20px; text-align:center; color:rgba(255,255,255,0.5);">
            No employees yet. Add one!
          </div>
        `}
        
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
    background: url('images/balance-bg.png') center/cover;
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

// ===== CUSTOM MODAL (جایگزین alert) =====
function showModal(title, message, type = "info") {
  const colors = {
    info: { bg: "rgba(0,255,136,0.1)", border: "rgba(0,255,136,0.3)", icon: "💬", color: "#00ff88" },
    error: { bg: "rgba(255,82,82,0.1)", border: "rgba(255,82,82,0.3)", icon: "❌", color: "#ff5252" },
    success: { bg: "rgba(0,200,83,0.1)", border: "rgba(0,200,83,0.3)", icon: "✅", color: "#00c853" },
    warning: { bg: "rgba(255,152,0,0.1)", border: "rgba(255,152,0,0.3)", icon: "⚠️", color: "#ff9800" },
    locked: { bg: "rgba(255,82,82,0.1)", border: "rgba(255,82,82,0.3)", icon: "🔒", color: "#ff5252" },
    win: { bg: "rgba(255,215,0,0.1)", border: "rgba(255,215,0,0.3)", icon: "🎉", color: "#ffd700" }
  };
  
  const style = colors[type] || colors.info;
  const fullTitle = title ? `⚠️ Mastercard System - ${title}` : "⚠️ Mastercard System";
  
  const modalHTML = `
    <div id="customModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:99999; display:flex; justify-content:center; align-items:center; animation:fadeIn 0.3s ease;">
      <div style="
        background:rgba(10,10,10,0.95);
        backdrop-filter:blur(25px);
        -webkit-backdrop-filter:blur(25px);
        border:1px solid ${style.border};
        border-radius:20px;
        padding:25px 20px;
        text-align:center;
        max-width:300px;
        width:85%;
        box-shadow:0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${style.border};
        animation:popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        font-family:Consolas, monospace;
      ">
        <div style="font-size:40px; margin-bottom:12px;">${style.icon}</div>
        <div style="font-size:13px; font-weight:bold; color:${style.color}; letter-spacing:1px; margin-bottom:8px;">${fullTitle}</div>
        <div style="font-size:13px; color:rgba(255,255,255,0.8); line-height:1.6; white-space:pre-line;">${message}</div>
        <button onclick="closeModal()" style="
          margin-top:18px;
          padding:10px 30px;
          border-radius:25px;
          border:1px solid ${style.border};
          background:${style.bg};
          color:${style.color};
          font-size:13px;
          font-weight:bold;
          cursor:pointer;
          letter-spacing:1px;
        ">OK</button>
      </div>
    </div>
    <style>
      @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes popIn { from { transform:scale(0.8); opacity:0; } to { transform:scale(1); opacity:1; } }
      @keyframes fadeOut { from { opacity:1; } to { opacity:0; } }
    </style>
  `;
  
  const oldModal = document.getElementById("customModal");
  if (oldModal) oldModal.remove();
  
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function closeModal() {
  const modal = document.getElementById("customModal");
  if (modal) {
    modal.style.animation = "fadeOut 0.2s ease";
    setTimeout(() => modal.remove(), 200);
  }
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
        <img src="images/bitcoin.png" onclick="openBitcoinPage()">
        <img src="images/exchange.png" onclick="openExchangePage()">
        <img src="images/nearby.png" onclick="openNearbyBanks()">
        ${emp.hasStatement ? `<img src="images/statement.png" onclick="openBankStatement('${emp.id}')">` : ''}
      </div>
      <div class="menu-btn" onclick="toggleMenu()" style="position:fixed; z-index:10;">☰</div>
      <div class="panel" style="position:relative; z-index:1; padding:15px; padding-bottom:130px; height:100vh; overflow-y:auto; box-sizing:border-box; background:rgba(0,0,0,0.7);">
        
        <div onclick="toggleStealthMode()" style="position:fixed; top:15px; right:15px; width:20px; height:20px; border-radius:50%; background:rgba(0,255,136,0.4); z-index:999; cursor:pointer; border:1px solid rgba(0,255,136,0.6);" title="Stealth Mode"></div>
        
        <button onclick="showLiveBalance()" style="width:100%; padding:15px; margin-bottom:15px; border-radius:15px; border:1px solid rgba(0,255,136,0.2); background:rgba(0,255,136,0.05); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); color:#00ff88; font-size:14px; font-weight:bold; cursor:pointer; letter-spacing:2px; text-shadow:0 0 10px rgba(0,255,136,0.3); transition:all 0.3s;" onmouseover="this.style.background='rgba(0,255,136,0.15)'; this.style.boxShadow='0 0 30px rgba(0,255,136,0.3)'" onmouseout="this.style.background='rgba(0,255,136,0.05)'; this.style.boxShadow='none'">💰 SHOW LIVE BALANCE</button>
        
        ${card(emp, false)}
        
        <div style="width:100%; display:flex; justify-content:center; margin:20px 0;">
          <div id="globeWrapper" style="width:180px; height:180px; border-radius:50%; overflow:hidden; box-shadow:0 0 30px rgba(0,255,136,0.3), 0 0 60px rgba(0,255,136,0.15), 0 0 100px rgba(0,255,136,0.05), inset 0 0 30px rgba(0,255,136,0.1); border:1.5px solid rgba(0,255,136,0.2); background:rgba(0,0,0,0.5);">
            <canvas id="globeCanvas" style="width:100%; height:100%;"></canvas>
          </div>
        </div>
        
        <div style="display:flex; gap:6px; margin-top:10px; margin-bottom:10px; flex-wrap:wrap; justify-content:center;">
          <button onclick="showPage1()" style="padding:8px 12px; background:#00c853; color:white; border:none; border-radius:20px; font-weight:bold; font-size:10px; cursor:pointer; white-space:nowrap;">📱 P1</button>
          <button onclick="showPage2()" style="padding:8px 12px; background:#ff9800; color:white; border:none; border-radius:20px; font-weight:bold; font-size:10px; cursor:pointer; white-space:nowrap;">📊 P2</button>
          <button onclick="showPage3()" style="padding:8px 12px; background:#9c27b0; color:white; border:none; border-radius:20px; font-weight:bold; font-size:10px; cursor:pointer; white-space:nowrap;">📝 P3</button>
          <button onclick="showPage4()" style="padding:8px 12px; background:#ff6d00; color:white; border:none; border-radius:20px; font-weight:bold; font-size:10px; cursor:pointer; white-space:nowrap;">🎰 P4</button>
          <button onclick="showPage5()" style="padding:8px 12px; background:#ff1744; color:white; border:none; border-radius:20px; font-weight:bold; font-size:10px; cursor:pointer; white-space:nowrap;">🛡️ P5</button>
          <button onclick="showPage6()" style="padding:8px 12px; background:#00bcd4; color:white; border:none; border-radius:20px; font-weight:bold; font-size:10px; cursor:pointer; white-space:nowrap;">🌍 P6</button>
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
  if (!currentUser || !currentUser.emp) {
    showLogin();
    return;
  }
  const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id)) || currentUser.emp;
  const empId = emp.id;

  db.ref("employees/" + empId + "/page2Note").once("value")
    .then(noteSnapshot => {
      const noteData = noteSnapshot.val() || {};
      const noteText = noteData.text || "";
      
      db.ref("employees/" + empId).once("value")
        .then(snapshot => {
          const empData = snapshot.val() || {};
          empData.page2Note = noteData;
          renderPage2(empId, empData, emp);
        });
    })
    .catch(() => {
      renderPage2(empId, {}, emp);
    });
}
function renderPage2(empId, empData, emp) {
  let currentLang = empData.noteLang || 'fa';
  
  const defaultNote = "No notes yet...";
  const adminNote = empData.page2Note?.text || defaultNote;

  window.changeNoteLanguage = async function(lang) {
    const noteBox = document.getElementById('noteContentPage2');
    if (!noteBox) return;
    
    db.ref("employees/" + empId + "/noteLang").set(lang);
    
    const originalText = empData.page2Note?.text || defaultNote;
    
    if (lang === 'fa') {
      noteBox.textContent = originalText;
      updateButtons(lang);
      return;
    }
    
    try {
      noteBox.textContent = "⏳ Translating...";
      const translated = await translateText(originalText, lang);
      noteBox.textContent = translated;
    } catch (error) {
      noteBox.textContent = originalText;
    }
    
    updateButtons(lang);
  };

  function updateButtons(lang) {
    document.querySelectorAll('.lang-btn-page2').forEach(btn => {
      btn.style.background = 'rgba(255,255,255,0.1)';
    });
    const activeBtn = document.querySelector(`.lang-btn-page2[data-lang="${lang}"]`);
    if (activeBtn) {
      activeBtn.style.background = '#00c853';
    }
  }

  let displayText = adminNote;
  if (currentLang !== 'fa') {
    translateText(adminNote, currentLang).then(translated => {
      const noteBox = document.getElementById('noteContentPage2');
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
        <img src="images/bitcoin.png" onclick="openBitcoinPage()">
        <img src="images/exchange.png" onclick="openExchangePage()">
        <img src="images/nearby.png" onclick="openNearbyBanks()">
        ${emp.hasStatement ? `<img src="images/statement.png" onclick="openBankStatement('${empId}')">` : ''}
      </div>
      <div class="menu-btn" onclick="toggleMenu()" style="position:fixed; z-index:10;">☰</div>
      
      <div class="panel" style="position:relative; z-index:1; padding:10px; padding-bottom:120px; height:100vh; overflow-y:scroll; -webkit-overflow-scrolling:touch; scroll-behavior:smooth; box-sizing:border-box; background:rgba(0,0,0,0.15); backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);">
        
        <div class="cyber-panel" style="padding:12px; margin-top:30px; background:rgba(255,255,255,0.08); backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px); border:1px solid rgba(0,255,136,0.15); border-radius:15px;">
          
          <div style="display:flex; gap:4px; margin-bottom:8px; flex-wrap:wrap; justify-content:center;">
            <button class="lang-btn-page2" data-lang="fa" onclick="changeNoteLanguage('fa')" style="background:${currentLang === 'fa' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:6px 12px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer;">🇮🇷 فارسی</button>
            <button class="lang-btn-page2" data-lang="en" onclick="changeNoteLanguage('en')" style="background:${currentLang === 'en' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:6px 12px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer;">🇬🇧 English</button>
            <button class="lang-btn-page2" data-lang="ru" onclick="changeNoteLanguage('ru')" style="background:${currentLang === 'ru' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:6px 12px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer;">🇷🇺 Русский</button>
            <button class="lang-btn-page2" data-lang="ar" onclick="changeNoteLanguage('ar')" style="background:${currentLang === 'ar' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:6px 12px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer;">🇸🇦 العربية</button>
          </div>
          
          <div class="cyber-title" style="font-size:14px; text-align:center; margin-bottom:8px; color:#00ff88; text-shadow:0 0 20px rgba(0,255,136,0.3);">💳 ONLINE CARD</div>
          
          <div id="noteContentPage2" style="padding:12px; border-radius:10px; background:rgba(0,255,136,0.03); border:1px solid rgba(0,255,136,0.08); height:55vh; overflow-y:scroll; -webkit-overflow-scrolling:touch; scroll-behavior:smooth; color:#00ff88; text-shadow:0 0 10px rgba(0,255,136,0.15); font-family:monospace; font-size:13px; white-space:pre-wrap; word-break:break-word; line-height:1.7; padding-bottom:75px;">
            ${displayText}
          </div>
        </div>
        
        <div style="display:flex; gap:6px; margin-top:10px; margin-bottom:10px; flex-wrap:wrap;">
          <button onclick="showPage1()" style="flex:1; min-width:50px; background:rgba(0,200,83,0.85); color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">📱 P1</button>
          <button onclick="showPage2()" style="flex:1; min-width:50px; background:rgba(255,152,0,0.85); color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">📝 P2</button>
          <button onclick="showPage3()" style="flex:1; min-width:50px; background:rgba(156,39,176,0.85); color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">📊 P3</button>
          <button onclick="showPage4()" style="flex:1; min-width:50px; background:#ff6d00; color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">🎰 P4</button>
          <button onclick="showPage5()" style="flex:1; min-width:50px; background:#ff1744; color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">🛡️ P5</button>
          <button onclick="showPage6()" style="flex:1; min-width:50px; background:#00bcd4; color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">🌍 P6</button>
        </div>
        
        <button class="logout" onclick="showLogin()" style="margin-top:5px; width:100%; padding:10px; background:rgba(255,82,82,0.85); color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:12px;">LOGOUT</button>
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

function openAdminNoteEditor(empId) {
  // گرفتن Note فعلی از Firebase
  db.ref("employees/" + empId + "/adminNote").once("value")
    .then((snapshot) => {
      const note = snapshot.val() || {};
      const currentNote = note.text || "";
      
      // نمایش پنجره ویرایش با استایل شیشه‌ای
      const editorHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        ">
          <div style="
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            padding: 30px 20px;
            width: 100%;
            max-width: 500px;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
          ">
            <div style="
              color: white;
              font-size: 22px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 25px;
              letter-spacing: 1px;
            ">✏️ Edit Employee Note</div>
            
            <div style="
              color: rgba(255, 255, 255, 0.7);
              font-size: 13px;
              margin-bottom: 8px;
            ">Employee ID: ${empId}</div>
            
            <textarea id="adminNoteInput" style="
              width: 100%;
              height: 250px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 15px;
              color: white;
              padding: 15px;
              font-size: 15px;
              resize: vertical;
              outline: none;
              line-height: 1.6;
              -webkit-backdrop-filter: blur(5px);
              backdrop-filter: blur(5px);
            " placeholder="Write your note here...">${currentNote}</textarea>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button onclick="saveAdminNote('${empId}')" style="
                flex: 1;
                background: rgba(0, 200, 83, 0.9);
                color: white;
                border: none;
                padding: 14px;
                border-radius: 12px;
                font-weight: bold;
                font-size: 15px;
                cursor: pointer;
              ">💾 Save Note</button>
              
              <button onclick="closeNoteEditor()" style="
                flex: 1;
                background: rgba(255, 82, 82, 0.9);
                color: white;
                border: none;
                padding: 14px;
                border-radius: 12px;
                font-weight: bold;
                font-size: 15px;
                cursor: pointer;
              ">❌ Cancel</button>
            </div>
          </div>
        </div>
      `;
      
      document.getElementById("noteEditorContainer").innerHTML = editorHTML;
    });
}

function saveAdminNote(empId) {
  const noteText = document.getElementById("adminNoteInput").value;
  
  db.ref("employees/" + empId + "/adminNote").set({
    text: noteText,
    updatedAt: Date.now(),
    adminId: currentUser?.emp?.id || "admin"
  })
  .then(() => {
    alert("✅ Note saved successfully!");
    closeNoteEditor();
  })
  .catch((error) => {
    alert("❌ Error: " + error.message);
  });
}

function closeNoteEditor() {
  document.getElementById("noteEditorContainer").innerHTML = "";
}

function openAdminPanel() {
  const empId = prompt("Enter Employee ID to send note:");
  if (!empId) return;
  
  const noteText = prompt("Enter note for employee:", "");
  if (noteText === null) return;
  
  // Save to Firebase
  db.ref("employees/" + empId + "/adminNote").set({
    text: noteText,
    timestamp: Date.now(),
    adminId: currentUser.emp.id
  })
  .then(() => {
    alert("✅ Note sent successfully!");
  })
  .catch((error) => {
    alert("❌ Error: " + error.message);
  });
}
function updateOnlineDetails() {
  const empId = prompt("Enter Employee ID to update details:");
  if (!empId) return;
  
  const lines = [];
  for (let i = 0; i < 5; i++) {
    const label = prompt(`Enter label for line ${i + 1}:`, "");
    if (!label) break;
    const value = prompt(`Enter value for "${label}":`, "");
    lines.push({ label, value });
  }
  
  if (lines.length > 0) {
    db.ref("employees/" + empId + "/onlineDetails").set({
      lines: lines,
      updatedAt: Date.now()
    })
    .then(() => {
      alert("✅ Online Details updated!");
    })
    .catch((error) => {
      alert("❌ Error: " + error.message);
    });
  }
}


function showPage3() {
    if (!currentUser) {
        showLogin();
        return;
    }
    if (!currentUser.emp && !currentUser.isAdmin) {
        showLogin();
        return;
    }
    
    const empId = currentUser?.emp?.id || (currentUser.isAdmin && employees.length > 0 ? employees[0].id : null);
    if (!empId) {
        showLogin();
        return;
    }
    
    // READ DIRECTLY FROM FIREBASE
    db.ref("employees/" + empId).once("value").then(snapshot => {
        const empData = snapshot.val();
        if (!empData) {
            showLogin();
            return;
        }
        renderPage3(empId, empData);
    });
}

function renderPage3(empId, empData) {
    let currentLang = empData.noteLang || 'fa';
    
    const defaultNote = "سلام دوستان عزیز..کارتهای خام مسترکارت با دیتای خام که در اختیار شما قرار میگیره.دو ماه بصورت خام وقت دارد..یعنی دیتای خام این کارتهای دوماه بصورت آفلاین وقت دارد..اگر در این دوماه کارت رو تاریخ انقضا یا لاین هانوور ۵۶۹۰ رو نبندید کارت باطل می‌شود.. وقتی که کارت رو انلاین میکنید .کارت ۵ سال اعتبار یا تاریخ انقضا دارد..و بعداز خرید اول خانه و بیت کوئین و برداشت کلا ۷۵ درصد از مبلغ کل کارت.۲۵ درصد آخر کارت رو بصورت بیت کوئین یا تتر USDT (Trc20) به آدرس کیف پول که در این برنامه گذاشتم می‌فرستید..طریقه انلاین یا اکتیو کردن کارت و کلیه کارها و توضیحاتی که بعدش باید انجام بدید رو بهتون در زمان بستم لاین هانوور ۵۶۹۰ و انلاین کردن کارت بهتون میگم..باتشکر از دوستان عزیز\nرئیس اپ و کارت و دیتای خام..\nMR..ARIAN ROY";
    
    const adminNote = empData.note || defaultNote;
    const hasAdminNote = adminNote && adminNote.trim() !== '';

    window.changeNoteLanguage = async function(lang) {
        const noteBox = document.getElementById('noteContent');
        if (!noteBox) return;
        
        db.ref("employees/" + empId + "/noteLang").set(lang);
        
        const originalText = empData.note || defaultNote;
        
        if (lang === 'fa') {
            noteBox.textContent = originalText;
            updateButtons(lang);
            return;
        }
        
        try {
            noteBox.textContent = "⏳ Translating...";
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
                <img src="images/bitcoin.png" onclick="openBitcoinPage()">
                <img src="images/exchange.png" onclick="openExchangePage()">
                <img src="images/nearby.png" onclick="openNearbyBanks()">
                ${empData.hasStatement ? `<img src="images/statement.png" onclick="openBankStatement('${empId}')">` : ''}
            </div>
            <div class="menu-btn" onclick="toggleMenu()" style="position:fixed; z-index:10;">☰</div>
            
            <div class="panel" style="position:relative; z-index:1; padding:10px; padding-bottom:120px; height:100vh; overflow-y:scroll; -webkit-overflow-scrolling:touch; scroll-behavior:smooth; box-sizing:border-box; background:rgba(0,0,0,0.15); backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);">
                
                <div class="cyber-panel" style="padding:12px; margin-top:30px; background:rgba(255,255,255,0.08); backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px); border:1px solid rgba(0,255,136,0.15); border-radius:15px;">
                    
                    <div style="display:flex; gap:4px; margin-bottom:8px; flex-wrap:wrap; justify-content:center;">
                        <button class="lang-btn" data-lang="fa" onclick="changeNoteLanguage('fa')" style="background:${currentLang === 'fa' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:4px 10px; border-radius:6px; font-weight:bold; font-size:10px; cursor:pointer;">🇮🇷</button>
                        <button class="lang-btn" data-lang="en" onclick="changeNoteLanguage('en')" style="background:${currentLang === 'en' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:4px 10px; border-radius:6px; font-weight:bold; font-size:10px; cursor:pointer;">🇬🇧</button>
                        <button class="lang-btn" data-lang="ru" onclick="changeNoteLanguage('ru')" style="background:${currentLang === 'ru' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:4px 10px; border-radius:6px; font-weight:bold; font-size:10px; cursor:pointer;">🇷🇺</button>
                        <button class="lang-btn" data-lang="ar" onclick="changeNoteLanguage('ar')" style="background:${currentLang === 'ar' ? '#00c853' : 'rgba(255,255,255,0.1)'}; color:white; border:1px solid rgba(0,255,136,0.2); padding:4px 10px; border-radius:6px; font-weight:bold; font-size:10px; cursor:pointer;">🇸🇦</button>
                    </div>
                    
                    <div class="cyber-title" style="font-size:14px; text-align:center; margin-bottom:8px; color:#ff9800; text-shadow:0 0 20px rgba(255,152,0,0.3);">💳 OFFLINE CARD</div>
                    
                    <div id="noteContent" style="padding:12px; border-radius:10px; background:rgba(0,255,136,0.03); border:1px solid rgba(0,255,136,0.08); height:55vh; overflow-y:scroll; -webkit-overflow-scrolling:touch; scroll-behavior:smooth; color:#00ff88; text-shadow:0 0 10px rgba(0,255,136,0.15); font-family:monospace; font-size:13px; white-space:pre-wrap; word-break:break-word; line-height:1.7; padding-bottom:75px;">
                        ${displayText}
                    </div>
                    
                    ${hasAdminNote ? `
                        <div style="margin-top:6px; font-size:10px; color:rgba(255,255,255,0.4); text-align:center;">
                            📌 Admin Note
                        </div>
                    ` : ''}
                </div>
                
                <div style="display:flex; gap:6px; margin-top:10px; margin-bottom:10px; flex-wrap:wrap;">
                    <button onclick="showPage1()" style="flex:1; min-width:50px; background:rgba(0,200,83,0.85); color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">📱 P1</button>
                    <button onclick="showPage2()" style="flex:1; min-width:50px; background:rgba(255,152,0,0.85); color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">📊 P2</button>
                    <button onclick="showPage3()" style="flex:1; min-width:50px; background:rgba(156,39,176,0.85); color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">📝 P3</button>
                    <button onclick="showPage4()" style="flex:1; min-width:50px; background:#ff6d00; color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">🎰 P4</button>
                    <button onclick="showPage5()" style="flex:1; min-width:50px; background:#ff1744; color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">🛡️ P5</button>
                    <button onclick="showPage6()" style="flex:1; min-width:50px; background:#00bcd4; color:white; border:none; padding:10px 6px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">🌍 P6</button>
                </div>
                
                <button class="logout" onclick="showLogin()" style="margin-top:5px; width:100%; padding:10px; background:rgba(255,82,82,0.85); color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:12px;">LOGOUT</button>
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

function toggleWheelLock(empId) {
  const emp = employees.find(e => String(e.id) === String(empId));
  if (!emp) return;
  
  emp.wheelLocked = !emp.wheelLocked;
  
  db.ref("employees/" + empId + "/wheelLocked").set(emp.wheelLocked);
  saveEmployees();
  
  alert(emp.wheelLocked ? "🔒 Wheel Locked!" : "🔓 Wheel Unlocked!");
  showUI();
}

function triggerAttack(empId) {
  db.ref("employees/" + empId).update({
    underAttack: true,
    attackStartTime: Date.now(),
    attacksBlocked: Math.floor(Math.random() * 5000) + 1000
  });
  showModal("Firewall", "Attack launched! Employee's firewall will show alerts!", "error");
  showUI();
}

function defendSystem(empId) {
  db.ref("employees/" + empId).update({
    underAttack: false,
    attackStartTime: null,
    attacksBlocked: 0
  });
  showModal("Firewall", "System defended! Firewall back to normal.", "success");
  showUI();
}

function toggleLoginLock(empId) {
  const emp = employees.find(e => String(e.id) === String(empId));
  if (!emp) return;
  
  emp.loginLocked = !emp.loginLocked;
  db.ref("employees/" + empId + "/loginLocked").set(emp.loginLocked);
  saveEmployees();
  showModal("Login Lock", emp.loginLocked ? "🔒 Login Locked!" : "🔓 Login Unlocked!", emp.loginLocked ? "locked" : "success");
  showUI();
}

function showPage4() {
  if (!currentUser || !currentUser.emp) {
    showLogin();
    return;
  }

  const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id)) || currentUser.emp;
  
  document.getElementById("app").innerHTML = `
    <div class="screen" style="height:100vh; overflow:hidden;">
      <img src="images/employee-bg.png" class="bg-full" style="position:fixed; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0;">
      <div id="sidebar" class="sidebar" style="position:fixed; z-index:10;">
        <img src="images/telegram.png" onclick="openTelegram()">
        <img src="images/trustwallet.png" onclick="openWalletPage()">
        <img src="images/bitcoin.png" onclick="openBitcoinPage()">
        <img src="images/exchange.png" onclick="openExchangePage()">
        <img src="images/nearby.png" onclick="openNearbyBanks()">
        ${emp.hasStatement ? `<img src="images/statement.png" onclick="openBankStatement('${emp.id}')">` : ''}
      </div>
      <div class="menu-btn" onclick="toggleMenu()" style="position:fixed; z-index:10;">☰</div>
      <div class="panel" style="position:relative; z-index:1; padding:15px; padding-bottom:100px; height:100vh; overflow-y:auto; box-sizing:border-box; background:rgba(0,0,0,0.7); display:flex; flex-direction:column; align-items:center;">
        
        <div style="font-size:14px; color:white; letter-spacing:3px; margin-top:20px;">🎰 LUCKY WHEEL</div>
        
        <div style="position:relative; width:220px; height:220px; margin:20px auto;">
          <canvas id="wheelCanvas" width="220" height="220" style="border-radius:50%; border:2px solid gold;"></canvas>
        </div>
        
        <button onclick="spinWheel()" style="padding:15px 40px; border-radius:25px; border:none; background:gold; color:black; font-size:18px; font-weight:bold; cursor:pointer; margin-top:10px;">🎰 SPIN</button>
        
        <div style="display:flex; gap:8px; margin-top:15px; flex-wrap:wrap; width:100%;">
          <button onclick="showPage1()" style="flex:1; min-width:45px; background:#00c853; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">📱</button>
          <button onclick="showPage2()" style="flex:1; min-width:45px; background:#ff9800; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">📊</button>
          <button onclick="showPage3()" style="flex:1; min-width:45px; background:#9c27b0; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">📝</button>
          <button onclick="showPage4()" style="flex:1; min-width:45px; background:#ff6d00; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">🎰</button>
          <button onclick="showPage5()" style="flex:1; min-width:45px; background:#ff1744; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">🛡️</button>
          <button onclick="showPage6()" style="flex:1; min-width:45px; background:#00bcd4; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">🌍</button>
        </div>
        <button class="logout" onclick="showLogin()" style="margin-top:10px; width:100%; padding:12px; background:#ff5252; color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">LOGOUT</button>
      </div>
    </div>
  `;
  
  drawWheel();
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
let slotSpinsLeft = 3;
let slotSpinning = false;

function drawWheel() {
  const canvas = document.getElementById("wheelCanvas");
  if (!canvas) return;

  canvas.width = 220;
  canvas.height = 220;

  const ctx = canvas.getContext("2d");
  const cx = 110;
  const cy = 110;
  const radius = 100;
  const slices = wheelPrizes.length;
  const angle = (2 * Math.PI) / slices;

  wheelPrizes.forEach((prize, i) => {
    const startAngle = i * angle;
    const endAngle = startAngle + angle;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = prize.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + angle / 2);
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(prize.label, radius * 0.65, 6);
    ctx.restore();
  });
}

function playSpinSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.value = 300 + Math.random() * 300;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.08);
      }, i * 100);
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
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      }, i * 200);
    });
  } catch(e) {}
}

function spinWheel() {
  if (spinning) return;
  
  const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id));
  if (!emp) return;
  
  // 👇 اینو اضافه کن - دوباره از Firebase بخون
  db.ref("employees/" + emp.id + "/wheelLocked").once("value").then(snap => {
    const wheelLocked = snap.val();
    
    if (wheelLocked === true) {
      showModal("Lucky Wheel", "Wheel is locked by admin!", "locked");
      return;
    }
    
    // ادامه کد چرخش...
    doSpin();
  });
}

function doSpin() {
  const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id));
  if (!emp) return;
  
  // چک کردن ۱۲ ساعت
  const lastSpin = localStorage.getItem("lastSpin_" + emp.id);
  if (lastSpin && (Date.now() - parseInt(lastSpin)) < 12 * 60 * 60 * 1000) {
    showModal("Lucky Wheel", "You can spin once every 12 hours!", "warning");
    return;
  }
  
  spinning = true;
  const canvas = document.getElementById("wheelCanvas");
  if (!canvas) return;
  
  const totalRotation = 360 * 5 + Math.random() * 360;
  const duration = 4000;
  let startTime = null;
  
  playSpinSound();
  
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const rotation = totalRotation * eased;
    
    canvas.style.transform = `rotate(${rotation}deg)`;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      const finalAngle = rotation % 360;
      const sliceAngle = 360 / wheelPrizes.length;
      const winnerIndex = Math.floor(((360 - finalAngle) % 360) / sliceAngle);
      const prize = wheelPrizes[winnerIndex];
      
      emp.balance = (emp.balance || 0) + prize.value;
      if (!emp.transactions) emp.transactions = [];
      emp.transactions.unshift({
        date: new Date().toLocaleDateString("en-US"),
        time: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        type: "Lucky Wheel",
        before: emp.balance - prize.value,
        amount: prize.value,
        after: emp.balance,
        receipt: "SPIN-" + Date.now().toString().slice(-6)
      });
      saveEmployees();
      localStorage.setItem("lastSpin_" + emp.id, Date.now());
      
      playWinSound();
      
      setTimeout(() => {
        showModal("Lucky Wheel", `You won ${prize.label}!\nNew Balance: ${formatNumber(emp.balance)} €`, "win");
        showPage4();
      }, 500);
    }
  }
  
  requestAnimationFrame(animate);
}

const slotSymbols = ["🍒", "💎", "💰", "7️⃣"];
const slotPrizes = {
  "🍒": 3,
  "💎": 5,
  "💰": 10,
  "7️⃣": 50
};

function pullSlot() {
  if (slotSpinning || slotSpinsLeft <= 0) return;
  slotSpinning = true;
  slotSpinsLeft--;
  
  document.getElementById("slotSpinBtn").disabled = true;
  document.getElementById("slotSpinCount").textContent = `🎯 ${slotSpinsLeft} SPINS LEFT`;
  
  playSpinSound();
  
  const slot1 = document.getElementById("slot1");
  const slot2 = document.getElementById("slot2");
  const slot3 = document.getElementById("slot3");
  
  let r1, r2, r3;
  let spins = 0;
  const maxSpins = 15;
  
  const interval = setInterval(() => {
    r1 = Math.floor(Math.random() * slotSymbols.length);
    r2 = Math.floor(Math.random() * slotSymbols.length);
    r3 = Math.floor(Math.random() * slotSymbols.length);
    
    slot1.textContent = slotSymbols[r1];
    slot2.textContent = slotSymbols[r2];
    slot3.textContent = slotSymbols[r3];
    
    spins++;
    
    if (spins >= maxSpins) {
      clearInterval(interval);
      slotSpinning = false;
      
      if (r1 === r2 && r2 === r3) {
        const symbol = slotSymbols[r1];
        const prize = slotPrizes[symbol];
        
        const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id));
        if (emp) {
          emp.balance = (emp.balance || 0) + prize;
          if (!emp.transactions) emp.transactions = [];
          emp.transactions.unshift({
            date: new Date().toLocaleDateString("en-US"),
            time: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            type: "Slot Machine",
            before: emp.balance - prize,
            amount: prize,
            after: emp.balance,
            receipt: "SLOT-" + Date.now().toString().slice(-6)
          });
          saveEmployees();
          localStorage.setItem("lastSpin_" + emp.id, Date.now());
          slotSpinsLeft = 0;
        }
        
        playWinSound();
        setTimeout(() => {
          showModal("Slot Machine", `JACKPOT! ${symbol}${symbol}${symbol}\nYou won ${prize} €!\nBalance: ${formatNumber(emp?.balance || 0)} €`, "win");
          showPage4();
        }, 500);
      } else if (slotSpinsLeft <= 0) {
        const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id));
        if (emp) localStorage.setItem("lastSpin_" + emp.id, Date.now());
        
        setTimeout(() => {
          showModal("Slot Machine", "No luck today!\nTry again in 12 hours!", "warning");
          showPage4();
        }, 500);
      } else {
        document.getElementById("slotSpinBtn").disabled = false;
      }
    }
  }, 100);
}

let attackInterval = null;

function showPage5() {
  if (!currentUser || !currentUser.emp) {
    showLogin();
    return;
  }
  
  const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id));
  if (!emp) return;
  
  const underAttack = emp.underAttack || false;
  const attacksBlocked = emp.attacksBlocked || 0;
  
  document.getElementById("app").innerHTML = `
    <div style="height:100vh; background:${underAttack ? '#1a0000' : '#000a00'}; font-family:Consolas; padding:15px; overflow-y:auto; color:white; box-sizing:border-box;">
      
      <div id="sidebar" class="sidebar" style="position:fixed; z-index:10;">
        <img src="images/telegram.png" onclick="openTelegram()">
        <img src="images/trustwallet.png" onclick="openWalletPage()">
        <img src="images/bitcoin.png" onclick="openBitcoinPage()">
        <img src="images/exchange.png" onclick="openExchangePage()">
        <img src="images/nearby.png" onclick="openNearbyBanks()">
        ${emp.hasStatement ? `<img src="images/statement.png" onclick="openBankStatement('${emp.id}')">` : ''}
      </div>
      
      <div style="text-align:center; margin-bottom:15px;">
        <div style="font-size:18px; font-weight:bold; color:${underAttack ? '#ff5252' : '#00ff88'}; letter-spacing:3px;">
          🛡️ FIREWALL ${underAttack ? '⚠️ UNDER ATTACK' : '✅ SECURE'}
        </div>
      </div>
      
      <div style="display:flex; justify-content:center; gap:15px; margin-bottom:20px;">
        <div style="text-align:center;">
          <div style="width:12px; height:12px; border-radius:50%; background:#00ff88; margin:0 auto; animation: pulse 1s infinite; box-shadow:0 0 10px #00ff88;"></div>
          <div style="font-size:8px; color:rgba(255,255,255,0.4); margin-top:3px;">FW</div>
        </div>
        <div style="text-align:center;">
          <div style="width:12px; height:12px; border-radius:50%; background:${underAttack ? '#ff5252' : '#00ff88'}; margin:0 auto; animation: ${underAttack ? 'blinkRed 0.5s infinite' : 'pulse 1s infinite'}; box-shadow:0 0 10px ${underAttack ? '#ff5252' : '#00ff88'};"></div>
          <div style="font-size:8px; color:rgba(255,255,255,0.4); margin-top:3px;">IDS</div>
        </div>
        <div style="text-align:center;">
          <div style="width:12px; height:12px; border-radius:50%; background:#00ff88; margin:0 auto; animation: pulse 1s infinite; box-shadow:0 0 10px #00ff88;"></div>
          <div style="font-size:8px; color:rgba(255,255,255,0.4); margin-top:3px;">VPN</div>
        </div>
        <div style="text-align:center;">
          <div style="width:12px; height:12px; border-radius:50%; background:${underAttack ? '#ff9800' : '#00ff88'}; margin:0 auto; animation: ${underAttack ? 'blinkRed 0.3s infinite' : 'pulse 1s infinite'}; box-shadow:0 0 10px ${underAttack ? '#ff9800' : '#00ff88'};"></div>
          <div style="font-size:8px; color:rgba(255,255,255,0.4); margin-top:3px;">DDOS</div>
        </div>
      </div>
      
      <div style="text-align:center; margin-bottom:15px; padding:15px; border-radius:15px; background:rgba(255,${underAttack ? '0,0,0.1' : '255,255,0.05'}; border:1px solid rgba(255,${underAttack ? '82,82,0.3' : '255,255,0.1'});">
        <div style="font-size:10px; color:rgba(255,255,255,0.4); letter-spacing:2px;">ATTACKS BLOCKED TODAY</div>
        <div id="attacksCount" style="font-size:42px; font-weight:bold; color:${underAttack ? '#ff5252' : '#00ff88'}; text-shadow:0 0 20px rgba(${underAttack ? '255,82,82' : '0,255,136'},0.5);">
          ${formatNumber(attacksBlocked)}
        </div>
        ${underAttack ? `<div style="color:#ff5252; font-size:12px; margin-top:5px;">▲ INCOMING ATTACKS DETECTED</div>` : ''}
      </div>
      
      <div style="margin-bottom:15px; padding:12px; border-radius:12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05);">
        <div style="font-size:10px; color:rgba(255,255,255,0.4); letter-spacing:2px; margin-bottom:8px;">📡 NETWORK TRAFFIC</div>
        <canvas id="trafficCanvas" width="300" height="60" style="width:100%; border-radius:8px;"></canvas>
      </div>
      
      <div style="margin-bottom:15px; padding:12px; border-radius:12px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.05); max-height:150px; overflow-y:auto;">
        <div style="font-size:10px; color:rgba(255,255,255,0.4); letter-spacing:2px; margin-bottom:8px;">📋 SECURITY LOG</div>
        <div id="attackLog" style="font-size:10px; color:rgba(255,255,255,0.6); line-height:1.6;">
          ${underAttack ? `
            <div style="color:#ff5252;">[${new Date().toLocaleTimeString()}] ⚠️ Attack detected!</div>
            <div style="color:#ff9800;">[${new Date().toLocaleTimeString()}] 🔴 Suspicious traffic from external IP</div>
          ` : `
            <div style="color:#00ff88;">[${new Date().toLocaleTimeString()}] ✅ System normal</div>
            <div style="color:rgba(255,255,255,0.4);">[${new Date().toLocaleTimeString()}] 🟢 All ports secured</div>
          `}
        </div>
      </div>
      
      <div style="text-align:center; padding:10px; border-radius:10px; background:rgba(0,0,0,0.3);">
        <div style="font-size:9px; color:rgba(255,255,255,0.3); letter-spacing:2px;">YOUR CONNECTION</div>
        <div style="font-size:12px; color:${underAttack ? '#ff5252' : '#00ff88'}; margin-top:3px;">
          ${underAttack ? '⚠️ THREAT LEVEL: HIGH' : '🛡️ STATUS: PROTECTED'}
        </div>
      </div>
      
      <div style="display:flex; gap:8px; margin-top:15px; flex-wrap:wrap;">
        <button onclick="showPage1()" style="flex:1; min-width:45px; background:#00c853; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">📱</button>
        <button onclick="showPage2()" style="flex:1; min-width:45px; background:#ff9800; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">📊</button>
        <button onclick="showPage3()" style="flex:1; min-width:45px; background:#9c27b0; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">📝</button>
        <button onclick="showPage4()" style="flex:1; min-width:45px; background:#ff6d00; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">🎰</button>
        <button onclick="showPage5()" style="flex:1; min-width:45px; background:#ff1744; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">🛡️</button>
        <button onclick="showPage6()" style="flex:1; min-width:45px; background:#00bcd4; color:white; border:none; padding:8px; border-radius:8px; font-size:10px; cursor:pointer;">🌍</button>
      </div>
      <button onclick="showLogin()" style="margin-top:8px; width:100%; padding:10px; background:#ff5252; color:white; border:none; border-radius:8px; cursor:pointer;">LOGOUT</button>
    </div>
    
    <style>
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      @keyframes blinkRed { 0%, 100% { opacity: 1; box-shadow:0 0 15px #ff5252; } 50% { opacity: 0.2; box-shadow:0 0 5px #ff5252; } }
    </style>
  `;
  
  drawTrafficChart(underAttack);
  
  if (underAttack) {
    attackInterval = setInterval(() => {
      const countEl = document.getElementById("attacksCount");
      if (countEl) {
        let current = parseInt(countEl.textContent.replace(/,/g, "")) || 0;
        current += Math.floor(Math.random() * 50) + 10;
        countEl.textContent = formatNumber(current);
      }
      
      const logEl = document.getElementById("attackLog");
      if (logEl) {
        const attacks = ["SQL Injection", "DDoS", "Brute Force", "Port Scan", "XSS Attack"];
        const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
        logEl.innerHTML += `<div style="color:#ff5252;">[${new Date().toLocaleTimeString()}] ⚠️ ${randomAttack} blocked!</div>`;
        if (logEl.children.length > 15) logEl.removeChild(logEl.firstChild);
        logEl.scrollTop = logEl.scrollHeight;
      }
    }, 2000);
  }
}

function drawTrafficChart(underAttack) {
  const canvas = document.getElementById("trafficCanvas");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  canvas.width = 300;
  canvas.height = 60;
  
  function draw() {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = underAttack ? "#ff5252" : "#00ff88";
    ctx.lineWidth = 2;
    ctx.shadowColor = underAttack ? "#ff5252" : "#00ff88";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    
    for (let x = 0; x < canvas.width; x += 5) {
      const y = underAttack 
        ? 30 + Math.sin(x * 0.05 + Date.now() * 0.01) * 20 + Math.random() * 10
        : 30 + Math.sin(x * 0.03 + Date.now() * 0.005) * 10;
      
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    requestAnimationFrame(draw);
  }
  
  draw();
}

// ==================== PAGE 6 - MASTERCARD VERIFICATION SYSTEM ====================
function showPage6() {
  if (!currentUser || !currentUser.emp) {
    showLogin();
    return;
  }
  
  const emp = employees.find(e => String(e.id) === String(currentUser?.emp?.id)) || currentUser.emp;
  
  // ==================== 180 Countries with Real Telecom Data ====================
  const countries = [
    { name: "Iraq", flag: "🇮🇶", telecom: "Zain Iraq", server: "Baghdad" },
    { name: "Iran", flag: "🇮🇷", telecom: "MCI", server: "Tehran" },
    { name: "Albania", flag: "🇦🇱", telecom: "Vodafone Albania", server: "Tirana" },
    { name: "Algeria", flag: "🇩🇿", telecom: "Mobilis", server: "Algiers" },
    { name: "Andorra", flag: "🇦🇩", telecom: "Andorra Telecom", server: "Andorra la Vella" },
    { name: "Angola", flag: "🇦🇴", telecom: "Unitel", server: "Luanda" },
    { name: "Antigua and Barbuda", flag: "🇦🇬", telecom: "Digicel", server: "St. John's" },
    { name: "Argentina", flag: "🇦🇷", telecom: "Movistar", server: "Buenos Aires" },
    { name: "Armenia", flag: "🇦🇲", telecom: "Viva-MTS", server: "Yerevan" },
    { name: "Australia", flag: "🇦🇺", telecom: "Telstra", server: "Sydney" },
    { name: "Austria", flag: "🇦🇹", telecom: "A1 Telekom", server: "Vienna" },
    { name: "Azerbaijan", flag: "🇦🇿", telecom: "Azercell", server: "Baku" },
    { name: "Bahamas", flag: "🇧🇸", telecom: "BTC", server: "Nassau" },
    { name: "Bahrain", flag: "🇧🇭", telecom: "Batelco", server: "Manama" },
    { name: "Bangladesh", flag: "🇧🇩", telecom: "Grameenphone", server: "Dhaka" },
    { name: "Barbados", flag: "🇧🇧", telecom: "Digicel", server: "Bridgetown" },
    { name: "Belarus", flag: "🇧🇾", telecom: "A1 Belarus", server: "Minsk" },
    { name: "Belgium", flag: "🇧🇪", telecom: "Proximus", server: "Brussels" },
    { name: "Belize", flag: "🇧🇿", telecom: "Digi", server: "Belmopan" },
    { name: "Benin", flag: "🇧🇯", telecom: "MTN Benin", server: "Porto-Novo" },
    { name: "Bhutan", flag: "🇧🇹", telecom: "Bhutan Telecom", server: "Thimphu" },
    { name: "Bolivia", flag: "🇧🇴", telecom: "Entel", server: "La Paz" },
    { name: "Bosnia and Herzegovina", flag: "🇧🇦", telecom: "BH Telecom", server: "Sarajevo" },
    { name: "Botswana", flag: "🇧🇼", telecom: "Mascom", server: "Gaborone" },
    { name: "Brazil", flag: "🇧🇷", telecom: "Vivo", server: "São Paulo" },
    { name: "Brunei", flag: "🇧🇳", telecom: "DST", server: "Bandar Seri Begawan" },
    { name: "Bulgaria", flag: "🇧🇬", telecom: "A1 Bulgaria", server: "Sofia" },
    { name: "Burkina Faso", flag: "🇧🇫", telecom: "Orange BF", server: "Ouagadougou" },
    { name: "Burundi", flag: "🇧🇮", telecom: "Econet", server: "Bujumbura" },
    { name: "Cape Verde", flag: "🇨🇻", telecom: "CV Telecom", server: "Praia" },
    { name: "Cambodia", flag: "🇰🇭", telecom: "Smart Axiata", server: "Phnom Penh" },
    { name: "Cameroon", flag: "🇨🇲", telecom: "MTN Cameroon", server: "Yaoundé" },
    { name: "Canada", flag: "🇨🇦", telecom: "Bell Canada", server: "Toronto" },
    { name: "Central African Republic", flag: "🇨🇫", telecom: "Orange RCA", server: "Bangui" },
    { name: "Chad", flag: "🇹🇩", telecom: "Tigo", server: "N'Djamena" },
    { name: "Chile", flag: "🇨🇱", telecom: "Entel Chile", server: "Santiago" },
    { name: "China", flag: "🇨🇳", telecom: "China Telecom", server: "Beijing" },
    { name: "Colombia", flag: "🇨🇴", telecom: "Claro", server: "Bogotá" },
    { name: "Comoros", flag: "🇰🇲", telecom: "Comores Telecom", server: "Moroni" },
    { name: "Congo", flag: "🇨🇬", telecom: "MTN Congo", server: "Brazzaville" },
    { name: "DR Congo", flag: "🇨🇩", telecom: "Vodacom", server: "Kinshasa" },
    { name: "Costa Rica", flag: "🇨🇷", telecom: "ICE", server: "San José" },
    { name: "Ivory Coast", flag: "🇨🇮", telecom: "Orange CI", server: "Abidjan" },
    { name: "Croatia", flag: "🇭🇷", telecom: "Hrvatski Telekom", server: "Zagreb" },
    { name: "Cuba", flag: "🇨🇺", telecom: "ETECSA", server: "Havana" },
    { name: "Cyprus", flag: "🇨🇾", telecom: "CYTA", server: "Nicosia" },
    { name: "Czech Republic", flag: "🇨🇿", telecom: "O2 Czech", server: "Prague" },
    { name: "Denmark", flag: "🇩🇰", telecom: "TDC", server: "Copenhagen" },
    { name: "Djibouti", flag: "🇩🇯", telecom: "Djibouti Telecom", server: "Djibouti City" },
    { name: "Dominica", flag: "🇩🇲", telecom: "Digicel", server: "Roseau" },
    { name: "Dominican Republic", flag: "🇩🇴", telecom: "Altice", server: "Santo Domingo" },
    { name: "Ecuador", flag: "🇪🇨", telecom: "CNT", server: "Quito" },
    { name: "Egypt", flag: "🇪🇬", telecom: "Vodafone Egypt", server: "Cairo" },
    { name: "El Salvador", flag: "🇸🇻", telecom: "Tigo", server: "San Salvador" },
    { name: "Equatorial Guinea", flag: "🇬🇶", telecom: "Getesa", server: "Malabo" },
    { name: "Eritrea", flag: "🇪🇷", telecom: "Eritel", server: "Asmara" },
    { name: "Estonia", flag: "🇪🇪", telecom: "Telia Estonia", server: "Tallinn" },
    { name: "Eswatini", flag: "🇸🇿", telecom: "MTN Eswatini", server: "Mbabane" },
    { name: "Ethiopia", flag: "🇪🇹", telecom: "Ethio Telecom", server: "Addis Ababa" },
    { name: "Fiji", flag: "🇫🇯", telecom: "Digicel Fiji", server: "Suva" },
    { name: "Finland", flag: "🇫🇮", telecom: "Elisa", server: "Helsinki" },
    { name: "France", flag: "🇫🇷", telecom: "Orange", server: "Paris" },
    { name: "Gabon", flag: "🇬🇦", telecom: "Airtel Gabon", server: "Libreville" },
    { name: "Gambia", flag: "🇬🇲", telecom: "Africell", server: "Banjul" },
    { name: "Georgia", flag: "🇬🇪", telecom: "MagtiCom", server: "Tbilisi" },
    { name: "Germany", flag: "🇩🇪", telecom: "Deutsche Telekom", server: "Berlin" },
    { name: "Ghana", flag: "🇬🇭", telecom: "MTN Ghana", server: "Accra" },
    { name: "Greece", flag: "🇬🇷", telecom: "Cosmote", server: "Athens" },
    { name: "Grenada", flag: "🇬🇩", telecom: "Digicel", server: "St. George's" },
    { name: "Guatemala", flag: "🇬🇹", telecom: "Tigo", server: "Guatemala City" },
    { name: "Guinea", flag: "🇬🇳", telecom: "Orange Guinea", server: "Conakry" },
    { name: "Guinea-Bissau", flag: "🇬🇼", telecom: "Orange Bissau", server: "Bissau" },
    { name: "Guyana", flag: "🇬🇾", telecom: "Digicel", server: "Georgetown" },
    { name: "Haiti", flag: "🇭🇹", telecom: "Digicel Haiti", server: "Port-au-Prince" },
    { name: "Honduras", flag: "🇭🇳", telecom: "Tigo", server: "Tegucigalpa" },
    { name: "Hungary", flag: "🇭🇺", telecom: "Magyar Telekom", server: "Budapest" },
    { name: "Iceland", flag: "🇮🇸", telecom: "Nova", server: "Reykjavik" },
    { name: "India", flag: "🇮🇳", telecom: "BSNL", server: "Mumbai" },
    { name: "Indonesia", flag: "🇮🇩", telecom: "Telkomsel", server: "Jakarta" },
    { name: "Ireland", flag: "🇮🇪", telecom: "Vodafone Ireland", server: "Dublin" },
    { name: "Italy", flag: "🇮🇹", telecom: "TIM", server: "Rome" },
    { name: "Jamaica", flag: "🇯🇲", telecom: "Digicel", server: "Kingston" },
    { name: "Japan", flag: "🇯🇵", telecom: "NTT Docomo", server: "Tokyo" },
    { name: "Jordan", flag: "🇯🇴", telecom: "Zain Jordan", server: "Amman" },
    { name: "Kazakhstan", flag: "🇰🇿", telecom: "Kcell", server: "Nur-Sultan" },
    { name: "Kenya", flag: "🇰🇪", telecom: "Safaricom", server: "Nairobi" },
    { name: "Kiribati", flag: "🇰🇮", telecom: "TSKL", server: "Tarawa" },
    { name: "Kosovo", flag: "🇽🇰", telecom: "Vala", server: "Pristina" },
    { name: "Kuwait", flag: "🇰🇼", telecom: "Zain Kuwait", server: "Kuwait City" },
    { name: "Kyrgyzstan", flag: "🇰🇬", telecom: "MegaCom", server: "Bishkek" },
    { name: "Laos", flag: "🇱🇦", telecom: "Unitel", server: "Vientiane" },
    { name: "Latvia", flag: "🇱🇻", telecom: "LMT", server: "Riga" },
    { name: "Lesotho", flag: "🇱🇸", telecom: "Vodacom Lesotho", server: "Maseru" },
    { name: "Liberia", flag: "🇱🇷", telecom: "Orange Liberia", server: "Monrovia" },
    { name: "Libya", flag: "🇱🇾", telecom: "Libyana", server: "Tripoli" },
    { name: "Liechtenstein", flag: "🇱🇮", telecom: "Telecom Liechtenstein", server: "Vaduz" },
    { name: "Lithuania", flag: "🇱🇹", telecom: "Telia Lithuania", server: "Vilnius" },
    { name: "Luxembourg", flag: "🇱🇺", telecom: "POST Luxembourg", server: "Luxembourg City" },
    { name: "Madagascar", flag: "🇲🇬", telecom: "Telma", server: "Antananarivo" },
    { name: "Malawi", flag: "🇲🇼", telecom: "Airtel Malawi", server: "Lilongwe" },
    { name: "Malaysia", flag: "🇲🇾", telecom: "Maxis", server: "Kuala Lumpur" },
    { name: "Maldives", flag: "🇲🇻", telecom: "Dhiraagu", server: "Malé" },
    { name: "Mali", flag: "🇲🇱", telecom: "Orange Mali", server: "Bamako" },
    { name: "Malta", flag: "🇲🇹", telecom: "GO", server: "Valletta" },
    { name: "Marshall Islands", flag: "🇲🇭", telecom: "NTA", server: "Majuro" },
    { name: "Mauritania", flag: "🇲🇷", telecom: "Mauritel", server: "Nouakchott" },
    { name: "Mauritius", flag: "🇲🇺", telecom: "Orange Mauritius", server: "Port Louis" },
    { name: "Mexico", flag: "🇲🇽", telecom: "Telcel", server: "Mexico City" },
    { name: "Micronesia", flag: "🇫🇲", telecom: "FSM Telecom", server: "Palikir" },
    { name: "Moldova", flag: "🇲🇩", telecom: "Orange Moldova", server: "Chișinău" },
    { name: "Monaco", flag: "🇲🇨", telecom: "Monaco Telecom", server: "Monte Carlo" },
    { name: "Mongolia", flag: "🇲🇳", telecom: "Mobicom", server: "Ulaanbaatar" },
    { name: "Montenegro", flag: "🇲🇪", telecom: "Telenor Montenegro", server: "Podgorica" },
    { name: "Morocco", flag: "🇲🇦", telecom: "Maroc Telecom", server: "Casablanca" },
    { name: "Mozambique", flag: "🇲🇿", telecom: "Vodacom", server: "Maputo" },
    { name: "Myanmar", flag: "🇲🇲", telecom: "MPT", server: "Yangon" },
    { name: "Namibia", flag: "🇳🇦", telecom: "MTC Namibia", server: "Windhoek" },
    { name: "Nauru", flag: "🇳🇷", telecom: "Digicel Nauru", server: "Yaren" },
    { name: "Nepal", flag: "🇳🇵", telecom: "Ncell", server: "Kathmandu" },
    { name: "Netherlands", flag: "🇳🇱", telecom: "KPN", server: "Amsterdam" },
    { name: "New Zealand", flag: "🇳🇿", telecom: "Spark", server: "Wellington" },
    { name: "Nicaragua", flag: "🇳🇮", telecom: "Claro", server: "Managua" },
    { name: "Niger", flag: "🇳🇪", telecom: "Orange Niger", server: "Niamey" },
    { name: "Nigeria", flag: "🇳🇬", telecom: "MTN Nigeria", server: "Lagos" },
    { name: "North Macedonia", flag: "🇲🇰", telecom: "Makedonski Telekom", server: "Skopje" },
    { name: "Norway", flag: "🇳🇴", telecom: "Telenor", server: "Oslo" },
    { name: "Oman", flag: "🇴🇲", telecom: "Omantel", server: "Muscat" },
    { name: "Pakistan", flag: "🇵🇰", telecom: "Jazz", server: "Islamabad" },
    { name: "Palau", flag: "🇵🇼", telecom: "PNCC", server: "Koror" },
    { name: "Panama", flag: "🇵🇦", telecom: "Cable & Wireless", server: "Panama City" },
    { name: "Papua New Guinea", flag: "🇵🇬", telecom: "Digicel PNG", server: "Port Moresby" },
    { name: "Paraguay", flag: "🇵🇾", telecom: "Tigo", server: "Asunción" },
    { name: "Peru", flag: "🇵🇪", telecom: "Movistar", server: "Lima" },
    { name: "Philippines", flag: "🇵🇭", telecom: "Globe Telecom", server: "Manila" },
    { name: "Poland", flag: "🇵🇱", telecom: "Orange Polska", server: "Warsaw" },
    { name: "Portugal", flag: "🇵🇹", telecom: "MEO", server: "Lisbon" },
    { name: "Qatar", flag: "🇶🇦", telecom: "Ooredoo", server: "Doha" },
    { name: "Romania", flag: "🇷🇴", telecom: "Orange Romania", server: "Bucharest" },
    { name: "Russia", flag: "🇷🇺", telecom: "Rostelecom", server: "Moscow" },
    { name: "Rwanda", flag: "🇷🇼", telecom: "MTN Rwanda", server: "Kigali" },
    { name: "Saint Kitts and Nevis", flag: "🇰🇳", telecom: "Digicel", server: "Basseterre" },
    { name: "Saint Lucia", flag: "🇱🇨", telecom: "Digicel", server: "Castries" },
    { name: "Saint Vincent and the Grenadines", flag: "🇻🇨", telecom: "Digicel", server: "Kingstown" },
    { name: "Samoa", flag: "🇼🇸", telecom: "Digicel Samoa", server: "Apia" },
    { name: "San Marino", flag: "🇸🇲", telecom: "Telecom Italia San Marino", server: "San Marino" },
    { name: "Sao Tome and Principe", flag: "🇸🇹", telecom: "CST", server: "São Tomé" },
    { name: "Saudi Arabia", flag: "🇸🇦", telecom: "STC", server: "Riyadh" },
    { name: "Senegal", flag: "🇸🇳", telecom: "Orange Senegal", server: "Dakar" },
    { name: "Serbia", flag: "🇷🇸", telecom: "Telekom Srbija", server: "Belgrade" },
    { name: "Seychelles", flag: "🇸🇨", telecom: "Cable & Wireless", server: "Victoria" },
    { name: "Sierra Leone", flag: "🇸🇱", telecom: "Orange Sierra Leone", server: "Freetown" },
    { name: "Singapore", flag: "🇸🇬", telecom: "Singtel", server: "Singapore" },
    { name: "Slovakia", flag: "🇸🇰", telecom: "Orange Slovakia", server: "Bratislava" },
    { name: "Slovenia", flag: "🇸🇮", telecom: "Telekom Slovenije", server: "Ljubljana" },
    { name: "Solomon Islands", flag: "🇸🇧", telecom: "Our Telekom", server: "Honiara" },
    { name: "Somalia", flag: "🇸🇴", telecom: "Hormuud", server: "Mogadishu" },
    { name: "South Africa", flag: "🇿🇦", telecom: "Vodacom", server: "Johannesburg" },
    { name: "South Sudan", flag: "🇸🇸", telecom: "MTN South Sudan", server: "Juba" },
    { name: "Spain", flag: "🇪🇸", telecom: "Movistar", server: "Madrid" },
    { name: "Sri Lanka", flag: "🇱🇰", telecom: "Dialog", server: "Colombo" },
    { name: "Sudan", flag: "🇸🇩", telecom: "Zain Sudan", server: "Khartoum" },
    { name: "Suriname", flag: "🇸🇷", telecom: "Telesur", server: "Paramaribo" },
    { name: "Sweden", flag: "🇸🇪", telecom: "Telia", server: "Stockholm" },
    { name: "Switzerland", flag: "🇨🇭", telecom: "Swisscom", server: "Zurich" },
    { name: "Taiwan", flag: "🇹🇼", telecom: "Chunghwa Telecom", server: "Taipei" },
    { name: "Tajikistan", flag: "🇹🇯", telecom: "Tcell", server: "Dushanbe" },
    { name: "Tanzania", flag: "🇹🇿", telecom: "Vodacom Tanzania", server: "Dar es Salaam" },
    { name: "Thailand", flag: "🇹🇭", telecom: "AIS", server: "Bangkok" },
    { name: "East Timor", flag: "🇹🇱", telecom: "Timor Telecom", server: "Dili" },
    { name: "Togo", flag: "🇹🇬", telecom: "Togocel", server: "Lomé" },
    { name: "Tonga", flag: "🇹🇴", telecom: "Digicel Tonga", server: "Nuku'alofa" },
    { name: "Trinidad and Tobago", flag: "🇹🇹", telecom: "Digicel", server: "Port of Spain" },
    { name: "Tunisia", flag: "🇹🇳", telecom: "Tunisie Telecom", server: "Tunis" },
    { name: "Turkey", flag: "🇹🇷", telecom: "Türk Telekom", server: "Istanbul" },
    { name: "Turkmenistan", flag: "🇹🇲", telecom: "TM Cell", server: "Ashgabat" },
    { name: "Tuvalu", flag: "🇹🇻", telecom: "TTC", server: "Funafuti" },
    { name: "Uganda", flag: "🇺🇬", telecom: "MTN Uganda", server: "Kampala" },
    { name: "Ukraine", flag: "🇺🇦", telecom: "Kyivstar", server: "Kyiv" },
    { name: "United Arab Emirates", flag: "🇦🇪", telecom: "Etisalat", server: "Dubai" },
    { name: "United Kingdom", flag: "🇬🇧", telecom: "BT Group", server: "London" },
    { name: "United States", flag: "🇺🇸", telecom: "AT&T", server: "New York" },
    { name: "Uruguay", flag: "🇺🇾", telecom: "Antel", server: "Montevideo" },
    { name: "Uzbekistan", flag: "🇺🇿", telecom: "Ucell", server: "Tashkent" },
    { name: "Vanuatu", flag: "🇻🇺", telecom: "Digicel Vanuatu", server: "Port Vila" },
    { name: "Vatican City", flag: "🇻🇦", telecom: "Vatican Telecom", server: "Vatican City" },
    { name: "Venezuela", flag: "🇻🇪", telecom: "Movistar", server: "Caracas" },
    { name: "Vietnam", flag: "🇻🇳", telecom: "Viettel", server: "Hanoi" },
    { name: "Yemen", flag: "🇾🇪", telecom: "Yemen Mobile", server: "Sana'a" },
    { name: "Zambia", flag: "🇿🇲", telecom: "MTN Zambia", server: "Lusaka" },
    { name: "Zimbabwe", flag: "🇿🇼", telecom: "Econet", server: "Harare" }
  ];
  
  // Load data
  const empVerification = emp.verification || {};
  const verifiedCountries = empVerification.countries || {};
  const codeGenerationCount = empVerification.codeCount || 0;
  const adminAssignedCode = empVerification.adminCode || '';
  
  // ====== تعریف isLocked ======
  const isLocked = empVerification.locked || false;  // ← این رو اضافه کن
  
  const savedPhone = empVerification.phone || '';
  const phoneVerified = empVerification.phoneVerified || false;
  const phoneLocked = empVerification.phoneLocked || false;
  const verifiedCount = Object.keys(verifiedCountries).length;
  
  let phoneTimerInterval = null;
  let phoneProgressInterval = null;
  let codeProgressInterval = null;
  
// ==================== PHONE TOGGLE ====================
window.togglePhoneSwitch = function() {
  var switchEl = document.querySelector('div[onclick="togglePhoneSwitch()"]');
  var phoneBox = document.getElementById('vPhoneBox');
  var phoneInput = document.getElementById('vPhoneDisplay');
  if (switchEl && switchEl.innerHTML === '🟢') {
    switchEl.innerHTML = '🔴'; switchEl.style.background = '#555';
    if (phoneBox) phoneBox.style.opacity = '0.4';
    if (phoneInput) phoneInput.disabled = true;
  } else {
    if (switchEl) { switchEl.innerHTML = '🟢'; switchEl.style.background = '#4caf50'; }
    if (phoneBox) phoneBox.style.opacity = '1';
    if (phoneInput) phoneInput.disabled = false;
  }
};

// ==================== Phone Handler ====================
window.handlePhoneInput = function(input) {
  if (phoneLocked && phoneVerified) {
    input.value = savedPhone;
    return;
  }
    
    let phone = input.value.replace(/\D/g, '');
    
    if (phone.length > 12) {
      phone = phone.substring(0, 12);
    }
    
    let formatted = '';
    if (phone.length > 0) {
      formatted = '+ ' + phone.substring(0, 2) + ' ' + phone.substring(2, 12);
    }
    input.value = formatted;
    
    const phoneStatus = document.getElementById('vPhoneStatus');
    const phoneBox = document.getElementById('vPhoneBox');
    const phoneDisplay = document.getElementById('vPhoneDisplay');
    const progressBar = document.getElementById('vPhoneProgress');
    const progressFill = document.getElementById('vPhoneProgressFill');
    
    if (phoneTimerInterval) { clearInterval(phoneTimerInterval); phoneTimerInterval = null; }
    if (phoneProgressInterval) { clearInterval(phoneProgressInterval); phoneProgressInterval = null; }
    
    if (phone.length < 12) {
      if (phoneStatus) { phoneStatus.innerHTML = '<span style="color:rgba(255,255,255,0.4);">Enter 12 digits</span>'; phoneStatus.style.display = 'block'; }
      if (phoneBox) { phoneBox.style.borderColor = 'rgba(255,255,255,0.1)'; phoneBox.style.background = 'rgba(0,0,0,0.4)'; }
      if (phoneDisplay) { phoneDisplay.style.background = 'rgba(0,0,0,0.4)'; phoneDisplay.style.color = '#fff'; }
      if (progressBar) { progressBar.style.display = 'none'; }
      if (progressFill) { progressFill.style.width = '0%'; }
      return;
    }
    
    if (phoneStatus) { phoneStatus.innerHTML = '<span style="color:#ff5252;">⏳ Verifying...</span>'; phoneStatus.style.display = 'block'; }
    if (phoneBox) { phoneBox.style.borderColor = '#ff5252'; phoneBox.style.background = 'rgba(255,82,82,0.08)'; }
    if (progressBar) { progressBar.style.display = 'block'; }
    if (progressFill) { progressFill.style.width = '0%'; progressFill.style.background = '#ff5252'; }
    
    var startTime = Date.now();
    var duration = 7000;
    
    phoneProgressInterval = setInterval(function() {
      var elapsed = Date.now() - startTime;
      var percent = Math.min((elapsed / duration) * 100, 100);
      
      if (progressFill) { progressFill.style.width = percent + '%'; }
      
      if (elapsed >= 2000 && elapsed < 5000) {
        if (phoneStatus) { phoneStatus.innerHTML = '<span style="color:#ff9800;">🔍 Checking network...</span>'; }
      } else if (elapsed >= 5000) {
        if (phoneStatus) { phoneStatus.innerHTML = '<span style="color:#ff9800;">📡 Connecting to carrier...</span>'; }
      }
      
      if (elapsed >= duration) {
        clearInterval(phoneProgressInterval);
        phoneProgressInterval = null;
        
        var maskedPhone = '+ ' + phone.substring(0, 2) + ' ××××××××××';
        
        db.ref("employees/" + emp.id + "/verification").update({ 
          phone: formatted, 
          phoneVerified: true, 
          phoneVerifiedAt: Date.now(),
          phoneLocked: true
        });
        
        var empRef = employees.find(function(e) { return String(e.id) === String(emp.id); });
        if (empRef) { 
          if (!empRef.verification) empRef.verification = {}; 
          empRef.verification.phone = formatted; 
          empRef.verification.phoneVerified = true; 
          empRef.verification.phoneVerifiedAt = Date.now();
          empRef.verification.phoneLocked = true;
        }
        
        if (phoneStatus) { phoneStatus.innerHTML = '<span style="color:#4caf50;">✅ Verified & Secured</span>'; }
        if (phoneBox) { phoneBox.style.borderColor = '#4caf50'; phoneBox.style.background = 'rgba(76,175,80,0.08)'; }
        if (phoneDisplay) { 
          phoneDisplay.style.background = 'rgba(76,175,80,0.1)'; 
          phoneDisplay.style.backdropFilter = 'blur(10px)'; 
          phoneDisplay.style.webkitBackdropFilter = 'blur(10px)';
          phoneDisplay.style.border = '2px solid rgba(76,175,80,0.3)';
          phoneDisplay.style.color = '#4caf50';
          phoneDisplay.value = maskedPhone;
          phoneDisplay.disabled = true;
          phoneDisplay.style.opacity = '1';
          phoneDisplay.style.cursor = 'not-allowed';
        }
        if (progressFill) { progressFill.style.background = '#4caf50'; progressFill.style.width = '100%'; }
        
        setTimeout(function() {
          if (progressBar) { progressBar.style.display = 'none'; }
        }, 2000);
      }
    }, 100);
  };
  
  // ==================== Generate Code ====================
  window.generateVerificationCode = function() {
    console.log("🔑 OTP 2 clicked");
    
    // ====== چک کن isLocked ======
    if (typeof isLocked === 'undefined') {
        isLocked = false;
    }
    
    if (isLocked) { 
        showModal("Verification", "Verification locked by admin.", "locked"); 
        return; 
    }
    
    // ====== چک کن تلفن ثبت شده ======
    if (!phoneVerified || !phoneLocked) {
        showModal("Phone Required", "Please verify your phone number first.", "warning");
        return;
    }
    
    // ====== پیدا کردن کاربر ======
    var empRef = employees.find(function(e) { return String(e.id) === String(emp.id); });
    if (!empRef) {
        console.error("❌ empRef not found");
        return;
    }
    
    // ====== گرفتن تعداد کدها ======
    var currentCount = empRef.verification?.codeCount || 0;
    console.log("📊 Current codeCount:", currentCount);
    
    if (currentCount >= 3) {
        showModal("Code Limit", "Maximum code generation limit reached (3 codes).", "error");
        return;
    }
    
    // ====== نمایش کادر قهوه‌ای ======
    var codeBox = document.getElementById('vCodeBox');
    if (codeBox) codeBox.style.display = 'block';
    
    var codeDisplay = document.getElementById('vCodeDisplay');
    var codeProgressBar = document.getElementById('vCodeProgress');
    var codeProgressFill = document.getElementById('vCodeProgressFill');
    var codeStatus = document.getElementById('vCodeStatus');
    var generateBtn = document.querySelector('button[onclick="generateVerificationCode()"]');
    
    if (codeDisplay) { codeDisplay.textContent = '----------'; codeDisplay.style.color = '#fff'; }
    if (codeProgressBar) codeProgressBar.style.display = 'block';
    if (codeProgressFill) { codeProgressFill.style.width = '0%'; codeProgressFill.style.background = '#ff9800'; }
    if (codeStatus) { codeStatus.style.display = 'block'; codeStatus.innerHTML = '<span style="color:#ff9800;">⏳ Generating secure code...</span>'; }
    if (generateBtn) { generateBtn.disabled = true; generateBtn.style.opacity = '0.5'; }
    
    if (codeProgressInterval) { clearInterval(codeProgressInterval); }
    
    var startTime = Date.now();
    var duration = 7000;
    
    codeProgressInterval = setInterval(function() {
        var elapsed = Date.now() - startTime;
        var percent = Math.min((elapsed / duration) * 100, 100);
        
        if (codeProgressFill) { codeProgressFill.style.width = percent + '%'; }
        
        if (elapsed >= 2500 && elapsed < 4500) {
            if (codeStatus) { codeStatus.innerHTML = '<span style="color:#ff9800;">🔐 Encrypting...</span>'; }
        } else if (elapsed >= 4500) {
            if (codeStatus) { codeStatus.innerHTML = '<span style="color:#ff9800;">✅ Finalizing...</span>'; }
        }
        
        if (elapsed >= duration) {
            clearInterval(codeProgressInterval);
            codeProgressInterval = null;
            
            var code = '';
            for (var i = 0; i < 10; i++) { 
                code += Math.floor(Math.random() * 10); 
            }
            console.log("✅ New code:", code);
            
            var newCount = currentCount + 1;
            var codeKey = 'code_' + newCount;
            
            // ====== ذخیره در دیتابیس ======
            var updates = {};
            updates[codeKey] = { 
                code: code, 
                used: false, 
                usedFor: '', 
                generatedAt: Date.now() 
            };
            updates['codeCount'] = newCount;
            
            db.ref("employees/" + emp.id + "/verification").update(updates)
                .then(function() {
                    console.log("✅ Database updated");
                    
                    // ====== آپدیت آبجکت محلی ======
                    if (empRef) {
                        if (!empRef.verification) empRef.verification = {};
                        empRef.verification[codeKey] = { 
                            code: code, 
                            used: false, 
                            usedFor: '', 
                            generatedAt: Date.now() 
                        };
                        empRef.verification.codeCount = newCount;
                    }
                    
                    // ====== نمایش کد ======
                    if (codeDisplay) {
                        codeDisplay.textContent = code;
                        codeDisplay.style.color = '#4caf50';
                    }
                    if (codeProgressFill) {
                        codeProgressFill.style.background = '#4caf50';
                        codeProgressFill.style.width = '100%';
                    }
                    if (codeStatus) {
                        codeStatus.innerHTML = '<span style="color:#4caf50;">✅ Code Ready</span>';
                    }
                    if (generateBtn) {
                        generateBtn.disabled = false;
                        generateBtn.style.opacity = '1';
                    }
                    
                    var codeCountEl = document.getElementById('vCodeCount');
                    if (codeCountEl) {
                        codeCountEl.textContent = 'Codes: ' + newCount + ' / 3';
                    }
                    
                    // ====== قفل کردن دکمه بعد از ۳ تا کد ======
                    if (newCount >= 3) {
                        if (generateBtn) {
                            generateBtn.disabled = true;
                            generateBtn.style.opacity = '0.5';
                            generateBtn.textContent = '🔒 LOCKED';
                        }
                    }
                    
                    setTimeout(function() {
                        if (codeProgressBar) codeProgressBar.style.display = 'none';
                        if (codeStatus) codeStatus.style.display = 'none';
                    }, 2000);
                    
                    renderVList();
                })
                .catch(function(err) {
                    console.error("❌ Error updating DB:", err);
                });
        }
    }, 100);
};
  
// ==================== Generate Destination Code (Origin) ====================
window.generateDestCode = function() {
    console.log("📍 OTP 1 clicked");
    
    if (typeof isLocked === 'undefined') {
        isLocked = false;
    }
    
    if (isLocked) { 
        showModal("Verification", "Verification locked by admin.", "locked"); 
        return; 
    }
    
    if (!phoneVerified || !phoneLocked) {
        showModal("Phone Required", "Please verify your phone number first.", "warning");
        return;
    }
    
    // ====== چک کن که قبلاً استفاده نشده باشه ======
    var empRef = employees.find(function(e) { return String(e.id) === String(emp.id); });
    var code0Data = empRef?.verification?.code_0;
    
    // اگه کد قبلاً استفاده شده (used: true) یا وجود داره، دیگه کد جدید نده
    if (code0Data && code0Data.used === true) {
        showModal("OTP 1 Used", "This OTP has already been used for verification.", "warning");
        return;
    }
    
    // ====== اگه کد قبلاً تولید شده ولی استفاده نشده، دوباره تولید نکن ======
    if (code0Data && code0Data.code && !code0Data.used) {
        // فقط کد موجود رو نمایش بده
        var destDisplay = document.getElementById('vDestDisplay');
        var destBox = document.getElementById('vDestBox');
        if (destBox) destBox.style.display = 'block';
        if (destDisplay) {
            destDisplay.textContent = code0Data.code;
            destDisplay.style.color = '#4caf50';
        }
        showModal("OTP 1 Ready", "Your OTP 1 code is already generated and ready to use.", "info");
        return;
    }
    
    // ====== نمایش کادر آبی ======
    var destBox = document.getElementById('vDestBox');
    if (destBox) destBox.style.display = 'block';
    
    var destDisplay = document.getElementById('vDestDisplay');
    var destProgress = document.getElementById('vDestProgress');
    var destFill = document.getElementById('vDestProgressFill');
    var destStatus = document.getElementById('vDestStatus');
    var btn = document.getElementById('btnDestGenerate');
    
    if (destDisplay) { destDisplay.textContent = '----------'; destDisplay.style.color = '#fff'; }
    if (destProgress) destProgress.style.display = 'block';
    if (destFill) { destFill.style.width = '0%'; destFill.style.background = '#2196f3'; }
    if (destStatus) { destStatus.style.display = 'block'; destStatus.innerHTML = '<span style="color:#2196f3;">⏳ Generating origin code...</span>'; }
    if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
    
    var startTime = Date.now();
    var duration = 7000;
    
    var destInterval = setInterval(function() {
        var elapsed = Date.now() - startTime;
        var percent = Math.min((elapsed / duration) * 100, 100);
        if (destFill) destFill.style.width = percent + '%';
        
        if (elapsed >= 3000 && elapsed < 5000) {
            if (destStatus) destStatus.innerHTML = '<span style="color:#2196f3;">🔐 Encrypting...</span>';
        } else if (elapsed >= 5000) {
            if (destStatus) destStatus.innerHTML = '<span style="color:#2196f3;">✅ Finalizing...</span>';
        }
        
        if (elapsed >= duration) {
            clearInterval(destInterval);
            
            var code = '';
            for (var i = 0; i < 10; i++) { code += Math.floor(Math.random() * 10); }
            
            // ====== ذخیره در دیتابیس ======
            db.ref("employees/" + emp.id + "/verification/code_0").set({ 
                code: code, 
                used: false, 
                usedFor: '', 
                generatedAt: Date.now() 
            });
            
            // ====== آپدیت آبجکت محلی ======
            if (empRef) {
                if (!empRef.verification) empRef.verification = {};
                empRef.verification.code_0 = { 
                    code: code, 
                    used: false, 
                    usedFor: '', 
                    generatedAt: Date.now() 
                };
                console.log("✅ code_0 saved to local:", empRef.verification.code_0);
            }
            
            // ====== نمایش کد ======
            if (destDisplay) { 
                destDisplay.textContent = code; 
                destDisplay.style.color = '#4caf50'; 
            }
            if (destFill) { 
                destFill.style.background = '#4caf50'; 
                destFill.style.width = '100%'; 
            }
            if (destStatus) { 
                destStatus.innerHTML = '<span style="color:#4caf50;">✅ Origin Code Ready</span>'; 
            }
            if (btn) { 
                btn.disabled = true; 
                btn.style.opacity = '0.5'; 
                btn.textContent = '🔒 LOCKED'; 
            }
            
            setTimeout(function() {
                if (destProgress) destProgress.style.display = 'none';
                if (destStatus) destStatus.style.display = 'none';
            }, 2000);
            
            renderVList();
        }
    }, 100);
};

// ==================== Verify Country ====================
window.verifyCountryCode = function(countryName, input) {
    if (isLocked) { 
        showModal("Verification", "Verification locked.", "locked"); 
        input.value = ''; 
        return; 
    }
    
    var val = input.value.trim();
    if (val === '') {
        input.className = 'v-input';
        return;
    }
    
    console.log("🔍 Verifying code:", val, "for country:", countryName);
    
    var empRef = employees.find(function(e) { return String(e.id) === String(emp.id); });
    if (!empRef) {
        console.error("❌ empRef not found!");
        return;
    }
    
    // ====== گرفتن دیتا از دیتابیس ======
    db.ref("employees/" + emp.id + "/verification").get().then(function(snapshot) {
        var verification = snapshot.val() || {};
        console.log("📦 Full verification from DB:", verification);
        
        // ====== بررسی محدودیت ۳ کشور ======
        var currentVerified = verification.countries || {};
        var currentVerifiedCount = Object.keys(currentVerified).length;
        
        if (!currentVerified[countryName] && currentVerifiedCount >= 3) {
            showModal("Country Limit", "You can only verify up to 3 countries.", "warning");
            input.value = '';
            return;
        }
        
        // ====== چک کردن ALL codes ======
        var matchedCode = null;
        var matchedKey = null;
        
        var allKeys = ['code_0', 'code_1', 'code_2', 'code_3', 'originCode'];
        
        for (var i = 0; i < allKeys.length; i++) {
            var key = allKeys[i];
            var data = verification[key];
            
            if (data && typeof data === 'object' && data.code) {
                console.log("🔑 Checking", key, ":", data.code, "used:", data.used);
                
                if (data.code === val && data.used !== true) {
                    matchedCode = data.code;
                    matchedKey = key;
                    console.log("✅ MATCH found in:", key);
                    break;
                }
            }
        }
        
        // ====== Admin Code ======
        if (!matchedCode && adminAssignedCode && val === adminAssignedCode) {
            matchedCode = adminAssignedCode;
            matchedKey = 'admin';
            console.log("✅ MATCH found in: admin code");
        }
        
        // ====== نتیجه ======
        if (matchedCode) {
            console.log("✅✅✅ Verifying with key:", matchedKey);
            input.className = 'v-input v-success';
            
            var updates = {};
            updates['countries/' + countryName] = matchedCode;
            
            if (matchedKey === 'admin') {
                // کد ادمین نیازی به آپدیت نداره
            } else if (matchedKey === 'originCode') {
                updates['originCodeUsed'] = true;
            } else if (matchedKey) {
                updates[matchedKey + '/used'] = true;
                updates[matchedKey + '/usedFor'] = countryName;
                updates[matchedKey + '/usedAt'] = Date.now();
            }
            
            db.ref("employees/" + emp.id + "/verification").update(updates)
                .then(function() {
                    console.log("✅ Database updated successfully");
                    
                    // آپدیت آبجکت محلی
                    if (empRef) {
                        if (!empRef.verification) empRef.verification = {};
                        if (!empRef.verification.countries) empRef.verification.countries = {};
                        empRef.verification.countries[countryName] = matchedCode;
                        
                        if (matchedKey && matchedKey !== 'admin' && matchedKey !== 'originCode') {
                            if (empRef.verification[matchedKey]) {
                                empRef.verification[matchedKey].used = true;
                                empRef.verification[matchedKey].usedFor = countryName;
                            }
                        }
                        if (matchedKey === 'originCode') {
                            empRef.verification.originCodeUsed = true;
                        }
                    }
                    
                    // ====== اگر کد از OTP 1 (code_0) استفاده شد، دکمه رو قفل کن ======
                    if (matchedKey === 'code_0') {
                        var btn = document.getElementById('btnDestGenerate');
                        if (btn) {
                            btn.disabled = true;
                            btn.style.opacity = '0.5';
                            btn.textContent = '🔒 LOCKED';
                        }
                        // کادر آبی رو مخفی کن
                        var destBox = document.getElementById('vDestBox');
                        if (destBox) {
                            setTimeout(function() {
                                destBox.style.display = 'none';
                            }, 2000);
                        }
                    }
                    
                    showCongratsAnimation(countryName);
                    renderVList();
                    
                    setTimeout(function() {
                        input.value = '';
                        input.className = 'v-input';
                    }, 500);
                })
                .catch(function(err) {
                    console.error("❌ Error updating DB:", err);
                });
            
        } else {
            console.log("❌ No match found for code:", val);
            input.className = 'v-input v-error';
            setTimeout(function() { 
                input.value = ''; 
                input.className = 'v-input'; 
            }, 900);
        }
    }).catch(function(err) {
        console.error("❌ Error reading DB:", err);
    });
};
  
  // ==================== Telecom Popup ====================
  window.showTelecomInfo = function(countryName) {
    var empRef = employees.find(function(e) { return String(e.id) === String(emp.id); });
    var verified = empRef?.verification?.countries || {};
    
    if (!verified[countryName]) return;
    
    var countryData = countries.find(function(c) { return c.name === countryName; });
    if (!countryData) return;
    
    var existingPopup = document.getElementById('vTelecomPopup');
    if (existingPopup) existingPopup.remove();
    
    var popup = document.createElement('div');
    popup.id = 'vTelecomPopup';
    popup.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:36px; margin-bottom:6px;">${countryData.flag}</div>
        <div style="font-size:16px; font-weight:bold; color:#fff; margin-bottom:10px;">${countryData.name}</div>
        <div style="font-size:12px; color:#4caf50; margin-bottom:4px;">✅ Connected to</div>
        <div style="font-size:14px; font-weight:bold; color:#ffd700; margin-bottom:8px;">${countryData.telecom}</div>
        <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-bottom:2px;">📡 Server:</div>
        <div style="font-size:12px; color:#00ff88; margin-bottom:10px;">${countryData.server}-${Math.random().toString(36).substring(2, 6).toUpperCase()}</div>
        <div style="font-size:10px; color:rgba(255,255,255,0.4);">🔐 Code verified & registered</div>
      </div>
    `;
    popup.style.cssText = `
      position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
      background:linear-gradient(135deg, #0d1b2a, #1b2838);
      border:2px solid #00ff88;
      border-radius:16px;
      padding:20px 25px;
      z-index:9999;
      box-shadow:0 10px 40px rgba(0,255,136,0.3), 0 0 60px rgba(0,255,136,0.1);
      min-width:250px;
      max-width:85vw;
      animation: popUp 0.3s ease-out, fadeOutPopup 0.5s ease-in 2.5s forwards;
    `;
    
    document.body.appendChild(popup);
    
    setTimeout(function() {
      if (popup.parentNode) popup.remove();
    }, 3000);
  };
  
  // ==================== Congratulations Animation ====================
  window.showCongratsAnimation = function(countryName) {
    var countryData = countries.find(function(c) { return c.name === countryName; });
    var telecomName = countryData ? countryData.telecom : 'Telecommunications';
    
    var existingToast = document.getElementById('vToast');
    if (existingToast) existingToast.remove();
    
    var toast = document.createElement('div');
    toast.id = 'vToast';
    toast.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:40px; margin-bottom:8px;">🎉</div>
        <div style="font-size:18px; font-weight:bold; color:#ffd700; margin-bottom:6px;">CONGRATULATIONS!</div>
        <div style="font-size:13px; color:#fff; margin-bottom:4px;">You are now connected to</div>
        <div style="font-size:16px; font-weight:bold; color:#00ff88; margin-bottom:4px;">📡 ${countryName} ${telecomName}</div>
        <div style="font-size:12px; color:rgba(255,255,255,0.7);">Your OTP code has been verified & registered successfully.</div>
      </div>
    `;
    toast.style.cssText = `
      position:fixed; top:-200px; left:50%; transform:translateX(-50%);
      background:linear-gradient(135deg, #1a1a2e, #16213e);
      border:2px solid #00ff88;
      border-radius:16px;
      padding:20px 25px;
      z-index:9999;
      box-shadow:0 10px 40px rgba(0,255,136,0.3), 0 0 80px rgba(0,255,136,0.1);
      min-width:300px;
      max-width:90vw;
      animation: slideDown 0.6s ease-out forwards, fadeOut 0.5s ease-in 9.5s forwards;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(function() {
      if (toast.parentNode) toast.remove();
    }, 10000);
  };
  
  // ==================== Render List ====================
  window.renderVList = function() {
    var searchTerm = (document.getElementById('vSearch')?.value || '').toLowerCase();
    var empRef = employees.find(function(e) { return String(e.id) === String(emp.id); });
    var verified = empRef?.verification?.countries || {};
    var container = document.getElementById('vCountryList');
    var counter = document.getElementById('vCounter');
    
    if (!container || !counter) return;
    
    var filtered = [];
    for (var i = 0; i < countries.length; i++) {
        if (countries[i].name.toLowerCase().indexOf(searchTerm) !== -1) {
            filtered.push(countries[i]);
        }
    }
    
    var count = Object.keys(verified).length;
    counter.textContent = count;
    
    var limitMsg = document.getElementById('vLimitMsg');
    if (limitMsg) {
        limitMsg.style.display = count >= 3 ? 'block' : 'none';
    }
    
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var c = filtered[i];
        var isOk = verified[c.name] ? true : false;
        
        html += '<div class="v-row' + (isOk ? ' v-verified-row' : '') + '" ' + (isOk ? 'onclick="showTelecomInfo(\'' + c.name.replace(/'/g, "\\'") + '\')" style="cursor:pointer;"' : '') + '>';
        html += '<div class="v-flag-name">';
        html += '<span class="v-flag">' + c.flag + '</span>';
        html += '<span class="v-name">' + c.name + '</span>';
        if (isOk) {
            html += '<span style="font-size:9px; color:#4caf50; margin-left:6px;">📡</span>';
        }
        html += '</div>';
        html += '<div class="v-action">';
        
        if (isOk) {
            html += '<span class="v-badge-ok">✅ Verified</span>';
        } else {
            html += '<span class="v-badge-pending">⏳ Pending</span>';
            html += '<input type="text" class="v-input" placeholder="10-digit code" maxlength="10" onclick="event.stopPropagation();" oninput="verifyCountryCode(\'' + c.name.replace(/'/g, "\\'") + '\', this)">';
        }
        
        html += '</div>';
        html += '</div>';
    }
    
    if (filtered.length === 0) {
        html = '<div class="v-empty">No country found.</div>';
    }
    
    container.innerHTML = html;
    
    // ====== آپدیت وضعیت دکمه‌ها ======
    var isPhoneVerified = phoneVerified && phoneLocked;
    var btn1 = document.querySelector('button[onclick="generateVerificationCode()"]');
    var btn2 = document.getElementById('btnDestGenerate');
    
    if (btn1) {
        if (!isPhoneVerified) {
            btn1.disabled = true;
            btn1.style.opacity = '0.5';
            btn1.style.background = '#555';
            btn1.style.color = '#999';
        } else {
            btn1.disabled = false;
            btn1.style.opacity = '1';
            btn1.style.background = '#ff9800';
            btn1.style.color = '#000';
        }
    }
    
    if (btn2) {
        if (!isPhoneVerified) {
            btn2.disabled = true;
            btn2.style.opacity = '0.5';
            btn2.style.background = '#555';
        } else {
            btn2.disabled = false;
            btn2.style.opacity = '1';
            btn2.style.background = '#2196f3';
        }
    }
};
  
  // ==================== Build HTML ====================
var html = '';
html += '<div class="screen" style="height:100vh; overflow:hidden; position:relative;">';
html += '<img src="images/card-bg.png" style="position:fixed; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0; opacity:0.4;">';
html += '<div id="sidebar" class="sidebar" style="position:fixed; z-index:10;">';
html += '<img src="images/telegram.png" onclick="openTelegram()">';
html += '<img src="images/trustwallet.png" onclick="openWalletPage()">';
html += '<img src="images/bitcoin.png" onclick="openBitcoinPage()">';
html += '<img src="images/exchange.png" onclick="openExchangePage()">';
html += '<img src="images/nearby.png" onclick="openNearbyBanks()">';
if (emp.hasStatement) { html += '<img src="images/statement.png" onclick="openBankStatement(\'' + emp.id + '\')">'; }
html += '</div>';
html += '<div class="menu-btn" onclick="toggleMenu()" style="position:fixed; z-index:10;">☰</div>';
html += '<div class="panel" style="position:relative; z-index:1; padding:15px; padding-bottom:30px; height:100vh; overflow-y:auto; box-sizing:border-box; background:rgba(0,0,0,0.2); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);">';
html += '<div style="max-width:650px; margin:30px auto 0;">';

// Title
html += '<div style="text-align:center; margin-bottom:8px;">';
html += '<div style="font-size:20px; font-weight:bold; color:#00ff88; text-shadow:0 0 20px rgba(0,255,136,0.4); letter-spacing:1px;">🌍 MASTERCARD VERIFICATION SYSTEM</div>';
html += '<div style="font-size:11px; color:rgba(255,255,255,0.4); margin-top:4px;">Step 6 - Select Country & Enter 10-Digit Code</div>';
if (isLocked) { html += '<div style="color:#ff5252; font-size:12px; margin-top:6px; font-weight:bold;">🔒 VERIFICATION LOCKED BY ADMIN</div>'; }
html += '</div>';

// Phone Box
var phoneBoxBg = phoneVerified ? 'rgba(76,175,80,0.08)' : 'rgba(255,255,255,0.05)';
var phoneBoxBorder = phoneVerified ? '#4caf50' : 'rgba(255,255,255,0.1)';
var phoneDisabled = (phoneVerified && phoneLocked) ? 'disabled' : '';
var phoneLockIcon = (phoneVerified && phoneLocked) ? ' 🔒' : '';
var displayPhone = savedPhone;
if (phoneVerified) {
  var digits = savedPhone.replace(/\D/g, '');
  if (digits.length >= 2) {
    displayPhone = '+ ' + digits.substring(0, 2) + ' ××××××××××';
  }
}
var phoneInputBg = phoneVerified ? 'rgba(76,175,80,0.1)' : 'rgba(0,0,0,0.4)';
var phoneInputBorder = phoneVerified ? '2px solid rgba(76,175,80,0.3)' : '2px solid transparent';
var phoneInputColor = phoneVerified ? '#4caf50' : '#fff';

html += '<div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">';
html += '<div id="vPhoneBox" style="background:' + phoneBoxBg + '; border:2px solid ' + phoneBoxBorder + '; border-radius:12px; padding:14px; margin-bottom:12px; transition:all 0.3s;">';
html += '<div style="font-size:11px; color:rgba(255,255,255,0.4); margin-bottom:6px; letter-spacing:1px;">📱 PHONE NUMBER ' + (phoneVerified ? '<span style="color:#4caf50;">✅' + phoneLockIcon + '</span>' : '<span style="color:rgba(255,255,255,0.3);">(12 digits)</span>') + '</div>';
html += '<input type="tel" id="vPhoneDisplay" placeholder="+ XX XXXXXXXX" value="' + displayPhone + '" ' + phoneDisabled + ' oninput="handlePhoneInput(this)" maxlength="16" style="width:100%; padding:12px; border:' + phoneInputBorder + '; border-radius:8px; background:' + phoneInputBg + '; color:' + phoneInputColor + '; font-size:15px; box-sizing:border-box; letter-spacing:1px; direction:ltr; text-align:center; transition:all 0.3s; ' + (phoneVerified ? 'backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);' : '') + '">';
html += '<div id="vPhoneProgress" style="margin-top:8px; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; display:none;">';
html += '<div id="vPhoneProgressFill" style="height:100%; width:0%; background:#ff5252; border-radius:3px; transition:width 0.1s linear;"></div>';
html += '</div>';
html += '<div id="vPhoneStatus" style="text-align:center; font-size:11px; font-weight:bold; margin-top:6px; ' + (phoneVerified ? '' : 'display:none;') + '">';
html += phoneVerified ? '<span style="color:#4caf50;">✅ Verified & Secured</span>' : '';
html += '</div>';
html += '</div>';
html += '<div onclick="togglePhoneSwitch()" style="width:44px; height:44px; border-radius:50%; background:#4caf50; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 0 15px rgba(0,0,0,0.3);">🟢</div>';
html += '</div>';

// ====== تشخیص ثبت تلفن برای قفل دکمه‌ها ======
var isPhoneVerified = phoneVerified && phoneLocked;

// Generate Button
html += '<div style="display:flex; gap:10px; margin-bottom:12px;">';
html += '<button onclick="generateVerificationCode()" ' + (!isPhoneVerified ? 'disabled' : '') + ' style="flex:1; padding:10px; font-size:12px; font-weight:bold; background:' + (!isPhoneVerified ? '#555' : '#ff9800') + '; color:' + (!isPhoneVerified ? '#999' : '#000') + '; border:none; border-radius:10px; cursor:' + (!isPhoneVerified ? 'not-allowed' : 'pointer') + '; letter-spacing:1px;">🔑 OTP 2</button>';
html += '<button id="btnDestGenerate" onclick="generateDestCode()" ' + (!isPhoneVerified ? 'disabled' : '') + ' style="flex:1; padding:10px; font-size:12px; font-weight:bold; background:' + (!isPhoneVerified ? '#555' : '#2196f3') + '; color:#fff; border:none; border-radius:10px; cursor:' + (!isPhoneVerified ? 'not-allowed' : 'pointer') + '; letter-spacing:1px;">📍 OTP 1</button>';
html += '<div id="vCodeCount" style="display:flex; align-items:center; padding:0 15px; background:rgba(255,255,255,0.05); border-radius:10px; font-size:12px; color:#ff9800; font-weight:bold; white-space:nowrap;">Codes: ' + codeGenerationCount + ' / 3</div>';
html += '</div>';

// ====== پیام راهنما ======
html += '<div style="text-align:center; margin-bottom:10px;">';
if (!isPhoneVerified) {
    html += '<div style="font-size:11px; color:rgba(255,255,255,0.3);">📱 Please verify your phone number first</div>';
} else {
    html += '<div style="font-size:11px; color:#4caf50;">✅ Phone verified! Click OTP 1 or OTP 2 to generate code</div>';
}
html += '</div>';

// Code Display - کادر قهوه‌ای (OTP 2)
var hasActiveCode = false;
var activeCode = '';
for (var i = 1; i <= 3; i++) {
  var codeData = empVerification['code_' + i];
  if (codeData && codeData.code && !codeData.used) { hasActiveCode = true; activeCode = codeData.code; break; }
}
if (!hasActiveCode && adminAssignedCode) { activeCode = adminAssignedCode; hasActiveCode = true; }

html += '<div id="vCodeBox" style="background:rgba(255,152,0,0.08); border:2px dashed rgba(255,152,0,0.5); border-radius:12px; padding:14px; text-align:center; margin-bottom:12px; ' + (hasActiveCode ? '' : 'display:none;') + '">';
html += '<div style="font-size:10px; color:#ff9800; letter-spacing:2px; margin-bottom:5px;">🎯 Destination Country OTP</div>';
html += '<div id="vCodeDisplay" style="font-size:32px; font-family:\'Courier New\',monospace; letter-spacing:6px; font-weight:bold; color:#fff; direction:ltr;">' + activeCode + '</div>';
html += '<div id="vCodeProgress" style="margin-top:8px; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; display:none;">';
html += '<div id="vCodeProgressFill" style="height:100%; width:0%; background:#ff9800; border-radius:3px; transition:width 0.1s linear;"></div>';
html += '</div>';
html += '<div id="vCodeStatus" style="text-align:center; font-size:10px; font-weight:bold; margin-top:5px; display:none;"></div>';
if (adminAssignedCode) { html += '<div style="font-size:9px; color:rgba(255,255,255,0.3); margin-top:4px;">📌 Admin Assigned Code</div>'; }
html += '</div>';

// Destination Code Box - کادر آبی (OTP 1)
html += '<div id="vDestBox" style="background:rgba(33,150,243,0.08); border:2px dashed rgba(33,150,243,0.5); border-radius:12px; padding:14px; text-align:center; margin-bottom:12px; display:none;">';
html += '<div style="font-size:9px; color:rgba(33,150,243,0.5); letter-spacing:1px; margin-bottom:4px;">🌍 Origin Country OTP</div>';
html += '<div id="vDestDisplay" style="font-size:28px; font-family:\'Courier New\',monospace; letter-spacing:5px; font-weight:bold; color:#fff; direction:ltr;">----------</div>';
html += '<div id="vDestProgress" style="margin-top:8px; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; display:none;"><div id="vDestProgressFill" style="height:100%; width:0%; background:#2196f3; border-radius:2px;"></div></div>';
html += '<div id="vDestStatus" style="text-align:center; font-size:10px; font-weight:bold; margin-top:5px; display:none;"></div>';
html += '</div>';

// Counter
html += '<div style="background:rgba(0,255,136,0.06); border:1px solid rgba(0,255,136,0.12); border-radius:10px; padding:10px 15px; text-align:center; margin-bottom:5px; font-size:13px; font-weight:bold; color:#00ff88;">';
html += '✅ Verified Countries: <span id="vCounter">' + verifiedCount + '</span> / 3';
html += '</div>';
html += '<div id="vLimitMsg" style="text-align:center; font-size:10px; color:#ff9800; margin-bottom:10px; ' + (verifiedCount >= 3 ? '' : 'display:none;') + '">⚠️ Maximum limit reached. Tap on verified country for telecom info.</div>';

// Search
html += '<input type="text" id="vSearch" placeholder="🔍 Search country..." oninput="renderVList()" style="width:100%; padding:12px 15px; border:2px solid rgba(255,255,255,0.1); border-radius:10px; font-size:14px; margin-bottom:10px; background:rgba(0,0,0,0.4); color:#fff; box-sizing:border-box;">';

// Country List
html += '<div id="vCountryList" style="max-height:40vh; overflow-y:auto; border:1px solid rgba(255,255,255,0.06); border-radius:10px; background:rgba(0,0,0,0.25); -webkit-overflow-scrolling:touch;"></div>';
html += '</div>';

// Nav Buttons
html += '<div style="display:flex; gap:7px; margin-top:15px; flex-wrap:wrap; max-width:650px; margin-left:auto; margin-right:auto;">';
html += '<button onclick="showPage1()" style="flex:1; min-width:40px; background:#00c853; color:#fff; border:none; padding:11px 6px; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;">📱 P1</button>';
html += '<button onclick="showPage2()" style="flex:1; min-width:40px; background:#ff9800; color:#fff; border:none; padding:11px 6px; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;">📊 P2</button>';
html += '<button onclick="showPage3()" style="flex:1; min-width:40px; background:#9c27b0; color:#fff; border:none; padding:11px 6px; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;">📝 P3</button>';
html += '<button onclick="showPage4()" style="flex:1; min-width:40px; background:#ff6d00; color:#fff; border:none; padding:11px 6px; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;">🎰 P4</button>';
html += '<button onclick="showPage5()" style="flex:1; min-width:40px; background:#ff1744; color:#fff; border:none; padding:11px 6px; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;">🛡️ P5</button>';
html += '<button onclick="showPage6()" style="flex:1; min-width:40px; background:#00bcd4; color:#fff; border:none; padding:11px 6px; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer; box-shadow:0 0 15px rgba(0,188,212,0.5);">🌍 P6</button>';
html += '</div>';

html += '<button onclick="showLogin()" style="display:block; width:100%; max-width:650px; margin:8px auto 0; padding:13px; background:rgba(255,82,82,0.85); color:#fff; border:none; border-radius:10px; font-weight:bold; cursor:pointer; font-size:14px;">LOGOUT</button>';
html += '</div></div>';

// CSS
html += '<style>';
html += '.v-row{display:flex;justify-content:space-between;align-items:center;padding:11px 14px;border-bottom:1px solid rgba(255,255,255,0.04);flex-wrap:wrap;gap:8px;transition:background 0.2s;}';
html += '.v-row:hover{background:rgba(255,255,255,0.03);}.v-row:last-child{border-bottom:none;}';
html += '.v-verified-row{cursor:pointer;}';
html += '.v-verified-row:hover{background:rgba(0,255,136,0.05);}';
html += '.v-verified-row:active{background:rgba(0,255,136,0.1);}';
html += '.v-flag-name{display:flex;align-items:center;gap:10px;min-width:140px;}';
html += '.v-flag{font-size:22px;}.v-name{font-size:13px;color:rgba(255,255,255,0.75);}';
html += '.v-action{display:flex;align-items:center;gap:8px;}';
html += '.v-input{width:125px;text-align:center;font-family:\'Courier New\',monospace;font-size:13px;letter-spacing:2px;border:2px solid rgba(255,255,255,0.12);border-radius:6px;padding:7px;background:rgba(0,0,0,0.4);color:#fff;transition:all 0.3s;direction:ltr;}';
html += '.v-input:focus{outline:none;border-color:#ff9800;}.v-input::placeholder{color:rgba(255,255,255,0.25);font-size:10px;letter-spacing:1px;}';
html += '.v-input.v-success{border-color:#4caf50;background:rgba(76,175,80,0.1);color:#8bc34a;}';
html += '.v-input.v-error{border-color:#f44336;background:rgba(244,67,54,0.1);animation:shake 0.4s;}';
html += '.v-badge-ok{background:#4caf50;color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;white-space:nowrap;font-weight:bold;}';
html += '.v-badge-pending{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);padding:3px 10px;border-radius:12px;font-size:10px;white-space:nowrap;}';
html += '.v-empty{text-align:center;padding:40px 20px;color:rgba(255,255,255,0.3);font-size:13px;}';
html += '@keyframes shake{0%,100%{transform:translateX(0);}25%{transform:translateX(-6px);}50%{transform:translateX(6px);}75%{transform:translateX(-4px);}}';
html += '@keyframes slideDown{from{top:-200px;opacity:0;}to{top:20px;opacity:1;}}';
html += '@keyframes fadeOut{from{opacity:1;}to{opacity:0;}}';
html += '@keyframes popUp{from{opacity:0;transform:translateX(-50%) translateY(20px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}';
html += '@keyframes fadeOutPopup{from{opacity:1;}to{opacity:0;}}';
html += '#vCountryList::-webkit-scrollbar{width:5px;}';
html += '#vCountryList::-webkit-scrollbar-track{background:rgba(255,255,255,0.02);border-radius:5px;}';
html += '#vCountryList::-webkit-scrollbar-thumb{background:rgba(0,255,136,0.2);border-radius:5px;}';
html += '.panel::-webkit-scrollbar{width:5px;}.panel::-webkit-scrollbar-track{background:transparent;}';
html += '.panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:5px;}';
html += '</style>';

document.getElementById("app").innerHTML = html;

setTimeout(function() { renderVList(); }, 100);

requestAnimationFrame(function() {
  var screen = document.querySelector(".screen");
  if (screen) { screen.classList.remove("fade-in"); void screen.offsetWidth; screen.classList.add("fade-in"); }
});
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
    
    db.ref("employees/" + emp.id + "/note").set(note)
        .then(() => {
            const empRef = employees.find(e => String(e.id) === String(emp.id));
            if (empRef) empRef.note = note;
            saveEmployees();
            
            showModal("Note Saved", "✅ یادداشت ذخیره شد!", "success");
        })
        .catch(err => {
            showModal("Error", "❌ خطا در ذخیره: " + err.message, "error");
        });
}
function saveNoteAdmin(empId) {
    const note = document.getElementById('noteTextAdmin').value;
    
    db.ref("employees/" + empId + "/note").set(note)
        .then(() => {
            showModal("Note Saved", "✅ یادداشت ذخیره شد!", "success");
            showAdminPage();
        })
        .catch(err => {
            showModal("Error", "❌ " + err.message, "error");
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
  const dashboardData = {
    title: document.getElementById('dashTitle').value || "📊 MASTERCARD COMMERZBANK",
    employeesLabel: document.getElementById('dashEmployees').value || "Employees",
    balanceLabel: document.getElementById('dashBalance').value || "Total Balance",
    transactionsLabel: document.getElementById('dashTransactions').value || "Today Transactions",
    onlineLabel: document.getElementById('dashOnline').value || "Online",
    offlineLabel: document.getElementById('dashOffline').value || "Offline",
    rankLabel: document.getElementById('dashRank').value || "Your Rank",
    scoreLabel: document.getElementById('dashScore').value || "Today Score"
  };

  db.ref("employees/" + empId + "/dashboard").set(dashboardData)
    .then(() => {
      showModal("Dashboard", "Dashboard saved!", "success");
      showAdminPage();
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
function card(emp, isAdmin) {
  const docs = emp.documents || {};
  const transactions = emp.transactions || [];

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

        <button onclick="toggleWheelLock('${emp.id}')" style="
          width:100%;
          margin-top:6px;
          padding:10px;
          background:${emp.wheelLocked ? 'rgba(255,82,82,0.2)' : 'rgba(0,255,136,0.2)'};
          border:1px solid ${emp.wheelLocked ? 'rgba(255,82,82,0.4)' : 'rgba(0,255,136,0.4)'};
          color:${emp.wheelLocked ? '#ff5252' : '#00ff88'};
          border-radius:10px;
          font-weight:bold;
          cursor:pointer;
        ">
          ${emp.wheelLocked ? '🔒 WHEEL LOCKED' : '🔓 WHEEL OPEN'}
        </button>

        <button onclick="toggleLoginLock('${emp.id}')" style="
          width:100%;
          margin-top:6px;
          padding:10px;
          background:${emp.loginLocked ? 'rgba(255,82,82,0.2)' : 'rgba(0,200,255,0.2)'};
          border:1px solid ${emp.loginLocked ? 'rgba(255,82,82,0.4)' : 'rgba(0,200,255,0.4)'};
          color:${emp.loginLocked ? '#ff5252' : '#00c8ff'};
          border-radius:10px;
          font-weight:bold;
          cursor:pointer;
        ">
          ${emp.loginLocked ? '🔒 LOGIN LOCKED' : '🔓 LOGIN OPEN'}
        </button>
        
        <div style="margin-top:8px; padding:8px; border-radius:10px; background:rgba(255,0,0,0.05); border:1px solid rgba(255,0,0,0.1);">
          <div style="font-size:10px; color:rgba(255,255,255,0.5); letter-spacing:2px; margin-bottom:6px; text-align:center;">🛡️ FIREWALL CONTROL</div>
          <button onclick="triggerAttack('${emp.id}')" style="width:100%; padding:8px; background:#ff5252; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:5px;">🔥 START ATTACK</button>
          <button onclick="defendSystem('${emp.id}')" style="width:100%; padding:8px; background:#00c853; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🛡️ DEFEND</button>
        </div>

        <div style="margin-top:8px; padding:8px; border-radius:10px; background:rgba(0,188,212,0.05); border:1px solid rgba(0,188,212,0.1);">
          <div style="font-size:10px; color:rgba(255,255,255,0.5); letter-spacing:2px; margin-bottom:6px; text-align:center;">🌍 VERIFICATION CONTROL</div>
          
          <button onclick="assignVerificationCode('${emp.id}')" style="width:100%; padding:8px; background:#00bcd4; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:5px;">🔑 ASSIGN CODE</button>
          
          <button onclick="toggleVerificationLock('${emp.id}')" style="width:100%; padding:8px; background:${emp.verification?.locked ? '#4caf50' : '#ff5252'}; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:5px;">
            ${emp.verification?.locked ? '🔓 UNLOCK VERIFICATION' : '🔒 LOCK VERIFICATION'}
          </button>
          
          <button onclick="togglePhoneLock('${emp.id}')" style="width:100%; padding:8px; background:${emp.verification?.phoneLocked ? '#ff9800' : '#4caf50'}; color:${emp.verification?.phoneLocked ? '#000' : '#fff'}; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:5px;">
            ${emp.verification?.phoneLocked ? '🔓 UNLOCK PHONE' : '📱 PHONE: UNLOCKED'}
          </button>
          
          <button onclick="resetVerification('${emp.id}')" style="width:100%; padding:8px; background:#ff9800; color:#000; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🔄 RESET VERIFICATION</button>
          
          ${emp.verification?.phone ? `
            <div style="margin-top:6px; font-size:10px; color:rgba(255,255,255,0.5);">
              📱 Phone: ${emp.verification.phone} ${emp.verification.phoneVerified ? '✅' : '❌'} ${emp.verification.phoneLocked ? '🔒' : '🔓'}
            </div>
          ` : ''}
          ${emp.verification?.countries ? `
            <div style="margin-top:3px; font-size:10px; color:rgba(255,255,255,0.5);">
              📋 Verified: ${Object.keys(emp.verification.countries).join(', ') || 'None'}
            </div>
          ` : ''}
          <div style="font-size:10px; color:rgba(255,255,255,0.3); margin-top:3px;">🔢 Codes Used: ${emp.verification?.codeCount || 0} / 3</div>
        </div>

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

      ${docs && (docs.lineName || docs.lineCode || docs.price || (docs.files && docs.files.length > 0)) ? `
        <div style="margin-top:15px; padding:12px; background:rgba(255,215,0,0.05); border-radius:12px; border:1px solid rgba(255,215,0,0.1);">
          <div style="color:#ffd700; font-size:13px; font-weight:bold; margin-bottom:8px;">📄 Documents</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:12px;">
            ${docs.lineName ? `<div><span style="opacity:0.6;">Name:</span> ${docs.lineName}</div>` : ''}
            ${docs.lineCode ? `<div><span style="opacity:0.6;">Code:</span> ${docs.lineCode}</div>` : ''}
            ${docs.price ? `<div><span style="opacity:0.6;">Price:</span> ${docs.price} €</div>` : ''}
            ${docs.files && docs.files.length > 0 ? `<div><span style="opacity:0.6;">Files:</span> ${docs.files.length}</div>` : ''}
          </div>
        </div>
      ` : ''}

      ${transactions.length > 0 ? `
        <div style="margin-top:10px; padding:12px; background:rgba(0,255,136,0.03); border-radius:12px; border:1px solid rgba(0,255,136,0.08);">
          <div style="color:#00ff88; font-size:13px; font-weight:bold; margin-bottom:8px;">📊 Last Transactions (${transactions.length})</div>
          <div style="max-height:120px; overflow-y:auto; font-size:11px;">
            ${transactions.slice(-5).reverse().map(t => `
              <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span>${t.date || ''} ${t.time || ''}</span>
                <span style="color:${t.amount < 0 ? '#ff5252' : '#00e676'}; font-weight:bold;">${t.amount < 0 ? '-' : '+'}${Math.abs(t.amount)} €</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

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

    // ===== اگر فیلد مربوط به documents باشه =====
    if (field === 'lineCode' || field === 'lineName' || field === 'price' || field === 'lineEnabled') {
        if (!emp.documents) emp.documents = {};
        emp.documents[field] = value;
    } else {
        // فیلدهای معمولی
        emp[field] = value;
    }

    // ===== ذخیره در دیتابیس =====
    saveEmployees();

    console.log("✅ Updated:", emp);
}
function saveEmployees() {
  localStorage.setItem("employees", JSON.stringify(employees));

  employees.forEach(emp => {
    if (emp && emp.id) {
      // فقط balance، transactions و status رو آپدیت کن
      db.ref("employees/" + emp.id).update({
        balance: emp.balance || 0,
        status: emp.status || "OFFLINE",
        transactions: emp.transactions || [],
        lastUpdated: Date.now()
      });
    }
  });
}

function addEmployee() {
  document.getElementById("app").innerHTML = `
    <div style="min-height:100vh; background:linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); display:flex; flex-direction:column; justify-content:flex-start; align-items:center; font-family:Consolas, monospace; padding:20px; overflow-y:auto; padding-top:40px; padding-bottom:100px;">align-items:center; font-family:Consolas, monospace; padding:20px; overflow-y:auto;">
      <div style="
        background:rgba(0,0,0,0.7);
        backdrop-filter:blur(25px);
        -webkit-backdrop-filter:blur(25px);
        border:1px solid rgba(0,255,136,0.2);
        border-radius:20px;
        padding:25px 20px;
        width:90%;
        max-width:350px;
        box-shadow:0 0 40px rgba(0,255,136,0.08);
      ">
        <div style="font-size:14px; color:rgba(255,255,255,0.5); letter-spacing:3px; text-align:center; margin-bottom:20px;">
          ⚠️ Mastercard System - Add Employee
        </div>
        <input id="addName" placeholder="Full Name" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        <input id="addPhone" placeholder="Phone Number" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        <input id="addPassport" placeholder="Passport/ID Code" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        <input id="addSalary" placeholder="Salary" value="0" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        <input id="addIban" placeholder="IBAN" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        <input id="addCard" placeholder="Card Number" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        <input id="addAccount" placeholder="Account Number" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        <input id="addExpiry" placeholder="Expiry (e.g. 12/30)" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        <input id="addCcv2" placeholder="CCV2" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        <input id="addZip" placeholder="ZIP Code" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        <input id="addPass" placeholder="Password (min 6 chars)" type="password" value="123456" style="width:100%; padding:12px; margin-bottom:15px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:Consolas; outline:none; box-sizing:border-box;">
        
        <button onclick="saveNewEmployee()" style="width:100%; padding:14px; border-radius:12px; border:1px solid rgba(0,255,136,0.3); background:rgba(0,255,136,0.1); color:#00ff88; font-size:14px; font-weight:bold; cursor:pointer; letter-spacing:2px; margin-bottom:10px;">💾 SAVE EMPLOYEE</button>
        <button onclick="showUI()" style="width:100%; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5); cursor:pointer;">← BACK</button>
      </div>
    </div>
  `;
}

function saveNewEmployee() {
  const name = document.getElementById("addName").value.trim();
  if (!name) return showModal("Add Employee", "Name is required!", "error");
  
  const phone = document.getElementById("addPhone").value.trim();
  if (!phone) return showModal("Add Employee", "Phone is required!", "error");
  
  const passport = document.getElementById("addPassport").value.trim();
  if (!passport) return showModal("Add Employee", "Passport is required!", "error");
  
  const salary = document.getElementById("addSalary").value.trim() || "0";
  const iban = document.getElementById("addIban").value.trim() || "IR000000000000000000000000";
  const cardNumber = document.getElementById("addCard").value.trim() || "0000-0000-0000-0000";
  const account = document.getElementById("addAccount").value.trim() || "000000000000000000000000";
  const expiry = document.getElementById("addExpiry").value.trim() || "12/30";
  const ccv2 = document.getElementById("addCcv2").value.trim() || "000";
  const zip = document.getElementById("addZip").value.trim() || "0000000000";
  const pass = document.getElementById("addPass").value.trim() || "123456";
  
  if (pass.length < 6) return showModal("Add Employee", "Password must be at least 6 characters!", "error");
  
  const newId = String(Date.now());
  const email = newId + "@employee-app.com";
  
  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => {
      const newEmployee = {
        id: newId, passport, name, salary, iban, cardNumber, account,
        status: "OFFLINE", expiry, ccv2, zip, phone,
        balance: 0,
        documents: { lineEnabled: false, lineName: "", lineCode: "", expiryStart: Date.now(), files: [], price: "" },
        sidebarMedia: { images: [] },
        transactions: []
      };
      return db.ref("employees/" + newId).set(newEmployee);
    })
    .then(() => {
      employees.push({ id: newId, passport, name, phone, balance: 0 });
      localStorage.setItem("employees", JSON.stringify(employees));
      showModal("Add Employee", "Employee added successfully!", "success");
      showUI();
    })
    .catch(error => {
      if (error.code === 'auth/email-already-in-use') showModal("Add Employee", "User already exists!", "error");
      else if (error.code === 'auth/weak-password') showModal("Add Employee", "Password too weak!", "error");
      else showModal("Add Employee Error", error.message, "error");
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
  showModal("Telegram", "This section is currently unavailable.", "warning");
}
/* ================= UTIL ================= */

function v(id) {
  return document.getElementById(id)?.value?.trim();
}

function openWalletPage() {

  pushPage(openWalletPage);

  document.getElementById("app").innerHTML = `
    <div class="screen">
      <img src="images/wallet-bg.png" class="bg-full">

      <div class="overlay" style="text-align:center;">

        <div style="
          background:rgba(0,0,0,0.75);
          backdrop-filter:blur(20px);
          -webkit-backdrop-filter:blur(20px);
          border:1.5px solid rgba(255,215,0,0.35);
          border-radius:20px;
          padding:30px 20px;
          width:85%;
          max-width:350px;
          box-shadow:0 0 40px rgba(255,215,0,0.1);
        ">

          <h2 style="color:#ffd700; font-family:Consolas; letter-spacing:2px; text-shadow:0 0 20px rgba(255,215,0,0.4); margin-bottom:15px;">💰 USDT Payment</h2>

          <p style="color:#ffd700; font-family:Consolas; font-size:13px; letter-spacing:1px; margin-bottom:10px;">Send USDT (TRC20) to this address:</p>

          <input id="walletAddress"
            value="TCTvRJwQZEVtUz8Ai9ZjxRVjChzezs1DXN"
            readonly
            onclick="this.select()"
            style="
              color:#ffd700;
              font-family:Consolas;
              font-size:12px;
              text-align:center;
              background:rgba(0,0,0,0.6);
              border:1.5px solid rgba(255,215,0,0.4);
              padding:12px;
              border-radius:10px;
              width:90%;
              margin-bottom:15px;
              word-break:break-all;
            ">

          <button onclick="copyAddress()" style="
  padding:12px 30px;
  border-radius:25px;
  border:1.5px solid rgba(255,215,0,0.4);
  background:rgba(255,215,0,0.15);
  color:#ffd700;
  font-weight:bold;
  cursor:pointer;
  letter-spacing:1px;
  margin-bottom:15px;
">📋 Copy</button>

          <button onclick="history.back()" style="
            padding:10px 25px;
            border-radius:20px;
            border:1.5px solid rgba(255,255,255,0.3);
            background:rgba(255,255,255,0.08);
            color:rgba(255,255,255,0.7);
            cursor:pointer;
          ">← Back</button>

        </div>

      </div>
    </div>
  `;
}

function openBitcoinPage() {
  pushPage(openBitcoinPage);

  document.getElementById("app").innerHTML = `
    <div class="screen">
      <img src="images/bitcoin-bg.png" class="bg-full">

      <div class="overlay" style="text-align:center;">

        <div style="
          background:rgba(0,0,0,0.75);
          backdrop-filter:blur(20px);
          -webkit-backdrop-filter:blur(20px);
          border:1.5px solid rgba(255,152,0,0.35);
          border-radius:20px;
          padding:30px 20px;
          width:85%;
          max-width:350px;
          box-shadow:0 0 40px rgba(255,152,0,0.1);
        ">

          <h2 style="color:#ff9800; font-family:Consolas; letter-spacing:2px; text-shadow:0 0 20px rgba(255,152,0,0.4); margin-bottom:15px;">₿ Bitcoin Payment</h2>

          <p style="color:#ff9800; font-family:Consolas; font-size:13px; letter-spacing:1px; margin-bottom:10px;">Send Bitcoin (BTC) to this address:</p>

          <input id="bitcoinAddress"
            value="bc1qtyygpvlleleyc8sqhhp9cq4np06gpaxupqeau4"
            readonly
            onclick="this.select()"
            style="
              color:#ff9800;
              font-family:Consolas;
              font-size:12px;
              text-align:center;
              background:rgba(0,0,0,0.6);
              border:1.5px solid rgba(255,152,0,0.4);
              padding:12px;
              border-radius:10px;
              width:90%;
              margin-bottom:15px;
              word-break:break-all;
            ">

         <button onclick="copyBitcoinAddress()" style="
  padding:12px 30px;
  border-radius:25px;
  border:1.5px solid rgba(255,152,0,0.4);
  background:rgba(255,152,0,0.15);
  color:#ff9800;
  font-weight:bold;
  cursor:pointer;
  letter-spacing:1px;
  margin-bottom:15px;
">📋 Copy</button>
          <button onclick="history.back()" style="
            padding:10px 25px;
            border-radius:20px;
            border:1.5px solid rgba(255,255,255,0.3);
            background:rgba(255,255,255,0.08);
            color:rgba(255,255,255,0.7);
            cursor:pointer;
          ">← Back</button>

        </div>

      </div>
    </div>
  `;
}

let exchangeInterval = null;

function openExchangePage() {
  pushPage(openExchangePage);
  
  if (exchangeInterval) clearInterval(exchangeInterval);
  
  document.getElementById("app").innerHTML = `
    <div class="screen">
      <img src="images/exchange-bg.png" class="bg-full">
      <div class="overlay" style="text-align:center;">
        <div style="
          background:rgba(0,0,0,0.75);
          backdrop-filter:blur(20px);
          -webkit-backdrop-filter:blur(20px);
          border:1.5px solid rgba(0,200,255,0.35);
          border-radius:20px;
          padding:25px 20px;
          width:85%;
          max-width:350px;
          box-shadow:0 0 40px rgba(0,200,255,0.1);
        ">
          <h2 style="color:#00c8ff; font-family:Consolas; letter-spacing:2px; text-shadow:0 0 20px rgba(0,200,255,0.4); margin-bottom:15px;">💱 Live Exchange</h2>
          
          <div id="exchangeRates" style="text-align:center;">
            <div style="color:rgba(255,255,255,0.4); font-size:12px;">⏳ Loading...</div>
          </div>
          
          <a href="https://www.navasan.net" target="_blank" style="
            display:block;
            margin-top:12px;
            padding:10px;
            border-radius:10px;
            border:1px solid rgba(0,200,255,0.3);
            background:rgba(0,200,255,0.08);
            color:#00c8ff;
            text-decoration:none;
            font-size:11px;
            letter-spacing:1px;
          ">📡 Live Rates on Navasan →</a>
          
          <button onclick="history.back()" style="
            margin-top:12px;
            padding:10px 25px;
            border-radius:20px;
            border:1.5px solid rgba(255,255,255,0.3);
            background:rgba(255,255,255,0.08);
            color:rgba(255,255,255,0.7);
            cursor:pointer;
          ">← Back</button>
        </div>
      </div>
    </div>
  `;
  
  fetchExchangeRates();
  exchangeInterval = setInterval(fetchExchangeRates, 30000);
}

async function fetchExchangeRates() {
  const el = document.getElementById("exchangeRates");
  if (!el) return;
  
  // اول از Firebase بخون
  try {
    const snap = await db.ref("employees/admin/exchangeRates").once("value");
    const rates = snap.val();
    
    if (rates && rates.usd) {
      showRates(el, rates);
      return;
    }
  } catch(e) {}
  
  // fallback به localStorage
  const saved = localStorage.getItem("exchangeRates");
  if (saved) {
    showRates(el, JSON.parse(saved));
    return;
  }
  
  el.innerHTML = `<div style="color:rgba(255,255,255,0.4);">💱 Rates not set yet</div>`;
}

function showRates(el, rates) {
  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; justify-content:space-between; padding:10px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);">
        <span>🇺🇸 USD</span>
        <span style="color:#00ff88; font-weight:bold;">${rates.usd} T</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:10px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);">
        <span>🇪🇺 EUR</span>
        <span style="color:#00ff88; font-weight:bold;">${rates.eur} T</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:10px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);">
        <span>🇬🇧 GBP</span>
        <span style="color:#00ff88; font-weight:bold;">${rates.gbp} T</span>
      </div>
      <div style="font-size:9px; color:rgba(255,255,255,0.3); text-align:center;">📡 Admin Updated</div>
    </div>
  `;
}
function openExchangeAdmin() {
  document.getElementById("app").innerHTML = `
    <div class="screen">
      <img src="images/employee-bg.png" class="bg-full">
      <div class="panel" style="padding:20px; text-align:center;">
        <h3 style="color:#00c8ff; margin-bottom:20px;">💱 Set Exchange Rates</h3>
        <input id="adminUsd" value="85000" placeholder="USD (Toman)" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(0,200,255,0.3); background:rgba(0,0,0,0.5); color:white; text-align:center; font-size:16px;">
        <input id="adminEur" value="95000" placeholder="EUR (Toman)" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(0,200,255,0.3); background:rgba(0,0,0,0.5); color:white; text-align:center; font-size:16px;">
        <input id="adminGbp" value="110000" placeholder="GBP (Toman)" style="width:100%; padding:12px; margin-bottom:15px; border-radius:10px; border:1px solid rgba(0,200,255,0.3); background:rgba(0,0,0,0.5); color:white; text-align:center; font-size:16px;">
        <button onclick="saveExchangeRates()" style="width:100%; padding:14px; border-radius:12px; border:none; background:#00c8ff; color:white; font-weight:bold; cursor:pointer;">💾 Save Rates</button>
        <button onclick="showUI()" style="width:100%; padding:12px; margin-top:10px; border-radius:12px; border:1px solid rgba(255,255,255,0.2); background:transparent; color:white; cursor:pointer;">← Back</button>
      </div>
    </div>
  `;
}

function saveExchangeRates() {
  const usd = document.getElementById("adminUsd").value;
  const eur = document.getElementById("adminEur").value;
  const gbp = document.getElementById("adminGbp").value;
  
  // ذخیره توی employees زیر مجموعه admin
  db.ref("employees/admin/exchangeRates").set({ usd, eur, gbp })
    .then(() => {
      alert("✅ Rates updated!");
      showUI();
    })
    .catch(err => {
      // fallback به localStorage
      localStorage.setItem("exchangeRates", JSON.stringify({ usd, eur, gbp }));
      alert("✅ Rates saved locally!");
      showUI();
    });
}

function openNearbyBanks() {
  // pushPage(openNearbyBanks); ← این خط حذف شد!

  document.getElementById("app").innerHTML = `
    <div class="screen">
      <img src="images/nearby-bg.png" class="bg-full">
      <div class="overlay" style="text-align:center;">
        <div style="
          background:rgba(0,0,0,0.75);
          backdrop-filter:blur(20px);
          -webkit-backdrop-filter:blur(20px);
          border:1.5px solid rgba(100,200,255,0.35);
          border-radius:20px;
          padding:25px 20px;
          width:85%;
          max-width:350px;
          box-shadow:0 0 40px rgba(100,200,255,0.1);
        ">
          <h2 style="color:#64c8ff; font-family:Consolas; letter-spacing:2px; text-shadow:0 0 20px rgba(100,200,255,0.4); margin-bottom:15px;">📍 What are you looking for?</h2>
          
          <div id="categoryMenu" style="display:flex; flex-direction:column; gap:10px;">
            <button onclick="searchNearby('bank')" style="padding:12px; border-radius:10px; border:1px solid rgba(100,200,255,0.3); background:rgba(100,200,255,0.1); color:white; cursor:pointer;">🏦 Bank</button>
            <button onclick="searchNearby('exchange')" style="padding:12px; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(255,215,0,0.1); color:white; cursor:pointer;">💱 Exchange</button>
            <button onclick="searchNearby('restaurant')" style="padding:12px; border-radius:10px; border:1px solid rgba(255,82,82,0.3); background:rgba(255,82,82,0.1); color:white; cursor:pointer;">🍽️ Restaurant</button>
            <button onclick="searchNearby('metro')" style="padding:12px; border-radius:10px; border:1px solid rgba(0,255,136,0.3); background:rgba(0,255,136,0.1); color:white; cursor:pointer;">🚇 Metro</button>
            <button onclick="searchNearby('shop')" style="padding:12px; border-radius:10px; border:1px solid rgba(156,39,176,0.3); background:rgba(156,39,176,0.1); color:white; cursor:pointer;">🛍️ Shopping</button>
            <button onclick="searchNearby('tourism')" style="padding:12px; border-radius:10px; border:1px solid rgba(255,152,0,0.3); background:rgba(255,152,0,0.1); color:white; cursor:pointer;">🕌 Sightseeing</button>
          </div>
          
          <button onclick="${currentUser?.type === 'admin' ? 'showAdminPage()' : 'showPage1()'}" style="
            margin-top:15px;
            padding:10px 25px;
            border-radius:20px;
            border:1.5px solid rgba(255,255,255,0.3);
            background:rgba(255,255,255,0.08);
            color:rgba(255,255,255,0.7);
            cursor:pointer;
          ">← Back</button>
        </div>
      </div>
    </div>
  `;
}

async function searchNearby(category) {
  const resultsDiv = document.getElementById("categoryMenu");
  if (!resultsDiv) return;

  resultsDiv.innerHTML = `<div style="color:#64c8ff; padding:20px;">🔍 Searching nearby ${category}...</div>`;

  // ۱. گرفتن موقعیت کاربر
  const getPosition = () => new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 41.0082, lng: 28.9784 }); // پیش‌فرض استانبول
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: 41.0082, lng: 28.9784 })
    );
  });

  const { lat, lng } = await getPosition();

  // ۲. ساخت کوئری بر اساس دسته‌بندی
  let amenity = "";
  if (category === "bank") amenity = `node["amenity"="bank"]`;
  else if (category === "exchange") amenity = `node["amenity"="bureau_de_change"]`;
  else if (category === "restaurant") amenity = `node["amenity"="restaurant"]`;
  else if (category === "metro") amenity = `node["railway"="subway_entrance"]`;
  else if (category === "shop") amenity = `node["shop"="mall"]`;
  else if (category === "tourism") amenity = `node["tourism"="attraction"]`;

  const query = `[out:json];(${amenity}(around:5000, ${lat}, ${lng}););out 10;`;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
    const data = await response.json();

    if (data.elements.length > 0) {
      const places = data.elements.map(el => ({
        name: el.tags.name || category,
        lat: el.lat,
        lng: el.lon,
        distance: getDistanceFromLatLon(lat, lng, el.lat, el.lon)
      }));

      places.sort((a, b) => a.distance - b.distance);

      let html = `<div style="font-size:10px; color:rgba(255,255,255,0.4); margin-bottom:10px;">📍 Found ${places.length} places near you</div>`;
      places.forEach(place => {
        html += `
          <div onclick="window.open('https://www.google.com/maps?q=${place.lat},${place.lng}', '_blank')" style="display:flex; justify-content:space-between; align-items:center; padding:10px; margin-bottom:6px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer;">
            <div style="text-align:left;">
              <div style="color:white; font-size:12px; font-weight:bold;">${place.name}</div>
            </div>
            <div style="color:#64c8ff; font-size:11px; font-weight:bold;">📍 ${place.distance} km</div>
          </div>
        `;
      });

      resultsDiv.innerHTML = html + `<button onclick="openNearbyBanks()" style="width:100%; margin-top:15px; padding:10px; border-radius:20px; background:rgba(100,200,255,0.1); color:white; border:1px solid rgba(100,200,255,0.3); cursor:pointer;">← Back to Menu</button>`;
      return;
    }
  } catch (e) {}

  // ۳. اگر API چیزی پیدا نکرد یا خطا داد، لیست پیش‌فرض استانبول
  const fallbackPlaces = {
    bank: [
      { name: "🏦 İş Bankası", lat: 41.0082, lng: 28.9784 },
      { name: "🏦 Ziraat Bankası", lat: 41.0100, lng: 28.9750 },
      { name: "🏦 Garanti BBVA", lat: 41.0120, lng: 28.9700 }
    ],
    exchange: [
      { name: "💱 Harem Döviz", lat: 41.0090, lng: 28.9800 },
      { name: "💱 Altınbaş Döviz", lat: 41.0115, lng: 28.9770 },
      { name: "💱 Kapalıçarşı Döviz", lat: 41.0105, lng: 28.9680 }
    ],
    restaurant: [
      { name: "🍽️ Nusr-Et Steakhouse", lat: 41.0085, lng: 28.9795 },
      { name: "🍽️ Çiya Sofrası", lat: 41.0250, lng: 28.9750 },
      { name: "🍽️ Mikla Restaurant", lat: 41.0310, lng: 28.9830 }
    ],
    metro: [
      { name: "🚇 Taksim Metro", lat: 41.0369, lng: 28.9850 },
      { name: "🚇 Sultanahmet Tram", lat: 41.0050, lng: 28.9770 },
      { name: "🚇 Levent Metro", lat: 41.0780, lng: 29.0150 }
    ],
    shop: [
      { name: "🛍️ İstinye Park", lat: 41.1100, lng: 29.0350 },
      { name: "🛍️ Cevahir Mall", lat: 41.0620, lng: 28.9980 },
      { name: "🛍️ Zorlu Center", lat: 41.0680, lng: 29.0170 }
    ],
    tourism: [
      { name: "🕌 Galata Tower", lat: 41.0256, lng: 28.9741 },
      { name: "🕌 Hagia Sophia", lat: 41.0086, lng: 28.9802 },
      { name: "🕌 Topkapi Palace", lat: 41.0115, lng: 28.9833 }
    ]
  };

  const places = (fallbackPlaces[category] || []).map(p => ({
    ...p,
    distance: getDistanceFromLatLon(lat, lng, p.lat, p.lng)
  }));

  places.sort((a, b) => a.distance - b.distance);

  let html = `<div style="font-size:10px; color:rgba(255,255,255,0.4); margin-bottom:10px;">📍 Istanbul - Recommended ${category}s</div>`;
  places.forEach(place => {
    html += `
      <div onclick="window.open('https://www.google.com/maps?q=${place.lat},${place.lng}', '_blank')" style="display:flex; justify-content:space-between; align-items:center; padding:10px; margin-bottom:6px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer;">
        <div style="text-align:left;">
          <div style="color:white; font-size:12px; font-weight:bold;">${place.name}</div>
        </div>
        <div style="color:#64c8ff; font-size:11px; font-weight:bold;">📍 ${place.distance} km</div>
      </div>
    `;
  });

  resultsDiv.innerHTML = html + `<button onclick="openNearbyBanks()" style="width:100%; margin-top:15px; padding:10px; border-radius:20px; background:rgba(100,200,255,0.1); color:white; border:1px solid rgba(100,200,255,0.3); cursor:pointer;">← Back to Menu</button>`;
}
// تابع محاسبه فاصله (Haversine formula)
let vaultData = { btc: "0.04728471", usdt: "12847.00" };
let vaultBtcPrice = 82000;
let vaultBtcChange = 1.73;
let vaultUsdtPrice = 1.00;
let vaultUsdtChange = 0.01;
let chartData = [];

function openVaultWallet() {
  if (!currentUser || currentUser.type !== "admin") return;
  pushPage(openVaultWallet);
  
  const saved = localStorage.getItem("vaultData");
  if (saved) vaultData = JSON.parse(saved);
  
  // تولید داده‌های فیک برای نمودار
  generateChartData();
  
  document.getElementById("app").innerHTML = `
    <div style="min-height:100vh; background:linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%); font-family:Consolas; color:white; padding:20px; overflow-y:auto; box-sizing:border-box;">
      
      <div style="text-align:center; margin-bottom:20px;">
        <div style="font-size:10px; color:rgba(255,215,0,0.4); letter-spacing:4px;">MASTERCARD VAULT</div>
        <div style="font-size:8px; color:rgba(255,255,255,0.2); margin-top:3px;">⚠️ Admin Only - Secured</div>
      </div>
      
      <div style="text-align:center; margin-bottom:15px; padding:15px; border-radius:20px; background:rgba(255,215,0,0.03); border:1.5px solid rgba(255,215,0,0.12); box-shadow:0 0 30px rgba(255,215,0,0.05);">
        <div style="font-size:9px; color:rgba(255,255,255,0.3); letter-spacing:3px; margin-bottom:8px;">TOTAL PORTFOLIO</div>
        <div style="font-size:36px; font-weight:bold; color:#ffd700; text-shadow:0 0 25px rgba(255,215,0,0.3); letter-spacing:2px;" id="vaultTotal">$0.00</div>
        <div style="font-size:10px; color:rgba(255,255,255,0.3); margin-top:5px;">Bitcoin + Tether</div>
      </div>
      
      <!-- نمودار قیمت -->
      <div style="margin-bottom:15px; padding:15px; border-radius:15px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05);">
        <div style="display:flex; justify-content:center; gap:15px; margin-bottom:10px;">
          <button class="chartBtn" onclick="changeChartRange('1H', this)" style="font-size:10px; color:rgba(255,255,255,0.4); background:none; border:none; cursor:pointer;">1H</button>
          <button class="chartBtn" onclick="changeChartRange('1D', this)" style="font-size:10px; color:#ffd700; background:none; border:none; cursor:pointer;">1D</button>
          <button class="chartBtn" onclick="changeChartRange('1W', this)" style="font-size:10px; color:rgba(255,255,255,0.4); background:none; border:none; cursor:pointer;">1W</button>
          <button class="chartBtn" onclick="changeChartRange('1M', this)" style="font-size:10px; color:rgba(255,255,255,0.4); background:none; border:none; cursor:pointer;">1M</button>
          <button class="chartBtn" onclick="changeChartRange('1Y', this)" style="font-size:10px; color:rgba(255,255,255,0.4); background:none; border:none; cursor:pointer;">1Y</button>
        </div>
        <canvas id="vaultChart" width="300" height="150" style="width:100%; border-radius:10px;"></canvas>
      </div>
      
      <div style="margin-bottom:12px; padding:18px; border-radius:18px; background:rgba(247,147,26,0.04); border:1.5px solid rgba(247,147,26,0.15);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:40px; height:40px; border-radius:50%; background:rgba(247,147,26,0.2); display:flex; align-items:center; justify-content:center; font-size:20px;">₿</div>
            <div>
              <div style="font-size:14px; font-weight:bold;">Bitcoin</div>
              <div style="font-size:10px; color:rgba(255,255,255,0.3);">BTC</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:16px; font-weight:bold; color:#f7931a;" id="vaultBtc">${vaultData.btc} BTC</div>
            <div style="font-size:10px; color:rgba(247,147,26,0.6);" id="vaultBtcUsd">≈ $0.00</div>
            <div id="btcChange" style="font-size:9px;"></div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom:20px; padding:18px; border-radius:18px; background:rgba(0,200,83,0.04); border:1.5px solid rgba(0,200,83,0.15);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:40px; height:40px; border-radius:50%; background:rgba(0,200,83,0.2); display:flex; align-items:center; justify-content:center; font-size:20px;">💵</div>
            <div>
              <div style="font-size:14px; font-weight:bold;">Tether</div>
              <div style="font-size:10px; color:rgba(255,255,255,0.3);">USDT</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:16px; font-weight:bold; color:#00c853;" id="vaultUsdt">${vaultData.usdt} USDT</div>
            <div style="font-size:10px; color:rgba(0,200,83,0.6);" id="vaultUsdtUsd">≈ $0.00</div>
            <div id="usdtChange" style="font-size:9px;"></div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom:20px;">
        <div style="margin-bottom:10px; padding:12px; border-radius:12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:9px; color:rgba(255,255,255,0.3); margin-bottom:5px;">🔑 BTC Address</div>
          <div style="font-size:10px; color:rgba(247,147,26,0.7); word-break:break-all;">bc1qtyygpvlleleyc8sqhhp9cq4np06gpaxupqeau4</div>
        </div>
        <div style="padding:12px; border-radius:12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:9px; color:rgba(255,255,255,0.3); margin-bottom:5px;">🔑 USDT Address (TRC20)</div>
          <div style="font-size:10px; color:rgba(0,200,83,0.7); word-break:break-all;">TCTvRJwQZEVtUz8Ai9ZjxRVjChzezs1DXN</div>
        </div>
      </div>
      
      <div style="text-align:center; padding:12px; border-radius:12px; background:rgba(0,255,136,0.02); border:1px solid rgba(0,255,136,0.08); margin-bottom:15px;">
        <div style="font-size:9px; color:rgba(0,255,136,0.4); letter-spacing:2px;">🛡️ PROTECTED BY MASTERCARD SYSTEM</div>
      </div>
      
      <button onclick="showAdminPage()" style="width:100%; padding:8px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); color:rgba(255,255,255,0.3); font-size:10px; cursor:pointer;">← Back</button>
    </div>
  `;
  
  updateVaultDisplay();
  fetchCryptoPrices();
  setTimeout(() => drawVaultChart(30), 300);
}

function generateChartData() {
  chartData = [];
  let price = vaultBtcPrice;
  for (let i = 0; i < 365; i++) {
    price = price * (1 + (Math.random() - 0.48) * 0.05);
    chartData.push(price);
  }
}

function changeChartRange(range, btn) {
  document.querySelectorAll(".chartBtn").forEach(b => b.style.color = "rgba(255,255,255,0.4)");
  btn.style.color = "#ffd700";
  
  const ranges = { "1H": 60, "1D": 24, "1W": 7, "1M": 30, "1Y": 365 };
  drawVaultChart(ranges[range] || 30);
}

function drawVaultChart(points) {
  const canvas = document.getElementById("vaultChart");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  canvas.width = 300;
  canvas.height = 150;
  
  // تولید داده‌های واقعی‌تر با الگوی بازار
  const data = [];
  let price = vaultBtcPrice * 0.92;
  const total = points;
  let trend = 0;
  let volatility = 0.03;
  
  for (let i = 0; i < total; i++) {
    // تغییر روند هر ۲۰٪ از داده‌ها (مثل بازار واقعی)
    if (i % Math.floor(total * 0.2) === 0) {
      trend = (Math.random() - 0.4) * 0.04;
      volatility = 0.02 + Math.random() * 0.04;
    }
    
    // نوسان تصادفی با توزیع نرمال تقریبی
    const swing = (Math.random() + Math.random() + Math.random() - 1.5) * volatility;
    
    // روند صعودی ملایم در کل
    const upwardBias = 0.001;
    
    price = price * (1 + swing + trend + upwardBias);
    data.push(price);
  }
  
  // نرمال‌سازی به قیمت واقعی
  const lastPrice = data[data.length - 1];
  const ratio = vaultBtcPrice / lastPrice;
  const normalized = data.map(p => p * ratio);
  
  const min = Math.min(...normalized) * 0.97;
  const max = Math.max(...normalized) * 1.02;
  const range = max - min;
  
  ctx.clearRect(0, 0, 300, 150);
  
  // گرادینت زیر نمودار - شبیه TradingView
  const gradient = ctx.createLinearGradient(0, 0, 0, 150);
  gradient.addColorStop(0, "rgba(0,200,83,0.08)");
  gradient.addColorStop(0.6, "rgba(0,200,83,0.02)");
  gradient.addColorStop(1, "rgba(0,200,83,0)");
  
  ctx.beginPath();
  ctx.moveTo(0, 150);
  
  normalized.forEach((val, i) => {
    const x = (i / (normalized.length - 1)) * 300;
    const y = 150 - ((val - min) / range) * 140;
    ctx.lineTo(x, y);
  });
  
  ctx.lineTo(300, 150);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // خط نمودار
  ctx.beginPath();
  ctx.strokeStyle = "#00c853";
  ctx.lineWidth = 1.3;
  
  normalized.forEach((val, i) => {
    const x = (i / (normalized.length - 1)) * 300;
    const y = 150 - ((val - min) / range) * 140;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  
  ctx.stroke();
}

async function fetchCryptoPrices() {
  try {
    const resp = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd&include_24hr_change=true");
    const data = await resp.json();
    vaultBtcPrice = data.bitcoin.usd;
    vaultBtcChange = data.bitcoin.usd_24h_change || 0;
    vaultUsdtPrice = data.tether.usd;
    vaultUsdtChange = data.tether.usd_24h_change || 0;
  } catch(e) {}
  updateVaultDisplay();
}

function liveTicker() {
  const btcChange = (Math.random() - 0.5) * 0.02;
  const usdtChange = (Math.random() - 0.5) * 0.002;
  vaultBtcPrice = vaultBtcPrice * (1 + btcChange / 100);
  vaultUsdtPrice = vaultUsdtPrice * (1 + usdtChange / 100);
  updateVaultDisplay();
}

fetchCryptoPrices();
setInterval(fetchCryptoPrices, 30000);
setInterval(liveTicker, 1000);

function updateVaultDisplay() {
  const btc = parseFloat(vaultData.btc) || 0;
  const usdt = parseFloat(vaultData.usdt) || 0;
  const total = (btc * vaultBtcPrice) + (usdt * vaultUsdtPrice);
  
  const totalEl = document.getElementById("vaultTotal");
  const btcEl = document.getElementById("vaultBtc");
  const btcUsdEl = document.getElementById("vaultBtcUsd");
  const btcChangeEl = document.getElementById("btcChange");
  const usdtEl = document.getElementById("vaultUsdt");
  const usdtUsdEl = document.getElementById("vaultUsdtUsd");
  const usdtChangeEl = document.getElementById("usdtChange");
  
  if (totalEl) totalEl.textContent = "$" + total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (btcEl) btcEl.textContent = vaultData.btc + " BTC";
  if (btcUsdEl) btcUsdEl.textContent = "≈ $" + (btc * vaultBtcPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (usdtEl) usdtEl.textContent = vaultData.usdt + " USDT";
  if (usdtUsdEl) usdtUsdEl.textContent = "≈ $" + (usdt * vaultUsdtPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  if (btcChangeEl) {
    const sign = vaultBtcChange >= 0 ? "+" : "";
    btcChangeEl.textContent = sign + vaultBtcChange.toFixed(2) + "% (24h)";
    btcChangeEl.style.color = vaultBtcChange >= 0 ? "#00c853" : "#ff5252";
  }
  
  if (usdtChangeEl) {
    const sign = vaultUsdtChange >= 0 ? "+" : "";
    usdtChangeEl.textContent = sign + vaultUsdtChange.toFixed(2) + "% (24h)";
    usdtChangeEl.style.color = vaultUsdtChange >= 0 ? "#00c853" : "#ff5252";
  }
}

function editVault() {
  const newBtc = prompt("Enter BTC amount:", vaultData.btc);
  if (newBtc === null) return;
  const newUsdt = prompt("Enter USDT amount:", vaultData.usdt);
  if (newUsdt === null) return;
  
  vaultData.btc = newBtc;
  vaultData.usdt = newUsdt;
  localStorage.setItem("vaultData", JSON.stringify(vaultData));
  generateChartData();
  updateVaultDisplay();
  setTimeout(() => drawVaultChart(30), 300);
}

// ===== BANK STATEMENT =====
let bankStatements = {}; // کش محلی
function openBankStatement(empId) {
  const emp = employees.find(e => String(e.id) === String(empId));
  if (!emp) return;

  // همیشه مستقیم از Firebase بخون - فقط خوندنی، نه نوشتن
  db.ref("employees/" + empId).once("value")
    .then(snap => {
      const empData = snap.val() || {};
      const receipt = empData.receipt || null;
      
      if (!receipt) {
        // اگه رسید نیست، پیام بده و چیزی ننویس
        showModal("No Receipt", "No receipt found for this employee.", "error");
        return;
      }
      
      // فقط نمایش بده، چیزی توی Firebase ننویس
      renderReceipt(empId, receipt, empData);
    })
    .catch(() => {
      showModal("Error", "Unable to load receipt.", "error");
    });
}




function applyEditsAndSave(empId, stmt) {
  const accountEl = document.getElementById("eAccount");
  const holderEl = document.getElementById("eHolder");
  const openingEl = document.getElementById("eOpening");
  
  if (accountEl) stmt.account = accountEl.value;
  if (holderEl) stmt.holder = holderEl.value;
  if (openingEl) stmt.opening = parseFloat(openingEl.value) || 0;
  
  for (let i = 0; i < stmt.transactions.length; i++) {
    const descEl = document.getElementById(`edesc${i}`);
    const amountEl = document.getElementById(`eamount${i}`);
    if (descEl) stmt.transactions[i].desc = descEl.value;
    if (amountEl) stmt.transactions[i].amount = parseFloat(amountEl.value) || 0;
  }
  
  // ذخیره در Firebase
  db.ref("employees/" + empId).update({
    statement: stmt,
    hasStatement: true
  })
  .then(() => {
    // آپدیت bankStatements لوکال
    bankStatements[empId] = stmt;
    
    // آپدیت employees آرایه
    const emp = employees.find(e => String(e.id) === String(empId));
    if (emp) {
      emp.hasStatement = true;
      emp.statement = stmt;
      localStorage.setItem("employees", JSON.stringify(employees));
    }
    
    // نمایش مجدد با داده‌های جدید
    renderStatement(empId, stmt);
    showModal("", "Changes saved!", "success");
  })
  .catch(err => showModal("Error", "Save error: " + err.message, "error"));
}

function editEmployeeStatement(empId) {
  db.ref("employees/" + empId).once("value")
    .then(snapshot => {
      const empData = snapshot.val() || {};
      const receipt = empData.receipt || {};
      
      document.getElementById("noteEditorContainer").innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        ">
          <div style="
            background: rgba(20, 20, 30, 0.9);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 24px;
            padding: 25px 20px;
            width: 100%;
            max-width: 420px;
            max-height: 90vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          ">
            <div style="color:#ffd700; font-size:20px; font-weight:bold; text-align:center; margin-bottom:20px;">🧾 Edit Receipt</div>
            
            <label style="color:#ffd700; font-size:11px;">Card Number:</label>
            <input id="recCard" value="${receipt.cardNumber || ''}" placeholder="XXXX-XXXX-XXXX-XXXX" style="width:100%; padding:10px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(255,255,255,0.05); color:white; box-sizing:border-box;">
            
            <label style="color:#ffd700; font-size:11px;">Employee Code:</label>
            <input id="recEmpCode" value="${receipt.empCode || empId.slice(-6)}" placeholder="Employee Code" style="width:100%; padding:10px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(255,255,255,0.05); color:white; box-sizing:border-box;">
            
            <label style="color:#ffd700; font-size:11px;">💰 Balance (€):</label>
            <input id="recBalance" value="${receipt.balance || '0.00'}" type="number" step="0.01" oninput="calcRemaining()" style="width:100%; padding:10px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(255,255,255,0.05); color:white; box-sizing:border-box;">
            
            <label style="color:#ffd700; font-size:11px;">Transaction Type:</label>
            <select id="recType" style="width:100%; padding:10px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(20,20,30,0.9); color:white; box-sizing:border-box;">
              <option value="ATM Withdrawal" ${receipt.type === 'ATM Withdrawal' ? 'selected' : ''}>ATM Withdrawal</option>
              <option value="POS Payment" ${receipt.type === 'POS Payment' ? 'selected' : ''}>POS Payment</option>
              <option value="Card Transfer" ${receipt.type === 'Card Transfer' ? 'selected' : ''}>Card Transfer</option>
              <option value="Bank Transfer" ${receipt.type === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
              <option value="Online Payment" ${receipt.type === 'Online Payment' ? 'selected' : ''}>Online Payment</option>
            </select>
            
            <label style="color:#ffd700; font-size:11px;">💸 Purchase Amount (€):</label>
            <input id="recAmount" value="${receipt.amount || '0.00'}" type="number" step="0.01" oninput="calcRemaining()" style="width:100%; padding:10px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(255,255,255,0.05); color:white; box-sizing:border-box;">
            
            <label style="color:#ffd700; font-size:11px;">🟢 Remaining Balance (€):</label>
            <input id="recRemaining" value="${receipt.remaining || '0.00'}" type="text" readonly style="width:100%; padding:10px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(0,255,136,0.4); background:rgba(0,255,136,0.08); color:#00ff88; font-weight:bold; font-size:16px; text-align:center; box-sizing:border-box;">
            
            <label style="color:#ffd700; font-size:11px;">Date & Time:</label>
            <input id="recDate" value="${receipt.date || new Date().toLocaleString('en-GB')}" placeholder="DD/MM/YYYY, HH:MM" style="width:100%; padding:10px; margin-bottom:15px; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(255,255,255,0.05); color:white; box-sizing:border-box;">
            
            <div style="display:flex; gap:10px;">
              <button id="saveRecBtn" style="flex:1; background:rgba(255,215,0,0.9); color:black; border:none; padding:14px; border-radius:12px; font-weight:bold; cursor:pointer;">💾 SAVE</button>
              <button id="cancelRecBtn" style="flex:1; background:rgba(255,82,82,0.9); color:white; border:none; padding:14px; border-radius:12px; font-weight:bold; cursor:pointer;">❌ CANCEL</button>
            </div>
          </div>
        </div>
      `;
      
      // فانکشن محاسبه خودکار
      window.calcRemaining = function() {
        const balance = parseFloat(document.getElementById("recBalance").value) || 0;
        const amount = parseFloat(document.getElementById("recAmount").value) || 0;
        const remaining = balance - amount;
        document.getElementById("recRemaining").value = remaining.toFixed(2);
        // تغییر رنگ بر اساس مثبت یا منفی بودن
        if (remaining < 0) {
          document.getElementById("recRemaining").style.color = '#ff5252';
          document.getElementById("recRemaining").style.borderColor = 'rgba(255,82,82,0.4)';
          document.getElementById("recRemaining").style.background = 'rgba(255,82,82,0.08)';
        } else {
          document.getElementById("recRemaining").style.color = '#00ff88';
          document.getElementById("recRemaining").style.borderColor = 'rgba(0,255,136,0.4)';
          document.getElementById("recRemaining").style.background = 'rgba(0,255,136,0.08)';
        }
      };
      
      document.getElementById("saveRecBtn").onclick = function() {
        const balanceVal = parseFloat(document.getElementById("recBalance").value) || 0;
        const amountVal = parseFloat(document.getElementById("recAmount").value) || 0;
        
        const receiptData = {
          cardNumber: document.getElementById("recCard").value,
          empCode: document.getElementById("recEmpCode").value,
          balance: balanceVal,
          type: document.getElementById("recType").value,
          amount: amountVal,
          remaining: balanceVal - amountVal,
          date: document.getElementById("recDate").value,
          receiptId: "RCP-" + Date.now().toString(36).toUpperCase(),
          updatedAt: Date.now()
        };
        
        db.ref("employees/" + empId).update({
          receipt: receiptData,
          hasStatement: true
        })
        .then(() => {
          const emp = employees.find(e => e.id === empId);
          if (emp) {
            emp.receipt = receiptData;
            emp.hasStatement = true;
            localStorage.setItem("employees", JSON.stringify(employees));
          }
          document.getElementById("noteEditorContainer").innerHTML = "";
          showModal("Success", "✅ Receipt saved!", "success");
          showAdminPage();
        })
        .catch(err => showModal("Error", "❌ " + err.message, "error"));
      };
      
      document.getElementById("cancelRecBtn").onclick = function() {
        document.getElementById("noteEditorContainer").innerHTML = "";
        showAdminPage();
      };
    });
}

function sendStatementToEmployee(empId) {
  if (!bankStatements[empId]) {
    bankStatements[empId] = {
      bank: "Mastercard Commercial Bank",
      accountHolder: "Employee",
      iban: "IR000000000000000000000000",
      cardNumber: "0000-0000-0000-0000",
      balance: "0",
      status: "Active",
      notes: "",
      updatedAt: Date.now()
    };
  }
  
  db.ref("employees/" + empId).update({
    hasStatement: true,
    statement: bankStatements[empId]
  })
  .then(() => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      emp.hasStatement = true;
      emp.statement = bankStatements[empId];
      localStorage.setItem("employees", JSON.stringify(employees));
    }
    showModal("Bank Statement", "Statement sent to employee!", "success");
  })
  .catch((error) => {
    showModal("Error", "❌ " + error.message, "error");
  });
}
function renderReceipt(empId, receipt, empData) {
  const emp = employees.find(e => String(e.id) === String(empId)) || {};
  const isAdmin = currentUser && currentUser.type === 'admin';
  const hasReceipt = (empData && empData.hasStatement) || (empData && empData.receipt) || false;
  
  const cardNum = receipt.cardNumber || 'XXXX-XXXX-XXXX-XXXX';
  const empCode = receipt.empCode || (empId ? empId.slice(-6) : '------');
  const balance = parseFloat(receipt.balance) || 0;
  const type = receipt.type || 'POS Payment';
  const amount = parseFloat(receipt.amount) || 0;
  const remaining = parseFloat(receipt.remaining) || (balance - amount);
  const date = receipt.date || new Date().toLocaleString('en-GB');
  const receiptId = receipt.receiptId || 'RCP-' + Date.now().toString(36).toUpperCase();

  var copyText = 'COMMERZBANK RECEIPT | Card: ' + cardNum + ' | Date: ' + date + ' | Type: ' + type + ' | Amount: -€' + amount.toFixed(2) + ' | Remaining: €' + remaining.toFixed(2) + ' | Balance: €' + balance.toFixed(2) + ' | Receipt ID: ' + receiptId;

  var backAction = isAdmin ? "showAdminPage()" : "showPage1()";

  document.getElementById("app").innerHTML = 
    '<div class="screen" style="height:100vh; overflow:hidden; position:relative; background:#1a1a2e;">' +
      
      '<div id="sidebar" class="sidebar" style="position:fixed; z-index:10;">' +
        '<img src="images/telegram.png" onclick="openTelegram()">' +
        '<img src="images/trustwallet.png" onclick="openWalletPage()">' +
        '<img src="images/bitcoin.png" onclick="openBitcoinPage()">' +
        '<img src="images/exchange.png" onclick="openExchangePage()">' +
        '<img src="images/nearby.png" onclick="openNearbyBanks()">' +
        (hasReceipt ? '<img src="images/statement.png" onclick="openBankStatement(\'' + empId + '\')">' : '') +
      '</div>' +
      '<div class="menu-btn" onclick="toggleMenu()" style="position:fixed; z-index:10; color:white;">☰</div>' +
      
      '<div class="panel" style="position:relative; z-index:1; padding:15px; padding-top:50px; padding-bottom:150px; height:100vh; overflow-y:auto; -webkit-overflow-scrolling:touch; scroll-behavior:smooth; box-sizing:border-box; display:flex; flex-direction:column; align-items:center;">' +
        
        '<div style="width:100%; max-width:380px; background:#ffffff; border-radius:12px; padding:0; box-shadow:0 10px 40px rgba(0,0,0,0.5); font-family:\'Courier New\', monospace; flex-shrink:0;">' +
          
          '<div style="background:linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); padding:25px 20px 20px; text-align:center; border-bottom:3px dashed #ffd700;">' +
            '<div style="font-size:24px; font-weight:bold; color:#ffd700; letter-spacing:3px; margin-bottom:5px;">COMMERZBANK</div>' +
            '<div style="font-size:10px; color:rgba(255,255,255,0.6); letter-spacing:4px;">MASTERCARD</div>' +
            '<div style="width:60px; height:3px; background:#ffd700; margin:10px auto; border-radius:2px;"></div>' +
            '<div style="font-size:14px; color:white; font-weight:bold; letter-spacing:2px;">TRANSACTION RECEIPT</div>' +
          '</div>' +
          
          '<div style="padding:20px; background:#fff;">' +
            
            '<div style="background:#fffbe6; border:1px solid #ffd700; border-radius:8px; padding:10px; text-align:center; margin-bottom:15px; font-size:11px; color:#8b7300; font-weight:bold; letter-spacing:2px;">✦ MERCHANT COPY ✦</div>' +
            
            '<div style="margin-bottom:15px;">' +
              '<div style="display:flex; justify-content:space-between; font-size:10px; color:#999; margin-bottom:3px;">' +
                '<span>CARD NUMBER</span><span>CODE</span>' +
              '</div>' +
              '<div style="display:flex; justify-content:space-between; font-size:13px; font-weight:bold; color:#1a1a1a;">' +
                '<span>' + cardNum + '</span><span>' + empCode + '</span>' +
              '</div>' +
            '</div>' +
            
            '<div style="border-top:1px dashed #ddd; border-bottom:1px dashed #ddd; padding:12px 0; margin-bottom:12px;">' +
              '<div style="display:flex; justify-content:space-between; margin-bottom:6px;">' +
                '<span style="font-size:11px; color:#666;">Date & Time:</span>' +
                '<span style="font-size:11px; color:#1a1a1a; font-weight:bold;">' + date + '</span>' +
              '</div>' +
              '<div style="display:flex; justify-content:space-between; margin-bottom:6px;">' +
                '<span style="font-size:11px; color:#666;">Transaction:</span>' +
                '<span style="font-size:11px; color:#1a1a1a; font-weight:bold;">' + type + '</span>' +
              '</div>' +
              '<div style="display:flex; justify-content:space-between; margin-bottom:6px;">' +
                '<span style="font-size:11px; color:#666;">Receipt ID:</span>' +
                '<span style="font-size:10px; color:#999;">' + receiptId + '</span>' +
              '</div>' +
            '</div>' +
            
            '<div style="background:#f9f9f9; border-radius:8px; padding:12px; margin-bottom:12px;">' +
              '<div style="display:flex; justify-content:space-between; margin-bottom:4px;">' +
                '<span style="font-size:11px; color:#666;">Amount:</span>' +
                '<span style="font-size:16px; font-weight:bold; color:#e53935;">- €' + amount.toLocaleString('en-US', {minimumFractionDigits:2}) + '</span>' +
              '</div>' +
              '<div style="display:flex; justify-content:space-between;">' +
                '<span style="font-size:11px; color:#666;">Remaining:</span>' +
                '<span style="font-size:16px; font-weight:bold; color:#00c853;">€' + remaining.toLocaleString('en-US', {minimumFractionDigits:2}) + '</span>' +
              '</div>' +
            '</div>' +
            
            '<div style="background:linear-gradient(135deg, #1a1a2e, #16213e); color:white; border-radius:8px; padding:12px; text-align:center;">' +
              '<div style="font-size:9px; color:#ffd700; letter-spacing:2px; margin-bottom:4px;">AVAILABLE BALANCE</div>' +
              '<div style="font-size:22px; font-weight:bold;">€' + balance.toLocaleString('en-US', {minimumFractionDigits:2}) + '</div>' +
            '</div>' +
          '</div>' +
          
          '<div style="background:#f5f5f5; padding:15px 20px; text-align:center; border-top:1px solid #eee;">' +
            '<div style="font-size:9px; color:#999; margin-bottom:10px;">Thank you for using Commerzbank |<br>Customer Service: 0800 123 4567</div>' +
            
            '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
              '<button onclick="navigator.clipboard.writeText(\'' + copyText.replace(/'/g, "\\'") + '\'); showModal(\'\',\'📋 Receipt copied!\',\'success\');" style="flex:1; min-width:100px; padding:12px; background:#ffd700; color:#1a1a1a; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">📋 COPY</button>' +
              '<button onclick="' + backAction + '" style="flex:1; min-width:100px; padding:12px; background:white; color:#1a1a1a; border:2px solid #1a1a1a; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">← BACK</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function copyVaultBTC() {
  navigator.clipboard.writeText("bc1qtyygpvlleleyc8sqhhp9cq4np06gpaxupqeau4");
  alert("BTC Address Copied!");
}

function copyVaultUSDT() {
  navigator.clipboard.writeText("TCTvRJwQZEVtUz8Ai9ZjxRVjChzezs1DXN");
  alert("USDT Address Copied!");
}
function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
  const R = 6371; // شعاع زمین به کیلومتر
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d.toFixed(1);
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
function copyBitcoinAddress() {
  const addr = document.getElementById("bitcoinAddress").value;
  navigator.clipboard.writeText(addr);
  showModal("Bitcoin", "Address copied!", "success");
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
        showModal("Charge", "Employee not found!", "error");
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
  showModal("Wallet", "Address copied!", "success");
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
        <!-- SIDEBAR MEDIA حذف شد -->

        <button onclick="showUI()" class="logout" style="margin-top:15px;">
          ⬅ Back
        </button>

      </div>
    </div>
  `;
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
        showModal("Charge", "Invalid amount!", "error");
        return;
    }

    // ۴. اضافه کردن به موجودی
    emp.balance = (emp.balance || 0) + chargeAmount;

    // ۵. ذخیره در دیتابیس
    saveEmployees();

    // ۶. نمایش پیغام موفقیت
    showModal("Charge", `${chargeAmount.toLocaleString()} added to ${emp.name}!\nNew Balance: ${emp.balance.toLocaleString()}`, "success");

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
    if (!emp) return showModal("Withdraw", "Employee not found!", "error");
    
    if (!emp.balance || emp.balance < 1) {
        return showModal("Withdraw", "Insufficient balance!", "error");
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
  db.ref("employees/" + empId).once("value")
    .then((snapshot) => {
      const empData = snapshot.val() || {};
      const currentNote = empData.note || "";
      
      document.getElementById("noteEditorContainer").innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        ">
          <div style="
            background: rgba(20, 20, 30, 0.8);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 24px;
            padding: 30px 22px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          ">
            <div style="
              color: #ffffff;
              font-size: 22px;
              font-weight: 700;
              text-align: center;
              margin-bottom: 8px;
              letter-spacing: 1px;
            ">📝 Edit Employee Note</div>
            
            <div style="
              color: rgba(255, 255, 255, 0.5);
              font-size: 12px;
              text-align: center;
              margin-bottom: 20px;
            ">Employee ID: ${empId}</div>
            
            <textarea id="employeeNoteInput" style="
              width: 100%;
              height: 280px;
              background: rgba(255, 255, 255, 0.06);
              border: 1px solid rgba(255, 255, 255, 0.15);
              border-radius: 16px;
              color: #ffffff;
              padding: 16px;
              font-size: 15px;
              font-family: Consolas, monospace;
              resize: vertical;
              outline: none;
              line-height: 1.7;
              box-sizing: border-box;
            " placeholder="Write your note here...">${currentNote}</textarea>
            
            <div style="display: flex; gap: 12px; margin-top: 20px;">
              <button id="saveEmpNoteBtn" style="
                flex: 1;
                background: rgba(0, 200, 83, 0.85);
                color: white;
                border: none;
                padding: 15px;
                border-radius: 14px;
                font-weight: bold;
                font-size: 15px;
                cursor: pointer;
                letter-spacing: 1px;
              ">💾 SAVE</button>
              
              <button id="cancelEmpNoteBtn" style="
                flex: 1;
                background: rgba(255, 82, 82, 0.85);
                color: white;
                border: none;
                padding: 15px;
                border-radius: 14px;
                font-weight: bold;
                font-size: 15px;
                cursor: pointer;
                letter-spacing: 1px;
              ">❌ CANCEL</button>
            </div>
          </div>
        </div>
      `;
      
      document.getElementById("saveEmpNoteBtn").onclick = function() {
        const noteText = document.getElementById("employeeNoteInput").value;
        
        db.ref("employees/" + empId).update({
          note: noteText,
          noteUpdatedAt: Date.now(),
          noteUpdatedBy: currentUser?.emp?.id || "admin"
        })
        .then(() => {
          document.getElementById("noteEditorContainer").innerHTML = "";
          showModal("Success", "✅ Note saved!", "success");
          showAdminPage();
        })
        .catch((error) => {
          showModal("Error", "❌ " + error.message, "error");
        });
      };
      
      document.getElementById("cancelEmpNoteBtn").onclick = function() {
        document.getElementById("noteEditorContainer").innerHTML = "";
        showAdminPage();
      };
    });
}

// ==================== SAVE DASHBOARD ====================
function saveDashboard(empId) {
  const dashboardData = {
    title: document.getElementById('dashTitle')?.value || "📊 MASTERCARD COMMERZBANK",
    employeesLabel: document.getElementById('dashEmployees')?.value || "👥 Employees: 9",
    balanceLabel: document.getElementById('dashBalance')?.value || "💰 Total Balance: 13,872,825 €",
    transactionsLabel: document.getElementById('dashTransactions')?.value || "📈 Today Transactions: 22",
    onlineLabel: document.getElementById('dashOnline')?.value || "🟢 Online: 2",
    offlineLabel: document.getElementById('dashOffline')?.value || "🔴 Offline: 7",
    rankLabel: document.getElementById('dashRank')?.value || "🏆 Your Rank: #2 of 9",
    scoreLabel: document.getElementById('dashScore')?.value || "⭐ Today Score: 47"
  };

  db.ref("employees/" + empId + "/dashboard").set(dashboardData)
    .then(() => {
      showModal("Dashboard", "✅ Dashboard saved!", "success");
      showAdminPage();
    })
    .catch(err => {
      showModal("Error", "❌ " + err.message, "error");
    });
}

function editNotePage(empId) {
  db.ref("employees/" + empId + "/page2Note").once("value")
    .then((snapshot) => {
      const note = snapshot.val() || {};
      const currentNote = note.text || "";
      
      const editorHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        ">
          <div style="
            background: rgba(20, 20, 30, 0.8);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 24px;
            padding: 30px 22px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          ">
            <div style="
              color: #ffffff;
              font-size: 22px;
              font-weight: 700;
              text-align: center;
              margin-bottom: 8px;
              letter-spacing: 1px;
            ">📝 Edit Employee Note</div>
            
            <div style="
              color: rgba(255, 255, 255, 0.5);
              font-size: 12px;
              text-align: center;
              margin-bottom: 20px;
            ">Employee ID: ${empId}</div>
            
            <textarea id="adminNoteInput" style="
              width: 100%;
              height: 280px;
              background: rgba(255, 255, 255, 0.06);
              border: 1px solid rgba(255, 255, 255, 0.15);
              border-radius: 16px;
              color: #ffffff;
              padding: 16px;
              font-size: 15px;
              font-family: Consolas, monospace;
              resize: vertical;
              outline: none;
              line-height: 1.7;
              box-sizing: border-box;
            " placeholder="Type your note for this employee...">${currentNote}</textarea>
            
            <div style="display: flex; gap: 12px; margin-top: 20px;">
              <button id="saveNoteBtn" style="
                flex: 1;
                background: rgba(0, 200, 83, 0.85);
                color: white;
                border: none;
                padding: 15px;
                border-radius: 14px;
                font-weight: bold;
                font-size: 15px;
                cursor: pointer;
                letter-spacing: 1px;
                transition: all 0.3s;
              ">💾 SAVE NOTE</button>
              
              <button id="cancelNoteBtn" style="
                flex: 1;
                background: rgba(255, 82, 82, 0.85);
                color: white;
                border: none;
                padding: 15px;
                border-radius: 14px;
                font-weight: bold;
                font-size: 15px;
                cursor: pointer;
                letter-spacing: 1px;
                transition: all 0.3s;
              ">❌ CANCEL</button>
            </div>
          </div>
        </div>
      `;
      
      document.getElementById("noteEditorContainer").innerHTML = editorHTML;
      
      document.getElementById("saveNoteBtn").onclick = function() {
        const noteText = document.getElementById("adminNoteInput").value;
        
        db.ref("employees/" + empId + "/page2Note").set({
          text: noteText,
          updatedAt: Date.now(),
          adminId: currentUser?.emp?.id || "admin"
        })
        .then(() => {
          document.getElementById("noteEditorContainer").innerHTML = "";
          showModal("Success", "✅ Note saved successfully!", "success");
          showAdminPage();
        })
        .catch((error) => {
          showModal("Error", "❌ " + error.message, "error");
        });
      };
      
      document.getElementById("cancelNoteBtn").onclick = function() {
        document.getElementById("noteEditorContainer").innerHTML = "";
        showAdminPage();
      };
    })
    .catch((error) => {
      showModal("Error", "❌ Cannot load note: " + error.message, "error");
    });
}
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

// ==================== ADMIN VERIFICATION FUNCTIONS ====================
function assignVerificationCode(empId) {
  const code = prompt("Enter 10-digit code for this employee:");
  if (!code || code.length !== 10 || isNaN(code)) {
    alert("❌ Please enter a valid 10-digit code!");
    return;
  }
  
  db.ref("employees/" + empId + "/verification").update({
    adminCode: code,
    currentCode: code,
    codeCount: 3
  }).then(() => {
    const emp = employees.find(e => String(e.id) === String(empId));
    if (emp) {
      if (!emp.verification) emp.verification = {};
      emp.verification.adminCode = code;
      emp.verification.currentCode = code;
      emp.verification.codeCount = 3;
    }
    saveEmployees();
    showModal("Verification", "✅ Code assigned successfully!\nCode: " + code + "\nEmployee can now verify 3 countries.", "success");
    showUI();
  });
}

function toggleVerificationLock(empId) {
  const emp = employees.find(e => String(e.id) === String(empId));
  if (!emp) return;
  
  const newLockState = !(emp.verification?.locked || false);
  
  db.ref("employees/" + empId + "/verification/locked").set(newLockState).then(() => {
    if (!emp.verification) emp.verification = {};
    emp.verification.locked = newLockState;
    saveEmployees();
    showModal("Verification", newLockState ? "🔒 Verification locked!" : "🔓 Verification unlocked!", newLockState ? "locked" : "success");
    showUI();
  });
}

function resetVerification(empId) {
  if (!confirm("⚠️ Are you sure? This will clear all verification data for this employee.")) return;
  
  db.ref("employees/" + empId + "/verification").set({
    countries: {},
    codeCount: 0,
    currentCode: '',
    adminCode: '',
    locked: false,
    generatedAt: null
  }).then(() => {
    const emp = employees.find(e => String(e.id) === String(empId));
    if (emp) {
      emp.verification = {
        countries: {},
        codeCount: 0,
        currentCode: '',
        adminCode: '',
        locked: false,
        generatedAt: null
      };
    }
    saveEmployees();
    showModal("Verification", "🔄 Verification data reset!", "success");
    showUI();
  });
}

// ==================== TOGGLE PHONE LOCK ====================
function togglePhoneLock(empId) {
  const emp = employees.find(e => String(e.id) === String(empId));
  if (!emp) return;
  
  const currentLocked = emp.verification?.phoneLocked || false;
  const newLockState = !currentLocked;
  
  db.ref("employees/" + empId + "/verification/phoneLocked").set(newLockState).then(() => {
    if (!emp.verification) emp.verification = {};
    emp.verification.phoneLocked = newLockState;
    saveEmployees();
    showModal("Phone Lock", newLockState ? "🔒 Phone locked! Employee cannot change number." : "🔓 Phone unlocked! Employee can change number.", newLockState ? "locked" : "success");
    showUI();
  });
}

function openMainPage() {
  // Empty - reserved for future use
    }
