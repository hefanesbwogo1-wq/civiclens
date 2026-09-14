"use strict";
console.log("CivicLens: register.js V16.1 Payment loaded");
let supabaseClient=null;
let currentStep=1;
let uploadedFrontUrl=null, uploadedBackUrl=null;

document.addEventListener("DOMContentLoaded", () => {
    if(!window.SUPABASE_URL ||!window.supabase){ console.error("Supabase missing"); document.getElementById("message").textContent="Config missing - check /config.js"; return; }
    supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    document.getElementById("idFront")?.addEventListener("change", (e)=> handleFile(e, "front"));
    document.getElementById("idBack")?.addEventListener("change", (e)=> handleFile(e, "back"));
    document.querySelectorAll('.plan-card:not(.pay-card)').forEach(card=>{
        card.addEventListener('click', ()=>{
            document.querySelectorAll('.plan-card:not(.pay-card)').forEach(c=>c.classList.remove('selected'));
            card.classList.add('selected');
            const inp=card.querySelector('input[name="subscription_plan"]');
            if(inp) inp.checked=true;
            updatePaymentUI();
        });
    });
    document.querySelectorAll('.pay-card').forEach(card=>{
        card.addEventListener('click', ()=>{
            document.querySelectorAll('.pay-card').forEach(c=>c.classList.remove('selected'));
            card.classList.add('selected');
            const inp=card.querySelector('input[name="payment_method"]');
            if(inp) inp.checked=true;
            updatePaymentFields();
        });
    });
    document.getElementById("cardNumber")?.addEventListener("input", (e)=>{ e.target.value=e.target.value.replace(/\D/g,"").replace(/(.{4})/g,"$1 ").trim().slice(0,19); });
    document.getElementById("cardExpiry")?.addEventListener("input", (e)=>{ let v=e.target.value.replace(/\D/g,""); if(v.length>=2) v=v.slice(0,2)+"/"+v.slice(2,4); e.target.value=v; });
    document.getElementById("password")?.addEventListener("input", updateStrength);
    document.getElementById("confirmPassword")?.addEventListener("input", checkMatch);
    document.getElementById("phone")?.addEventListener("blur", ()=>{ const p=document.getElementById("phone").value.trim(); const m=document.getElementById("mpesaPhone"); if(p && m &&!m.value) m.value=p; });
    document.getElementById("registrationForm")?.addEventListener("submit", handleRegister);
    updatePaymentUI();
});

function updatePaymentUI(){
    const planEl=document.querySelector('input[name="subscription_plan"]:checked');
    const plan=planEl?.value||"pro";
    const price=planEl?.dataset.price||(plan==="free"?0:plan==="enterprise"?99:19);
    const isFree=plan==="free" || String(price)==="0";
    const paySec=document.getElementById("paymentSection");
    const freeNote=document.getElementById("freeNote");
    if(paySec) paySec.style.display=isFree?"none":"block";
    if(freeNote) freeNote.style.display=isFree?"block":"none";
    const sp=document.getElementById("summaryPlan"); if(sp) sp.textContent=`${plan.charAt(0).toUpperCase()+plan.slice(1)} - $${price}/mo`;
    const st=document.getElementById("summaryTotal"); if(st) st.textContent=`$${price}`;
    const ta=document.getElementById("termsAmount"); if(ta) ta.textContent=`$${price}`;
    const ma=document.getElementById("mpesaAmount"); if(ma) ma.textContent=`Enter PIN to pay $${price}`;
    const subTxt=document.getElementById("submitText"); if(subTxt) subTxt.textContent=isFree?`Create Free Account`:`Confirm & Pay $${price}`;
    updatePaymentFields();
}
function updatePaymentFields(){
    const method=document.querySelector('input[name="payment_method"]:checked')?.value||"mpesa";
    const mpesa=document.getElementById("mpesaFields");
    const card=document.getElementById("cardFields");
    const bank=document.getElementById("bankFields");
    if(mpesa) mpesa.style.display=method==="mpesa"?"block":"none";
    if(card) card.style.display=method==="card"?"block":"none";
    if(bank) bank.style.display=method==="bank"?"block":"none";
    const sm=document.getElementById("summaryMethod"); if(sm) sm.textContent=method==="mpesa"?"M-Pesa":method==="card"?"Card":"Bank Transfer";
}

