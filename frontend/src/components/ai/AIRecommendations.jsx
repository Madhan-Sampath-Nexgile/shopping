import { useEffect, useState } from 'react'
import api from '../../services/api'
export default function AIRecommendations({ userId }){
  const [items, setItems] = useState([])
  useEffect(()=>{
    (async ()=>{
      const { data } = await api.post('/rag/recommend', { userId })
      setItems(data.items || [])
    })()
  }, [userId])
  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Recommended for you</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(p => (
          <div key={p.id} className="border rounded-xl p-3">
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-gray-500">Reason: {p.reason}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
