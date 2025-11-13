import fetch from 'node-fetch'
const RAG_URL = process.env.RAG_URL || 'http://127.0.0.1:8000'
export async function ragPOST(path, body){
  try{
    const r = await fetch(`${RAG_URL}${path}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    return await r.json()
  }catch(e){
    return { error: 'RAG service unavailable', details: String(e) }
  }
}
