'use strict';
const cloud = (() => {
  const config = window.ATLAS_CLOUD;
  let session, revision = 0, records = [], busy = false;
  const ready = () => /^https:\/\//.test(config.url) && !!config.publishableKey;
  async function request(path, method, body, extra = {}) {
    const headers = {apikey: config.publishableKey, 'Content-Type':'application/json', ...extra};
    if (session) headers.Authorization = 'Bearer ' + session.access_token;
    const res = await fetch(config.url.replace(/\/$/, '') + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache:'no-store'
    });
    const raw = await res.text();
    const data = raw ? JSON.parse(raw) : null;
    if (!res.ok) {
      const error = new Error(data?.msg || data?.message || data?.error_description || '服务暂不可用');
      error.status = res.status;
      throw error;
    }
    return data;
  }
  async function refresh() {
    const rows = await request('/rest/v1/atlas_ledgers?select=revision,records','GET');
    revision = rows[0]?.revision || 0;
    records = rows[0]?.records || [];
  }
  async function login(email,password,signup) {
    const data = await request('/auth/v1/'+(signup?'signup':'token?grant_type=password'),'POST',{email,password});
    if (!data.access_token) return false;
    session = data;
    try {await refresh()} catch(error){clear();throw error}
    return true;
  }
  function clear(){session=null;revision=0;records=[]}
  async function save(list) {
    const initial = revision === 0;
    try {
      const rows = await request('/rest/v1/atlas_ledgers'+(initial?'':'?revision=eq.'+revision),initial?'POST':'PATCH',
        {records:list,revision:revision+1},{Prefer:'return=representation'});
      if (!rows?.length) throw Object.assign(new Error(),{status:409});
      revision=rows[0].revision;records=rows[0].records;
    } catch(error) {
      if(error.status!==409) throw error;
      await refresh();
      throw Object.assign(new Error('另一台设备已更新账本。已载入最新版，请重新打开任务后再修改。'),{conflict:true});
    }
  }
  return {ready, login, refresh, save, clear, logout:async()=>{try{await request('/auth/v1/logout?scope=local','POST')}finally{clear()}},
    get list(){return structuredClone(records)},get email(){return session?.user?.email},get busy(){return busy},set busy(v){busy=v}};
})();
