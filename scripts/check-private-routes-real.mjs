import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
// Explicitly opt into creating dedicated QA records. Never run against production.
if(!process.argv.includes('--allow-test-records'))throw new Error('Run with --allow-test-records against the local development services.');
const baseline=process.argv.includes('--baseline');
const output=process.env.BOOKNOOK_QA_OUTPUT || join(tmpdir(),'booknook-private-routes-'+Date.now());await mkdir(output,{recursive:true});
const run='QA-PRIVATE-'+new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);
const users=[0].map(i=>({name:`${run} Reader ${i+1}`,email:`${run.toLowerCase()}-${i+1}@example.test`,password:'Qa'+randomBytes(24).toString('base64url')+'9!'}));
const state={run,userIds:[],emails:users.map(u=>u.email),bookId:null,loanId:null};
const cases=[],events=[],browserIssues=[],networkFailures=[];let book,loan,tokenA,documents=0,ws,browser;
const reportPath=join(output,baseline?'private-routes-before.json':'private-routes-after.json');
async function save(){await writeFile(reportPath,JSON.stringify({run,created:state,scenarios:cases,api:events,browserIssues,networkFailures},null,2));await writeFile(join(output,'private-routes-state.json'),JSON.stringify(state));}
async function scenario(name,fn){try{const detail=await fn();cases.push({name,status:'PASS',detail});console.log('PASS '+name);}catch(error){cases.push({name,status:'FAIL',detail:error.qaMessage||'Expected result was not observed; inspect sanitized API evidence.',errorType:error.name});console.log('FAIL '+name);}await save();}
const check=(condition,message)=>{if(!condition){const e=new Error();e.qaMessage=message;throw e;}};
function safeResult(method,path,status,json){
 const result={method,path,status,success:json?.success,errorCode:json?.error?.code};
 const d=json?.data;
 if(d?.title?.includes(run)||d?._id===state.bookId)result.data={_id:d._id,title:d.title,totalCopies:d.totalCopies,availableCopies:d.availableCopies,addedByUserId:d.addedByUserId,createdAt:d.createdAt,updatedAt:d.updatedAt,deleted:d.deleted};
 else if(d?.bookId===state.bookId)result.data={_id:d._id,bookId:d.bookId,userId:d.userId,borrowDate:d.borrowDate,returnDate:d.returnDate,returnedAt:d.returnedAt,status:d.status};
 else if(d?.pagination)result.data={count:(d.books||d.borrows||[]).length,pagination:d.pagination};
 return result;
}
async function api(path,{method='GET',body,token=tokenA}={}){
 const r=await fetch('http://localhost:5000'+path,{method,headers:{Origin:'http://localhost:3000',Accept:'application/json',...(token?{Authorization:`Bearer ${token}`} :{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});
 let json;try{json=await r.json();}catch{json=null;}
 events.push(safeResult(method,path,r.status,json));await save();return{status:r.status,json,headers:r.headers};
}
let seq=0;const pending=new Map(),requests=new Map();
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){expression='(async()=>{const V=s=>Array.from(document.querySelectorAll(s)).find(e=>e.getBoundingClientRect().width>0 && !e.closest("[hidden],[inert]") && getComputedStyle(e).visibility!=="hidden");return eval('+JSON.stringify(expression)+');})()';const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails){const e=new Error();e.qaMessage='Browser evaluation failed (details suppressed).';throw e;}return r.result.value;}
async function wait(expression){for(let i=0;i<300;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}const e=new Error();e.qaMessage='Browser state did not reach the expected condition within 30 seconds.';throw e;}
const click=text=>evaluate(`Array.from(document.querySelectorAll('button,[role=menuitem]')).filter(b=>b.getBoundingClientRect().width>0).find(b=>b.textContent.trim()===${JSON.stringify(text)})?.click()`);
const link=href=>evaluate(`Array.from(document.querySelectorAll('a')).filter(a=>a.getBoundingClientRect().width>0).find(a=>a.getAttribute('href')===${JSON.stringify(href)})?.click()`);
async function fill(id,value){await evaluate(`(()=>{const e=V('[role=dialog] #'+${JSON.stringify(id)}) || V('#'+${JSON.stringify(id)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);}
async function session(){return evaluate(`fetch('/api/auth/get-session',{cache:'no-store'}).then(async r=>({status:r.status,data:await r.json()}))`);}
async function jwt(){return evaluate(`fetch('/api/auth/token',{cache:'no-store'}).then(r=>r.json()).then(j=>j.token)`);}
try{
 browser=spawn(process.env.BOOKNOOK_BROWSER_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9344',`--user-data-dir=${join(tmpdir(),'booknook-real-e2e-'+Date.now())}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:9344/json/list')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const targets=await(await fetch('http://127.0.0.1:9344/json/list')).json();ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',async event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error('Browser command failed.'));else p.resolve(m.result);return;}
  if(m.method==='Network.requestWillBeSent'){const {requestId,request,type}=m.params;const u=new URL(request.url);if(type==='Document')documents++;if((u.port==='5000'&&['/books','/borrows'].some(p=>u.pathname.startsWith(p)))||u.pathname.startsWith('/api/auth/'))requests.set(requestId,{method:request.method,path:u.pathname+u.search,business:u.port==='5000'});}
  if(m.method==='Network.responseReceived'){const info=requests.get(m.params.requestId);if(info){info.status=m.params.response.status;}}
  if(m.method==='Network.loadingFinished'){const info=requests.get(m.params.requestId);if(info){requests.delete(m.params.requestId);if(info.business){try{const r=await send('Network.getResponseBody',{requestId:m.params.requestId});const j=JSON.parse(r.body);events.push(safeResult(info.method,info.path,info.status,j));if(info.method==='POST'&&info.path==='/books'&&j.data?.title?.includes(run)){book=j.data;state.bookId=book._id;}if(info.method==='POST'&&info.path==='/borrows'&&j.data?.bookId===state.bookId){loan=j.data;state.loanId=loan._id;}await save();}catch{}}else if(!['/api/auth/token','/api/auth/get-session'].some(p=>info.path.startsWith(p)))events.push({method:info.method,path:info.path,status:info.status});}}
  if(m.method==='Runtime.exceptionThrown')browserIssues.push({type:'uncaught-exception',source:m.params.exceptionDetails.url?new URL(m.params.exceptionDetails.url,'http://localhost:3000').pathname:'unknown'});
  if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error'){const text=m.params.args.map(a=>a.description||a.value||'').join(' ');browserIssues.push({type:'console-error',category:/hydrat/i.test(text)?'hydration':/fetch|network/i.test(text)?'network':/server component/i.test(text)?'server-component':'other',reactCode:text.match(/Minified React error #(\d+)/)?.[1],firstLine:text.split('\n')[0].replace(/https?:\/\/[^\s]+/g,'[URL]').replace(/mongodb[^\s]+/g,'[REDACTED]').slice(0,180),frames:text.split('\n').filter(line=>/^\s+at /.test(line)).slice(0,8).map(line=>line.replace(/https?:\/\/[^\s)]+/g,'[source URL]'))});}
  if(m.method==='Network.loadingFailed'&&!m.params.canceled)networkFailures.push({type:m.params.type,error:m.params.errorText});
 });
 await send('Runtime.enable');await send('Network.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:950,deviceScaleFactor:1,mobile:false});


 await scenario('Anonymous private routes require login',async()=>{
  for(const path of ['/add-book','/my-books','/my-borrows','/books/000000000000000000000001','/profile']){
   await send('Page.navigate',{url:'http://localhost:3000'+path});await wait('location.pathname==="/login" && !!V("#auth-email")');
   check(await evaluate(`decodeURIComponent(location.search).includes(${JSON.stringify(path)})`),'Login redirect lost the private destination.');
  }
  const r=await api('/books/000000000000000000000001',{token:null});check(r.status===401,'Private API accepted anonymous identity.');
  return {routes:5,privateApiStatus:401};
 });
 await scenario('Register dedicated real QA user and preserve redirect',async()=>{
  await send('Page.navigate',{url:'http://localhost:3000/register?callbackURL=%2Fadd-book'});await wait('!!V("#auth-name")');
  for(const [id,value] of [['auth-name',users[0].name],['auth-email',users[0].email],['auth-password',users[0].password],['auth-confirmPassword',users[0].password]])await fill(id,value);
  await evaluate('V("form.auth-form").requestSubmit()');await wait('location.pathname==="/add-book" && !!V("#book-title") && !!V(".account-trigger")');
  const s=await session();check(!!s.data?.user?.id,'Registration did not establish verified identity.');state.userIds[0]=s.data.user.id;tokenA=await jwt();check(typeof tokenA==='string','Better Auth JWT unavailable.');return {userId:state.userIds[0],status:s.status};
 });
 if(!tokenA)throw new Error();
 await scenario('Server verified identity persists on refresh',async()=>{await send('Page.reload');await wait('!!V("#book-title") && !!V(".account-trigger")');const s=await session();check(s.data?.user?.id===state.userIds[0],'Session changed on refresh.');check(await evaluate(`V('#owner-email').value===${JSON.stringify(users[0].email)}`),'Form identity differs from session.');return {identityMatches:true};});
 if(!baseline){
  await scenario('Create real QA book through existing UI',async()=>{
   for(const [id,value] of [['book-title',run+' One Copy'],['book-author','BookNook QA'],['book-category','Science'],['book-totalCopies','1'],['book-image','http://localhost:3000/assets/home/atomic-habits.jpg'],['book-description','Dedicated private-route rendering regression record for '+run]])await fill(id,value);
   await evaluate('V("form.book-form").requestSubmit()');await wait('location.pathname.startsWith("/books/") && !!V(".book-borrow")');
   for(let i=0;i<50&&!book;i++)await new Promise(r=>setTimeout(r,100));check(book?.addedByUserId===state.userIds[0]&&book.availableCopies===1,'Create response identity/inventory incorrect.');return {status:201,bookId:state.bookId};
  });
  if(!state.bookId)throw new Error();
 }
 await scenario('Private Link navigation preserves identity and Navbar',async()=>{
  await link('/');await wait('!!V(".new-arrivals .book-details") && !!V(".account-trigger")');await evaluate('window.qaNavbar=V(".site-header");true');const initial=documents;
  for(const path of ['/add-book','/my-books','/my-borrows','/books']){
   await link(path);await wait(`location.pathname===${JSON.stringify(path)}`);
   const ready={'/add-book':'!!V("#book-title")','/my-books':'!!V(".book-library") && !V(".book-skeleton")','/my-borrows':'!!V(".borrow-state") || !!V(".borrow-record")','/books':'!!V(".catalog-grid .book-details")'};
   await wait(ready[path]);await wait('!!V(".account-trigger")');check(await evaluate('window.qaNavbar===V(".site-header")'),'Shared Navbar remounted.');
  }
  const detail=state.bookId?'/books/'+state.bookId:await evaluate('V(".catalog-grid .book-details").getAttribute("href")');await link(detail);await wait('!!V(".book-detail-copy h1")');check(documents===initial,'Internal navigation loaded a new document.');
  const s=await session();check(s.data?.user?.id===state.userIds[0],'Private navigation lost identity.');return {privateRoutes:4,documentReloads:0};
 });
 await scenario('Profile uses the same server guard',async()=>{await send('Page.navigate',{url:'http://localhost:3000/profile'});await wait('!!V(".profile-header")');check(await evaluate(`V('.profile-header').textContent.includes(${JSON.stringify(users[0].email)})`),'Profile identity mismatch.');return {identityMatches:true};});
 if(!baseline){
  await scenario('Real owner edit and inventory preserved',async()=>{await link('/my-books');await wait('!!V("button[aria-label^=Edit]")');await evaluate('V("button[aria-label^=Edit]").click()');await wait('!!V("[role=dialog] #book-title")');await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await fill('book-title',run+' One Copy Edited');await wait('V("[role=dialog] #book-title")?.value.endsWith("Edited")');await evaluate('V("[role=dialog] form.book-form").requestSubmit()');await wait('!V("[role=dialog]") && V("tbody")?.textContent.includes("Edited")');const r=await api('/books/'+state.bookId);check(r.status===200&&r.json.data.title.endsWith('Edited')&&r.json.data.availableCopies===1,'Owner edit failed.');return {status:r.status};});
  await scenario('Real Borrow modal, transaction and duplicate protection',async()=>{await link('/books');await wait('!!V(".catalog-grid .book-details")');await link('/books/'+state.bookId);await wait('!!V(".book-borrow")');await click('Borrow This Book');await wait('!!V(".borrow-dialog")');await click('Confirm Borrow');await wait('!V("[role=dialog]") && V(".book-borrow")?.disabled');for(let i=0;i<50&&!loan;i++)await new Promise(r=>setTimeout(r,100));check(loan?.userId===state.userIds[0]&&Date.parse(loan.returnDate)-Date.parse(loan.borrowDate)===604800000,'Borrow identity/due date incorrect.');const r=await api('/books/'+state.bookId);check(r.json.data.availableCopies===0,'Inventory not decremented once.');const duplicate=await api('/borrows',{method:'POST',body:{bookId:state.bookId}});check(duplicate.status===409&&duplicate.json.error.code==='DUPLICATE_BORROW','Duplicate active borrowing allowed.');return {borrowStatus:201,availableCopies:0,duplicateStatus:409};});
  await scenario('Real return UI and retained history',async()=>{await link('/my-borrows');await wait('!!V(".borrow-record")');await click('Return Book');await wait('!!V(".borrow-dialog")');await click('Confirm Return');await wait('V(".borrow-status")?.textContent==="Returned"');const history=await api('/borrows');const l=history.json.data.borrows.find(x=>x._id===state.loanId);const r=await api('/books/'+state.bookId);check(l?.status==='returned'&&!!l.returnedAt&&r.json.data.availableCopies===1,'Return/history/inventory incorrect.');const again=await api('/borrows/'+state.loanId,{method:'DELETE'});const after=await api('/books/'+state.bookId);check(again.status===409&&after.json.data.availableCopies===1,'Repeated return changed inventory.');return {returnStatus:200,repeatStatus:409,availableCopies:1,historyRetained:true};});
  await scenario('Delete only returned QA book through UI',async()=>{await link('/my-books');await wait('!!V("button[aria-label^=Delete]")');await evaluate('V("button[aria-label^=Delete]").click()');await wait('!!V("[role=dialog]")');await click('Delete Book');await wait('V(".book-state")?.textContent.includes("No books")');const r=await api('/books/'+state.bookId);check(r.status===404,'QA book still exists.');return {deleteStatus:200,getAfterDelete:404};});
 }
 await scenario('Logout closes session and restores server-side protection',async()=>{await wait('!!V(".account-trigger")');await evaluate('V(".account-trigger").click()');await wait('!!V(".account-menu")');await click('Logout');await wait('location.pathname==="/" && !!V(".login-link")');const s=await session();check(!s.data?.user,'Logout retained authenticated identity.');await link('/login');await wait('!!V("#auth-email")');return {session:null};});
 await scenario('Real login and private-route refresh',async()=>{await fill('auth-email',users[0].email);await fill('auth-password',users[0].password);await evaluate('V("form.auth-form").requestSubmit()');await wait('location.pathname==="/" && !!V(".account-trigger")');await link('/add-book');await wait('!!V("#book-title")');await send('Page.reload');await wait('!!V("#book-title") && !!V(".account-trigger")');const s=await session();check(s.data?.user?.id===state.userIds[0],'Login/refresh identity mismatch.');return {identityMatches:true};});
 await new Promise(r=>setTimeout(r,500));
 await scenario(baseline?'Before-fix diagnostic reproduced':'No uncached-data diagnostic in real browser',async()=>{const diagnostics=browserIssues.filter(x=>/uncached data during prerendering or a navigation/.test(x.firstLine||''));if(baseline)check(diagnostics.length>0,'Could not reproduce original diagnostic.');else check(browserIssues.length===0,'Browser emitted console or uncaught errors; inspect sanitized evidence.');return {diagnostics:diagnostics.length,consoleErrors:browserIssues.length};});
} catch {cases.push({name:'Dependent real-browser checks',status:'NOT TESTED',detail:'A real authentication or book prerequisite failed; inspect prior results.'});}
finally{
 // Bounded cleanup only for the exact QA record owned by the account registered above.
 // Retain returned history; never touch unrelated books/users or delete collections.
 if(tokenA&&state.bookId){try{const r=await api('/books/'+state.bookId);if(r.status===200&&r.json.data.addedByUserId===state.userIds[0]&&r.json.data.title.includes(run)){
  if(state.loanId){const h=await api('/borrows');const l=h.json.data.borrows.find(x=>x._id===state.loanId);if(l?.status==='borrowed')await api('/borrows/'+state.loanId,{method:'DELETE'});}
  const current=await api('/books/'+state.bookId);if(current.json?.data?.availableCopies===current.json?.data?.totalCopies)await api('/books/'+state.bookId,{method:'DELETE'});
 }}catch{cases.push({name:'Exact QA cleanup',status:'FAIL',detail:'Manual review of this run’s recorded test IDs is needed; no broad deletion attempted.'});}}
 if(ws){try{await evaluate(`fetch('/api/auth/sign-out',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.status)`);}catch{}try{await send('Browser.close');}catch{}ws.close();}
 browser?.kill();await save();const counts={pass:cases.filter(x=>x.status==='PASS').length,fail:cases.filter(x=>x.status==='FAIL').length,notTested:cases.filter(x=>x.status==='NOT TESTED').length};console.log(JSON.stringify({reportPath,...counts}));if(counts.fail||counts.notTested)process.exitCode=1;
}
