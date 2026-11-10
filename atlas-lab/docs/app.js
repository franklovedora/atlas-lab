'use strict';
const $=s=>document.querySelector(s);
const types=['免管理费 DD','银行开户奖励','信用卡还款','信用卡开卡奖励'],icons=['▤','✧','▰','✦'];
const local=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const now=new Date(),today=local(now);
function offset(n){const d=new Date(now);d.setDate(d.getDate()+n);return local(d)}
const id=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)), b=>b.toString(16).padStart(2,'0')).join(''),money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:Number.isInteger(n)?0:2}).format(n);
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const samples=[['Chase Checking',0,500,300,12,0],['Sapphire Preferred',2,420,0,3,0],['Citi Checking',1,1500,1000,6,300],['American Express Gold',3,6000,3250,27,600]].map(([name,type,target,done,n,bonus])=>({id:id(),name,type,target,done,due:offset(n),bonus,notes:''}));
let demo=localStorage.getItem('atlas-mode')!=='personal',filter='全部',editing=null;
const key=()=>demo?'atlas-example-v1':'atlas-personal-v1';
function read(){if(cloud.email)return cloud.list;const saved=localStorage.getItem(key());if(saved)return JSON.parse(saved);const list=demo?samples:[];localStorage.setItem(key(),JSON.stringify(list));return list}
const complete=t=>t.done>=t.target,days=t=>Math.round((Date.parse(t.due)-Date.parse(today))/86400000);
const period=t=>t.type===0||t.type===2;
function render(){
const tasks=read(),open=tasks.filter(t=>!complete(t)).sort((a,b)=>a.due.localeCompare(b.due)),finished=tasks.length-open.length;
$('#account').textContent=cloud.email?'退出账号':'账号登录';$('#mode').hidden=!!cloud.email;
$('#mode').textContent=demo?'示例模式 · 进入我的账本 →':'我的账本 · 查看示例';
$('#today').textContent=now.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})+(demo?' · 示例数据':' · 我的账本');
$('#percent').textContent=(tasks.length?Math.round(100*finished/tasks.length):0)+'%';
$('#count').textContent='已完成 '+finished+' / '+tasks.length+' 项任务';
$('#soon').textContent=open.filter(t=>days(t)>=0&&days(t)<=7).length+' 项';
$('#rewards').textContent=money(open.reduce((s,t)=>s+t.bonus,0));$('#total').textContent=tasks.length+' 项';
const groups=['全部','银行账户','信用卡','已完成'];$('#filters').innerHTML=groups.map(g=>'<button class="'+(g===filter?'active':'')+'" data-filter="'+g+'">'+g+'</button>').join('');
const visible=tasks.filter(t=>filter==='全部'||(filter==='银行账户'?t.type<2:filter==='信用卡'?t.type>=2:complete(t)));
$('#rows').innerHTML=visible.map(t=>'<button class="row" data-id="'+safe(t.id)+'"><span class="icon t'+t.type+'">'+icons[t.type]+'</span><span class="body"><span class="rowtitle"><b>'+safe(t.name)+'</b><span class="pill">'+(complete(t)?'已完成':types[t.type])+'</span></span><span class="sub"><span>'+money(t.done)+' / '+money(t.target)+'</span><span>'+t.due.slice(5).replace('-','/')+' 截止</span></span><span class="bar" style="display:block"><i style="width:'+Math.min(100,t.done/t.target*100)+'%"></i></span></span><span class="arrow">›</span></button>').join('')||'<div class="empty">暂无任务，可通过「新建任务」开始记录。</div>';
$('#upcoming').innerHTML=open.slice(0,5).map(t=>'<button class="event" data-id="'+safe(t.id)+'"><span class="date"><small>'+Number(t.due.slice(5,7))+' 月</small>'+t.due.slice(-2)+'</span><span><b>'+safe(t.name)+'</b><label>'+types[t.type]+' · '+(days(t)<0?'逾期 '+(-days(t))+' 天':days(t)===0?'今天到期':'剩余 '+days(t)+' 天')+'</label></span></button>').join('')||'<div class="empty">暂无待办提醒</div>';
$('#export').disabled=!open.length;
}
function switchMode(){if(cloud.email)return;demo=!demo;localStorage.setItem('atlas-mode',demo?'demo':'personal');filter='全部';render()}
$('#mode').onclick=switchMode;
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b?.dataset.filter){filter=b.dataset.filter;render()}if(b?.dataset.id)show(read().find(t=>t.id===b.dataset.id))});
function input(label,key,type,value,attrs=''){return '<label>'+label+'<input name="'+key+'" type="'+type+'" value="'+safe(value)+'" '+attrs+'></label>'}
const dlg=$('dialog'),form=$('#form');
function show(t=null){editing=t?.id||null;$('#dialogtitle').textContent=(editing?'更新任务':'新建任务')+(demo?' · 示例':'');$('#remove').hidden=!t;
$('#fields').innerHTML=input('账户或任务名称','name','text',t?.name||'','required maxlength="100" placeholder="例如 Chase Checking"')+'<label>任务类别<select name="type">'+types.map((v,i)=>'<option value="'+i+'" '+(i===t?.type?'selected':'')+'>'+v+'</option>').join('')+'</select></label>'+input('本期目标金额（USD）','target','number',t?.target??'','min=".01" step=".01" required')+input('已完成金额（USD）','done','number',t?.done??0,'min="0" step=".01" required')+(t?input('本次新增金额（保存时累加）','increment','number','','min="0" step=".01"'):'')+'<div id="rewardfield">'+input('奖励金额（USD，可选）','bonus','number',t?.bonus||'','min="0" step=".01"')+'</div>'+input('截止日期','due','date',t?.due||today,'required')+input('备注 / 具体要求','notes','text',t?.notes||'','maxlength="500"')+(t&&period(t)?'<button class="record" type="button" id="next">创建下一期任务</button>':'');
const kind=form.elements.type;kind.onchange=()=>$('#rewardfield').hidden=![1,3].includes(+kind.value);kind.onchange();
if($('#next'))$('#next').onclick=async()=>{const [y,m,d]=t.due.split('-').map(Number),anchor=t.anchor||d,date=local(new Date(y,m,Math.min(anchor,new Date(y,m+1,0).getDate())));if(read().some(x=>x.previous===t.id)){alert('该任务已创建下一期。');return}const next={...t,id:id(),due:date,done:0,previous:t.id,anchor};const list=read();list.push(next);if(await writeList(list)){render();show(next)}};
if(!dlg.open)dlg.showModal()}
$('#add').onclick=()=>{if(demo)switchMode();show()};$('#close').onclick=()=>dlg.close();
form.onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(form)),list=read(),index=list.findIndex(t=>t.id===editing);if(!v.name.trim()){form.elements.name.focus();return}const old=list[index],t={...old,id:editing||id(),name:v.name.trim(),type:+v.type,target:+v.target,done:Math.round((+v.done+(+v.increment||0))*100)/100,bonus:[1,3].includes(+v.type)?+v.bonus:0,due:v.due,notes:v.notes,anchor:old?.due===v.due?old.anchor:Number(v.due.slice(-2))};if(index<0)list.push(t);else list[index]=t;if(await writeList(list)){dlg.close();render()}};
$('#remove').onclick=async()=>{if(confirm('确定删除这项任务？')){if(await writeList(read().filter(t=>t.id!==editing))){dlg.close();render()}}};
const escICS=v=>v.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/[,;]/g,s=>'\\'+s);
$('#export').onclick=()=>{const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Atlas//Account Planner//ZH','CALSCALE:GREGORIAN'];for(const t of read().filter(t=>!complete(t))){lines.push('BEGIN:VEVENT','UID:'+t.id+'@atlas','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z'),'DTSTART;VALUE=DATE:'+t.due.replaceAll('-',''),'SUMMARY:'+escICS(t.name+' · '+types[t.type]));for(const n of [3,1])lines.push('BEGIN:VALARM','TRIGGER:-P'+n+'D','ACTION:DISPLAY','DESCRIPTION:账户任务即将到期','END:VALARM');lines.push('END:VEVENT')}lines.push('END:VCALENDAR');const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=demo?'Atlas-示例.ics':'Atlas-提醒.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
window.addEventListener('storage',render);render();
const personalKey='atlas-personal-v1';
$('#backup').onclick=()=>{
  const blob=new Blob([cloud.email?JSON.stringify(cloud.list):localStorage.getItem(personalKey)||'[]'],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='atlas-personal-'+local(new Date())+'.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('#restore').onclick=()=>$('#backupfile').click();
$('#backupfile').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try {
    const records=JSON.parse(await file.text());
    const validId=s=>typeof s==='string'&&/^[a-f0-9-]{32,36}$/i.test(s);
    const amount=n=>Number.isFinite(n)&&n>=0;
    if(!Array.isArray(records)||!records.every(t=>t&&validId(t.id)&&typeof t.name==='string'&&t.name.trim()&&Number.isInteger(t.type)&&types[t.type]&&amount(t.target)&&t.target>0&&amount(t.done)&&amount(t.bonus)&&typeof t.due==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.due)&&local(new Date(t.due+'T12:00:00'))===t.due&&(t.notes==null||typeof t.notes==='string')&&(t.anchor==null||(Number.isInteger(t.anchor)&&t.anchor>=1&&t.anchor<=31))&&(t.previous==null||validId(t.previous))))throw Error();
    if(!confirm('将 '+records.length+' 项记录合并到我的账本？'))return;
    const merged=new Map((cloud.email?cloud.list:JSON.parse(localStorage.getItem(personalKey)||'[]')).map(t=>[t.id,t]));
    records.forEach(t=>merged.set(t.id,t));if(cloud.email){if(!await writeList([...merged.values()]))return}else localStorage.setItem(personalKey,JSON.stringify([...merged.values()]));
    if(demo)switchMode();else render();
  } catch {alert('导入失败，请检查文件是否为有效的 Atlas JSON 备份，以及浏览器存储空间是否充足。')}
  finally {e.target.value=''}
};
const statusLine=$('#syncstatus'),auth=$('#auth'), loginForm=$('#loginform');
function cloudStatus(){statusLine.textContent=cloud.email?'已同步 · '+cloud.email+' · '+new Date().toLocaleTimeString():'本地模式 · 数据保存在当前浏览器'}
function leaveCloud(){cloud.clear();demo=localStorage.getItem('atlas-mode')!=='personal';filter='全部';render();cloudStatus()}
function reportCloudError(error) {
  if(error.status===401){dlg.close();leaveCloud();statusLine.textContent='登录已过期，请重新登录同步账本。';return}
  statusLine.textContent=error.message||'网络连接失败，请重试';
  if(error.conflict){dlg.close();render()}
}
async function writeList(list){
  if(!cloud.email){localStorage.setItem(key(),JSON.stringify(list));return true}
  if(cloud.busy){alert('正在同步，请稍后再试。');return false}
  cloud.busy=true;
  try{await cloud.save(list);cloudStatus();return true}
  catch(error){reportCloudError(error);alert(statusLine.textContent);return false}
  finally{cloud.busy=false}
}
$('#account').onclick=async()=>{
  if(cloud.busy)return;
  if(cloud.email){
    cloud.busy=true;
    try{await cloud.logout()}catch{}finally{leaveCloud();cloud.busy=false}
    return;
  }
  loginForm.reset();$('#authmsg').textContent=cloud.ready()?'使用邮箱和密码跨设备同步。':'部署者需先按 README 设置 docs/config.js 并运行 schema.sql。';
  for(const b of loginForm.querySelectorAll('button[value]'))b.disabled=!cloud.ready();
  auth.showModal();
};
$('#dismiss').onclick=()=>auth.close();
loginForm.onsubmit=async e=>{
  e.preventDefault();if(cloud.busy||!cloud.ready())return;
  cloud.busy=true;auth.oncancel=event=>event.preventDefault();$('#dismiss').disabled=true;
  try{
    const ok=await cloud.login(loginForm.elements.email.value.trim(),loginForm.elements.password.value,e.submitter?.value==='register');
    loginForm.elements.password.value='';
    if(!ok){$('#authmsg').textContent='请查收验证邮件，完成验证后回到这里登录。';return}
    auth.close();demo=false;filter='全部';render();cloudStatus();
  }catch(error){$('#authmsg').textContent='登录或注册失败：'+error.message}
  finally{cloud.busy=false;auth.oncancel=null;$('#dismiss').disabled=false}
};
async function pull(){
  if(!cloud.email||cloud.busy||dlg.open||document.hidden)return;
  cloud.busy=true;
  // Prevent opening an editor on a revision which is being replaced.
  document.querySelector('main').inert=true;
  try{await cloud.refresh();render();cloudStatus()}catch(error){reportCloudError(error)}
  finally{cloud.busy=false;document.querySelector('main').inert=false}
}
window.addEventListener('focus',pull);setInterval(pull,30000);cloudStatus();
