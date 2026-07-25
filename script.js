// Thay firebaseConfig bằng cấu hình của bạn
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAkaju4D7ivfI9Rj-q0zDnOL2jiTBjGxYk",
    authDomain: "chia-cdf09.firebaseapp.com",
    projectId: "chia-cdf09",
    storageBucket: "chia-cdf09.firebasestorage.app",
    messagingSenderId: "1068772307933",
    appId: "1:1068772307933:web:741632526b391e7ad2fc34"
  };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const room = new URLSearchParams(location.search).get("id") || "default";
const ref = doc(db, "rooms", room);
const input = document.getElementById("input");
const res = document.getElementById("result");
const status = document.getElementById("status"); // Khai báo thêm biến status

function render(t) {
    res.innerHTML = "";
    t.split(/\r?\n/).forEach(l => {
        const row = document.createElement("div");
        row.className = "line";
        
        l.trim().split(/\s+/).filter(Boolean).forEach(w => {
            const b = document.createElement("div");
            b.className = "box";
            b.innerHTML = `<span class="word">${w}</span><button class="copy">Copy</button>`;
            
            const copyBtn = b.querySelector("button");
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(w);
                // Hiệu ứng UX nhỏ khi copy
                copyBtn.textContent = "Đã copy!";
                copyBtn.style.color = "#10b981"; 
                setTimeout(() => {
                    copyBtn.textContent = "Copy";
                    copyBtn.style.color = "";
                }, 1000);
            };
            row.appendChild(b);
        });
        res.appendChild(row);
    });
}

onSnapshot(ref, s => {
    if (s.exists()) {
        const t = s.data().text || "";
        input.value = t;
        render(t);
    }
});

document.getElementById("save").onclick = async () => {
    await setDoc(ref, { text: input.value });
    render(input.value);
    
    // Cập nhật trạng thái
    status.textContent = "Đã lưu thành công!";
    setTimeout(() => status.textContent = "", 3000);
};
