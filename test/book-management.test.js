import assert from "node:assert/strict";
import test from "node:test";
import { createAuthenticatedRequest, createBooksApi, BookApiError } from "../src/lib/api/authenticated-request.js";
import { bookSchema, bookPayload, bookDefaults, isImageUrl, categories } from "../src/lib/books/schema.js";
const fields = { title:"A Library Book", author:"A Writer", category:"Fiction", image:"https://example.com/cover.jpg", description:"A story to share.", totalCopies:3 };
const id = "000000000000000000000001";

test("book form validates required fields, allowed categories and positive integer inventory", () => {
  assert.equal(bookSchema.safeParse(fields).success,true);
  for (const category of categories) assert.equal(bookSchema.safeParse({...fields,category}).success,true);
  for (const key of Object.keys(fields)) { const value={...fields}; delete value[key]; assert.equal(bookSchema.safeParse(value).success,false); }
  for (const totalCopies of [0,-1,1.5,"3",NaN,Infinity,Number.MAX_SAFE_INTEGER+1]) assert.equal(bookSchema.safeParse({...fields,totalCopies}).success,false);
  for (const category of ["Poetry","fiction",""]) assert.equal(bookSchema.safeParse({...fields,category}).success,false);
});
test("image URLs require HTTP(S) without embedded credentials", () => {
  for (const url of ["https://example.com/a.jpg","http://example.com/a.png"]) assert.equal(isImageUrl(url),true);
  for (const url of ["",null,"bad","javascript:alert(1)","file:///tmp/a","data:image/png,a","https://user:secret@example.com/a"]) assert.equal(isImageUrl(url),false);
  assert.equal(bookSchema.parse({...fields,image:" https://example.com/new.jpg "}).image,"https://example.com/new.jpg");
});
test("form payload whitelists editable fields and initializes legacy edit values", () => {
  const result=bookPayload({...fields,title:"  A Library Book  ",addedByUserId:"attacker",availableCopies:999});
  assert.deepEqual(result,fields);
  assert.equal(bookDefaults({imageUrl:fields.image}).image,fields.image);
  assert.equal(bookDefaults().totalCopies,1);
  assert.equal(bookSchema.safeParse({...fields,addedByEmail:"spoof@example.com"}).success,false);
});
test("authenticated helper obtains a fresh JWT and sends the expected request", async () => {
  let tokens=0; const requests=[];
  const api=createBooksApi(createAuthenticatedRequest(async()=>({data:{token:`memory-only-${++tokens}`}}),async(url,options)=>{requests.push({url,options});return Response.json({success:true,data:{_id:id}});}));
  await api.create(fields); await api.update(id,{title:"Updated"}); await api.remove(id);
  assert.equal(tokens,3);
  assert.deepEqual(requests.map(r=>r.options.method),["POST","PATCH","DELETE"]);
  assert.equal(requests[0].options.headers.Authorization,"Bearer memory-only-1");
  assert.equal(requests[1].options.headers.Authorization,"Bearer memory-only-2");
  assert.equal(requests[0].options.cache,"no-store");
  assert.deepEqual(JSON.parse(requests[0].options.body),fields);
  assert.equal(new URL(requests[1].url).pathname,`/books/${id}`);
});
test("My Books always requests mine=true with server pagination", async()=>{
  const calls=[]; const api=createBooksApi(async(path,options)=>{calls.push({path,options});return {};});
  const signal=new AbortController().signal; await api.mine(2,signal);
  assert.equal(calls[0].path,"/books?mine=true&page=2&limit=10"); assert.equal(calls[0].options.signal,signal);
  await api.detail(id,signal); assert.equal(calls[1].path,`/books/${id}`);
  assert.throws(()=>api.detail("bad"),error=>error.status===404);
});
test("missing/expired authentication fails safely before fetching books",async()=>{
  let fetches=0;
  for (const auth of [{data:null},{error:{status:401,message:"SECRET"}},{data:{token:""}}]) {
    const request=createAuthenticatedRequest(async()=>auth,async()=>{fetches++;});
    await assert.rejects(request("/books"),error=>error instanceof BookApiError && error.status===401 && !error.message.includes("SECRET"));
  }
  assert.equal(fetches,0);
});
test("HTTP validation, permission, not-found and conflict failures use fixed safe messages",async()=>{
  for (const status of [400,401,403,404,409,429,500,503]) {
    const request=createAuthenticatedRequest(async()=>({data:{token:"memory-only"}}),async()=>new Response("SECRET raw error",{status}));
    await assert.rejects(request("/books"),error=>error.status===status && !error.message.includes("SECRET"));
  }
});
test("network failures and invalid JSON/envelopes are safely handled",async()=>{
  for (const response of [new Response("not JSON"),Response.json({success:false}),Response.json({success:true,data:null})]) {
    const request=createAuthenticatedRequest(async()=>({data:{token:"memory-only"}}),async()=>response);
    await assert.rejects(request("/books"),error=>error.status===502);
  }
  const request=createAuthenticatedRequest(async()=>({data:{token:"memory-only"}}),async()=>{throw new Error("SECRET network details");});
  await assert.rejects(request("/books"),error=>error.status===0 && !error.message.includes("SECRET"));
});
test("retry performs a fresh request; failed mutations are never automatically repeated",async()=>{
  let attempts=0;
  const request=createAuthenticatedRequest(async()=>({data:{token:"memory-only"}}),async()=> ++attempts===1 ? new Response("failure",{status:409}) : Response.json({success:true,data:{_id:id}}));
  await assert.rejects(request("/books",{method:"POST",body:fields}),error=>error.status===409);
  assert.equal(attempts,1);
  assert.equal((await request("/books",{method:"POST",body:fields}))._id,id);
});
test("aborted loads cannot continue to the Express API",async()=>{
  const controller=new AbortController(); controller.abort(); let requests=0;
  const request=createAuthenticatedRequest(async()=>({data:{token:"memory-only"}}),async()=>{requests++;});
  await assert.rejects(request("/books",{signal:controller.signal})); assert.equal(requests,0);
});
