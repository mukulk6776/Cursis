const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText,
    { exports, require: name => imports[name] || require(name), Date, Set, Map, URL, Buffer, TextEncoder, console, Response, Request, File, process, ReadableStream, AbortController, setTimeout, clearTimeout, setInterval, clearInterval });
  return exports;
}
const copy = value => value === undefined ? undefined : structuredClone(value);
const get = (doc, path) => path.split('.').reduce((value,key) => value?.[key], doc);
function matches(doc, query) {
  return Object.entries(query).every(([key,wanted]) => {
    if (key === '$or') return wanted.some(condition => matches(doc,condition));
    const actual = get(doc,key);
    if (wanted && typeof wanted === 'object' && !Array.isArray(wanted)) {
      if ('$exists' in wanted) return (actual !== undefined) === wanted.$exists;
      if ('$in' in wanted) return wanted.$in.includes(actual);
      if ('$lt' in wanted) return actual < wanted.$lt;
      if ('$gt' in wanted) return actual > wanted.$gt;
      if ('$elemMatch' in wanted) return (actual || []).some(item => matches(item,wanted.$elemMatch));
      if ('$not' in wanted) return !matches({ value: actual },{ value: wanted.$not });
    }
    return actual === wanted;
  });
}
function put(doc, key, value, filter) {
  const keys = key.split('.'); let target = doc;
  keys.forEach((part,index) => {
    if (part === '$') part = filter.__positions[keys.slice(0,index).join('.')];
    if (index === keys.length-1) target[part] = copy(value);
    else { target[part] ??= {}; target = target[part]; }
  });
}
function harness() {
  const stores = new Map(), indexes = [], watchers = new Set();
  const notify = (name, doc, operationType) => { for (const listener of watchers) listener({ ns: { coll: name }, fullDocument: copy(doc), operationType }); };
  const watch = pipeline => {
    const queue = [];
    let pending, closed = false;
    const listener = change => {
      if (!matches(change,pipeline[0].$match)) return;
      if (pending) { const resolve = pending; pending = null; resolve({done:false,value:change}); }
      else queue.push(change);
    };
    watchers.add(listener);
    return {
      async tryNext() { return queue.shift() || null; },
      [Symbol.asyncIterator]() { return this; },
      next() { return closed ? Promise.resolve({done:true}) : queue.length ? Promise.resolve({done:false,value:queue.shift()}) : new Promise(resolve=>{pending=resolve;}); },
      async close() { closed=true;watchers.delete(listener);pending?.({done:true});pending=null; },
    };
  };
  let available = true, acting = 'alice';
  const revoked=new Set();
  const roles = { alice: 'owner', bob: 'member', carol: 'member', viewer: 'viewer' };
  const auth = uid => ({ workspaceId: 'ws_A', role: roles[uid], errorResponse: null, user: { uid, displayName: uid, email: `${uid}@example.com`, workspaceId: 'ws_A' } });
  const collection = name => {
    if (!stores.has(name)) stores.set(name,new Map());
    const store = stores.get(name);
    const find = query => [...store.values()].filter(doc => matches(doc,query));
    function update(query, changes, options = {}) {
      let doc = find(query)[0], fresh = false;
      if (!doc && options.upsert) { doc = { ...query }; fresh = true; }
      if (!doc) return null;
      doc = copy(doc);
      query = { ...query, __positions: Object.fromEntries(Object.entries(query).filter(([,value]) => value?.$elemMatch).map(([key,value]) => [key,get(doc,key).findIndex(item => matches(item,value.$elemMatch))])) };
      if (fresh) Object.assign(doc,copy(changes.$setOnInsert || {}));
      for (const [key,value] of Object.entries(changes.$set || {})) put(doc,key,value,query);
      for (const [key,value] of Object.entries(changes.$push || {})) put(doc,key,[...(get(doc,key)||[]),value],query);
      for (const [key,value] of Object.entries(changes.$addToSet || {})) {
        const values = get(doc,key)||[];
        for (const item of value.$each || [value]) if (!values.some(old => JSON.stringify(old) === JSON.stringify(item))) values.push(copy(item));
        put(doc,key,values,query);
      }
      store.set(doc._id || doc.id,doc); notify(name,doc,fresh?'insert':'update'); return copy(doc);
    }
    return {
      findOne: async query => copy(find(query)[0] || null),
      find(query) {
        let rows = find(query);
        return { sort(spec) { const [key,dir] = Object.entries(spec)[0]; rows.sort((a,b) => String(get(a,key)).localeCompare(String(get(b,key))) * dir); return this; }, limit(n) { rows=rows.slice(0,n); return this; }, async toArray() { return copy(rows); } };
      },
      async insertOne(doc) {
        if (store.has(doc._id || doc.id) || name === 'focus_sessions' && doc.active && find({ userId: doc.userId, active:true }).length) throw Object.assign(new Error('Duplicate'),{ code:11000 });
        store.set(doc._id || doc.id,copy(doc));
        notify(name,doc,'insert');
      },
      async updateOne(query,changes,options) { return { matchedCount:update(query,changes,options) ? 1 : 0 }; },
      async findOneAndUpdate(query,changes,options) { return update(query,changes,options); },
      async replaceOne(query,doc) { store.set(doc._id,copy(doc)); notify(name,doc,'replace'); },
      async createIndex(keys,options) { indexes.push({name,keys,options}); },
      aggregate(pipeline) {
        const totals = new Map();
        for (const session of find(pipeline[0].$match)) totals.set(session.taskId,(totals.get(session.taskId)||0)+(session.seconds||0));
        return { async toArray() { return [...totals].map(([_id,seconds]) => ({_id,seconds})); } };
      },
    };
  };
  const api = { apiSuccess:(data,status=200,headers) => Response.json({success:true,...data},{status,headers}), apiError:(error,status=400) => Response.json({success:false,error},{status}) };
  const rbac = {
    isWorkspaceMember: async (uid,ws) => ws === 'ws_A' && !!roles[uid],
    getUserWorkspaceRole: async (uid,ws) => ws === 'ws_A' ? roles[uid] || null : null,
    authorizeWorkspaceAccess: async (request,ws) => {
      const actor=request.headers.get('x-work-fixture-user')||acting;
      return !actor ? {errorResponse:api.apiError('Unauthorized',401)} : ws !== 'ws_A'||!roles[actor]||revoked.has(actor) ? {errorResponse:api.apiError('Forbidden',403)} : roles[actor] === 'viewer' && request.method !== 'GET' ? {errorResponse:api.apiError('Read only',403)} : auth(actor);
    },
  };
  class PrivacyError extends Error { constructor(message,status) {super(message);this.status=status;} }
  const mongodb = { getCollection: async name => available ? collection(name) : null, getDb: async () => available ? {watch} : null };
  const store = { inMemoryStore: { tasks:new Map(),users:new Map() } };
  const types = load('lib/work-hub/types.ts',{});
  const service = load('lib/db/work-hub.ts',{ '@/lib/mongodb':mongodb,'@/lib/auth/rbac':rbac,'@/lib/work-hub/types':types,'./store':store });
  const http = load('lib/engagement/http.ts',{'@/lib/api/response':api,'@/lib/privacy/core':{PrivacyError},'@/lib/site':{SITE_URL:'https://cursis.in'}});
  const route = load('app/api/work-hub/route.ts',{'@/lib/auth/rbac':rbac,'@/lib/api/response':api,'@/lib/db/work-hub':service,'@/lib/engagement/http':http,'@/lib/privacy/core':{PrivacyError}});
  const fileRoute = load('app/api/work-hub/files/route.ts',{'@/lib/auth/rbac':rbac,'@/lib/api/response':api,'@/lib/db/work-hub':service,'@/lib/site':{SITE_URL:'https://cursis.in'}});
  const tasks = load('lib/db/tasks.ts',{'./store':store,'./types':{},'./team':{},'@/lib/mongodb':mongodb,'./notifications':{},'@/lib/auth/rbac':rbac,'./departments':{}});
  const workStream = load('lib/realtime/work-stream.ts',{});
  const eventsRoute = load('app/api/work-hub/events/route.ts',{'@/lib/auth/rbac':rbac,'@/lib/mongodb':mongodb,'@/lib/realtime/work-stream':workStream});
  return { stores,indexes,types,service,route,fileRoute,tasks,collection,auth,store,eventsRoute,workStream,watchers,
    act(uid) {acting=uid;}, setAvailable(value) {available=value;},
    revoke(uid) {revoked.add(uid);},
    async command(command,uid='alice',workspaceId='ws_A') { return service.executeWork({...auth(uid),workspaceId},service.workCommand.parse(command)); },
    post(body,origin='https://app.example') { return route.POST(new Request('https://app.example/api/work-hub',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({workspaceId:'ws_A',...body})})); },
  };
}
module.exports = { harness };
