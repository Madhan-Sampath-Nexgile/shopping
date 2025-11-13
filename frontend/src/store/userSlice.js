import { createSlice } from '@reduxjs/toolkit'

// Initialize state from localStorage/sessionStorage
const getInitialState = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return { token: null, profile: null, variant: 'A' }
  }

  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    let profile = null
    let variant = 'A'

    if (userStr) {
      profile = JSON.parse(userStr)
      variant = profile.variant || 'A'
    }

    return { token, profile, variant }
  } catch (e) {
    console.error('Failed to initialize user state:', e)
    return { token: null, profile: null, variant: 'A' }
  }
}

const slice = createSlice({
  name:'user',
  initialState: getInitialState(),
  reducers:{
    setToken:(s,a)=>{ s.token=a.payload },
    setProfile:(s,a)=>{ s.profile=a.payload },
    setVariant:(s,a)=>{ s.variant=a.payload },
    logout:(s)=>{
      s.token = null
      s.profile = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
    }
  }
})
export const { setToken,setProfile,setVariant,logout } = slice.actions
export default slice.reducer
