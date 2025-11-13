import { configureStore } from '@reduxjs/toolkit'
import user from './userSlice'
import product from './productSlice'
import cart from './cartSlice'
import rag from './ragSlice'
import analytics from './analyticsSlice'
export default configureStore({ reducer: { user, product, cart, rag, analytics } })
