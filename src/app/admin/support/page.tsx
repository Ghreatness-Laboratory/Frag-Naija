'use client';
import { useEffect, useState } from 'react';

export default function AdminSupportPage(){
 const [prompt,setPrompt]=useState(''); const [msg,setMsg]=useState('');
 useEffect(()=>{fetch('/api/admin/settings',{credentials:'include'}).then(r=>r.ok?r.json():{}).then(s=>setPrompt(String(s.support_chatbot_prompt||'')));},[]);
 async function save(e:React.FormEvent){e.preventDefault(); const r=await fetch('/api/admin/settings',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({support_chatbot_prompt:prompt})}); setMsg(r.ok?'Support prompt saved.':'Failed to save prompt.');}
 return <div className="p-8"><h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">AI Support Chatbot</h1><p className="mt-1 text-xs text-fn-muted">Edit the grounding prompt/knowledge base used by the provider-agnostic support chatbot.</p><form onSubmit={save} className="mt-5 max-w-4xl"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="min-h-80 w-full border border-fn-gborder bg-fn-black p-3 text-xs text-fn-text"/><button className="fn-btn mt-3 px-4 py-2 text-xs">Save Prompt</button>{msg&&<p className="mt-3 text-xs text-fn-green">{msg}</p>}</form></div>
}