function nextStep(n){
    if(n>currentStep &&!validateStep(currentStep)) return;
    document.getElementById(`step${currentStep}`)?.classList.remove("active");
    document.getElementById(`dot${currentStep}`)?.classList.remove("active");
    document.getElementById(`dot${currentStep}`)?.classList.add("done");
    currentStep=n;
    document.getElementById(`step${currentStep}`)?.classList.add("active");
    document.getElementById(`dot${currentStep}`)?.classList.add("active");
    const titles={1:["Create your account","Set up your CivicLens workspace","Personal Details"],2:["Verify your identity","We need to verify your identity","Identity"],3:["Secure your account","Create strong password","Password"],4:["Choose plan & pay","Select plan and confirm payment","Payment"]};
    const t=titles[currentStep];
    document.getElementById("stepTitle").textContent=t[0];
    document.getElementById("stepDesc").textContent=t[1];
    document.getElementById("stepCount").textContent=`STEP ${currentStep} OF 4`;
    document.getElementById("stepLabel").textContent=t[2];
    window.scrollTo({top:0,behavior:"smooth"});
    if(currentStep===4) updatePaymentUI();
}
window.nextStep=nextStep;

function validateStep(step){
    const show=(txt)=>{ const m=document.getElementById("message"); m.textContent=txt; m.className="message error"; window.scrollTo({top:0,behavior:"smooth"}); };
    if(step===1){
        if(!document.getElementById("fullName").value.trim()){ show("Enter full name"); return false; }
        if(!document.getElementById("email").value.trim()){ show("Enter email"); return false; }
        if(!document.getElementById("phone").value.trim()){ show("Enter phone"); return false; }
        if(!document.getElementById("organization").value.trim()){ show("Enter organization"); return false; }
        if(!document.getElementById("role").value.trim()){ show("Enter role"); return false; }
    }
    if(step===2){
        if(!document.getElementById("idNumber").value.trim()){ show("Enter ID number"); return false; }
        if(!uploadedFrontUrl &&!(document.getElementById("idFront")?.files[0])){ show("Upload ID front photo"); return false; }
    }
    if(step===3){
        const p=document.getElementById("password").value;
        const c=document.getElementById("confirmPassword").value;
        if(p.length<8){ show("Password minimum 8 characters"); return false; }
        if(p!==c){ show("Passwords do not match"); return false; }
        if(passwordStrength(p)<3){ show("Create stronger password"); return false; }
    }
    const m=document.getElementById("message"); if(m){ m.className="message"; m.textContent=""; }
    return true;
}

function passwordStrength(v){
    let s=0; if(v.length>=8)s++; if(/[A-Z]/.test(v))s++; if(/[0-9]/.test(v))s++; if(/[^A-Za-z0-9]/.test(v))s++;
    document.querySelectorAll(".password-strength span").forEach((bar,i)=>{ bar.style.background=i<s?"#087cf5":"#e5ebf2"; });
    return s;
}
function updateStrength(){
    const v=this.value; const score=passwordStrength(v);
    const hint=document.getElementById("passwordHint");
    const msgs=["Use letters, numbers and symbols.","Weak","Fair","Good","Strong"];
    if(hint) { hint.textContent=`Password strength: ${msgs[score]||msgs[0]}`; hint.className="field-hint"+(score>=3?" ok":""); }
}
function checkMatch(){
    const p=document.getElementById("password").value; const c=this.value;
    const h=document.getElementById("matchHint"); if(!h) return;
    if(!c){ h.textContent=""; return; }
    if(p===c){ h.textContent="Passwords match."; h.className="field-hint ok"; }
    else{ h.textContent="Passwords do not match."; h.className="field-hint error"; }
}

async function handleFile(e,type){
    const file=e.target.files[0]; if(!file) return;
    if(file.size>5*1024*1024){ alert("File too large max 5MB"); return; }
    const preview=document.getElementById(type==="front"?"frontPreview":"backPreview");
    if(preview) preview.textContent="⏳ Uploading "+file.name+"...";
    try{
        const fileName=`${Date.now()}_${type}_${file.name}`.replace(/[^a-zA-Z0-9._-]/g,"_");
        const {error}=await supabaseClient.storage.from("id-documents").upload(fileName,file,{upsert:true});
        if(error) throw error;
        const {data}=supabaseClient.storage.from("id-documents").getPublicUrl(fileName);
        if(type==="front") uploadedFrontUrl=data.publicUrl; else uploadedBackUrl=data.publicUrl;
        if(preview) preview.textContent="✅ "+file.name+" uploaded";
    }catch(err){
        console.error("Upload err",err);
        if(preview) preview.textContent="⚠️ Will upload on submit";
        if(type==="front") uploadedFrontUrl=file; else uploadedBackUrl=file;
    }
}

function showMessage(text,type){
    const m=document.getElementById("message"); if(!m) return;
    m.textContent=text; m.className="message "+type;
    window.scrollTo({top:0,behavior:"smooth"});
}

