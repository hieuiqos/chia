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

let currentCheckedIds = []; // Mảng lưu trữ các ID đã được check đồng bộ qua Firebase

function get2FACode(secretStr) {
    try {
        const cleanSecret = secretStr.replace(/[^A-Z2-7]/gi, "");
        const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(cleanSecret) });
        return totp.generate();
    } catch (e) {
        return "Lỗi mã";
    }
}

function createDataBox(content, hasCopyButton, is2FA = false) {
    const b = document.createElement("div");
    b.className = "box";
    
    if (is2FA) {
        b.classList.add("box-2fa");
        b.setAttribute("data-secret", content);
    }
    
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";
    
    let codeSpan; 

    if (is2FA) {
        wordSpan.style.gap = "6px";

        codeSpan = document.createElement("span");
        codeSpan.className = "code-text";
        codeSpan.textContent = get2FACode(content);

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
    }
    
    return b;
}

// Render dữ liệu kết hợp với trạng thái Checkbox từ Firebase
function render(t, checkedIds = []) {
    res.innerHTML = "";
    t.split(/\r?\n/).forEach(l => {
        const parts = l.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return;

        const frame = document.createElement("div");
        frame.className = "frame";

        const header = document.createElement("div");
        header.className = "frame-header";

        const accountId = parts[0]; // ID tài khoản

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "move-checkbox";
        
        // Kiểm tra xem ID này có nằm trong danh sách đã check trên Firebase không
        if (checkedIds.includes(accountId)) {
            checkbox.checked = true;
            frame.classList.add("checked-frame");
        }
        
        // Bắt sự kiện khi người dùng click checkbox
        checkbox.addEventListener("change", async function() {
            if (this.checked) {
                frame.classList.add("checked-frame");
                if (!currentCheckedIds.includes(accountId)) {
                    currentCheckedIds.push(accountId);
                }
            } else {
                frame.classList.remove("checked-frame");
                currentCheckedIds = currentCheckedIds.filter(id => id !== accountId);
            }
            
            // Lưu trạng thái Checkbox mới lên Firebase để thiết bị khác cũng nhận được
            await setDoc(ref, { text: input.value, checkedIds: currentCheckedIds }, { merge: true });
        });

        const title = document.createElement("span");
        title.className = "frame-title";
        title.textContent = accountId;

        header.appendChild(checkbox);
        header.appendChild(title);

        const content = document.createElement("div");
        content.className = "frame-content";
        
        for (let index = 1; index < parts.length; index++) {
            let w = parts[index];
            let box = (index === 3) ? createDataBox(w, true, true) : createDataBox(w, true, false);
            content.appendChild(box);
        }

        frame.appendChild(header);
        frame.appendChild(content);
        res.appendChild(frame);
    });
}

// Cập nhật 2FA mỗi giây
setInterval(() => {
    const timeLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
    document.querySelectorAll('.box-2fa').forEach(el => {
        const secret = el.getAttribute('data-secret');
        const codeSpan = el.querySelector('.code-text');
        const timerSpan = el.querySelector('.timer-badge');
        
        if (secret && codeSpan) codeSpan.textContent = get2FACode(secret);
        
        if (timerSpan) {
            timerSpan.textContent = `${timeLeft}s`;
            if (timeLeft <= 5) {
                timerSpan.style.backgroundColor = '#fee2e2';
                timerSpan.style.color = '#ef4444';
            } else {
                timerSpan.style.backgroundColor = '#d1fae5';
                timerSpan.style.color = '#10b981';
            }
        }
    });
}, 1000);

// Lắng nghe Firebase realtime
onSnapshot(ref, s => {
    if (s.exists()) {
        const data = s.data();
        const t = data.text || "";
        currentCheckedIds = data.checkedIds || []; // Nhận danh sách checkedIds từ Firebase
        
        input.value = t;
        render(t, currentCheckedIds);
    }
});

// Nút Update
document.getElementById("save").onclick = async () => {
    await setDoc(ref, { text: input.value, checkedIds: currentCheckedIds }, { merge: true });
    
    status.textContent = "Đã lưu thành công!";
    setTimeout(() => status.textContent = "", 3000);
};
