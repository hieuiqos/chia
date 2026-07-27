import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { authenticator } from "https://cdn.jsdelivr.net/npm/otplib@12.0.1/+esm";

// ================= Firebase (GIỮ NGUYÊN) =================

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

// ================= Copy =================

function copyText(text, btn) {
    navigator.clipboard.writeText(text);

    const old = btn.textContent;
    btn.textContent = "✓";

    setTimeout(() => {
        btn.textContent = old;
    }, 800);
}

// ================= Render =================

function render(text) {

    res.innerHTML = "";

    const rows = [];

    text.split(/\r?\n/).forEach(line => {

        line = line.trim();

        if (!line) return;

        const parts = line.split(/\s+/);

        const id = parts[0] || "";
        const text1 = parts[1] || "";
        const text2 = parts[2] || "";
        const secret = parts[3] || "";

        const row = document.createElement("div");
        row.className = "line";

        // ID
        const idCell = document.createElement("div");
        idCell.className = "cell id";
        idCell.textContent = id;

        // TEXT1
        const text1Cell = document.createElement("div");
        text1Cell.className = "cell";

        text1Cell.innerHTML = `
            <span>${text1}</span>
            <button class="copy">Copy</button>
        `;

        text1Cell.querySelector("button").onclick = e => {
            copyText(text1, e.target);
        };

        // TEXT2
        const text2Cell = document.createElement("div");
        text2Cell.className = "cell";

        text2Cell.innerHTML = `
            <span>${text2}</span>
            <button class="copy">Copy</button>
        `;

        text2Cell.querySelector("button").onclick = e => {
            copyText(text2, e.target);
        };

        // 2FA
        const codeCell = document.createElement("div");
        codeCell.className = "cell totp";

        const codeSpan = document.createElement("span");
        const btn = document.createElement("button");

        btn.className = "copy";
        btn.textContent = "Copy";

        btn.onclick = () => {
            copyText(codeSpan.textContent, btn);
        };

        codeCell.appendChild(codeSpan);
        codeCell.appendChild(btn);

        row.appendChild(idCell);
        row.appendChild(text1Cell);
        row.appendChild(text2Cell);
        row.appendChild(codeCell);

        res.appendChild(row);

        rows.push({
            secret,
            codeSpan
        });

    });

    function updateCodes() {

        rows.forEach(item => {

            if (!item.secret) {
                item.codeSpan.textContent = "------";
                return;
            }

            try {
                item.codeSpan.textContent = authenticator.generate(item.secret);
            } catch {

                item.codeSpan.textContent = "ERROR";

            }

        });

    }

    updateCodes();

    if (window.totpTimer) {
        clearInterval(window.totpTimer);
    }

    window.totpTimer = setInterval(updateCodes, 1000);

}

// ================= Firebase =================

onSnapshot(ref, snapshot => {

    if (!snapshot.exists()) return;

    const text = snapshot.data().text || "";

    input.value = text;

    render(text);

});

// ================= Save =================

document.getElementById("save").onclick = async () => {

    await setDoc(ref, {
        text: input.value
    });

    render(input.value);

    status.textContent = "Đã lưu thành công!";

    setTimeout(() => {
        status.textContent = "";
    }, 3000);

};
