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

// ==========================================

// Hàm xử lý dữ liệu nhập vào
function processData() {
    const inputData = document.getElementById('dataInput').value;
    // Tách theo từng dòng bỏ qua dòng trống
    const lines = inputData.split('\n').filter(line => line.trim() !== '');
    const outputArea = document.getElementById('outputArea');
    
    outputArea.innerHTML = ''; // Xóa kết quả cũ

    lines.forEach(line => {
        // Tách dòng thành các phần tử (bằng dấu cách hoặc tab)
        const parts = line.trim().split(/\s+/);
        
        if (parts.length >= 4) {
            const id = parts[0];
            const text1 = parts[1];
            const text2 = parts[2];
            const secret = parts[3]; // Mã base32 secret của 2FA

            const row = document.createElement('div');
            row.className = 'data-row';

            // 1. Cột ID (Không có nút copy, đứng đầu dòng)
            row.innerHTML += `
                <div class="item-id">${id}</div>
            `;

            // 2. Cột Text 1 (Có nút copy)
            row.innerHTML += createCopyableItem(text1);

            // 3. Cột Text 2 (Có nút copy)
            row.innerHTML += createCopyableItem(text2);

            // 4. Cột Mã 2FA (Tự sinh mã 6 số và có nút copy)
            const totpId = 'totp-' + Math.random().toString(36).substr(2, 9);
            row.innerHTML += `
                <div class="item-box">
                    <span id="${totpId}" class="item-value totp-code" data-secret="${secret}">------</span>
                    <button class="btn-copy" onclick="copyText(document.getElementById('${totpId}').innerText, this)">Copy</button>
                </div>
            `;

            outputArea.appendChild(row);
        }
    });

    // Cập nhật mã 2FA ngay lập tức sau khi render
    updateAllTOTPCodes();
}

// Hàm hỗ trợ tạo khối HTML cho dữ liệu cần Copy
function createCopyableItem(text) {
    return `
        <div class="item-box">
            <span class="item-value">${text}</span>
            <button class="btn-copy" onclick="copyText('${text}', this)">Copy</button>
        </div>
    `;
}

// Hàm copy vào clipboard
function copyText(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btnElement.innerText;
        btnElement.innerText = "Đã Copy!";
        btnElement.style.backgroundColor = "#ffc107";
        btnElement.style.color = "#000";
        
        // Trả lại trạng thái cũ sau 1.5 giây
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.style.backgroundColor = "#28a745";
            btnElement.style.color = "#fff";
        }, 1500);
    }).catch(err => {
        console.error('Lỗi khi copy: ', err);
    });
}

// Hàm tính toán và cập nhật mã 2FA 6 số
function updateAllTOTPCodes() {
    const totpElements = document.querySelectorAll('.totp-code');
    
    totpElements.forEach(el => {
        const secret = el.getAttribute('data-secret');
        try {
            // Sử dụng thư viện OTPAuth
            let totp = new OTPAuth.TOTP({
                algorithm: "SHA1",
                digits: 6,
                period: 30,
                secret: secret // Truyền secret key vào đây
            });
            el.innerText = totp.generate();
        } catch (error) {
            el.innerText = "Lỗi Secret";
        }
    });
}

// Thiết lập vòng lặp cập nhật mã 2FA mỗi 1 giây (để đồng bộ thời gian)
setInterval(updateAllTOTPCodes, 1000);

