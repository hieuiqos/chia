// Thay firebaseConfig bằng của bạn
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore,doc,setDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const firebaseConfig={apiKey:"",authDomain:"",projectId:"",storageBucket:"",messagingSenderId:"",appId:""};
const app=initializeApp(firebaseConfig);const db=getFirestore(app);
const room=new URLSearchParams(location.search).get("id")||"default";
const ref=doc(db,"rooms",room);
const input=document.getElementById("input"),res=document.getElementById("result");
function render(t){res.innerHTML="";t.split(/\r?\n/).forEach(l=>{const row=document.createElement("div");row.className="line";l.trim().split(/\s+/).filter(Boolean).forEach(w=>{const b=document.createElement("div");b.className="box";b.innerHTML=`<span class=word>${w}</span><button class=copy>Copy</button>`;b.querySelector("button").onclick=()=>navigator.clipboard.writeText(w);row.appendChild(b)});res.appendChild(row)});}
onSnapshot(ref,s=>{if(s.exists()){const t=s.data().text||"";input.value=t;render(t);}});
document.getElementById("save").onclick=async()=>{await setDoc(ref,{text:input.value});render(input.value);status.textContent="Đã lưu";};
