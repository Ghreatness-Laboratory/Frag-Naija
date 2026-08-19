'use client';
import { useEffect, useState } from 'react';
import { Search, Swords, Upload } from 'lucide-react';
import Link from 'next/link';
import { GAMES } from '@/lib/games';

type UserResult={id:string;username:string}; 
type Wager={ id:string; creator_id:string; opponent_id:string; creator_name:string; opponent_name:string; terms:string; stake_amount:number|string; status:string; game_slug?:string; proof_of_win_url?:string };

export default function CustomWagerPage(){
 const [rows,setRows]=useState<Wager[]>([]); 
 const [q,setQ]=useState(''); 
 const [users,setUsers]=useState<UserResult[]>([]); 
 const [opponent,setOpponent]=useState<UserResult|null>(null); 
 const [terms,setTerms]=useState(''); 
 const [stake,setStake]=useState(''); 
 const [gameSlug,setGameSlug]=useState('pubg-mobile');
 const [msg,setMsg]=useState('');
 const [proofFile, setProofFile] = useState<File | null>(null);
 const [uploading, setUploading] = useState(false);

 async function load(){ 
   const r=await fetch('/api/custom-wagers',{credentials:'include'}); 
   if(r.status===401){setMsg('Login required.');return;} 
   if(r.ok)setRows(await r.json()); 
 }

 useEffect(()=>{load();},[]);

 async function search(v:string){ 
   setQ(v); 
   if(v.length<2){setUsers([]);return;} 
   const r=await fetch(`/api/custom-wagers/search?q=${encodeURIComponent(v)}`,{credentials:'include'}); 
   if(r.ok)setUsers(await r.json()); 
 }

 async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
   const file = e.target.files?.[0];
   if (!file) return;
   if (!file.type.startsWith('image/')) {
     setMsg('Please upload an image file');
     return;
   }
   setProofFile(file);
 }

 async function create(e:React.FormEvent){ 
   e.preventDefault(); 
   if(!opponent) return; 
   let proofUrl = '';
   
   // Upload proof if file selected
   if (proofFile) {
     setUploading(true);
     const formData = new FormData();
     formData.append('file', proofFile);
     formData.append('bucket', 'wager-proofs');
     
     try {
       const uploadRes = await fetch('/api/upload', {
         method: 'POST',
         credentials: 'include',
         body: formData
       });
       const uploadData = await uploadRes.json();
       if (uploadRes.ok) {
         proofUrl = uploadData.url;
       } else {
         setMsg(`Proof upload failed: ${uploadData.error}`);
         setUploading(false);
         return;
       }
     } catch (err) {
       setMsg('Failed to upload proof image');
       setUploading(false);
       return;
     }
     setUploading(false);
   }

   const r=await fetch('/api/custom-wagers',{
     method:'POST',
     credentials:'include',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({
       opponent_id:opponent.id,
       terms,
       stake_amount:stake,
       game_slug: gameSlug,
       proof_of_win_url: proofUrl || null
     })
   }); 
   const d=await r.json(); 
   setMsg(r.ok?'Invite sent.':d.error); 
   if(r.ok){
     setTerms('');
     setStake('');
     setOpponent(null);
     setGameSlug('pubg-mobile');
     setProofFile(null);
     load();
   } 
 }

 async function act(id:string, action:string, extra={}){ 
   const r=await fetch(`/api/custom-wagers/${id}`,{
     method:'POST',
     credentials:'include',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({action,...extra})
   }); 
   const d=await r.json(); 
   if(r.ok)setRows(d); 
   else setMsg(d.error); 
 }

 function getGameName(slug: string) {
   return GAMES.find(g => g.slug === slug)?.name || slug;
 }

 return <main className="min-h-screen bg-fn-black px-3 py-5 pb-28 text-fn-text sm:px-6">
   <section className="mx-auto max-w-5xl">
     <p className="fn-label text-fn-green"><Swords size={12} className="mr-1 inline"/>Custom Wager Escrow</p>
     <h1 className="font-display text-3xl font-black uppercase tracking-widest">Peer Wagers</h1>
     <p className="mt-2 text-xs text-fn-muted">Search by username, agree exact terms, fund both stakes into escrow, then confirm the outcome or submit evidence for admin dispute review.</p>
     
     {msg&&<p className="mt-3 border border-fn-green/30 bg-fn-green/10 p-2 text-xs text-fn-green">{msg} {msg==='Login required.'&&<Link href="/login?next=/custom-wager" className="underline">Login</Link>}</p>}
     
     <form onSubmit={create} className="mt-5 grid gap-3 border border-fn-gborder bg-fn-card p-4">
       <label>
         <span className="fn-label">Opponent username</span>
         <div className="mt-2 flex gap-2"><Search size={16}/><input value={opponent?.username||q} onChange={e=>search(e.target.value)} className="flex-1 bg-fn-black border border-fn-gborder px-3 py-2 text-xs"/></div>
         {users.map(u=><button key={u.id} type="button" onClick={()=>{setOpponent(u);setUsers([]);}} className="mr-2 mt-2 border border-fn-green/30 px-2 py-1 text-xs text-fn-green">{u.username}</button>)}
       </label>
       
       <label>
         <span className="fn-label">Game</span>
         <select value={gameSlug} onChange={e=>setGameSlug(e.target.value)} className="mt-2 w-full bg-fn-black border border-fn-gborder px-3 py-2 text-xs" required>
           {GAMES.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
         </select>
       </label>
       
       <label>
         <span className="fn-label">Terms</span>
         <textarea value={terms} onChange={e=>setTerms(e.target.value)} className="mt-2 w-full bg-fn-black border border-fn-gborder px-3 py-2 text-xs" required/>
       </label>
       
       <label>
         <span className="fn-label">Stake amount (₦500 - ₦5,000,000)</span>
         <input value={stake} onChange={e=>setStake(e.target.value)} type="number" min="500" max="5000000" className="mt-2 w-full bg-fn-black border border-fn-gborder px-3 py-2 text-xs" required/>
       </label>
       
       <label>
         <span className="fn-label">Proof of Win (optional at creation)</span>
         <div className="mt-2 flex items-center gap-2">
           <Upload size={16} className="text-fn-muted"/>
           <input type="file" accept="image/*" onChange={handleProofUpload} className="flex-1 text-xs text-fn-muted"/>
         </div>
         {proofFile && <p className="mt-1 text-[10px] text-fn-green">Selected: {proofFile.name}</p>}
       </label>
       
       <button disabled={uploading} className="fn-btn py-3 text-xs">{uploading ? 'Uploading...' : 'Send Invite'}</button>
     </form>
     
     <div className="mt-5 space-y-3">
       {rows.map(w=><article key={w.id} className="border border-fn-gborder bg-fn-card p-4">
         <div className="flex justify-between gap-3">
           <div>
             <p className="font-black uppercase">{w.creator_name} vs {w.opponent_name}</p>
             <p className="mt-1 text-xs text-fn-muted">{w.terms}</p>
             <p className="fn-label mt-2">₦{Number(w.stake_amount).toLocaleString()} each · {getGameName(String(w.game_slug || 'pubg-mobile'))} · {w.status}</p>
             {w.proof_of_win_url && <p className="mt-1 text-[10px] text-fn-green">📎 Proof uploaded</p>}
           </div>
           <div className="flex flex-col gap-2 text-[10px]">
             <button onClick={()=>act(w.id,'accept')} className="border border-fn-green/40 px-2 py-1 text-fn-green">Accept</button>
             <button onClick={()=>act(w.id,'fund')} className="border border-fn-yellow/40 px-2 py-1 text-fn-yellow">Fund</button>
             <button onClick={()=>act(w.id,'claim',{winner_id:w.creator_id})} className="border border-fn-gborder px-2 py-1">Creator won</button>
             <button onClick={()=>act(w.id,'claim',{winner_id:w.opponent_id})} className="border border-fn-gborder px-2 py-1">Opponent won</button>
             <button onClick={()=>{const image_url=prompt('Evidence screenshot URL'); if(image_url) act(w.id,'evidence',{image_url,note:'User submitted evidence'});}} className="border border-fn-red/40 px-2 py-1 text-fn-red">Dispute + Evidence</button>
           </div>
         </div>
       </article>)}
     </div>
   </section>
 </main> 
}
