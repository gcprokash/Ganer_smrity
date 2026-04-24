/* ================= VARIABLES & APIS ================= */
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRt4hTMNVe8OxSO1hpjg3DR3ruUTLA8OlVem_49cRMAdwhNPfpxRLrZFoJt9CQ-UO4NF1Hm1GQmREHs/pub?gid=0&single=true&output=csv";
const API_URL = "https://script.google.com/macros/s/AKfycbyDznSCqU-gxcqPwQCQ-wTdiLS4kOxgQhQziiVjbQt7QQ5sywDSB4jQtQ-ivNqsyKtENA/exec";
const TEACHER_SHEET_URL = "https://opensheet.elk.sh/1M95Tze9o6OYJj-RLAV-Y-nk8Vk2YWWWXG7qjigxIgb8/Sheet1";

let allData = [];
let currentClass = "6";

/* ================= HELPERS ================= */

// বাংলাদেশ সময় পাওয়ার ফাংশন
function getBDTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
}

/* ================= INIT ================= */

// পেজ লোড হওয়ার সাথে সাথে সব ডায়নামিক ফাংশন চালু হবে
window.addEventListener("DOMContentLoaded", () => {
  loadRoutine();
  updateClock();
  loadDailyUpdates();
  loadNotices();
  loadTeachers(); // টিচার সেকশন লোড ফাংশন
});

/* ================= LOAD ROUTINE ================= */

async function loadRoutine(){
  const container = document.getElementById("routineTableContainer");
  if(!container) return;
  container.innerHTML = "<p style='color:#aaa'>লোড হচ্ছে...</p>";

  try{
    const res = await fetch(sheetURL);
    const data = await res.text();

    allData = data
      .trim()
      .split("\n")
      .slice(1)
      .map(parseCSV);

    showRoutine(currentClass);

  }catch(err){
    container.innerHTML = "<p style='color:red'>ডাটা লোড হয়নি</p>";
    console.error(err);
  }
}

function parseCSV(row){
  return row
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map(cell => cell.replace(/^"|"$/g, '').trim());
}

