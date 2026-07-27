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

document.getElementById('processBtn').addEventListener('click', () => {
    const input = document.getElementById('dataInput').value;
    const lines = input.split('\n');
    const output = document.getElementById('output');
    output.innerHTML = ''; // Làm sạch kết quả cũ

    lines.forEach((line, index) => {
        if (!line.trim()) return;

        // Cắt theo khoảng trắng, dấu tab hoặc ký tự |
        const parts = line.split(/[\s|]+/).filter(Boolean);
        
        if (parts.length >= 4) {
            const id = parts[0];
            const text1 = parts[1];
            const text2 = parts[2];
            // Lấy chuỗi cuối làm mã secret 2FA
            const secret2fa = parts.slice(3).join('').replace(/\s/g, ''); 

            createRow(output, id, text1, text2, secret2fa, index);
        }
    });
});

function createRow(container, id, text1, text2, secret2fa, index) {
    const row = document.createElement('div');
    row.className = 'data-row';

    // 1. [ID] - Hiện đầu dòng, không có nút copy
    const idSpan = document.createElement('span');
    idSpan.className = 'data-id';
    idSpan.textContent = id;
    row.appendChild(idSpan);

    // 2. [Text 1] - Có nút copy
    const btnText1 = createCopyButton(text1, `Copy Text 1`);
    row.appendChild(btnText1);

    // 3. [Text 2] - Có nút copy
    const btnText2 = createCopyButton(text2, `Copy Text 2`);
    row.appendChild(btnText2);

    // 4. [Code 2FA] - Đổi theo thời gian, có nút copy
    const totpContainer = document.createElement('div');
    totpContainer.className = 'totp-container';
    
    const totpDisplay = document.createElement('span');
    totpDisplay.className = 'totp-code';
    
    const totpCopyBtn = createCopyButton('...', 'Copy 2FA');
    
    const countdownDisplay = document.createElement('span');
    countdownDisplay.className = 'countdown';

    totpContainer.appendChild(totpDisplay);
    totpContainer.appendChild(totpCopyBtn);
    totpContainer.appendChild(countdownDisplay);
    row.appendChild(totpContainer);

    container.appendChild(row);

    // Khởi tạo và đếm giờ 2FA
    try {
        const totp = new OTPAuth.TOTP({
            issuer: "App",
            label: id,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secret2fa)
        });

        // Chạy ngay lần đầu và thiết lập interval mỗi giây
        updateTOTP(totp, totpDisplay, totpCopyBtn, countdownDisplay);
        setInterval(() => updateTOTP(totp, totpDisplay, totpCopyBtn, countdownDisplay), 1000);
    } catch (error) {
        totpDisplay.textContent = "Lỗi mã";
        countdownDisplay.textContent = "";
    }
}

// Hàm hỗ trợ tạo nút copy
function createCopyButton(copyText, buttonLabel) {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = buttonLabel;
    
    // Lưu giá trị cần copy vào thuộc tính data (dùng để update realtime cho 2FA)
    btn.setAttribute('data-copy', copyText); 

    btn.onclick = () => {
        const textToCopy = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = btn.textContent;
            btn.textContent = 'Đã Copy!';
            btn.classList.add('copied');
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 1000);
        });
    };
    return btn;
}

// Hàm hỗ trợ tính toán và hiển thị 2FA
function updateTOTP(totpInstance, displayElement, copyBtn, countdownElement) {
    const code = totpInstance.generate();
    displayElement.textContent = code;
    
    // Cập nhật giá trị copy hiện tại cho nút bấm
    copyBtn.setAttribute('data-copy', code);

    // Tính thời gian đếm ngược của chu kỳ 30s
    const epoch = Math.floor(Date.now() / 1000);
    const remaining = 30 - (epoch % 30);
    countdownElement.textContent = `(${remaining}s)`;
}
