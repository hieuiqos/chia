import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =======================
// GIỮ NGUYÊN CONFIG CỦA BẠN
// =======================
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

// Lấy id theo URL
const room = new URLSearchParams(location.search).get("id") || "default";
const ref = doc(db, "rooms", room);

const input = document.getElementById("input");
const result = document.getElementById("result");
const status = document.getElementById("status");
const toast = document.getElementById("toast");

let saveTimeout;

// Toast thông báo
function showToast(message){
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

// Render các ô
function render(text){
    result.innerHTML = "";

    const lines = text.split(/\\r?\\n/);

    lines.forEach(line => {
        const row = document.createElement("div");
        row.className = "line";

        line
            .trim()
            .split(/\\s+/)
            .filter(Boolean)
            .forEach(word => {

                const box = document.createElement("div");
                box.className = "box";

                const wordEl = document.createElement("div");
                wordEl.className = "word";
                wordEl.textContent = word;

                const btn = document.createElement("button");
                btn.className = "copy";
                btn.textContent = "Copy";

                btn.onclick = async () => {
                    await navigator.clipboard.writeText(word);

                    btn.textContent = "✓";
                    btn.classList.add("success");

                    showToast(`Đã copy: ${word}`);

                    setTimeout(() => {
                        btn.textContent = "Copy";
                        btn.classList.remove("success");
                    }, 1000);
                };

                box.appendChild(wordEl);
                box.appendChild(btn);
                row.appendChild(box);
            });

        result.appendChild(row);
    });
}

// Đồng bộ realtime từ Firebase
onSnapshot(ref, snap => {
    if (!snap.exists()) return;

    const text = snap.data().text || "";

    // Không ghi đè khi đang gõ
    if (document.activeElement !== input) {
        input.value = text;
    }

    render(text);
});

// Tự động lưu khi gõ
input.addEventListener("input", () => {
    render(input.value);

    status.textContent = "💾 Đang lưu...";

    clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async () => {
        await setDoc(ref, {
            text: input.value,
            updatedAt: Date.now()
        });

        status.textContent = "✅ Đã lưu & đồng bộ realtime";
    }, 500);
});
