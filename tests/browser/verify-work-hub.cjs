const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const http = require('node:http');
const { harness } = require('../helpers/work-hub.cjs');
const base = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3100';
const h = harness();
const users = ['alice','bob'].map(uid=>({uid,id:uid,email:`${uid}@example.com`,displayName:uid,role:uid==='alice'?'owner':'member',workspaceRole:uid==='alice'?'owner':'member',workspaceId:'ws_A',skills:[],presence:'online',lastActiveAt:new Date().toISOString()}));
const project={id:'launch',name:'Launch project',workspaceId:'ws_A',status:'active',progress:0,team:['alice','bob'],deadline:'2026-11-01',createdAt:new Date().toISOString()};
const errors=[];
let streamOrigin;
const streamConnections=new Map();
const streamServer=http.createServer(async(request,response)=>{
  const url=new URL(request.url,'http://localhost');
  const user=url.searchParams.get('fixtureUser');
  h.act(user);
  if(!streamConnections.has(user))streamConnections.set(user,new Set());
  streamConnections.get(user).add(response);
  const abort=new AbortController();
  response.on('close',()=>{abort.abort();streamConnections.get(user).delete(response);});
  try {
    const result=await h.eventsRoute.GET(new Request(`${base}/api/work-hub/events?workspaceId=${encodeURIComponent(url.searchParams.get('workspaceId')||'')}`,{signal:abort.signal,headers:{'x-work-fixture-user':user}}));
    response.writeHead(result.status,{...Object.fromEntries(result.headers),'Access-Control-Allow-Origin':base});
    for await(const chunk of result.body) { if(response.destroyed)break;response.write(chunk); }
    response.end();
  } catch(error) { if(!abort.signal.aborted){errors.push(error.message);response.destroy();} }
});
if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
const tokenModule={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/auth/token.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports:tokenModule,require,process,Buffer,console,Date});
async function fixture(browser,uid) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},bypassCSP:true});
  await context.addInitScript(({origin,user})=>{
    const NativeEventSource=window.EventSource;
    window.EventSource=class extends NativeEventSource {
      constructor(url,options) {
        const target=new URL(url,location.href);
        super(target.pathname==='/api/work-hub/events'?`${origin}/events?workspaceId=${encodeURIComponent(target.searchParams.get('workspaceId')||'')}&fixtureUser=${user}`:url,options);
        this.addEventListener('open',()=>{window.__workRealtimeReady=target.searchParams.get('workspaceId');});
      }
    };
  },{origin:streamOrigin,user:uid});
  await context.addCookies([{name:'cursis_session',value:tokenModule.createSessionToken({...users.find(user=>user.uid===uid),createdAt:Date.now()}),url:base,httpOnly:true,sameSite:'Lax'}]);
  await context.addInitScript(()=>{
    localStorage.setItem('cursis_active_workspace_id','ws_A');
    localStorage.setItem('cursis_workspace_setup_completed','true');
    localStorage.setItem('cursis_cookie_consent',JSON.stringify({essential:true,functional:false,analytics:false,timestamp:new Date().toISOString()}));
  });
  await context.route(url=>url.pathname.startsWith('/api/'),async route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname;
    h.act(uid);
    if (path.startsWith('/api/work-hub')) {
      const req=new Request(request.url(),{method:request.method(),headers:{...request.headers(),'x-work-fixture-user':uid},...(request.method()!=='GET'?{body:request.postDataBuffer()}: {})});
      const endpoint=path.endsWith('/files')?h.fileRoute:h.route;
      const response=await endpoint[request.method()](req);
      return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
    }
    let json={success:true};
    if (path==='/api/auth/session') json.user=users.find(user=>user.uid===uid);
    if (path==='/api/workspaces') json.workspaces=[{id:'ws_A',name:'Launch workspace',ownerId:'alice',workspaceRole:uid==='alice'?'owner':'member',shortName:'LW',color:'#FF5500',createdAt:new Date().toISOString()}];
    if (path==='/api/team') Object.assign(json,{team:users,invitations:[]});
    if (path==='/api/projects') json.projects=[project];
    if (path==='/api/tasks') json.tasks=[...(h.stores.get('tasks')?.values()||[])];
    const lists={'/api/notifications':'notifications','/api/departments':'departments','/api/documents':'documents','/api/meetings':'meetings','/api/ordis/conversations':'conversations'};
    if (lists[path]) json[lists[path]]=[];
    if (path==='/api/activation') Object.assign(json,{visible:false,steps:[true,true,true]});
    return route.fulfill({json});
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(120000);
  return {page,context};
}
(async()=>{
  await h.collection('projects').insertOne({...project,_id:'launch'});
  await new Promise(resolve=>streamServer.listen(0,'127.0.0.1',resolve));
  streamOrigin=`http://127.0.0.1:${streamServer.address().port}`;
  const browser=await chromium.launch({headless:true});
  try {
    const alice=await fixture(browser,'alice'),bob=await fixture(browser,'bob');
    const page=alice.page;
    await page.goto(base+'/dashboard/messages',{waitUntil:'domcontentloaded',timeout:120000});
    await page.getByText('● Live chat connected',{exact:true}).waitFor();
    await bob.page.goto(base+'/dashboard/messages',{waitUntil:'domcontentloaded',timeout:120000});
    await bob.page.getByText('● Live chat connected',{exact:true}).waitFor();
    await page.getByLabel('Message this channel',{exact:true}).fill('Instant hello to Bob');
    const sentAt=Date.now();
    await page.getByRole('button',{name:'Send message',exact:true}).click();
    await bob.page.getByText('Instant hello to Bob',{exact:true}).waitFor({timeout:2000});
    console.log('Real SSE browser delivery:',Date.now()-sentAt,'ms');
    await bob.page.getByLabel('Message this channel',{exact:true}).fill('Instant reply to Alice');
    await bob.page.getByRole('button',{name:'Send message',exact:true}).click();
    await page.getByText('Instant reply to Alice',{exact:true}).waitFor({timeout:2000});
    await h.collection('channel_messages').insertOne({_id:'delayed',id:'msg_0000000000001_late',workspaceId:'ws_A',channelId:'general',text:'Out-of-order write delivered',authorId:'alice',authorName:'alice',files:[],createdAt:new Date().toISOString()});
    await bob.page.getByText('Out-of-order write delivered',{exact:true}).waitFor({timeout:2000});
    await bob.context.setOffline(true);
    for(const connection of streamConnections.get('bob')||[])connection.destroy();
    await bob.page.getByText('○ Live chat disconnected — reconnecting…',{exact:true}).waitFor();
    await page.getByLabel('Message this channel',{exact:true}).fill('Sent while Bob reconnects');
    await page.getByRole('button',{name:'Send message',exact:true}).click();
    await bob.context.setOffline(false);
    await bob.page.getByText('Sent while Bob reconnects',{exact:true}).waitFor({timeout:5000});
    assert.equal(await bob.page.getByText('Instant hello to Bob',{exact:true}).count(),1);
    await page.screenshot({path:'artifacts/work-hub-initial.png',fullPage:true});
    await page.getByRole('button',{name:'# Launch project',exact:true}).click();
    await page.getByLabel('Message this channel',{exact:true}).fill('Homepage UI');
    await page.getByRole('button',{name:'Send message',exact:true}).click();
    await page.getByRole('button',{name:'+ Dock as Task',exact:true}).click();
    await page.getByRole('button',{name:'Open task thread · 0 replies',exact:true}).waitFor();
    const task=[...h.stores.get('tasks').values()][0];
    assert.equal(task.projectId,'launch');assert.equal(task.estimatedHours,2);
    const dock=page.getByRole('region',{name:'Live Action Dock',exact:true});
    await dock.getByRole('button',{name:'Homepage UI',exact:true}).click();
    const boardThread=dock.getByRole('region',{name:'Thread: Homepage UI',exact:true});
    await boardThread.getByLabel('Reply in this task thread',{exact:true}).fill('Design ready from the board');
    await boardThread.getByLabel('Attach a file (up to 10 MB)',{exact:true}).first().setInputFiles({name:'homepage.txt',mimeType:'text/plain',buffer:Buffer.from('Design attachment')});
    await boardThread.getByRole('button',{name:'Remove homepage.txt ×'}).waitFor();
    await boardThread.getByRole('button',{name:'Send reply',exact:true}).click();
    assert.equal(h.stores.get('tasks').get(task._id).collaboration.files[0].name,'homepage.txt');
    const chatThread=page.getByRole('region',{name:'Channel Launch project'}).getByRole('region',{name:'Thread: Homepage UI',exact:true});
    await chatThread.getByText('Design ready from the board',{exact:true}).waitFor();
    await chatThread.getByRole('button',{name:'Request approval for a file or link',exact:true}).click();
    await chatThread.getByLabel('What needs approval?',{exact:true}).fill('Please review the homepage');
    await chatThread.getByLabel('Reviewer',{exact:true}).selectOption('bob');
    await chatThread.getByLabel('Link to review',{exact:true}).fill('https://example.com/design');
    await chatThread.getByRole('button',{name:'Send approval request',exact:true}).click();
    await bob.page.goto(base+'/dashboard/messages',{waitUntil:'domcontentloaded',timeout:120000});
    await bob.page.getByRole('button',{name:'# Launch project',exact:true}).click();
    await bob.page.getByRole('button',{name:'Request Changes',exact:true}).click();
    await page.getByText('Changes requested',{exact:true}).first().waitFor();
    assert.equal(h.stores.get('tasks').get(task._id).status,'in_progress');
    await page.getByRole('button',{name:/^My Day ·/}).click();
    const tray=page.getByRole('complementary',{name:'My Day',exact:true});
    await tray.getByRole('button',{name:'Add to today',exact:true}).click();
    await tray.getByLabel('Today’s estimate (hours)',{exact:true}).fill('7.5');
    await tray.getByRole('heading',{name:'My Day',exact:true}).click();
    await tray.getByText('7.5h / 8h',{exact:true}).waitFor();
    await page.screenshot({path:'artifacts/work-hub-my-day-planned-1440.png',fullPage:true});
    await page.setViewportSize({width:360,height:1000});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Populated My Day overflow');
    await page.screenshot({path:'artifacts/work-hub-my-day-planned-360.png',fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    await tray.getByRole('button',{name:'▶ Start Working',exact:true}).click();
    await page.getByRole('button',{name:'Stop timer',exact:true}).waitFor();
    const session=[...h.stores.get('focus_sessions').values()][0];
    h.stores.get('focus_sessions').get(session._id).startedAt=new Date(Date.now()-3600000).toISOString();
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Stop timer',exact:true}).waitFor();
    await page.getByRole('button',{name:'Stop timer',exact:true}).click();
    await page.getByRole('button',{name:'Stop timer',exact:true}).waitFor({state:'hidden'});
    assert(h.stores.get('focus_sessions').get(session._id).seconds>=3600);
    await page.goto(base+'/dashboard/team',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__workRealtimeReady==='ws_A');
    await page.getByRole('button',{name:'Team Pulse',exact:true}).click();
    const pulse=page.getByRole('region',{name:'Team Pulse',exact:true});
    await pulse.waitFor();
    await pulse.getByText('7.5h / 8h',{exact:true}).waitFor();
    await pulse.getByText('Full',{exact:true}).waitFor();
    await page.screenshot({path:'artifacts/work-hub-pulse-1440.png',fullPage:true});
    await page.goto(base+'/dashboard/projects',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__workRealtimeReady==='ws_A');
    await page.getByText('Launch project',{exact:true}).first().click();
    const projectDock=page.getByRole('region',{name:'Live Action Dock',exact:true});
    await projectDock.getByRole('button',{name:'Homepage UI',exact:true}).click();
    await projectDock.getByText('Design ready from the board',{exact:true}).waitFor();
    await projectDock.getByRole('button',{name:'Request approval for a file or link',exact:true}).click();
    await projectDock.getByLabel('What needs approval?',{exact:true}).fill('Ready for final approval');
    await projectDock.getByLabel('Reviewer',{exact:true}).selectOption('bob');
    await projectDock.getByLabel('Link to review',{exact:true}).fill('https://example.com/design-v2');
    await projectDock.getByRole('button',{name:'Send approval request',exact:true}).click();
    await bob.page.getByRole('button',{name:'Approve',exact:true}).click();
    await projectDock.getByRole('region',{name:'Approved',exact:true}).getByRole('heading',{name:'Approved · 1',exact:true}).waitFor();
    assert.equal(h.types.taskStage(h.stores.get('tasks').get(task._id)),'approved');
    await page.goto(base+'/dashboard/messages',{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'# Launch project',exact:true}).click();
    await page.getByText('Ready for final approval',{exact:true}).waitFor();
    for(const width of [360,768,1440]) {
      await page.setViewportSize({width,height:1000});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Messages overflow '+width);
      await page.screenshot({path:`artifacts/work-hub-messages-${width}.png`,fullPage:true});
      await page.getByRole('button',{name:/^My Day ·/}).click();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'My Day overflow '+width);
      await page.screenshot({path:`artifacts/work-hub-tray-${width}.png`,fullPage:true});
      await page.getByRole('button',{name:'Close My Day',exact:true}).click();
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: real SSE between two browsers, bidirectional immediate messages, offline/reconnect catch-up without duplicates, docking, shared files/replies, approvals, My Day, Team Pulse, and three widths. Storage and authentication use isolated fixtures.');
  } finally {await browser.close();await new Promise(resolve=>streamServer.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
