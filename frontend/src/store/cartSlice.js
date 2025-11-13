import { createSlice } from '@reduxjs/toolkit'
const slice = createSlice({
  name:'cart', initialState:{ items:[] }, reducers:{
    add:(s,a)=>{ s.items.push(a.payload) },
    remove:(s,a)=>{ s.items = s.items.filter(x=>x.id!==a.payload) },
    clear:(s)=>{ s.items=[] }
  }
})
export const { add, remove, clear } = slice.actions
export default slice.reducer
