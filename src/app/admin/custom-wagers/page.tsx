'use client';
import { useEffect, useState } from 'react';
import AdminTable from '@/components/admin/AdminTable';
import { GAMES } from '@/lib/games';

type Row=Record<string, unknown>;
export default function AdminCustomWagersPage(){
 const [rows,setRows]=useState<Row[]>([]); 
 const [loading,setLoading]=useState(true); 
 const [reason,setReason]=useState('');
 
 async function load(){
   setLoading(true); 
   const r=await fetch('/api/admin/custom-wagers',{credentials:'include'}); 
   if(r.ok)setRows(await r.json()); 
   setLoading(false);
 }
 
 useEffect(()=>{load();},[]);
 
 async function resolve(row:Row, decision:string, winner_id?:string){ 
   const r=await fetch(`/api/admin/custom-wagers/${row.id}/resolve`,{
     method:'POST',
     credentials:'include',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({decision,winner_id,reason})
   }); 
   if(r.ok)load(); 
   else alert((await r.json()).error); 
 }
 
 function getGameName(slug: string) {
   return GAMES.find(g => g.slug === slug)?.name || slug;
 }

 return <div className="p-8">
   <h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">Custom Wager Disputes</h1>
   <p className="mt-1 text-xs text-fn-muted">Review escrow disputes, evidence, claims, and resolve with an audited decision.</p>
   
   <label className="mt-4 block">
     <span className="fn-label">Resolution reason</span>
     <input value={reason} onChange={e=>setReason(e.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-2 text-xs"/>
   </label>
   
   <div className="mt-5">
     <AdminTable 
       loading={loading} 
       rows={rows} 
       emptyText="No custom wagers yet" 
       columns={[
         {key:'game_slug',label:'Game',render:(v)=><span className="text-[10px]">{getGameName(String(v||'pubg-mobile'))}</span>},
         {key:'creator_name',label:'Creator'},
         {key:'opponent_name',label:'Opponent'},
         {key:'stake_amount',label:'Stake',render:(v)=><span>₦{Number(v).toLocaleString()}</span>},
         {key:'status',label:'Status'},
         {key:'terms',label:'Terms'}
       ]} 
       extraActions={(row)=><>
         {row.proof_of_win_url && (
           <a href={String(row.proof_of_win_url)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-fn-green underline">📎 View Proof</a>
         )}
         {(row as any).evidence?.map((ev:any,i:number)=><a key={i} href={ev.image_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-fn-red underline">📎 Evidence {i+1}</a>)}
         <button onClick={()=>resolve(row,'creator',String(row.creator_id))} className="text-[10px] text-fn-green">Creator wins</button>
         <button onClick={()=>resolve(row,'opponent',String(row.opponent_id))} className="text-[10px] text-fn-green">Opponent wins</button>
         <button onClick={()=>resolve(row,'refund')} className="text-[10px] text-fn-yellow">Refund</button>
       </>} 
     />
   </div>
 </div>
}
