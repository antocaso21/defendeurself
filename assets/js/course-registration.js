/* DefendEUrself course registration, verified email via Supabase Auth.
 * Basic works without any account. Data is written only after verified login.
 */
(()=>{
"use strict";
const conf=window.DEFEND_COURSE||{};
const $=(id)=>document.getElementById(id);
const status=$('course-status'), panel=$('course-module-panel'), list=$('course-modules');
const dialog=$('course-register-dialog'), form=$('course-register-form');
const buttons=[...document.querySelectorAll('[data-level]')];
const levelNames={basic:'Basic',intermediate:'Intermediate',advanced:'Advanced'};
let client=null,account=null,requestedLevel=null,busy=false;
const configured=Boolean(conf.supabaseUrl && conf.supabasePublishableKey);
const getLevelFromUrl=()=>{const p=new URLSearchParams(location.search);const l=p.get('level');return ['intermediate','advanced'].includes(l)?l:null;};
const setMessage=(message,type='info')=>{status.textContent=message; status.style.borderColor=type==='error'?'#e1b1bd':'#bdd5ff';status.style.background=type==='error'?'#fff0f4':'#eaf2ff';};
const showFeedback=(message,error=false)=>{const el=$('course-form-feedback');el.textContent=message;el.classList.toggle('error',error);};
const clean=(val,n=80)=>String(val||'').trim().slice(0,n);
const safeUrl=(value)=>{try {const u=new URL(value,location.href);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
function showModules(level){
  panel.hidden=false; $('course-panel-kicker').textContent='Level 0'+(['basic','intermediate','advanced'].indexOf(level)+1);
  $('course-panel-heading').textContent=levelNames[level]+' Micro-MOOCs';
  $('course-panel-description').textContent=`Seven learning modules at ${levelNames[level]} level. Each published resource opens in a new tab.`;
  list.textContent='';
  const modules=conf.modules?.[level]||[];
  for(let i=0;i<7;i++){
    const item=document.createElement('div');item.className='course-module';
    const num=document.createElement('span');num.className='course-module-num';num.textContent=String(i+1).padStart(2,'0');
    const name=document.createElement('span');name.className='course-module-name';name.textContent=`Micro-MOOC ${String(i+1).padStart(2,'0')}`;
    item.append(num,name);
    const href=safeUrl(modules[i]);
    if(href){const a=document.createElement('a');a.className='course-module-btn';a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Open module ↗';item.append(a);}
    else{const soon=document.createElement('span');soon.className='course-module-soon';soon.textContent='Link pending';item.append(soon);}
    list.append(item);
  }
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}
function refreshAccount(){
  const label=$('course-account-label'),signout=$('course-signout');
  if(account){label.textContent=`Signed in as ${account.email||'verified learner'}. Intermediate and Advanced are available.`;signout.classList.remove('course-hidden');}
  else{label.textContent='Basic is open. Verify your email once for Intermediate and Advanced.';signout.classList.add('course-hidden');}
  for(const b of buttons){const level=b.dataset.level;b.textContent=level==='basic'?'Explore Basic modules':account?'Explore '+levelNames[level]+' modules':'Register to access';}
}
function openRegistration(level){requestedLevel=level;$('course-dialog-description').textContent=`Register once to access ${levelNames[level]} and Advanced/Intermediate whenever you return to this browser.`;showFeedback('');
 if(typeof dialog.showModal==='function')dialog.showModal(); else dialog.setAttribute('open','');
}
async function recordRegistration(){
 if(!account||!client)return false;
 const m=account.user_metadata||{};
 const reg={user_id:account.id,email:account.email,first_name:clean(m.first_name),last_name:clean(m.last_name),country:clean(m.country,60)||null,privacy_ack_at:m.privacy_ack_at||new Date().toISOString()};
 const {error}=await client.from('course_registrations').insert(reg);
 if(error && error.code!=='23505')throw error;
 return true;
}
async function recordEnrollment(level){
 if(!client||!account)throw new Error('Sign in is required.');
 await recordRegistration();
 const {error}=await client.from('course_enrollments').insert({user_id:account.id,level});
 if(error && error.code!=='23505')throw error;
}
async function enterLevel(level){
 if(busy)return;
 if(level==='basic'){showModules('basic');return;}
 if(!configured||!client){setMessage('Registration is not yet connected to the database. The site administrator must configure Supabase before Intermediate and Advanced can be used.','error');openRegistration(level);showFeedback('Registration is not active yet. Please contact the project team.',true);return;}
 if(!account){openRegistration(level);return;}
 busy=true;setMessage(`Preparing ${levelNames[level]} access…`);
 try {await recordEnrollment(level);setMessage(`${levelNames[level]} access confirmed for ${account.email}. Your registration is saved.`);showModules(level);}
 catch(e){console.error('Course enrollment failed',e);setMessage('Your account is verified, but we could not save the level registration. Please try again or contact the project team.','error');}
 finally{busy=false;}
}
for(const b of buttons)b.addEventListener('click',()=>enterLevel(b.dataset.level));
$('course-close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',(e)=>{if(e.target===dialog)dialog.close();});
$('course-privacy-link').href=conf.privacyNoticeUrl||'privacy-course.html';
$('course-signout').addEventListener('click',async()=>{if(client){await client.auth.signOut();account=null;refreshAccount();panel.hidden=true;setMessage('Signed out. Basic remains free to access.');}});
form.addEventListener('submit',async(e)=>{
 e.preventDefault();
 if(!configured||!client){showFeedback('Registration is not configured on this website. Please contact the project team.',true);return;}
 if(!form.reportValidity()||!$('course-privacy-ack').checked)return;
 const first=clean($('course-first-name').value),last=clean($('course-last-name').value),email=clean($('course-email').value,254).toLowerCase(),country=$('course-country').value;
 const submit=$('course-submit');submit.disabled=true;showFeedback('Requesting your verification link…');
 try{
  const level=requestedLevel||'intermediate';
  const url=new URL(location.pathname,location.origin);url.searchParams.set('level',level);url.hash='training';
  const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:url.toString(),data:{first_name:first,last_name:last,country,privacy_ack_at:new Date().toISOString()}}});
  if(error)throw error;
  showFeedback(`Check ${email} and click the verification link. Then return to this page to open your course.`);
  setMessage('Verification email requested. Your level registration will be saved only after you confirm the link.');
 }catch(err){console.error('Registration email failed',err);showFeedback('We could not send your access link. Please check the email address or try again later.',true);}
 finally{submit.disabled=false;}
});
async function onSignedIn(user){account=user;refreshAccount();const level=getLevelFromUrl();if(level)await enterLevel(level);else setMessage(`Welcome back, ${account.email}. You can access Intermediate and Advanced with your verified email.`);}
async function init(){
 refreshAccount();
 if(!configured){setMessage('Basic is freely available. Intermediate and Advanced registrations will open when the project database is connected.');return;}
 if(!window.supabase?.createClient){setMessage('We could not load the registration service. Try refreshing the page. Basic is still available.','error');return;}
 try{
  client=window.supabase.createClient(conf.supabaseUrl,conf.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data:{user},error}=await client.auth.getUser();if(error)console.info('No current authenticated session',error.message);
  if(user)await onSignedIn(user);
  else setMessage('Basic is open. Intermediate and Advanced require a short free email registration.');
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_IN'&&session?.user){queueMicrotask(async()=>{
      if(account?.id!==session.user.id)await onSignedIn(session.user);
    });}
    if(event==='SIGNED_OUT'){account=null;refreshAccount();}
  });
 }catch(err){console.error('Course setup failed',err);setMessage('The registration service is currently unavailable. Basic stays accessible.','error');}
}
init();
})();