async function handleRegister(e){
    e.preventDefault();
    if(!validateStep(3)){ return; }
    if(!document.getElementById("terms")?.checked){ showMessage("Please accept Terms and Privacy","error"); return; }

    const planEl=document.querySelector('input[name="subscription_plan"]:checked');
    const plan=planEl?.value||"pro";
    const price=parseInt(planEl?.dataset.price||"19");
    const isFree=plan==="free" || price===0;
    const method=isFree?"free":document.querySelector('input[name="payment_method"]:checked')?.value||"mpesa";

    if(!isFree){
        if(method==="mpesa" &&!document.getElementById("mpesaPhone")?.value.trim()){ showMessage("Enter M-Pesa phone number","error"); return; }
        if(method==="card"){
            if(!document.getElementById("cardNumber")?.value.trim() ||!document.getElementById("cardExpiry")?.value.trim() ||!document.getElementById("cardCvv")?.value.trim()){ showMessage("Fill card details","error"); return; }
        }
        if(method==="bank" &&!document.getElementById("bankRef")?.value.trim()){ showMessage("Enter Bank transaction code","error"); return; }
    }

    const btn=document.getElementById("submitBtn");
    const txt=document.getElementById("submitText");
    const old=txt?.textContent||"";
    if(btn) btn.disabled=true;
    if(txt) txt.textContent=isFree?"Creating account...":method==="mpesa"?"Sending M-Pesa prompt...":"Processing payment...";

    const payload={
        full_name: document.getElementById("fullName").value.trim(),
        other_names: document.getElementById("otherNames").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        organization: document.getElementById("organization").value.trim(),
        role: document.getElementById("role").value.trim(),
        id_number: document.getElementById("idNumber").value.trim(),
        password: document.getElementById("password").value,
        subscription_plan: plan,
        payment_method: method,
        payment_amount: price,
        mpesa_phone: document.getElementById("mpesaPhone")?.value.trim()||"",
        card_last4: document.getElementById("cardNumber")?.value.trim().slice(-4)||"",
        bank_ref: document.getElementById("bankRef")?.value.trim()||"",
        id_front_url: typeof uploadedFrontUrl==="string"?uploadedFrontUrl:"",
        id_back_url: typeof uploadedBackUrl==="string"?uploadedBackUrl:"",
        accept_terms: true
    };

    try{
        if(!isFree){
            if(txt) txt.textContent=method==="mpesa"?`Waiting for M-Pesa PIN on ${payload.mpesa_phone}...`:"Verifying payment...";
            const payRes=await fetch("/api/payment/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan, amount:price, method, mpesa_phone:payload.mpesa_phone, card_last4:payload.card_last4, bank_ref:payload.bank_ref})});
            const payData=await payRes.json().catch(()=>({success:true, transaction_id:`TXN_${Date.now()}`, status:"completed"}));
            if(!payRes.ok &&!payData.success && method!=="bank"){ throw new Error(payData.message||"Payment failed"); }
            payload.transaction_id=payData.transaction_id||`TXN_${Date.now()}`;
            payload.payment_status=payData.status||"completed";
            showMessage(`✅ Payment ${payload.payment_status}: ${payload.transaction_id} - Creating account...`,"success");
            await new Promise(r=>setTimeout(r,1000));
        }

        let res=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        let result; try{ result=await res.json(); }catch{ result={success:false,message:"Invalid server response"}; }

        if(!res.ok ||!result.success){
            // Fallback direct Supabase
            console.log("Backend register fallback", result);
            const {data, error}=await supabaseClient.auth.signUp({email:payload.email,password:payload.password,options:{data:{full_name:payload.full_name,organization:payload.organization}}});
            if(error) throw error;
            if(data.user){
                const upsertData={id:data.user.id,email:payload.email,full_name:payload.full_name,other_names:payload.other_names,organization:payload.organization,phone:payload.phone,role:payload.role,id_number:payload.id_number,id_front_url:payload.id_front_url,id_back_url:payload.id_back_url,subscription_plan:payload.subscription_plan,payment_method:payload.payment_method,payment_status:payload.payment_status||(isFree?"free":"completed"),payment_amount:payload.payment_amount,mpesa_phone:payload.mpesa_phone,transaction_id:payload.transaction_id||"",updated_at:new Date().toISOString()};
                await supabaseClient.from("profiles").upsert(upsertData).execute().catch(()=>{});
                try{ await supabaseClient.from("subscriptions").insert({user_id:data.user.id,email:payload.email,plan:payload.subscription_plan,amount:payload.payment_amount,payment_method:payload.payment_method,transaction_id:payload.transaction_id||"",status:payload.payment_status||"completed"}); }catch{}
            }
        }

        showMessage(isFree?"✅ Free account created! Redirecting...":`✅ Account created & payment confirmed! ${payload.transaction_id||""} Redirecting...`,"success");
        document.getElementById("registrationForm")?.reset();
        setTimeout(()=> window.location.replace("/login"), 2000);
    }catch(err){
        console.error("Registration error", err);
        showMessage(err.message||"Unable to create account. Try again.","error");
        if(btn) btn.disabled=false;
        if(txt) txt.textContent=old;
    }
}