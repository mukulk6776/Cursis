const test=require('node:test');
const assert=require('node:assert/strict');
const {harness}=require('./helpers/work-hub.cjs');

test('live stream requires authentication, workspace access, and durable change streams',async()=>{
  const h=harness();
  const request=ws=>new Request('https://app.example/api/work-hub/events?workspaceId='+ws);
  assert.equal((await h.eventsRoute.GET(request('*'))).status,400);
  h.act(null);assert.equal((await h.eventsRoute.GET(request('ws_A'))).status,401);
  h.act('alice');assert.equal((await h.eventsRoute.GET(request('ws_B'))).status,403);
  h.setAvailable(false);assert.equal((await h.eventsRoute.GET(request('ws_A'))).status,503);
});

test('Mongo changes push saved messages across independent readers and never include another workspace',async()=>{
  const h=harness(),a=new AbortController(),b=new AbortController();
  h.act('alice');const first=await h.eventsRoute.GET(new Request('https://app.example/api/work-hub/events?workspaceId=ws_A',{signal:a.signal,headers:{'x-work-fixture-user':'alice'}}));
  h.act('bob');const second=await h.eventsRoute.GET(new Request('https://app.example/api/work-hub/events?workspaceId=ws_A',{signal:b.signal,headers:{'x-work-fixture-user':'bob'}}));
  const ra=first.body.getReader(),rb=second.body.getReader(),decode=new TextDecoder();
  try {
    assert.match(first.headers.get('content-type'),/text\/event-stream/);
    assert.match(decode.decode((await ra.read()).value),/connected/);
    await rb.read();
    await h.collection('channel_messages').insertOne({_id:'foreign',id:'foreign',workspaceId:'ws_B',text:'Private foreign message'});
    await h.command({action:'send',channelId:'general',text:'Hello both browsers',files:[]});
    const output=await Promise.race([Promise.all([ra.read(),rb.read()]),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Push did not arrive immediately')),1000).unref())]);
    for(const result of output) {
      const text=decode.decode(result.value);
      assert.match(text,/event: work.changed/);assert.match(text,/channel_messages/);
      assert.match(text,/Hello both browsers/);
      assert(!text.includes('Private foreign'));assert(!text.includes('ws_B'));
    }
    assert.equal(h.watchers.size,2);
    assert.equal(h.workStream.workChangeFrame({ns:{coll:'tasks'},fullDocument:{workspaceId:'ws_B'}},'ws_A','alice'),null);
    assert(h.workStream.workChangeFrame({ns:{coll:'focus_sessions'},fullDocument:{workspaceId:'ws_B',userId:'alice'}},'ws_A','alice'));
  } finally {a.abort();b.abort();await ra.cancel();await rb.cancel();}
  assert.equal(h.watchers.size,0);
});

test('message catch-up pages preserve all missed messages, including the last timestamp boundary',async()=>{
  const h=harness();
  for(let i=0;i<105;i++) await h.collection('channel_messages').insertOne({_id:'n'+i,id:`msg_1000_${String(i).padStart(3,'0')}`,workspaceId:'ws_A',channelId:'general',text:'Message '+i});
  const seen=[];let cursor='msg_1000_';let more=true;
  while(more) {
    const response=await h.route.GET(new Request('https://app.example/api/work-hub?workspaceId=ws_A&channelId=general&after='+cursor));
    const data=await response.json();assert.equal(response.status,200);
    seen.push(...data.messages.map(message=>message.id));cursor=data.messages.at(-1)?.id;more=data.hasMore;
  }
  assert.equal(seen.length,105);assert.equal(new Set(seen).size,105);
  assert.equal((await h.route.GET(new Request('https://app.example/api/work-hub?workspaceId=ws_A&channelId=general&after=a&before=b'))).status,400);
});

test('an already-connected reader stops receiving message content as soon as access is revoked',async()=>{
  const h=harness(),abort=new AbortController();
  const response=await h.eventsRoute.GET(new Request('https://app.example/api/work-hub/events?workspaceId=ws_A',{signal:abort.signal,headers:{'x-work-fixture-user':'alice'}}));
  const reader=response.body.getReader();
  try {
    await reader.read();h.revoke('alice');
    await h.command({action:'send',channelId:'general',text:'Not for the removed member',files:[]},'bob');
    const next=await reader.read();
    assert.equal(next.done,true);assert.equal(h.watchers.size,0);
  }finally{abort.abort();await reader.cancel();}
});
