import assert from 'node:assert/strict';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Run from booknook-client with its development server on localhost:3000.
// All Books, Borrow and auth requests are intercepted: no Atlas writes.
const harness = new URL('../src/app/(book-management)/borrow-ui-check-temp/page.jsx', import.meta.url);
await mkdir(new URL('.', harness), { recursive: true });
await writeFile(harness, "\"use client\";\nimport { useState } from \"react\";\nimport BookDetails from \"@/components/books/BookDetails\";\nimport MyBorrows from \"@/components/borrows/MyBorrows\";\nexport default function Harness() {\n const [view, setView] = useState(\"detail\");\n return <><div><button onClick={() => setView(\"detail\")}>details</button><button onClick={() => setView(\"history\")}>history</button></div>{view === \"detail\" ? <BookDetails id=\"000000000000000000000001\" user={{name:\"Test Reader\",email:\"reader@example.test\"}} /> : <MyBorrows />}</>;\n}\n", { flag: 'wx' });
let browser;
try {
 const executable = process.env.BOOKNOOK_BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
 browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9335', `--user-data-dir=${join(tmpdir(), `booknook-borrow-${Date.now()}`)}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
 let launchError;
 browser.on('error', error => { launchError = error; });
 for (let attempt = 0; attempt < 100; attempt++) {
  if (launchError) throw launchError;
  try { if ((await fetch('http://127.0.0.1:9335/json/list')).ok) break; } catch { /* Browser is starting. */ }
  await new Promise(resolve => setTimeout(resolve, 100));
 }
const targets=await (await fetch('http://127.0.0.1:9335/json/list')).json();
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let seq=0;const pending=new Map();const requests=[];let mode='ok',empty=false,listError=false,zero=false,returned=false,postDelay=0,listDelay=0;
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
const id='000000000000000000000001';
const book=()=>({_id:id,title:'The Library Journey',author:'Test Author',category:'Fiction',description:'A thoughtful journey through a library.',image:'https://covers.example.test/good.svg',totalCopies:3,availableCopies:zero?0:3,addedByName:'Test Reader',addedByEmail:'reader@example.test'});
const loan=()=>({_id:'000000000000000000000002',bookId:id,bookTitle:'The Library Journey',bookImage:'https://covers.example.test/good.svg',borrowDate:'2026-11-05T10:00:00Z',returnDate:'2026-11-12T10:00:00Z',returnedAt:returned?'2026-11-06T10:00:00Z':null,status:returned?'returned':'borrowed'});
ws.addEventListener('message',async event=>{
 const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result);return;}
 if(m.method!=='Fetch.requestPaused')return;
 const {requestId,request}=m.params;const u=new URL(request.url);let status=200,body;
 if(request.method==='OPTIONS'){status=204;body='';}
 else if(u.hostname==='covers.example.test')body='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="230"><rect width="160" height="230" fill="#344ed1"/><text x="20" y="90" fill="white" font-size="19">Library</text></svg>';
 else if(u.pathname.includes('/api/auth/token'))body=JSON.stringify({token:'mock.browser.token'});
 else if(u.pathname.includes('/api/auth/get-session'))body=JSON.stringify({user:{id,name:'Test Reader',email:'reader@example.test'},session:{id:'test',userId:id,expiresAt:new Date(Date.now()+3600000).toISOString()}});
 else if(u.port==='5000'){
  requests.push({path:u.pathname+u.search,method:request.method,body:request.postData,authorization:request.headers.Authorization});
  if(u.pathname.startsWith('/books'))body=JSON.stringify({success:true,data:book()});
  else if(request.method==='POST'||request.method==='DELETE'){
   if(postDelay)await new Promise(r=>setTimeout(r,postDelay));
   if(mode!=='ok'){status=mode==='failure'?503:409;body=JSON.stringify({success:false,error:{code:mode==='failure'?'SERVICE_UNAVAILABLE':mode,message:'PRIVATE diagnostic'}});}
   else {if(request.method==='POST')zero=true;else returned=true;body=JSON.stringify({success:true,data:loan()});}
  }else{if(listDelay)await new Promise(r=>setTimeout(r,listDelay));if(listError){status=503;body=JSON.stringify({success:false});}else body=JSON.stringify({success:true,data:{borrows:empty?[]:[loan()],pagination:{page:1,limit:10,total:empty?0:1,totalPages:empty?0:1}}});}
 }else body='{}';
 await send('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:u.hostname==='covers.example.test'?'image/svg+xml':'application/json'},{name:'Access-Control-Allow-Origin',value:'http://localhost:3000'},{name:'Access-Control-Allow-Headers',value:'Authorization, Content-Type'},{name:'Access-Control-Allow-Methods',value:'GET,POST,DELETE,OPTIONS'}],body:Buffer.from(body).toString('base64')});
});
await send('Runtime.enable');await send('Page.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*localhost:5000/books*'},{urlPattern:'*localhost:5000/borrows*'},{urlPattern:'*localhost:3000/api/auth/*'},{urlPattern:'https://covers.example.test/*'}]});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;}
async function wait(expression){for(let i=0;i<150;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw new Error('Timed out: '+expression);}
const click=text=>evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)})?.click()`);
const posts=()=>requests.filter(r=>r.method==='POST').length;
const deletes=()=>requests.filter(r=>r.method==='DELETE').length;
await send('Emulation.setDeviceMetricsOverride',{width:1280,height:950,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://localhost:3000/borrow-ui-check-temp'});
await wait('!!document.querySelector(".book-borrow")');
await click('Borrow This Book');await wait('!!document.querySelector("[role=dialog]")');
assert.equal(posts(),0);assert.equal(await evaluate('document.querySelector(".borrow-dialog input").readOnly'),true);
assert.ok(await evaluate('document.querySelector(".borrow-dialog").textContent.includes("You can keep this book for 7 days.")'));
assert.equal(await evaluate('document.querySelector(".borrow-dialog input").value'),'Test Reader');
await click('Cancel');await wait('!document.querySelector("[role=dialog]")');assert.equal(posts(),0);
await click('Borrow This Book');await wait('!!document.querySelector("[role=dialog]")');
const out=process.env.BOOKNOOK_UI_OUTPUT || tmpdir();
await mkdir(out, { recursive: true });
await evaluate("document.head.insertAdjacentHTML('beforeend','<style>[data-sonner-toaster]{visibility:hidden}</style>')");
await new Promise(resolve => setTimeout(resolve, 350));
await writeFile(out+'/borrow-confirmation.png',Buffer.from((await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64'));
mode='failure';await click('Confirm Borrow');await wait('!!document.querySelector(".borrow-error")');assert.ok(!(await evaluate('document.querySelector(".borrow-error").textContent')).includes('PRIVATE'));
mode='DUPLICATE_BORROW';await click('Confirm Borrow');await wait('document.querySelector(".borrow-error")?.textContent.includes("active loan")');assert.equal(await evaluate('Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="Confirm Borrow").disabled'),true);
await click('Cancel');await wait('!document.querySelector("[role=dialog]")');await wait('!!document.querySelector(".book-borrow")');
// Remount clears local conflict state, fresh server data governs availability.
await click('history');await wait('!!document.querySelector(".borrow-record")');await click('details');await wait('!!document.querySelector(".book-borrow")');
mode='BOOK_UNAVAILABLE';await click('Borrow This Book');await click('Confirm Borrow');await wait('document.querySelector(".borrow-error")?.textContent.includes("No copies")');await click('Cancel');await wait('!document.querySelector("[role=dialog]")');
await click('history');await wait('!!document.querySelector(".borrow-record")');await click('details');await wait('!!document.querySelector(".book-borrow")');
mode='ok';postDelay=700;const before=posts();await click('Borrow This Book');await evaluate('Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="Confirm Borrow").click();Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="Confirm Borrow")?.click()');
await wait('document.querySelector(".borrow-dialog")?.getAttribute("aria-busy")==="true"');
assert.equal(await evaluate('Array.from(document.querySelectorAll(".borrow-dialog button")).every(b=>b.disabled)'),true);
await wait('!document.querySelector("[role=dialog]") && document.querySelector(".book-borrow")?.disabled');assert.equal(posts(),before+1);assert.deepEqual(JSON.parse(requests.filter(r=>r.method==='POST').at(-1).body),{bookId:id});
listDelay=700;await click('history');await wait('!!document.querySelector(".borrow-skeleton")');await wait('!!document.querySelector(".borrow-record")');listDelay=0;
assert.ok(await evaluate('document.querySelector(".borrow-record").textContent.includes("Nov 12, 2026")'));
await click('Return Book');await wait('!!document.querySelector("[role=dialog]")');assert.equal(deletes(),0);await click('Cancel');await wait('!document.querySelector("[role=dialog]")');
await click('Return Book');await click('Confirm Return');await click('Confirm Return');await wait('document.querySelector(".borrow-status")?.textContent==="Returned"');assert.equal(deletes(),1);assert.ok(await evaluate('document.querySelector(".borrow-record").textContent.includes("Nov 6, 2026")'));assert.equal(await evaluate('Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Return Book")'),false);
returned=false;await click('details');await wait('!!document.querySelector(".book-borrow")');await click('history');await wait('!!document.querySelector(".borrow-record")');mode='BORROW_ALREADY_RETURNED';await click('Return Book');await click('Confirm Return');await wait('!document.querySelector("[role=dialog]")');mode='ok';
await click('details');await wait('!!document.querySelector(".book-borrow")');empty=true;await click('history');await wait('document.querySelector(".borrow-state")?.textContent.includes("No borrowed books")');
await click('details');await wait('!!document.querySelector(".book-borrow")');empty=false;listError=true;await click('history');await wait('!!document.querySelector(".borrow-state[role=alert]")');listError=false;await click('Retry');await wait('!!document.querySelector(".borrow-record")');
await send('Emulation.setDeviceMetricsOverride',{width:390,height:850,deviceScaleFactor:1,mobile:true});await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
await writeFile(out+'/my-borrows-mobile.png',Buffer.from((await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64'));
await send('Browser.close');console.log('PASS: Borrow open/cancel/read-only identity, API failure/retry, duplicate active loan, insufficient copies, busy/duplicate submission guard, success/server inventory refresh, history loading/rendering/dates, return confirmation/cancel/success/history retention, concurrent return guard, already-returned conflict, empty/error/retry, mobile overflow. All auth/API responses mocked; no Atlas writes.');

} finally {
 await unlink(harness);
 browser?.kill();
}
