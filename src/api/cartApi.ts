// src/api/cartApi.ts
import axios from "axios";

const BASE = "https://ebook-backend-lxce.onrender.com/api/cart";

function authHeaders() {
  const token = localStorage.getItem("token");  
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCart() {
  return axios
  .get(BASE, { headers: authHeaders() })
  .then(r => r.data);
}

export async function addToCart(payload: {
   book_id?: number; 
   note_id?: number; 
   quantity?: number; }) {
  return axios
  .post(`${BASE}/add`, payload, { headers: authHeaders() })
  .then(r => r.data);
}

export async function updateCartQty(id: string, quantity: number) {
  return axios
  .patch(`${BASE}/${id}`, { quantity }, { headers: authHeaders() })
  .then(r => r.data);
}

export async function removeCartItem(id: string) {
  return axios
  .delete(`${BASE}/${id}`, { headers: authHeaders() })
  .then(r => r.data);
}