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
const status = document.getElementById("status");

// Hàm Helper để tạo mã 2FA
function get2FACode(secretStr) {
    try {
        // Xoá bỏ ký tự không thuộc bảng mã Base32 phòng trường hợp lỗi
        const cleanSecret = secretStr.replace(/[^A-Z2-7]/gi, "");
        const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(cleanSecret) });
        return totp.generate();
    } catch (e) {
        return "Lỗi mã";
    }
}

// Hàm khởi tạo từng Box dữ liệu riêng biệt
function createDataBox(content, hasCopyButton, is2FA = false) {
    const b = document.createElement("div");
    b.className = "box";
    
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";
    
    if (is2FA) {
        wordSpan.classList.add("totp-code");
        wordSpan.setAttribute("data-secret", content);
        wordSpan.textContent = get2FACode(content);
    } else {
        wordSpan.textContent = content;
    }
    
    b.appendChild(wordSpan);

    if (hasCopyButton) {
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy";
        copyBtn.textContent = "Copy";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(wordSpan.textContent);
            copyBtn.textContent = "Đã copy!";
            copyBtn.style.color = "#10b981"; 
            setTimeout(() => {
                copyBtn.textContent = "Copy";
                copyBtn.style.color = "";
            }, 1000);
        };
        b.appendChild(copyBtn);
    } else {
        // Xóa viền phải nếu không có nút copy đứng cạnh
        wordSpan.style.borderRight = "none";
    }
    
    return b;
}

function render(t) {
    res.innerHTML = "";
    t.split(/\r?\n/).forEach(l => {
        const parts = l.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return;

        const row = document.createElement("div");
        row.className = "line";
        
        parts.forEach((w, index) => {
            let box;
            if (index === 0) {
                // Vị trí [id]: Không có nút copy
                box = createDataBox(w, false, false);
            } else if (index === 3) {
                // Vị trí [code 2fa]: Có nút copy và biến đổi thành OTP 6 số
                box = createDataBox(w, true, true);
            } else {
                // Vị trí [text] hoặc các dữ liệu khác: Có nút copy
                box = createDataBox(w, true, false);
            }
            row.appendChild(box);
        });
        res.appendChild(row);
    });
}

// Tự động cập nhật lại các mã 2FA sau mỗi 1 giây
setInterval(() => {
    document.querySelectorAll('.totp-code').forEach(el => {
        const secret = el.getAttribute('data-secret');
        if (secret) {
            el.textContent = get2FACode(secret);
        }
    });
}, 1000);

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
    
    status.textContent = "Đã lưu thành công!";
    setTimeout(() => status.textContent = "", 3000);
};