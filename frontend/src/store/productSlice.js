import { createSlice } from '@reduxjs/toolkit'
const slice = createSlice({
  name:'product', initialState:{ list:[] }, reducers:{
    setList:(s,a)=>{ s.list=a.payload }
  }
})
export const { setList } = slice.actions
export default slice.reducer
