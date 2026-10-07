import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const games = new Set(['pubg-mobile', 'cod-mobile', 'free-fire', 'fc-mobile', 'chess']);
const text = (value) => String(value ?? '').trim();
function clean(body = {}) {
  const image_urls = Array.isArray(body.image_urls) ? body.image_urls.map(text).filter(Boolean) : [];
  const data = { game_slug: text(body.game_slug), title: text(body.title), description: text(body.description), image_urls, asking_price: Number(body.asking_price), contact_preference: text(body.contact_preference) };
  if (!games.has(data.game_slug)) throw new Error('Choose a supported game.');
  if (data.title.length < 3 || data.title.length > 140) throw new Error('Title must be 3–140 characters.');
  if (data.description.length < 20 || data.description.length > 10000) throw new Error('Description must be 20–10,000 characters.');
  if (!data.image_urls.length) throw new Error('Upload at least one proof-of-ownership screenshot.');
  if (!data.image_urls.every((url) => { try { new URL(url); return true; } catch { return false; } })) throw new Error('Each image must be a valid URL.');
  if (!Number.isFinite(data.asking_price) || data.asking_price <= 0) throw new Error('Enter a valid asking price.');
  if (data.contact_preference.length < 3 || data.contact_preference.length > 1000) throw new Error('Provide contact information or an in-app contact preference.');
  return data;
}
export async function listAccountSales(filters = {}) {
  let query = supabaseAdmin.from('account_sale_listings').select('id,game_slug,title,description,image_urls,asking_price,contact_preference,created_at').eq('review_status','approved').eq('status','active').order('created_at',{ascending:false});
  if (filters.game_slug) query = query.eq('game_slug', filters.game_slug);
  if (Number.isFinite(filters.min_price)) query = query.gte('asking_price', filters.min_price);
  if (Number.isFinite(filters.max_price)) query = query.lte('asking_price', filters.max_price);
  const { data, error } = await query; if (error) throw error; return data || [];
}
export async function submitAccountSale(userId, body) { const data = clean(body); const { data: row, error } = await supabaseAdmin.from('account_sale_listings').insert({ seller_id:userId, ...data }).select('*').single(); if (error) throw error; return row; }
export async function getMyAccountSales(userId) { const { data, error } = await supabaseAdmin.from('account_sale_listings').select('*').eq('seller_id',userId).order('created_at',{ascending:false}); if(error) throw error; return data || []; }
export async function reviewAccountSale(id, body, adminId) { const action=text(body.action); if (!['approve','reject'].includes(action)) throw new Error('Invalid review action.'); const { data,error }=await supabaseAdmin.from('account_sale_listings').update({review_status:action==='approve'?'approved':'rejected',reviewer_note:text(body.note)||null,reviewed_by:adminId,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('review_status','pending').select('*').single(); if(error) throw error; return data; }
export async function accountSaleReviewQueue() { const {data,error}=await supabaseAdmin.from('account_sale_listings').select('*').eq('review_status','pending').order('created_at',{ascending:false}); if(error) throw error; return data||[]; }
export async function completeAccountSale(id,userId,finalPrice) { const price=Number(finalPrice); if(!Number.isFinite(price)||price<=0) throw new Error('Enter a valid final sale price.'); const {data,error}=await supabaseAdmin.rpc('complete_account_sale',{p_listing_id:id,p_seller_id:userId,p_final_sale_price:price}); if(error) throw error; return data; }
