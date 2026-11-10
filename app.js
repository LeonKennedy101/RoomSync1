/* RoomSync localStorage. Demo password: 1234 */
const $=s=>document.querySelector(s),KEY='roomsync_v2';
const mins=t=>{const[a,b]=t.split(':');return+a*60+ +b};
const f12=t=>{let[h,m]=t.split(':');h=+h;return`${(h+11)%12+1}:${m} ${h<12?'AM':'PM'}`};
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const nextDay=()=>{const d=new Date();d.setDate(d.getDate()+1);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const validDate=d=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||'');if(!m)return false;const date=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return date.getUTCFullYear()==+m[1]&&date.getUTCMonth()==+m[2]-1&&date.getUTCDate()==+m[3]};
const schoolYear=()=>{const d=today(),y=+d.slice(0,4),m=+d.slice(5,7),startYear=m>=8?y:y-1;return{start:`${startYear}-08-01`,end:`${startYear+1}-07-31`}};
const fd=d=>new Date(d+'T00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const wk=d=>new Date(d+'T00:00').getDay(),ov=(a,b,c,d)=>mins(a)<mins(d)&&mins(c)<mins(b);
const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const roomType=r=>r.type||'Unspecified';
const ROOM_TYPES=['Classroom','Computer Laboratory','Science Laboratory','Lecture Hall','Seminar Room','Conference Room'];
const BOOKING_PURPOSES=['Consultation','Review session','Exam','Activity','Regular class (room change)','Other'];
const ROOM_TYPE_DEFAULTS={C411:'Computer Laboratory',C111:'Classroom',R201:'Classroom',L101:'Lecture Hall',C413:'Computer Laboratory'};
const YR=['','1st','2nd','3rd','4th'],TO=[];
for(let h=7;h<=21;h++)for(const m of['00','30'])if(h<21||m=='00')TO.push(String(h).padStart(2,'0')+':'+m);

const seed=()=>({
 users:[
  {id:'2024-6767',name:'Prof. Peter Parker',role:'faculty',title:'Professor III'},
  {id:'2024-6768',name:'Prof. Norman Osborn',role:'faculty',title:'Professor II'},
  {id:'2024-0001',name:'Mary Jane Watson',role:'clerk',title:'University Clerk (Admin)'},
  {id:'2024-0002',name:'Dean Stephen Strange',role:'dean',title:'Dean, College of Computer Studies'},
  {id:'2024-0003',name:'Dr. Charles Xavier',role:'vpaa',title:'University Administrator (VPAA)'},
  {id:'2026-1001',name:'Gwen Stacy',role:'student',section:'WMA-3A',title:'BSIT 3rd Year · WMA-3A'},
  {id:'2026-1002',name:'Miles Morales',role:'student',section:'WMA-3A',title:'BSIT 3rd Year · WMA-3A'}].map(u=>({pw:'1234',...u})),
 rooms:[['C411',40,1],['C111',40,1],['R201',40,1],['L101',45,1],['C312',40,0],['C413',40,1],['C414',50,1]].map(([n,cap,on])=>({n,c:'CCS',cap,on:!!on,type:ROOM_TYPE_DEFAULTS[n],offReason:n=='C312'?'Under maintenance':''})),
 classes:[
  {f:'2024-6767',s:'07:00',e:'10:00',r:'C411',sub:'Web Development',sec:'WMA-3A'},
  {f:'2024-6767',s:'10:00',e:'13:00',r:'R201',sub:'CC6',sec:'TSM-3B'},
  {f:'2024-6767',s:'13:00',e:'16:00',r:'C111',sub:'CC6',sec:'NA-3A'},
  {f:'2024-6767',s:'16:00',e:'18:00',r:'L101',sub:'Web Development',sec:'WMA-3B'},
  {f:'2024-6768',s:'08:00',e:'11:00',r:'C312',sub:'CC6',sec:'TSM-1B'},
  {f:'2024-6768',s:'13:00',e:'16:00',r:'C413',sub:'CC3',sec:'NA-2A'}],
 mk:[
  {id:1,f:'2024-6767',sec:'WMA-3A',sub:'Web Development',n:45,od:'2026-08-29',date:'2026-09-03',s:'18:00',e:'21:00',room:'C414',why:'Class suspension due to typhoon',v:{'2026-1001':'y','2026-1002':'y'},
   ap:[{l:'Dean',r:'dean',s:'approved',by:'Dean Stephen Strange',at:'2026-09-01'},{l:'Univ. Admin',r:'vpaa',s:'approved',by:'Dr. Charles Xavier',at:'2026-09-02'}]},
  {id:2,f:'2024-6768',sec:'TSM-1B',sub:'CC6',n:38,od:'2026-09-01',date:'2026-09-05',s:'13:00',e:'15:00',room:'C312',why:'Professor attended a university seminar',v:{},
   ap:[{l:'Dean',r:'dean',s:'rejected',by:'Dean Stephen Strange',at:'2026-09-02',note:'Room C312 is under maintenance and the proposed time overlaps a college event.'},{l:'Univ. Admin',r:'vpaa',s:'waiting'}]},
  {id:3,f:'2024-6768',sec:'NA-2A',sub:'CC3',n:35,od:'2026-09-02',date:'2026-09-07',s:'16:00',e:'18:00',room:'C411',why:'Class suspension due to power outage',v:{},
   ap:[{l:'Dean',r:'dean',s:'pending'},{l:'Univ. Admin',r:'vpaa',s:'waiting'}]}],
 log:[{d:'2026-09-03',t:'Added Room C414',s:'Completed'},{d:'2026-09-03',t:'Updated Web Development schedule',s:'Updated'},{d:'2026-09-02',t:'Makeup class scheduled',s:'Completed'}]
});
let db=JSON.parse(localStorage[KEY]||'null')||seed(),me=db.users.find(u=>u.id==sessionStorage.uid),pg='home',F={},ed=null,sel=null,hook=null,sidebarOpen=true,mobileNavOpen=false;
db.bookings=db.bookings||[];
db.classes=db.classes||[];
const CAMPUS_WEEKDAYS=[1,2,3,4,5,6];
const classDays=c=>{
 const source=c.days??c.weekdays??c.day??c.weekday??c.dayOfWeek;
 if(source==null)return[...CAMPUS_WEEKDAYS];
 const names=['sun','mon','tue','wed','thu','fri','sat'];
 const values=Array.isArray(source)?source:String(source).split(/[,\s/]+/);
 return[...new Set(values.map(value=>{
  if(Number.isInteger(value))return value;
  const text=String(value).trim().toLowerCase();
  return /^\d$/.test(text)?+text:names.findIndex(name=>name==text.slice(0,3));
 }).filter(day=>day>=1&&day<=6))];
};
db.classes.forEach(c=>{c.days=classDays(c)});
db.rooms.forEach(r=>{
 if(!r.type||!ROOM_TYPES.includes(r.type))r.type=ROOM_TYPE_DEFAULTS[r.n]||undefined;
 if(r.n=='C312'&&!r.on&&!r.offReason)r.offReason='Under maintenance';
});
const save=()=>localStorage[KEY]=JSON.stringify(db),U=id=>db.users.find(u=>u.id==id)||{name:id};
const log=(t,s='Completed')=>{db.log.unshift({d:today(),t,s});save()};
const toast=t=>{const d=$('#toast');d.textContent=t;d.className='show';setTimeout(()=>d.className='',2800)};
const confirmAction=(title,message,label)=>new Promise(resolve=>{
 const root=$('#dialog-root');
 root.innerHTML=`<dialog class=confirm-dialog aria-labelledby=confirm-title aria-describedby=confirm-message>
  <h2 id=confirm-title>${E(title)}</h2><p id=confirm-message>${E(message)}</p>
  <form method=dialog class=rw><button class=sm value=cancel>Back</button><button class=sm value=confirm>${E(label)}</button></form>
 </dialog>`;
 const dialog=root.querySelector('dialog');
 dialog.addEventListener('close',()=>{const confirmed=dialog.returnValue=='confirm';root.innerHTML='';resolve(confirmed)},{once:true});
 dialog.showModal();
});

/* ---------- rules ---------- */
const st=m=>m.cx?'Cancelled':m.ap.some(a=>a.s=='rejected')?'Rejected':m.ap.every(a=>a.s=='approved')?'Scheduled':'Pending '+m.ap.find(a=>a.s=='pending').l;
const active=m=>!/Cancel|Reject/.test(st(m));
const bookingStatus=b=>b.cx?'Cancelled':!b.ap?'Approved':b.ap.some(a=>a.s=='rejected')?'Rejected':b.ap.every(a=>a.s=='approved')?'Approved':'Pending '+b.ap.find(a=>a.s=='pending').l;
const activeBooking=b=>!/Cancel|Reject/.test(bookingStatus(b));
const bookingNeedsAction=b=>!b.cx&&b.ap?.some(a=>a.r==me.role&&a.s=='pending');
const busy=(d,s,e,fn,ign)=>[...db.classes.filter(c=>c.days.includes(wk(d))).map(c=>({...c,t:'Regular'})),
 ...db.bookings.filter(b=>b.date==d&&activeBooking(b)).map(b=>({f:b.f,s:b.s,e:b.e,r:b.r,t:'One-time reservation'})),
 ...db.mk.filter(m=>m.id!=ign&&active(m)&&m.date==d).map(m=>({f:m.f,sec:m.sec,sub:m.sub,s:m.s,e:m.e,r:m.room,t:'Makeup'}))].filter(x=>ov(s,e,x.s,x.e)&&fn(x));
const roomOK=(r,d,s,e)=>r.on&&!busy(d,s,e,x=>x.r==r.n).length;
const roomStatus=(r,d,s,e,attendees=0)=>{
 if(!r.on)return r.offReason?`Unavailable: ${E(r.offReason)}`:'Unavailable (marked by the clerk)';
 const reasons=[];
 if(attendees>r.cap)reasons.push(`Too small (${r.cap} seats; ${attendees} requested)`);
 const c=db.classes.find(x=>x.days.includes(wk(d))&&x.r==r.n&&ov(s,e,x.s,x.e));
 if(c)reasons.push(`Weekly class: ${E(c.sub)} (${E(c.sec)}), ${f12(c.s)}–${f12(c.e)}`);
 const booking=db.bookings.find(b=>activeBooking(b)&&b.r==r.n&&b.date==d&&ov(s,e,b.s,b.e));
 if(booking)reasons.push(`Reserved: ${E(booking.purpose||'One-time session')}, ${f12(booking.s)}–${f12(booking.e)}`);
 const makeup=db.mk.find(m=>active(m)&&m.room==r.n&&m.date==d&&ov(s,e,m.s,m.e));
 if(makeup)reasons.push(`Makeup class: ${E(makeup.sub)} (${E(makeup.sec)}), ${f12(makeup.s)}–${f12(makeup.e)} (${E(st(makeup))})`);
 return reasons.join('; ');
};
const tal=m=>{const a=Object.values(m.v);return`${a.filter(x=>x=='y').length} available, ${a.filter(x=>x=='n').length} not available (of ${m.n} students)`};

/* ---------- ui helpers ---------- */
const bd=m=>{const s=st(m);return`<b class="bd ${s=='Scheduled'?'ok':/Rej|Canc/.test(s)?'bad':'wt'}">${s}</b>`};
const trk=m=>{const x=[['Submitted','dn'],...m.ap.map(a=>[a.l,{approved:'dn',rejected:'xx',pending:'cu',waiting:''}[a.s]]),['Scheduled',st(m)=='Scheduled'?'dn':'']];
 return`<div class=trk>${x.map(([l,c])=>`<span class="${c}">${l}</span>`).join('')}</div>`};
const notes=m=>m.ap.filter(a=>a.by).map(a=>`<div class=mu>${a.l}: ${a.s} by ${E(a.by)} on ${fd(a.at)}${a.note?` — “${E(a.note)}”`:''}</div>`).join('')+(m.cx?`<div class=mu>Cancelled: “${E(m.cx)}”</div>`:'');
const tb=(h,r,e='No records yet.')=>`<div class=card><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${r.length?r.map(x=>`<tr${x.off?' class=off':''}>${x.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan=${h.length}>${e}</td></tr>`}</table></div>`;
const stats=a=>`<div class=stats>${a.map(([n,l])=>`<div class=st><b>${n}</b>${l}</div>`).join('')}</div>`;
const S=(k,v,o)=>`<select onchange="sf('${k}',this.value)">${o.map(x=>{const[a,b]=Array.isArray(x)?x:[x,x];return`<option value="${E(a)}"${a==v?' selected':''}>${E(b)}</option>`}).join('')}</select>`;
const I=(k,v,t='text',x='')=>`<input type=${t} value="${E(v)}" oninput="sf('${k}',this.value)" ${x}>`;
const TS=TO.map(t=>[t,f12(t)]),sf=(k,v)=>{F[k]=v;if(pg=='avail'&&['d','s','e','n'].includes(k))F.room=null;hook&&hook()};
const dayRows=(d,fn)=>[...db.classes.filter(c=>c.days.includes(wk(d))&&fn(c)).map(c=>[c.s,c.e,c.r,c.sub,c.sec,'Regular']),
 ...db.bookings.filter(b=>activeBooking(b)&&b.date==d&&fn({f:b.f})).map(b=>[b.s,b.e,b.r,b.purpose||'One-time session','—',`One-time reservation (${bookingStatus(b)})`]),
 ...db.mk.filter(m=>active(m)&&m.date==d&&fn({f:m.f,sec:m.sec})).map(m=>[m.s,m.e,m.room,m.sub,m.sec,st(m)=='Scheduled'?'Makeup':'Makeup (pending)'])]
 .sort((a,b)=>mins(a[0])-mins(b[0])).map(r=>[`${f12(r[0])} – ${f12(r[1])}`,...r.slice(2)]);
const SH=['Time','Room','Subject','Section','Type'];
const nowT=()=>{const h=new Date().getHours();return[String(h).padStart(2,'0')+':00',String(Math.min(h+1,23)).padStart(2,'0')+':59']};
const freeNow=()=>{const[s,e]=nowT();return db.rooms.filter(r=>roomOK(r,today(),s,e)).length};

const ic=n=>`<img class="ic b" src="assets/icons/${n}-blue.png" alt=""><img class="ic k" src="assets/icons/${n}-black.png" alt="">`,ib=n=>`<img class=ic src="assets/icons/${n}-white.png" alt="">`;
const NAV={faculty:[['home','Home','home'],['avail','Classroom Availability','calendar-check'],['makeup','Makeup Class Scheduler','calendar-search'],['sched','My Schedule','notebook']],
 student:[['home','Home','home'],['votes','Makeup Class Votes','check-circle']],
 clerk:[['home','Admin Home','home'],['rooms','Classroom Management','school'],['mk','Makeup Class Management','notebook']],
 dean:[['home','Home','home'],['appr','Approvals','check-circle']],vpaa:[['home','Home','home'],['appr','Approvals','check-circle']]};
const avatars={'2024-6767':'peter','2024-6768':'norman','2024-0001':'mary-jane','2024-0002':'stephen','2024-0003':'charles','2026-1001':'gwen','2026-1002':'miles'};
const avatarSrc=u=>`assets/avatars/${avatars[u.id]||'default'}.svg`;
const showAvatar=()=>{
 const root=$('#dialog-root');
 root.innerHTML=`<dialog class=avatar-dialog aria-labelledby=avatar-title>
  <h2 id=avatar-title>${E(me.name)}</h2>
  <img src="${avatarSrc(me)}" alt="${E(me.name)} profile portrait">
  <p>${E(me.title)}</p>
  <form method=dialog><button class=neutral>Close</button></form>
 </dialog>`;
 const dialog=root.querySelector('dialog');
 dialog.addEventListener('click',event=>{if(event.target==dialog)dialog.close()});
 dialog.addEventListener('close',()=>{root.innerHTML='';$('.avatar-trigger')?.focus()},{once:true});
 dialog.showModal();
};
const isMobileSidebar=()=>window.matchMedia('(max-width: 700px)').matches;
const sidebarButtonLabel=()=>isMobileSidebar()?(mobileNavOpen?'Close navigation':'Open navigation'):`${sidebarOpen?'Hide':'Show'} sidebar`;
const shell=(t,sub,body)=>`<aside id=portal-sidebar><button type=button class="sidebar-toggle icon-only neutral" aria-label="${sidebarButtonLabel()}" title="${sidebarButtonLabel()}" aria-controls=portal-sidebar aria-expanded="${isMobileSidebar()?mobileNavOpen:sidebarOpen}" onclick="toggleSidebar()"><svg aria-hidden=true viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><div class=me><button type=button class=avatar-trigger aria-label="View larger profile photo for ${E(me.name)}" onclick="showAvatar()"><img class=avatar src="${avatarSrc(me)}" alt="" width=62 height=62></button><b>${E(me.name)}</b><small>${E(me.title)}</small></div>
 <nav aria-label="Portal navigation">
 ${NAV[me.role].map(([k,l,i])=>`<a tabindex=0 class="${pg==k?'on':''}" onclick="go('${k}')" onkeydown="event.key=='Enter'&&go('${k}')">${ic(i)}${l}</a>`).join('')}
 </nav>
 <a class=lo tabindex=0 onclick="out()" onkeydown="event.key=='Enter'&&out()">${ic('logout')}Logout</a></aside>
 <main><header><div class=header-title><div><h1>${t}</h1><p>${sub}</p></div></div><div class=hr><span class=lg><img src="assets/logo-dark.png" alt="RoomSync"></span><span>${new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}<br>${fd(today())}</span></div></header><section>${body}</section></main>`;

/* ---------- auth ---------- */
const loginPg=()=>`<div id=login><a class=login-exit href="index.html">Back to website</a><div class=brand><img class=login-logo src="assets/logo.png" alt="RoomSync: Classroom Availability | Makeup Class Scheduler"></div>
 <div class=lc><h2>Welcome back!</h2><label for=id>Employee / Student ID</label><input id=id autocomplete=username>
 <label for=pw>Password <span class=bad>*</span></label><input id=pw type=password autocomplete=current-password onkeydown="event.key=='Enter'&&login()">
 <div class=err id=err></div><button onclick=login()>Login</button>
 <p class=mu>Demo accounts (password 1234):<br>${db.users.map(u=>`<button class=chip onclick="$('#id').value='${u.id}';$('#pw').value='1234'">${u.role}</button>`).join('')}</p></div></div>`;
const login=()=>{const u=db.users.find(u=>u.id==$('#id').value.trim()&&u.pw==$('#pw').value);if(!u)return $('#err').textContent='Invalid ID or password.';sessionStorage.uid=u.id;me=u;go('home')};
const out=async()=>{
 if(!await confirmAction('Log out?',`Are you sure you want to log out of RoomSync, ${me.name}?`,'Log out'))return;
 sessionStorage.removeItem('uid');me=null;render();
};
const go=p=>{pg=p;F={};sel=null;ed=null;render()};
const setScheduleDate=d=>{const{start,end}=schoolYear();if(d<start||d>end){$('.schedule-date').value=F.d;toast('Choose a date within the current school year.');return}
 F.d=d;hook&&hook()};
const toggleSidebar=()=>{
 if(isMobileSidebar()){
  mobileNavOpen=!mobileNavOpen;
  $('#app').classList.toggle('mobile-nav-open',mobileNavOpen);
  const button=$('.sidebar-toggle'),label=sidebarButtonLabel();
  button.setAttribute('aria-expanded',String(mobileNavOpen));
  button.setAttribute('aria-label',label);
  button.title=label;
  return;
 }
 sidebarOpen=!sidebarOpen;
 $('#app').classList.toggle('sidebar-hidden',!sidebarOpen);
 const button=$('.sidebar-toggle'),label=`${sidebarOpen?'Hide':'Show'} sidebar`;
 button.setAttribute('aria-expanded',String(sidebarOpen));
 button.setAttribute('aria-label',label);
 button.title=label;
};
document.addEventListener('click',event=>{
 if(!mobileNavOpen||$('#portal-sidebar')?.contains(event.target))return;
 mobileNavOpen=false;
 $('#app').classList.remove('mobile-nav-open');
 const button=$('.sidebar-toggle'),label=sidebarButtonLabel();
 button.setAttribute('aria-expanded','false');
 button.setAttribute('aria-label',label);
 button.title=label;
});
document.addEventListener('keydown',event=>{
 if(event.key!='Escape'||!mobileNavOpen)return;
 mobileNavOpen=false;
 $('#app').classList.remove('mobile-nav-open');
 const button=$('.sidebar-toggle'),label=sidebarButtonLabel();
 button.setAttribute('aria-expanded','false');
 button.setAttribute('aria-label',label);
 button.title=label;
 button.focus();
});
window.addEventListener('resize',()=>{
 if(isMobileSidebar())return;
 mobileNavOpen=false;
 $('#app').classList.remove('mobile-nav-open');
 const button=$('.sidebar-toggle');
 if(button){
  const label=sidebarButtonLabel();
  button.setAttribute('aria-expanded',String(sidebarOpen));
  button.setAttribute('aria-label',label);
  button.title=label;
 }
});

/* ---------- faculty ---------- */
const fHome=()=>{const mine=x=>x.f==me.id,mk=db.mk.filter(m=>m.f==me.id&&active(m));
 return shell('Faculty Home','Here’s your classroom &amp; schedule overview.',stats([[freeNow(),'Available Rooms now'],[db.classes.filter(mine).length,'My Classes'],[mk.length,'Makeup Classes']])+
 `<h3>Today’s Schedule</h3>`+tb(SH,dayRows(today(),mine),'No classes today.')+`<button onclick="go('sched')">View Schedule</button>`)};
const aRes=()=>{const r=$('#res');if(!r)return;if(!F.go){r.innerHTML='';return}
 const bad=!F.d||F.d<today()||mins(F.s)>=mins(F.e)||!Number.isInteger(+F.n)||+F.n<1;
 if(F.room&&!db.rooms.some(x=>x.n==F.room&&!roomStatus(x,F.d,F.s,F.e,+F.n)))F.room=null;
 r.innerHTML=bad?`<div class=chk>${F.d<today()?'Choose today or a future date.':'Choose an end time after the start time and enter at least one attendee.'}</div>`:
 tb(['Room','Room Type','Capacity','Status',''],db.rooms.filter(x=>x.c=='CCS').map(x=>{const status=roomStatus(x,F.d,F.s,F.e,+F.n),ok=!status;const row=['Room '+x.n,E(roomType(x)),x.cap,ok?'<span class=ok>● Available for this time</span>':`<span class=bad>● ${status}</span>`,
  ok?`<button class=sm onclick="F.room='${x.n}';aRes()">${F.room==x.n?'Selected':'Select room'}</button>`:'<span class=mu>—</span>'];if(!ok)row.off=1;return row}))+
 (F.room?`<p class=mu>Room ${E(F.room)} is selected for ${E(F.kind)}. The request will be reviewed by the Dean, then the University Administrator.</p><button onclick="bookRoom()">Submit for approval</button>`:'')+
 (db.bookings.filter(b=>b.f==me.id&&b.date==F.d&&bookingStatus(b)!='Cancelled').length?`<h3>My room requests for ${fd(F.d)}</h3>${tb(['Time','Room','Purpose','Attendees','Status','Action'],db.bookings.filter(b=>b.f==me.id&&b.date==F.d&&bookingStatus(b)!='Cancelled').map(b=>[`${f12(b.s)} – ${f12(b.e)}`,b.r,E(b.purpose||'One-time session'),b.attendees||'—',bookingStatus(b),activeBooking(b)?`<button class=rd onclick="cancelBooking(${b.id})">${bookingStatus(b).startsWith('Pending')?'Withdraw request':'Cancel reservation'}</button>`:(b.ap||[]).filter(a=>a.note).map(a=>E(`${a.l}: ${a.note}`)).join('<br>')||'—']))}`:'');
};
const bookRoom=async()=>{const r=db.rooms.find(x=>x.n==F.room);
 if(!r||!F.d||F.d<today()||mins(F.s)>=mins(F.e)||!BOOKING_PURPOSES.includes(F.kind)||!Number.isInteger(+F.n)||+F.n<1||roomStatus(r,F.d,F.s,F.e,+F.n)){F.room=null;aRes();return toast('That room is no longer available. Please check availability again.')}
 if(!await confirmAction('Submit one-time room request',`Request Room ${r.n} for ${F.kind} on ${fd(F.d)} from ${f12(F.s)} to ${f12(F.e)}? The request will go to the Dean and then the University Administrator.`,'Submit request'))return;
 db.bookings.push({id:Date.now(),f:me.id,date:F.d,s:F.s,e:F.e,r:r.n,purpose:F.kind,attendees:+F.n,ap:[{l:'Dean',r:'dean',s:'pending'},{l:'Univ. Admin',r:'vpaa',s:'waiting'}]});F.room=null;
 log(`One-time room request: Room ${r.n} for ${F.kind} (${f12(F.s)}–${f12(F.e)})`,'Pending');aRes();toast('Request submitted. Waiting for the Dean’s approval.');
};
const cancelBooking=async id=>{const b=db.bookings.find(x=>x.id==id&&x.f==me.id);
 if(!b||!await confirmAction('Cancel room reservation',`Cancel your Room ${b.r} reservation on ${fd(b.date)}?`,'Cancel reservation'))return;
 db.bookings=db.bookings.filter(x=>x.id!=id);log(`Cancelled Room ${b.r} request/reservation`,'Cancelled');aRes();toast('Room request/reservation cancelled.');
};
const fAvail=()=>{F.d=F.d||today();F.s=F.s||'13:00';F.e=F.e||'14:30';F.kind=F.kind||BOOKING_PURPOSES[0];F.n=F.n||1;hook=aRes;
 return shell('Classroom Availability','Find a room for a one-time session or check options before planning a makeup class.',`<div class=card>
 <div class=availability-note>
  <h2>About room availability</h2>
  <div class=availability-note-grid>
   <div><h3>Rooms are only occupied during scheduled classes</h3><p>Assigned rooms are not reserved for the whole day. Check the gaps between weekly classes, or choose a future date to plan ahead.</p></div>
   <div><h3>Check before you reserve</h3><p>Availability also depends on existing reservations, makeup classes, room status, and whether the room has enough seats.</p></div>
   <div><h3>One-time sessions</h3><p>Request a room for a consultation, review session, exam, activity, or a regular class that needs a different room. Requests are reviewed by the Dean, then the University Administrator.</p></div>
   <div><h3>Makeup classes</h3><p>Use the Makeup Class Scheduler for makeup requests. They follow the separate Dean and University Administrator approval process.</p></div>
  </div>
 </div>
 <div class=g><div><label>College</label><select><option>College of Computer Studies</option></select></div>
 <div><label>Date</label>${I('d',F.d,'date')}</div><div><label>Start Time</label>${S('s',F.s,TS)}</div><div><label>End Time</label>${S('e',F.e,TS)}</div>
 <div><label>Session type</label>${S('kind',F.kind,BOOKING_PURPOSES)}</div><div><label>Number of attendees</label>${I('n',F.n,'number','min=1 step=1')}</div></div>
 <button onclick="F.go=1;F.room=null;aRes()">Check Availability ${ib('search')}</button></div><h3>Available Rooms</h3><div id=res></div>`)+(F.go?(setTimeout(aRes),''):'')};
const calc=()=>{const[sec,sub]=(F.cls||'|').split('|'),{d,od,s,e}=F,students=Number(F.n);
 const dateError=!validDate(d)?'Enter a valid makeup date.':d<today()?'The makeup date cannot be in the past.':!validDate(od)?'Enter a valid original class date.':d<=od?'The makeup date must be later than the original class date.':'';
 const studentError=!Number.isInteger(students)||students<=0?'Enter a whole number of students greater than zero.':'';
 const timeError=mins(s)>=mins(e)?'Choose an end time after the start time.':'';
 const error=dateError||studentError||timeError,bad=!!error;
 const sc=bad?[]:busy(d,s,e,x=>x.sec==sec),fc=bad?[]:busy(d,s,e,x=>x.f==me.id);
 const rm=db.rooms.map(r=>({r,ok:!bad&&roomOK(r,d,s,e)&&r.cap>=students,why:!r.on?'Unavailable':bad?'Check details':!roomOK(r,d,s,e)?'Booked':r.cap<students?'Too small':''}));
 if(F.room&&!rm.find(x=>x.r.n==F.room&&x.ok))F.room=null;
 const why=(F.why||'').trim(),whyOK=why.length>=10;
 const ok=!bad&&!sc.length&&!fc.length&&!!F.room&&whyOK;
 const list=a=>a.map(x=>`${x.sub} (${x.sec}, ${f12(x.s)}–${f12(x.e)})`).join('; ');
 const chk=error?`<span class=bad>● ${E(error)}</span>`:sc.length?`<span class=bad>● Conflict: ${sec} already has ${E(list(sc))}. Choose another schedule.</span>`:fc.length?`<span class=bad>● Conflict: you already have ${E(list(fc))}.</span>`:`<span class=ok>● Clear. ${sec} has no conflicting class during this time.</span>`;
 return{ok,error:error||(!whyOK?'Enter a specific reason with at least 10 characters.':''),studentsValid:!studentError,html:`<h3>Available Rooms</h3>${tb(['Room','Room Type','Capacity','Status',''],rm.map(x=>{const row=['Room '+x.r.n,E(roomType(x.r)),x.r.cap,x.ok?'<span class=ok>● Available</span>':`<span class=bad>● ${x.why}</span>`,
  x.ok?`<button class=sm onclick="F.room='${x.r.n}';upd()">${F.room==x.r.n?'Selected':'Select room'}</button>`:'<span class=mu>—</span>'];if(!x.ok)row.off=1;return row}))}
  <div class=chk><b>Schedule Check</b><br>${chk}</div><div class=chk><b>Approval needed</b><br>Dean → University Administrator. The room is held while pending and confirmed once both approve.</div>`}};
const upd=()=>{const c=calc();$('#dyn').innerHTML=c.html;$('#sb').disabled=!c.ok;
 const studentHint=$('#student-hint');
 if(studentHint){studentHint.className='chk '+(c.studentsValid?'ok':'bad');studentHint.textContent=c.studentsValid?'Student count looks good.':'Enter a whole number greater than zero.'}
 const hint=$('#reason-hint'),why=(F.why||'').trim();
 if(hint){hint.className='chk '+(why.length>=10?'ok':why?'bad':'mu');hint.textContent=why.length>=10?'Reason looks good.':`Enter a specific reason (at least 10 characters). ${why.length}/10 characters.`}
};
const fMakeup=()=>{const my=[...new Map(db.classes.filter(c=>c.f==me.id).map(c=>[c.sec+'|'+c.sub,c])).keys()];
 F.cls=F.cls||my[0];F.n=F.n||40;F.d=F.d||nextDay();F.od=F.od||today();F.s=F.s||'18:00';F.e=F.e||'21:00';F.why=F.why||'';hook=upd;const sec=F.cls.split('|')[0],studentsValid=Number.isInteger(+F.n)&&+F.n>0;
 return shell('Makeup Class Scheduler','Schedule a makeup class and request approval.',`<div class=card><div class=g>
 <div><label>Subject · Section</label>${S('cls',F.cls,my.map(k=>[k,k.split('|')[1]+' · '+k.split('|')[0]]))}</div><div><label>Number of students</label>${I('n',F.n,'number','min=1 step=1')}<div id=student-hint class="chk ${studentsValid?'ok':'bad'}">${studentsValid?'Student count looks good.':'Enter a whole number greater than zero.'}</div></div>
 <div><label>Start time</label>${S('s',F.s,TS)}</div><div><label>End time</label>${S('e',F.e,TS)}</div>
 <div><label>Original class date</label>${I('od',F.od,'date')}</div><div><label>Makeup class date</label>${I('d',F.d,'date',`min="${today()}"`)}</div></div>
 <label>Reason for makeup class (be specific)</label><textarea oninput="F.why=this.value;upd()" placeholder="Class suspension due to …">${E(F.why)}</textarea><div id=reason-hint class=chk>Enter a specific reason (at least 10 characters). ${(F.why||'').trim().length}/10 characters.</div></div>
 <div id=dyn>${calc().html}</div><button id=sb onclick=submitMk() ${calc().ok?'':'disabled'}>Submit for Approval ${ib('check-circle')}</button>`)};
const submitMk=()=>{const c=calc();if(!c.ok){upd();return toast(c.error||'Please resolve the schedule or room availability checks before submitting.')}
 const[sec,sub]=F.cls.split('|');db.mk.push({id:Date.now(),f:me.id,sec,sub,n:+F.n,od:F.od,date:F.d,s:F.s,e:F.e,room:F.room,why:F.why.trim(),v:{},
 ap:[{l:'Dean',r:'dean',s:'pending'},{l:'Univ. Admin',r:'vpaa',s:'waiting'}]});log(`Makeup request: ${sub} ${sec} (${me.name})`,'Pending');toast('Submitted. Waiting for the Dean’s approval.');go('sched')};
const mkCard=(m,x='')=>`<div class=card><div class=rw><b>${m.sub} · ${m.sec} — ${fd(m.date)}, ${f12(m.s)}–${f12(m.e)}, Room ${m.room}</b>${bd(m)}</div>
 <div class=mu>${E(U(m.f).name)} · original class ${fd(m.od)} · ${E(m.why)}</div>${trk(m)}${notes(m)}<div class=mu>Student votes: ${tal(m)}</div>${x}</div>`;
const fSched=()=>{const{start,end}=schoolYear();F.d=F.d||today();if(F.d<start||F.d>end)F.d=today();hook=()=>{$('#res').innerHTML=tb(SH,dayRows(F.d,x=>x.f==me.id),'No classes on this date.')};
 return shell('My Schedule','View your assigned class and makeup schedules.',`<div class=card><label for=schedule-date>Date (current school year: ${fd(start)} – ${fd(end)})</label><input id=schedule-date class=schedule-date type=date min="${start}" max="${end}" value="${E(F.d)}" onchange="setScheduleDate(this.value)"></div><div id=res>${tb(SH,dayRows(F.d,x=>x.f==me.id),'No classes on this date.')}</div>
 <h3>My Makeup Requests</h3>${db.mk.filter(m=>m.f==me.id).map(m=>mkCard(m,/Pending/.test(st(m))?`<button class="rd sm" onclick="cancelMk(${m.id},1)">Withdraw request</button>`:'')).join('')||'<div class=card>No requests yet.</div>'}`)};
const cancelMk=(id,self)=>{const m=db.mk.find(x=>x.id==id),r=self?'Withdrawn by faculty':($('#cx'+id)?.value||'').trim();if(r.length<10)return toast('Please give a detailed reason (at least 10 characters).');
 m.cx=r;log(`Makeup cancelled: ${m.sub} ${m.sec}`,'Cancelled');render()};

/* ---------- student ---------- */
const sRes=()=>{$('#res').innerHTML=tb(SH,dayRows(F.pd,x=>x.f==F.pf),'No classes on this date.')};
const sHome=()=>{const sec=me.section,mk=db.mk.filter(m=>m.sec==sec&&active(m)),profs=db.users.filter(u=>u.role=='faculty');F.pf=F.pf||profs[0].id;F.pd=F.pd||today();hook=sRes;
 return shell('Student Home',`Section ${sec} · view only`,stats([[dayRows(today(),x=>x.sec==sec).length,'Classes today'],[mk.filter(m=>!m.v[me.id]).length,'Makeup votes waiting'],[mk.filter(m=>st(m)=='Scheduled').length,'Scheduled makeups']])+
 `<h3>Today’s schedule for ${sec}</h3>`+tb(SH,dayRows(today(),x=>x.sec==sec),'No classes today.')+
 `<h3>View a professor’s schedule</h3><div class=card><div class=g><div>${S('pf',F.pf,profs.map(p=>[p.id,p.name]))}</div><div>${I('pd',F.pd,'date')}</div></div></div><div id=res>${tb(SH,dayRows(F.pd,x=>x.f==F.pf),'No classes on this date.')}</div>`)};
const vote=async(id,v)=>{const m=db.mk.find(x=>x.id==id&&x.sec==me.section&&active(x));if(!m)return toast('This makeup class is no longer available for voting.');
 const previous=m.v[me.id],changing=!!previous;
 if(previous==v)return toast('That is already your saved vote.');
 const response=v=='y'?'available':'not available';
 if(!await confirmAction(changing?'Confirm vote change':'Confirm your vote',changing?`Change your vote to “${response}”?`:`Submit your vote as “${response}”?`,changing?'Change vote':'Confirm vote'))return;
 m.v[me.id]=v;delete F.changeVote;save();render();toast(changing?'Vote changed.':'Vote saved.')};
const voteActions=m=>{const current=m.v[me.id];
 if(!current)return`<button class="sm good" onclick="vote(${m.id},'y')">I’m available</button><button class="sm rd" onclick="vote(${m.id},'n')">Not available</button>`;
 if(F.changeVote==m.id)return`<div class=chk>Your current vote is <b>${current=='y'?'I’m available':'Not available'}</b>. Choose the other option to change it.</div>
  <button class="sm ${current=='n'?'good':'rd'}" onclick="vote(${m.id},'${current=='y'?'n':'y'}')">Change to ${current=='y'?'Not available':'I’m available'}</button>
  <button class="sm neutral" onclick="delete F.changeVote;render()">Keep current vote</button>`;
 return`<div class=rw><span class=mu>Your vote: <b>${current=='y'?'I’m available':'Not available'}</b></span><button class="sm neutral" onclick="F.changeVote=${m.id};render()">Change vote</button></div>`;
};
const sVotes=()=>shell('Makeup Class Votes','Tell the approvers if you can attend. Your vote helps, but does not replace approval.',
 db.mk.filter(m=>m.sec==me.section&&active(m)).map(m=>mkCard(m,voteActions(m))).join('')||'<div class=card>No makeup classes proposed for your section.</div>');

/* ---------- approvers (dean / university administrator) ---------- */
const mine=m=>m.ap.some(a=>a.r==me.role&&a.s=='pending')&&!m.cx;
const act=(id,yes)=>{const m=db.mk.find(x=>x.id==id),i=m.ap.findIndex(a=>a.r==me.role&&a.s=='pending'),a=m.ap[i],note=($('#rj'+id)?.value||'').trim();
 if(!a)return;if(!yes&&note.length<15)return toast('Rejecting needs a detailed reason (at least 15 characters).');
 Object.assign(a,{s:yes?'approved':'rejected',by:me.name,at:today()});if(note)a.note=note;if(yes&&m.ap[i+1])m.ap[i+1].s='pending';
 log(`${yes?'Approved':'Rejected'} by ${me.title.split(',')[0]}: ${m.sub} ${m.sec}`,yes?'Approved':'Rejected');toast(yes?'Approved.':'Rejected. Faculty will see your reason.');render()};
const bookingCard=b=>`<div class=card><div class=rw><b>${E(b.purpose||'One-time session')} — Room ${E(b.r)}, ${fd(b.date)}, ${f12(b.s)}–${f12(b.e)}</b><b class="bd ${bookingStatus(b)=='Approved'?'ok':bookingStatus(b)=='Rejected'?'bad':'wt'}">${E(bookingStatus(b))}</b></div>
 <div class=mu>${E(U(b.f).name)} · ${b.attendees||'—'} attendees</div>${(b.ap||[]).map(a=>`<div class=mu>${E(a.l)}: ${E(a.s)}${a.by?` by ${E(a.by)} on ${fd(a.at)}`:''}${a.note?` — “${E(a.note)}”`:''}</div>`).join('')}</div>`;
const actBooking=(id,yes)=>{const b=db.bookings.find(x=>x.id==id),i=b?.ap?.findIndex(a=>a.r==me.role&&a.s=='pending'),a=i>=0?b.ap[i]:null,note=($('#brj'+id)?.value||'').trim();
 if(!a)return toast('This room request is no longer awaiting your decision.');
 if(!yes&&note.length<15)return toast('Rejecting needs a detailed reason (at least 15 characters).');
 Object.assign(a,{s:yes?'approved':'rejected',by:me.name,at:today()});if(note)a.note=note;if(yes&&b.ap[i+1])b.ap[i+1].s='pending';
 log(`${yes?'Approved':'Rejected'} one-time room request: Room ${b.r} for ${b.purpose||'session'}`,yes?'Approved':'Rejected');toast(yes?'Room request approved.':'Room request rejected.');render()};
const aHome=()=>{const q=db.mk.filter(mine),bq=db.bookings.filter(bookingNeedsAction),h=db.mk.filter(m=>m.ap.some(a=>a.r==me.role&&a.by)),bh=db.bookings.filter(b=>b.ap?.some(a=>a.r==me.role&&a.by));
 const decided=[...h.flatMap(m=>m.ap.filter(a=>a.r==me.role&&a.by)),...bh.flatMap(b=>b.ap.filter(a=>a.r==me.role&&a.by))];
 return shell(me.role=='dean'?'Dean Home':'University Admin Home','Review makeup class and one-time room requests.',stats([[q.length+bq.length,'Awaiting my action'],[decided.filter(a=>a.s=='approved').length,'Approved by me'],[decided.filter(a=>a.s=='rejected').length,'Rejected by me']])+
 `<button onclick="go('appr')">Open approvals</button>`)};
const aAppr=()=>{const requests=db.bookings.filter(bookingNeedsAction),decisions=db.bookings.filter(b=>b.ap?.some(a=>a.r==me.role&&a.by));
 const makeupActions=db.mk.filter(mine).map(m=>mkCard(m,`<textarea id=rj${m.id} placeholder="Reason (required when rejecting)"></textarea><button onclick="act(${m.id},1)">Approve</button><button class=rd onclick="act(${m.id},0)">Reject</button>`)).join('');
 const bookingActions=requests.map(b=>bookingCard(b)+`<textarea id=brj${b.id} placeholder="Reason (required when rejecting)"></textarea><button onclick="actBooking(${b.id},1)">Approve</button><button class=rd onclick="actBooking(${b.id},0)">Reject</button>`).join('');
 const makeupDecisions=db.mk.filter(m=>m.ap.some(a=>a.r==me.role&&a.by)).map(m=>mkCard(m)).join('');
 const bookingDecisions=decisions.map(bookingCard).join('');
 return shell('Approvals','Review makeup class and one-time room requests. Rejections need a detailed reason.',
 `<h3>Awaiting my action</h3>${makeupActions}${bookingActions||(!makeupActions?'<div class=card>Nothing to review.</div>':'')}
 <h3>My decisions</h3>${makeupDecisions}${bookingDecisions||(!makeupDecisions?'<div class=card>No decisions yet.</div>':'')}`);
};

/* ---------- clerk (admin) ---------- */
const cHome=()=>shell('Admin Home','Manage classrooms, schedules, and makeup classes.',stats([[db.rooms.length,'Classrooms'],[db.users.filter(u=>u.role=='faculty').length,'Faculty'],[db.classes.length,'Classes'],[db.mk.length,'Makeup Classes']])+
 `<h3>Recent Activity</h3>`+tb(['Date','Activity','Status'],db.log.slice(0,6).map(l=>[fd(l.d),E(l.t),l.s])));
const addRoom=()=>{const n=(F.rn||'').trim().toUpperCase(),type=F.rt||'',cap=+F.rcap;if(!n||!ROOM_TYPES.includes(type)||!(cap>0))return toast('Enter a room number, choose a room type, and enter a capacity.');
 if(db.rooms.some((r,i)=>i!=ed&&r.n==n))return toast('That room number already exists.');const o={n,c:'CCS',cap,on:(F.rs||'1')=='1'};
 o.type=type;o.offReason=o.on?'':(F.offReason||'').trim();
 if(ed==null){db.rooms.push(o);log('Added Room '+n)}else{db.rooms[ed]=o;log('Updated Room '+n,'Updated')}ed=null;F={};save();render()};
const edit=i=>{const r=db.rooms[i];ed=i;F={rn:r.n,rt:ROOM_TYPES.includes(r.type)?r.type:'',rcap:r.cap,rs:r.on?'1':'0',offReason:r.offReason||''};render()};
const cRooms=()=>shell('Classroom Management','Add, update, and manage classroom information.',`<div class=card>${ed==null?'<h3>Add a room</h3>':`<h3>Editing Room ${E(db.rooms[ed].n)}</h3>`}<div class=mu>Enter the room details below, then save your changes.</div><div class=g><div><label>Room number</label>${I('rn',F.rn||'')}</div>
 <div><label>Room type</label>${S('rt',F.rt||'',[['','Select a room type'],...ROOM_TYPES])}</div>
 <div><label>College</label><select><option>College of Computer Studies</option></select></div><div><label>Capacity</label>${I('rcap',F.rcap||'','number','min=1')}</div>
 <div><label>Status</label>${S('rs',F.rs||'1',[['1','Available'],['0','Unavailable']])}</div>
 <div><label>Unavailable reason (optional)</label>${I('offReason',F.offReason||'','text','placeholder="For example: maintenance"')}</div></div><button onclick="go('rooms')">Cancel</button><button onclick=addRoom()>${ed==null?'Add Room':'Save Changes'}</button></div>`+
 tb(['Room','Room Type','College','Capacity','Status','Action'],db.rooms.map((r,i)=>{const status=r.on?'<span class=ok>● Available</span>':`<span class=bad>● Unavailable${r.offReason?`: ${E(r.offReason)}`:''}</span>`,x=[E(r.n),E(roomType(r)),r.c,r.cap,status,`<button class=sm onclick="edit(${i})">Edit</button>`];if(!r.on)x.off=1;return x})));
const deleteCancelledMk=async id=>{
 if(me.role!='clerk')return toast('Only the clerk can delete makeup class records.');
 const m=db.mk.find(x=>x.id==id),status=m&&st(m);
 if(!m||!['Cancelled','Rejected'].includes(status))return toast('Only cancelled or rejected makeup classes can be deleted.');
 if(!await confirmAction('Delete makeup class record',`Permanently delete the ${status.toLowerCase()} makeup class for ${m.sub} (${m.sec})? You can print the record before deleting it.`,'Delete record'))return;
 db.mk=db.mk.filter(x=>x.id!=id);
 if(sel==id)sel=null;
 log(`Deleted ${status.toLowerCase()} makeup class: ${m.sub} ${m.sec}`,'Deleted');
 render();toast('Makeup class record deleted.');
};
const lst=()=>{const q=(F.q||'').toLowerCase(),ft=F.ft||'All';$('#lst').innerHTML=tb(['Subject','Section','Faculty','Date','Time','Room','Status','Action'],
 db.mk.filter(m=>(ft=='All'||st(m).startsWith(ft))&&(m.sub+m.sec+U(m.f).name+m.room).toLowerCase().includes(q)).map(m=>[E(m.sub),m.sec,E(U(m.f).name.split(' ').pop()),fd(m.date),`${f12(m.s)}–${f12(m.e)}`,m.room,bd(m),`<button class=sm onclick="sel=${m.id};render()">View</button>${['Cancelled','Rejected'].includes(st(m))?`<button class="sm rd" onclick="deleteCancelledMk(${m.id})">Delete</button>`:''}`]))};
const detail=m=>`<div id=print class=card><h3>Makeup Class Authorization Form</h3><div class=mu>Tarlac State University · College of Computer Studies</div><p>
 <b>Subject:</b> ${E(m.sub)}<br><b>Section:</b> ${m.sec} (${m.n} students)<br><b>Faculty:</b> ${E(U(m.f).name)}<br><b>Original date:</b> ${fd(m.od)}<br><b>Makeup date:</b> ${fd(m.date)}<br>
 <b>Time:</b> ${f12(m.s)} – ${f12(m.e)}<br><b>Room:</b> ${m.room}<br><b>Reason:</b> ${E(m.why)}<br><b>Status:</b> ${st(m)}<br><b>Student votes:</b> ${tal(m)}</p>${notes(m)}
 ${m.ap.map(a=>`<div class=sig><u>${a.s=='approved'?E(a.by)+' · '+fd(a.at):'&nbsp;'}</u>${a.l} approval</div>`).join('')}</div>
 <button onclick=print()>${ib('print')}Print form</button>${active(m)?`<textarea id=cx${m.id} placeholder="Reason for cancelling (required)"></textarea><button class=rd onclick="cancelMk(${m.id})">Cancel makeup class</button>`:''}`;
const cMk=()=>{hook=lst;const m=db.mk.find(x=>x.id==sel);
 return shell('Makeup Class Management','View, track, and print faculty makeup class records.',`<div class=card><div class=g><div><label>Search</label><input value="${E(F.q||'')}" oninput="sf('q',this.value)"></div><div><label>Filter</label>${S('ft',F.ft||'All',['All','Scheduled','Pending','Rejected','Cancelled'])}</div></div><div class=mu>Rejected and cancelled records remain available to view and print. The clerk can delete individual records when they are no longer needed.</div></div>
 <div id=lst></div>${m?detail(m):''}`)+(setTimeout(lst),'')};

/* ---------- router ---------- */
const PG={faculty:{home:fHome,avail:fAvail,makeup:fMakeup,sched:fSched},student:{home:sHome,votes:sVotes},clerk:{home:cHome,rooms:cRooms,mk:cMk},dean:{home:aHome,appr:aAppr},vpaa:{home:aHome,appr:aAppr}};
function render(){hook=null;mobileNavOpen=false;$('#app').className=me?`app${sidebarOpen?'':' sidebar-hidden'}`:'';$('#app').innerHTML=me?PG[me.role][pg]():loginPg();save()}
render();
