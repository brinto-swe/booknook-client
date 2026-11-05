import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Uses the running Next development server. Every auth/books request is mocked.
// A temporary isolated component route verifies selected-ID rendering, without a real session or database writes.
const harness = new URL('../src/app/(book-management)/catalog-detail-check-temp/page.jsx', import.meta.url);
await mkdir(new URL('.', harness), { recursive: true });
await writeFile(harness, `"use client";
import {useState} from "react";
import BookDetails from "@/components/books/BookDetails";
export default function Harness(){const [id,setId]=useState("000000000000000000000001");return <><button onClick={()=>setId("000000000000000000000002")}>Select second book</button><BookDetails key={id} id={id} user={{name:"Test Reader",email:"reader@example.test"}} /></>}`, { flag: 'wx' });
let browser, ws;
try {
 const executable = process.env.BOOKNOOK_BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
 browser=spawn(executable,['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9336',`--user-data-dir=${join(tmpdir(),`booknook-catalog-${Date.now()}`)}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let launchError;browser.on('error',error=>{launchError=error;});
 for(let i=0;i<100;i++){if(launchError)throw launchError;try{if((await fetch('http://127.0.0.1:9336/json/list')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const targets=await(await fetch('http://127.0.0.1:9336/json/list')).json();
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map(),requests=[];let total=35,empty=false,fail=false,delay=0,documentLoads=0;
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const record=i=>({_id:String(i).padStart(24,'0'),title:`Catalog Book ${i}`,author:'Test Author',category:'Science',image:'https://covers.example.test/test.svg',description:'A test library book.',totalCopies:3,availableCopies:2});
 ws.addEventListener('message',async event=>{
  const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result);return;}
  if(m.method==='Network.requestWillBeSent'&&m.params.type==='Document')documentLoads++;
  if(m.method!=='Fetch.requestPaused')return;
  const {requestId,request}=m.params;const u=new URL(request.url);let status=200,body;
  if(request.method==='OPTIONS'){status=204;body='';}
  else if(u.hostname==='covers.example.test')body='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="230"><rect width="160" height="230" fill="#344ed1"/><text x="18" y="100" fill="white" font-size="18">Catalog</text></svg>';
  else if(u.pathname.includes('/api/auth/token'))body=JSON.stringify({token:'mock.test.token'});
  else if(u.pathname.includes('/api/auth/get-session'))body='null';
  else {
   assert.equal(request.method,'GET','Catalog test must not issue writes');requests.push(u.pathname+u.search);
   if(delay)await new Promise(r=>setTimeout(r,delay));
   if(fail){status=503;body=JSON.stringify({success:false});}
   else if(u.pathname!=='/books')body=JSON.stringify({success:true,data:record(Number(u.pathname.split('/').at(-1)))});
   else{const page=Number(u.searchParams.get('page')),limit=Number(u.searchParams.get('limit'));const count=empty?0:total;const start=(page-1)*limit;const books=Array.from({length:Math.min(limit,Math.max(0,count-start))},(_,i)=>record(start+i+1));body=JSON.stringify({success:true,data:{books,pagination:{page,limit,total:count,totalPages:Math.ceil(count/limit)}}});}
  }
  try { await send('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:u.hostname==='covers.example.test'?'image/svg+xml':'application/json'},{name:'Access-Control-Allow-Origin',value:'http://localhost:3000'},{name:'Access-Control-Allow-Headers',value:'Authorization, Content-Type'},{name:'Access-Control-Allow-Methods',value:'GET,OPTIONS'}],body:Buffer.from(body).toString('base64')}); } catch(error) { if(!error.message.includes('Invalid InterceptionId') && !error.message.includes('closed')) throw error; }
 });
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*localhost:5000/books*'},{urlPattern:'*localhost:3000/api/auth/*'},{urlPattern:'https://covers.example.test/*'}]});
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;}
 async function wait(expression){for(let i=0;i<200;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw new Error('Timed out: '+expression);}
 const click=text=>evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)})?.click()`);
 const link=href=>evaluate(`Array.from(document.querySelectorAll('a')).find(a=>a.getAttribute('href')===${JSON.stringify(href)})?.click()`);
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:950,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://localhost:3000/'});
 await wait('document.querySelectorAll(".new-arrivals .book-card:not(.book-skeleton)").length===30');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".new-arrivals .books-grid")).gridTemplateColumns.split(" ").length'),5);
 assert.equal(await evaluate('document.querySelectorAll(".new-arrivals .book-details")[29].getAttribute("href")'),'/books/000000000000000000000030');
 await wait('!!document.querySelector(".desktop-nav a.active")');
 await evaluate('window.originalNavbar=document.querySelector(".site-header");window.documentSentinel="persisted"');const initialDocuments=documentLoads;
 await link('/books');await wait('document.querySelectorAll(".catalog-grid .book-card:not(.book-skeleton)").length===12');
 assert.equal(await evaluate('window.originalNavbar===document.querySelector(".site-header")&&window.documentSentinel==="persisted"'),true);
 assert.equal(await evaluate('document.querySelector(".desktop-nav a.active").getAttribute("href")'),'/books');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".catalog-grid")).gridTemplateColumns.split(" ").length'),3);
 await click('Next');await wait('document.querySelector(".catalog-pagination")?.textContent.includes("Page 2")');assert.equal(await evaluate('document.querySelector(".catalog-grid h3").textContent'),'Catalog Book 13');
 await evaluate('const select=document.querySelector(".catalog-filter select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(select,"Science");select.dispatchEvent(new Event("change",{bubbles:true}))');
 await wait('document.querySelector(".catalog-pagination")?.textContent.includes("Page 1")');assert.ok(requests.some(p=>p.includes('page=1')&&p.includes('category=Science')));
 await click('Next');await wait('document.querySelector(".catalog-pagination")?.textContent.includes("Page 2")');assert.ok(requests.some(p=>p.includes('page=2')&&p.includes('category=Science')));
 await click('Next');await wait('document.querySelector(".catalog-pagination")?.textContent.includes("Page 3")');assert.equal(await evaluate('document.querySelectorAll(".catalog-grid .book-card").length'),11);
 const out=process.env.BOOKNOOK_UI_OUTPUT||tmpdir();await mkdir(out,{recursive:true});
 await writeFile(join(out,'catalog-desktop.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64'));
 // Real dynamic route stays private and preserves the selected ID in its login redirect.
 await evaluate('document.querySelector(".catalog-grid .book-details").click()');await wait('location.pathname==="/login"');assert.ok(await evaluate('location.search.includes("000000000000000000000025")'));
 for(const href of ['/register','/login']){await link(href);await wait(`location.pathname===${JSON.stringify(href)}`);assert.equal(await evaluate('window.originalNavbar===document.querySelector(".site-header")'),true);}
 for(const href of ['/add-book','/my-books','/my-borrows']){await evaluate(`(()=>{const a=document.createElement('a');a.href=${JSON.stringify(href)};return a.href})()`);const response=await fetch('http://localhost:3000'+href);assert.ok((await response.text()).includes('/login?'));}
 assert.equal(documentLoads,initialDocuments,'Internal Link navigation must not load a new document');
 total=7;await link('/');await wait('document.querySelectorAll(".new-arrivals .book-card:not(.book-skeleton)").length===7');
 await link('/books?category=Science');await wait('document.querySelector(".catalog-filter select")?.value==="Science" && document.querySelectorAll(".catalog-grid .book-card:not(.book-skeleton)").length===7');
 assert.ok(requests.at(-1).includes('category=Science'));
 await link('/');await wait('document.querySelectorAll(".new-arrivals .book-card:not(.book-skeleton)").length===7');
 delay=600;await link('/books');await wait('!!document.querySelector(".catalog-grid .book-skeleton")');await wait('document.querySelectorAll(".catalog-grid .book-card:not(.book-skeleton)").length===7');delay=0;
 // Leave and re-enter with fresh data. Empty state must come only from zero total.
 empty=true;await link('/');await wait('document.querySelector(".catalog-notice")?.textContent.includes("first books")');assert.equal(await evaluate('document.querySelectorAll(".new-arrivals .book-card").length'),0);
 await link('/books');await wait('!!document.querySelector(".catalog-empty")');
 empty=false;fail=true;await link('/');await wait('document.querySelector(".catalog-notice")?.textContent.includes("couldn’t load")');await link('/books');await wait('!!document.querySelector(".catalog-page [role=alert]")');fail=false;await click('Retry');await wait('document.querySelectorAll(".catalog-grid .book-card:not(.book-skeleton)").length===7');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:850,deviceScaleFactor:1,mobile:true});await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
 await writeFile(join(out,'catalog-mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64'));
 await send('Page.navigate',{url:'http://localhost:3000/catalog-detail-check-temp'});await wait('document.querySelector(".book-detail-copy h1")?.textContent==="Catalog Book 1"');await click('Select second book');await wait('document.querySelector(".book-detail-copy h1")?.textContent==="Catalog Book 2"');assert.ok(requests.includes('/books/000000000000000000000002'));
 console.log('PASS: 30-book cap/five desktop columns/correct links, three-column catalog, all pages, category reset/persistence, fewer books, loading/empty/error/retry, shared Navbar DOM identity, active links, client-side navigation without document loads, private selected-ID redirect, selected detail component, mobile overflow. API/auth mocked; no database writes.');
 await send('Browser.close');
} finally {ws?.close();browser?.kill();await unlink(harness);}
