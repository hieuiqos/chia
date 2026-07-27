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

// Hàm tạo mã 2FA
function get2FACode(secretStr) {
    try {
        const cleanSecret = secretStr.replace(/[^A-Z2-7]/gi, "");
        const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(cleanSecret) });
        return totp.generate();
    } catch (e) {
        return "Lỗi mã";
    }
}

// Hàm khởi tạo từng Box dữ liệu
function createDataBox(content, hasCopyButton, is2FA = false) {
    const b = document.createElement("div");
    b.className = "box";
    
    // Đánh dấu box 2FA để update mỗi giây
    if (is2FA) {
        b.classList.add("box-2fa");
        b.setAttribute("data-secret", content);
    }
    
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";
    
    let codeSpan; // Biến lưu trữ riêng phần text mã code để chép

    if (is2FA) {
        // Cấu hình linh hoạt để chứa mã code + đồng hồ đếm
        wordSpan.style.display = "flex";
        wordSpan.style.alignItems = "center";
        wordSpan.style.gap = "6px";

        // Thêm mã 2FA
        codeSpan = document.createElement("span");
        codeSpan.className = "code-text";
        codeSpan.textContent = get2FACode(content);

        // Thêm đếm ngược
        const timerSpan = document.createElement("span");
        timerSpan.className = "timer-badge";
        const timeLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
        timerSpan.textContent = `${timeLeft}s`;

        wordSpan.appendChild(codeSpan);
        wordSpan.appendChild(timerSpan);
    } else {
        wordSpan.textContent = content;
    }
    
    b.appendChild(wordSpan);

    if (hasCopyButton) {
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy";
        copyBtn.textContent = "Copy";
        copyBtn.onclick = () => {
            // Nếu là 2FA thì chỉ chép mã code, ngược lại thì chép toàn bộ text content
            const textToCopy = is2FA ? codeSpan.textContent : content;
            navigator.clipboard.writeText(textToCopy);
            
            copyBtn.textContent = "Đã copy!";
            copyBtn.style.color = "#10b981"; 
            setTimeout(() => {
                copyBtn.textContent = "Copy";
                copyBtn.style.color = "";
            }, 1000);
        };
        b.appendChild(copyBtn);
    } else {
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
                // Vị trí [id]
                box = createDataBox(w, false, false);
            } else if (index === 3) {
                // Vị trí [code 2fa]
                box = createDataBox(w, true, true);
            } else {
                // Vị trí [text]
                box = createDataBox(w, true, false);
            }
            row.appendChild(box);
        });
        res.appendChild(row);
    });
}

// Vòng lặp cập nhật đếm ngược và mã sau mỗi 1 giây
setInterval(() => {
    // Mã TOTP cập nhật mỗi chu kỳ 30s so với giờ hệ thống
    const timeLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
    
    document.querySelectorAll('.box-2fa').forEach(el => {
        const secret = el.getAttribute('data-secret');
        const codeSpan = el.querySelector('.code-text');
        const timerSpan = el.querySelector('.timer-badge');
        
        if (secret && codeSpan) {
            codeSpan.textContent = get2FACode(secret);
        }
        
        if (timerSpan) {
            timerSpan.textContent = `${timeLeft}s`;
            // Tạo hiệu ứng đỏ cảnh báo nếu sắp hết hạn (< 5s)
            if (timeLeft <= 5) {
                timerSpan.style.backgroundColor = '#fee2e2'; // Nền đỏ nhạt
                timerSpan.style.color = '#ef4444'; // Chữ đỏ
            } else {
                timerSpan.style.backgroundColor = '#d1fae5'; // Nền xanh nhạt
                timerSpan.style.color = '#10b981'; // Chữ xanh
            }
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
