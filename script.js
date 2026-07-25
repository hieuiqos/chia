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
const app=initializeApp(firebaseConfig),db=getFirestore(app);
const room=new URLSearchParams(location.search).get("id")||"default";
const ref=doc(db,"rooms",room);
const input=document.getElementById("input"),result=document.getElementById("result"),status=document.getElementById("saveStatus"),toast=document.getElementById("toast");
let timer,ignore=false;
function showToast(m){toast.textContent=m;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1500);}
function render(t){result.innerHTML="";t.split(/\r?\n/).forEach(l=>{const row=document.createElement("div");row.className="line";l.trim().split(/\s+/).filter(Boolean).forEach(w=>{const b=document.createElement("div");b.className="wordBox";const s=document.createElement("div");s.className="word";s.textContent=w;const bt=document.createElement("button");bt.className="copy";bt.textContent="Copy";bt.onclick=async()=>{await navigator.clipboard.writeText(w);bt.textContent="✓";bt.classList.add("success");showToast("Đã copy: "+w);setTimeout(()=>{bt.textContent="Copy";bt.classList.remove("success");},1000);};b.append(s,bt);row.appendChild(b);});result.appendChild(row);});}
input.addEventListener("input",()=>{render(input.value);status.textContent="Đang lưu...";clearTimeout(timer);timer=setTimeout(async()=>{ignore=true;await setDoc(ref,{text:input.value});ignore=false;status.textContent="Đã đồng bộ";},500);});
onSnapshot(ref,s=>{if(!s.exists()||ignore)return;const t=s.data().text||"";if(document.activeElement!==input)input.value=t;render(t);status.textContent="Đã đồng bộ";});