function showRoutine(cls){
  currentClass = cls;

  document.querySelectorAll(".routine-tab").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.class == cls);
  });

  const rows = allData.filter(r => r[0] == cls);

  const tableRows = rows.map(r => `
    <tr>
      <td class="routine-time">${r[1] || ""}</td>
      <td>${r[2] || ""}</td>
      <td>${r[3] || ""}</td>
      <td>${r[4] || ""}</td>
      <td>${r[5] || ""}</td>
      <td>${r[6] || ""}</td>
      <td class="routine-exam">${r[7] || ""}</td>
    </tr>
  `).join("");

  document.getElementById("routineTableContainer").innerHTML = `
    <table class="routine-table">
      <thead>
        <tr>
          <th>সময়</th>
          <th>শনিবার</th>
          <th>রবিবার</th>
          <th>সোমবার</th>
          <th>মঙ্গলবার</th>
          <th>বুধবার</th>
          <th>বৃহস্পতিবার</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;

  highlightToday();
  highlightCurrentClass();
}

function highlightToday(){
  const today = getBDTime().getDay();
  const map = { 6:1, 0:2, 1:3, 2:4, 3:5, 4:6 };
  const colIndex = map[today];
  if(!colIndex) return;

  const table = document.querySelector("#routineTableContainer table");
  if(!table) return;

  table.querySelectorAll("tbody tr").forEach(row=>{
    const cell = row.children[colIndex];
    if(cell) cell.classList.add("today-highlight");
  });

  const headerCell = table.querySelectorAll("thead th")[colIndex];
  if(headerCell) headerCell.classList.add("today-highlight");
}

function highlightCurrentClass(){
  const now = getBDTime();
  const currentTime = now.getHours()*60 + now.getMinutes();

  const table = document.querySelector("#routineTableContainer table");
  if(!table) return;

  table.querySelectorAll("td").forEach(td=>{
    td.classList.remove("now-class");
  });

  const rows = table.querySelectorAll("tbody tr");
  let rowIndex = -1;

  rows.forEach((row,i)=>{
    const timeText = row.children[0].innerText;
    if(!timeText.includes("-")) return;

    const [start,end] = timeText.split("-").map(t=>{
      let [h,m] = t.trim().split(":").map(Number);
      return h*60 + (m || 0);
    });

    if(currentTime >= start && currentTime < end){
      rowIndex = i;
    }
  });

  if(rowIndex === -1) return;

  const today = now.getDay();
  const map = { 6:1, 0:2, 1:3, 2:4, 3:5, 4:6 };
  const colIndex = map[today];
  if(!colIndex) return;

  const cell = rows[rowIndex].children[colIndex];
  if(cell) cell.classList.add("now-class");
}

setInterval(highlightCurrentClass, 60000);

/* ================= PRINT & COPY ROUTINE ================= */

function printRoutine(){
  const content = document.querySelector("#routineTableContainer").innerHTML;
  if(!content) return alert("রুটিন লোড হয়নি!");

  const classNameMap = {
    "6": "৬ষ্ঠ", "7": "৭ম", "8": "৮ম", "9": "৯ম", "10": "১০ম"
  };
  const printClassName = classNameMap[currentClass] || currentClass;

  const today = getBDTime().toLocaleDateString('bn-BD', {
    day:'numeric', month:'long', year:'numeric'
  });

  const logoURL = "https://i.ibb.co/mFrrtmcg/logo.png";
  const directorSignURL = "https://i.ibb.co.com/Txtpdr7p/director-sign.png";
  const teacherSignURL = "https://i.ibb.co.com/Txtpdr7p/director-sign.png";
  
  const win = window.open("", "", "width=900,height=700");

  win.document.write(`
  <html>
  <head>
    <title>Routine - জ্ঞানের স্মৃতি</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page { size: A4 portrait; margin: 15mm; }
      body { font-family: 'Noto Sans Bengali', Arial, sans-serif; text-align: center; margin: 0; color: #222; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { position: relative; min-height: 250mm; padding: 40px; border: 2px solid #ddd; border-radius: 8px; box-sizing: border-box; }
      .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 350px; opacity: 0.04; z-index: -1; }
      .header-container { border-bottom: 2px solid #ff9800; padding-bottom: 15px; margin-bottom: 25px; }
      .logo { width: 75px; margin-bottom: 8px; }
      h2 { margin: 0; color: #111; font-size: 26px; font-weight: 700; }
      h3 { margin: 5px 0 0; font-size: 18px; color: #444; font-weight: 600; }
      .date-text { margin: 8px 0 0; font-size: 13px; color: #666; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
      th, td { border: 1px solid #ccc; padding: 12px 8px; text-align: center; }
      th { background: #f4f6f8; color: #111; font-weight: 700; font-size: 15px; }
      tr:nth-child(even) { background-color: #fafafa; } 
      .signature { margin-top: 80px; display: flex; justify-content: space-between; padding: 0 30px; }
      .sig-box { text-align: center; width: 160px; }
      .sig-img { height: 45px; display: block; margin: 0 auto 5px; object-fit: contain; }
      .sig-text { border-top: 1.5px dashed #888; padding-top: 8px; font-size: 14px; font-weight: 600; color: #333; }
    </style>
  </head>
  <body>
    <div class="page">
      <img src="${logoURL}" class="watermark">
      <div class="header-container">
        <img src="${logoURL}" class="logo">
        <h2>জ্ঞানের স্মৃতি</h2>
        <h3>${printClassName} শ্রেণির সাপ্তাহিক রুটিন</h3>
        <p class="date-text">তারিখ: ${today}</p>
      </div>
      ${content}
      <div class="signature">
        <div class="sig-box">
          <img src="${teacherSignURL}" class="sig-img">
          <div class="sig-text">শিক্ষকের স্বাক্ষর</div>
        </div>
        <div class="sig-box">
          <img src="${directorSignURL}" class="sig-img">
          <div class="sig-text">পরিচালকের স্বাক্ষর</div>
        </div>
      </div>
    </div>
    <script>setTimeout(function() { window.print(); }, 1500); </script>
  </body>
  </html>
  `);
  win.document.close();
}

function copyRoutine(){
  const table = document.querySelector("#routineTableContainer table");
  if(!table) return alert("রুটিন লোড হয়নি!");

  const rows = table.querySelectorAll("tr");
  let text = `📚 জ্ঞানের স্মৃতি\n📅 ${currentClass} শ্রেণির রুটিন\n\n`;

  rows.forEach((row,i)=>{
    const cols = [...row.querySelectorAll("th,td")].map(c=>c.innerText.trim());
    text += i === 0
      ? cols.join(" | ") + "\n" + "-".repeat(40) + "\n"
      : `🕓 ${cols[0]} ➔ ${cols.slice(1).join(" | ")}\n`;
  });

  const toast = document.getElementById("copyToast");
  navigator.clipboard.writeText(text).then(()=>{
      showToast(toast, "✔ রুটিন কপি হয়েছে");
  }).catch(()=>{
      fallbackCopy(text);
      showToast(toast, "✔ রুটিন কপি হয়েছে");
  });
}

function showToast(elem, msg) {
  elem.innerText = msg;
  elem.classList.add("show");
  setTimeout(()=> elem.classList.remove("show"), 2000);
}

function fallbackCopy(text){
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

/* ================= DIGITAL CLOCK ================= */

function updateClock() {
    const bdTime = getBDTime(); 

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let h = bdTime.getHours();
    h = h % 12;
    h = h ? h : 12;
    h = String(h).padStart(2, "0");

    let m = String(bdTime.getMinutes()).padStart(2, "0");
    let s = String(bdTime.getSeconds()).padStart(2, "0");

    const timeDisplay = document.getElementById("clockTime");
    if (timeDisplay) timeDisplay.innerText = `${h}:${m}:${s}`;

    const day = days[bdTime.getDay()];
    const date = String(bdTime.getDate()).padStart(2, "0");
    const month = months[bdTime.getMonth()];
    const year = bdTime.getFullYear();

    const dateDisplay = document.getElementById("clockDate");
    if (dateDisplay) dateDisplay.innerText = `${day}, ${date} ${month} ${year}`;

    const box = document.querySelector(".clock-box");
    const wrapper = document.querySelector(".clock-wrapper");
    const outer = document.querySelector(".clock-outer");

    if (box && wrapper && outer) {
        box.classList.remove("active");
        wrapper.classList.remove("active");
        outer.classList.remove("active");

        setTimeout(() => box.classList.add("active"), 50);
        setTimeout(() => wrapper.classList.add("active"), 150);
        setTimeout(() => outer.classList.add("active"), 300);
    }
}
setInterval(updateClock, 1000);

/* ================= DAILY UPDATES ================= */

let lastDataString = "";

function getTodayBD(){
    return getBDTime().toLocaleDateString("en-GB");
}

function loadDailyUpdates(){
    const container = document.getElementById("dailyUpdates");
    if(!container) return;

    fetch("https://opensheet.elk.sh/18Fm2sKFMZ6dC9HWCKBjhpdkAmjWS2OqIOJQst-YGyKA/Sheet1")
    .then(res => res.json())
    .then(data => {

        const todayStr = getTodayBD();
        let classes = {};
        let banglaNumbers = ["১ম","২য়","৩য়","৪র্থ","৫ম","৬ষ্ঠ"];

        data.forEach(item => {
            if(!item.Date || item.Status !== "ON" || item.Date !== todayStr) return;

            if(!classes[item.Class]){ classes[item.Class] = []; }
            if(classes[item.Class].length < 3){ classes[item.Class].push(item); }
        });

        let newDataString = JSON.stringify(classes);
        if(newDataString === lastDataString) return;
        lastDataString = newDataString;

        container.style.opacity = "0.5";

        if(Object.keys(classes).length === 0){
            container.innerHTML = "<p style='text-align:center; color:#aaa; margin-top:20px;'>আজ কোনো ক্লাস নেই</p>";
            container.style.opacity = "1";
            return;
        }

        let classOrder = ["৬ষ্ঠ","৭ম","৮ম","৯ম","১০ম"];
        let html = "";

        classOrder.forEach(className => {
            if(!classes[className]) return;

            let lessonHTML = `<div class="lesson-grid">`;
            classes[className].forEach((item,index)=>{
                lessonHTML += `
                <div class="lesson-item">
                    <div class="lesson-title">${banglaNumbers[index]} ক্লাস</div>
                    <div class="lesson-subject">${item.Subject} — ${item.Chapter}</div>
                    <div class="lesson-teacher">শিক্ষক: ${item.Teacher}</div>
                </div>
                `;
            });
            lessonHTML += `</div>`;

            html += `
            <div class="daily-update-card">
                <h3>${className} শ্রেণি</h3>
                ${lessonHTML}
            </div>
            `;
        });

        container.innerHTML = html;
        container.style.opacity = "1";

        const todayDateElem = document.getElementById("todayDate");
        if(todayDateElem) {
            todayDateElem.innerText = getBDTime().toLocaleDateString('bn-BD', {
                day:'numeric', month:'long', year:'numeric'
            });
        }
    })
    .catch(err => {
        if(lastDataString === ""){
            container.innerHTML = "<p style='color:#ff4d4d;text-align:center; margin-top:20px;'>ডাটা লোড করা যায়নি। ইন্টারনেট কানেকশন চেক করুন!</p>";
        }
        container.style.opacity = "1";
    });
}
setInterval(loadDailyUpdates, 60000);

/* ================= NOTICE BOARD ================= */

function loadNotices(){

fetch("https://opensheet.elk.sh/146Kh8xhTY8QB9rObYTdlmm8FDGXrs8TDjki7ph7UW2E/1")
.then(res => res.json())
.then(data => {

  const board = document.getElementById("noticeBoard");
  if(!board) return;

  board.innerHTML = "";

  const parseDate = (dateStr) => {
    if(!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if(parts.length === 3){
      return new Date(parts[2], parts[1]-1, parts[0]);
    }
    return new Date(dateStr);
  };

  data.sort((a,b)=>parseDate(b.Date)-parseDate(a.Date));

  const LIMIT = 3;

  data.slice(0, LIMIT).forEach(row=>{

    let noticeText = row.Notice || "নোটিশ পাওয়া যায়নি";
    let type = (row.Type || "").toLowerCase().trim();
    let dateValue = row.Date || "";

    noticeText = noticeText
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/\n/g, "<br>"); 

    let badge = "";
    let importantClass = "";

    if(type === "important"){
      importantClass = "notice-important";
      badge += `<span class="notice-badge">IMPORTANT</span>`;
    }

    if(dateValue){
      const d = parseDate(dateValue);
      const today = getBDTime(); 

      if(d.toDateString() === today.toDateString()){
        badge += `<span class="notice-badge notice-new">NEW</span>`;
      }
    }

    let showDate = "";
    if(dateValue){
      const d = parseDate(dateValue);
      showDate = d.toLocaleDateString("bn-BD",{
        day:"numeric", month:"long", year:"numeric"
      });
    }

    let shortText = noticeText.length > 120
      ? noticeText.substring(0,120) + "..."
      : noticeText;

    let needButton = noticeText.length > 120;

    board.insertAdjacentHTML("beforeend",`
    <div class="notice-item ${importantClass}" data-full="${noticeText}">
      ${badge}
      <div class="notice-date">${showDate}</div>

      <div class="notice-text">
        <span class="notice-short">${shortText}</span>
        ${needButton ? `<span class="read-more">আরও পড়ুন</span>` : ""}
      </div>
    </div>
    `);

  });
})
.catch(err=>console.log("Notice load error:",err));

}
setInterval(loadNotices,30000);

/* ======================
NOTICE EVENT DELEGATION
====================== */

document.addEventListener("click",function(e){

  if(e.target.classList.contains("read-more")){
    e.stopPropagation();

    const parent = e.target.parentElement;
    const item = parent.parentElement;
    const shortText = parent.querySelector(".notice-short");
    const full = item.getAttribute("data-full") || "";

    if(e.target.innerText === "আরও পড়ুন"){
      shortText.innerHTML = full; 
      e.target.innerText = "কম দেখান";
    }else{
      shortText.innerHTML = full.substring(0,120) + "..."; 
      e.target.innerText = "আরও পড়ুন";
    }
    return;
  }

  const item = e.target.closest(".notice-item");
  if(!item) return;

  let date = item.querySelector(".notice-date")?.innerText || "";
  let fullText = item.getAttribute("data-full") || "";

  const popup = document.getElementById("noticePopup");

  if(popup){
    document.getElementById("popupDate").innerText = date;
    document.getElementById("popupText").innerHTML = fullText; 
    popup.style.display = "flex";
  }

});

document.getElementById("noticeClose")?.addEventListener("click", ()=>{
  document.getElementById("noticePopup").style.display = "none";
});

window.addEventListener("click",(e)=>{
  if(e.target?.id === "noticePopup"){
    document.getElementById("noticePopup").style.display = "none";
  }
});


/* ================= REGISTRATION FORM ================= */

function handleClassChange() {
    const classSelect = document.getElementById("studentClass").value;
    const groupField = document.getElementById("groupField");
    
    if (classSelect === "9" || classSelect === "10") {
        groupField.style.display = "block";
    } else {
        groupField.style.display = "none";
        document.getElementById("studentGroup").value = ""; 
    }
}

function submitStudent() {
    const btn = document.getElementById("registerBtn");
    const messageBox = document.getElementById("registerMessage");

    const studentMobile = document.getElementById("studentMobile").value.trim();
    const studentName = document.getElementById("studentName").value.trim();
    const studentClass = document.getElementById("studentClass").value;
    const studentSchool = document.getElementById("studentSchool").value.trim();
    const studentAddress = document.getElementById("studentAddress").value.trim();

    if (!studentName || studentMobile === "" || !studentClass || !studentSchool || !studentAddress) {
        messageBox.innerText = "❌ দয়া করে সব তথ্য পূরণ করুন!";
        messageBox.style.color = "#ff4d4d";
        return;
    }

    const mobileRegex = /^01[3-9]\d{8}$/;
    if (!mobileRegex.test(studentMobile)) {
        messageBox.innerText = "❌ দয়া করে সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন!";
        messageBox.style.color = "#ff4d4d";
        return;
    }

    const formData = {
        name: studentName,
        father: document.getElementById("fatherName").value.trim(),
        mobile: "'" + studentMobile, 
        class: studentClass,
        group: document.getElementById("studentGroup").value || "N/A",
        school: studentSchool,
        address: studentAddress
    };

    btn.innerText = "ভর্তি চলছে...";
    btn.disabled = true;
    messageBox.innerText = "সার্ভারে ডাটা পাঠানো হচ্ছে...";
    messageBox.style.color = "#ff9800"; 

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(formData),
    })
    .then(response => response.json()) 
    .then(result => {
        if (result.success) {
            messageBox.innerHTML = `
                ✅ আবেদন সফলভাবে জমা দেওয়া হয়েছে!<br>
                আপনার এডমিশন আইডি: <b style="color:#000; background:#ff9800; padding:2px 8px; border-radius:4px; margin-left:5px;">${result.id}</b><br>
                <small style="color:#aaa;">দয়া করে আইডিটি সংরক্ষণ করে রাখুন</small>
            `;
            messageBox.style.color = "#4caf50"; 
            clearForm();
        } else {
            messageBox.innerText = "❌ " + (result.message || "সমস্যা হয়েছে!");
            messageBox.style.color = "#ff4d4d";
        }
        setTimeout(() => { messageBox.innerHTML = ""; }, 15000);
    })
    .catch(error => {
        console.error("Error:", error);
        messageBox.innerText = "❌ সমস্যা হয়েছে! ইন্টারনেট কানেকশন চেক করুন।";
        messageBox.style.color = "#ff4d4d";
    })
    .finally(() => {
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> ভর্তি করুন';
        btn.disabled = false;
    });
}

function clearForm() {
    document.getElementById("studentName").value = "";
    document.getElementById("fatherName").value = "";
    document.getElementById("studentMobile").value = "";
    document.getElementById("studentClass").value = "";
    document.getElementById("studentGroup").value = "";
    document.getElementById("studentSchool").value = "";
    document.getElementById("studentAddress").value = "";
    if(document.getElementById("groupField")) document.getElementById("groupField").style.display = "none";
}

/* ================= TEACHERS SECTION ================= */

function loadTeachers() {
  const grid = document.getElementById("teachersGrid");
  const popup = document.getElementById("teacherPopup");
  const popupBox = document.querySelector(".popup-box");

  if (!grid) return;
  grid.innerHTML = "<p style='color:#aaa;'>লোড হচ্ছে...</p>";

  const getImage = (img) => {
    if (!img || img.trim() === "") return "images/default.png";
    return img.trim();
  };

  fetch(TEACHER_SHEET_URL)
    .then(res => res.json())
    .then(data => {
      grid.innerHTML = "";
      const fragment = document.createDocumentFragment();

      data.forEach(t => {
        const card = document.createElement("div");
        card.className = "teacher-card";
        card.dataset.teacher = t.id;

        card.innerHTML = `
          <img src="${getImage(t.img)}"
               class="teacher-img"
               loading="lazy"
               onerror="this.src='images/default.png'">
          <h3>${t.name || "No Name"}</h3>
          <span class="teacher-subject">${t.subject || ""}</span>
          <p>${t.degree || ""}</p>
        `;
        fragment.appendChild(card);
      });

      grid.appendChild(fragment);

      grid.addEventListener("click", (e) => {
        const card = e.target.closest(".teacher-card");
        if (!card) return;

        const id = card.dataset.teacher;
        const teacher = data.find(t => t.id == id);
        if (!teacher) return;

        document.getElementById("popupName").innerText = teacher.name || "";
        document.getElementById("popupSubject").innerText = "Subject: " + (teacher.subject || "");
        document.getElementById("popupDegree").innerText = teacher.degree || "";
        document.getElementById("popupBio").innerText = teacher.bio || "";
        document.getElementById("popupImg").src = getImage(teacher.img);

        document.getElementById("popupFacebook").href = teacher.facebook || "#";
        document.getElementById("popupWhatsapp").href = teacher.whatsapp || "#";
        document.getElementById("popupTelegram").href = teacher.telegram || "#";
        document.getElementById("popupEmail").href = teacher.email || "#";

        if(popup) popup.style.display = "flex";
      });
    })
    .catch(err => {
      console.error("ERROR:", err);
      grid.innerHTML = "<p style='color:red;'>ডাটা লোড করা যায়নি!</p>";
    });

  if (popupBox) {
    popupBox.addEventListener("click", (e) => e.stopPropagation());
  }

  document.getElementById("popupClose")?.addEventListener("click", () => {
    if(popup) popup.style.display = "none";
  });

  popup?.addEventListener("click", (e) => {
    if (e.target === popup) popup.style.display = "none";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup) popup.style.display = "none";
  });
}

/* ================= SUCCESS COUNTERS (WITH + SIGN) ================= */

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    const animationSpeed = 100;

    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        
        const updateCount = () => {
            const count = +counter.innerText.replace('+', '').replace('%', ''); // চিহ্ন সরিয়ে নাম্বার নেওয়া
            const increment = target / animationSpeed;

            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(updateCount, 30);
            } else {
                // টার্গেটে পৌঁছালে চিহ্ন যোগ করা
                if (target === 95) {
                    counter.innerText = target + "%"; // সফলতার হারের জন্য %
                } else {
                    counter.innerText = target + "+"; // অন্যদের জন্য +
                }
            }
        };
        updateCount();
    });
}

// সেকশন স্ক্রল ডিটেকশন (আগের মতোই থাকবে)
const statsSection = document.querySelector('.stats');
if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            initCounters();
            observer.unobserve(statsSection);
        }
    }, { threshold: 0.5 });
    observer.observe(statsSection);
}
