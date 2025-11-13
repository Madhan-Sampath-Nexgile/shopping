import { useState } from 'react'
import api from '../../services/api'
export default function QABot(){
  const [q, setQ] = useState(''); const [a, setA] = useState(null); const [loading, setLoading] = useState(false)
  const ask = async ()=>{
    setLoading(true)
    try{
      const { data } = await api.post('/rag/qa', { question: q, productId: null })
      setA(data)
    }finally{ setLoading(false) }
  }
  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Product Q&A</h3>
      <div className="flex gap-2">
        <input className="input" placeholder="Ask about a product..." value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn" onClick={ask} disabled={loading}>{loading?'Answering...':'Ask'}</button>
      </div>
      {a && <pre className="mt-3 text-sm bg-gray-50 p-3 rounded-xl overflow-auto">{JSON.stringify(a, null, 2)}</pre>}
    </div>
  )
}
