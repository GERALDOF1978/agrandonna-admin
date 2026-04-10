import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { Pizza, CupSoda, Plus, Edit2, Trash2, Save, X, Flame, ClipboardList, Clock, MapPin, Settings, User, ImageIcon, Bike, Power, Phone } from 'lucide-react';

const config = {
  apiKey: "AIzaSyCeeWoPLjf14v12RguHdlL4GjpKs3TGrjA",
  authDomain: "pizzaria-a-grandonna.firebaseapp.com",
  projectId: "pizzaria-a-grandonna",
  storageBucket: "pizzaria-a-grandonna.firebasestorage.app",
  messagingSenderId: "961510711770",
  appId: "1:961510711770:web:44fca1ff969613fc2f20e3"
};

const app = initializeApp(config); const db = getFirestore(app);
const LOGO = "https://i.ibb.co/WN4kL4xv/logo-pizza.jpg";

export default function Admin() {
  const [log, setLog] = useState(false); const [pass, setPass] = useState('');
  const [aba, setAba] = useState('pedidos'); const [peds, setPeds] = useState([]);
  const [sabs, setSabs] = useState([]); const [bebs, setBebs] = useState([]);
  const [bans, setBans] = useState([]); const [edit, setEdit] = useState(null);
  const [cfg, setCfg] = useState({ tempo: 40, taxa: 6, aberto: true, inicio: '18:00', fim: '23:00', zap: '19988723803' });

  useEffect(() => {
    if (!log) return;
    onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => setPeds(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_sabores'), s => setSabs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_bebidas'), s => setBebs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_banners'), s => setBans(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(doc(db, 'loja_config', 'geral'), s => s.exists() && setCfg(s.data()));
  }, [log]);

  const upStat = (id, st) => updateDoc(doc(db, 'pedidos', id), { status: st });
  const salvar = async (e) => {
    e.preventDefault(); const col = aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':'menu_banners';
    if(edit.id) await updateDoc(doc(db, col, edit.id), edit); else await addDoc(collection(db, col), edit);
    setEdit(null);
  };

  if(!log) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-black p-8 rounded-[40px] border border-gray-800 w-full max-w-sm text-center">
        <img src={LOGO} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-yellow-500"/><h1 className="text-white font-black italic mb-6 uppercase">A Grandonna Admin</h1>
        <input type="password" placeholder="SENHA" className="w-full bg-gray-900 text-white p-4 rounded-2xl text-center mb-4 border border-gray-800 font-black" value={pass} onChange={e=>setPass(e.target.value)} />
        <button onClick={()=>pass==='1234'?setLog(true):alert('Erro')} className="w-full bg-red-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg">Entrar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col items-center gap-2 border-b border-gray-800 pb-4">
          <img src={LOGO} className="w-12 h-12 rounded-full border border-yellow-500"/>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${cfg.aberto ? 'bg-green-600' : 'bg-red-600'}`}>{cfg.aberto ? 'Loja Aberta' : 'Loja Fechada'}</div>
        </div>
        <nav className="space-y-2">
          {['pedidos','sabores','bebidas','banners','sistema'].map(m => (
            <button key={m} onClick={()=>setAba(m)} className={`w-full p-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 ${aba===m?'bg-red-600 text-white shadow-md':'text-gray-500 hover:bg-gray-900'}`}>{m}</button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border">
          <h1 className="text-2xl font-black text-gray-800 uppercase italic">{aba}</h1>
          {['sabores','bebidas','banners'].includes(aba) && <button onClick={()=>setEdit(aba==='sabores'?{name:'',prices:{grande:0,gigante:0}} : aba==='bebidas'?{name:'',price:0} : {title:'',imageUrl:''})} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase"><Plus size={16}/></button>}
        </header>

        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {peds.map(p => (
              <div key={p.id} className={`bg-white rounded-3xl shadow-md border-2 p-5 flex flex-col gap-3 ${p.status==='pendente'?'border-red-500 animate-pulse':'border-transparent'}`}>
                <div className="flex justify-between font-black text-xs border-b pb-2"><span>#{p.id.slice(-4).toUpperCase()}</span><span className="text-gray-400">{new Date(p.timestamp).toLocaleTimeString()}</span></div>
                <div className="font-bold text-sm text-gray-800 flex items-center gap-2"><User size={14} className="text-red-600"/> {p.clientName}</div>
                <div className="bg-gray-50 p-3 rounded-xl text-[10px] font-bold text-gray-600"><MapPin size={12} className="inline mr-1 text-red-500"/> {p.entrega==='retirada'?'RETIRADA':`${p.end?.rua}, ${p.end?.num}`}</div>
                <div className="flex-1 text-[11px] font-bold text-gray-700 py-2 border-b">{p.items?.map((it,idx)=><div key={idx}>1x {it.name || it.tamanho?.name}</div>)}</div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={()=>upStat(p.id,'pendente')} className={`p-2 rounded-lg text-[8px] font-black uppercase ${p.status==='pendente'?'bg-red-600 text-white':'bg-gray-100 text-gray-400'}`}>Pendente</button>
                  <button onClick={()=>upStat(p.id,'preparando')} className={`p-2 rounded-lg text-[8px] font-black uppercase ${p.status==='preparando'?'bg-yellow-500 text-white':'bg-gray-100 text-gray-400'}`}>Preparando</button>
                  <button onClick={()=>upStat(p.id,'saiu_entrega')} className={`p-2 rounded-lg text-[8px] font-black uppercase ${p.status==='saiu_entrega'?'bg-blue-600 text-white':'bg-gray-100 text-gray-400'}`}>Na Rua</button>
                  <button onClick={()=>upStat(p.id,'entregue')} className={`p-2 rounded-lg text-[8px] font-black uppercase ${p.status==='entregue'?'bg-green-600 text-white':'bg-gray-100 text-gray-400'}`}>Concluído</button>
                </div>
                <div className="font-black text-green-600 text-center text-lg mt-2 pt-2 border-t">R$ {p.total?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {aba === 'sistema' && (
          <div className="max-w-md bg-white p-8 rounded-[40px] shadow-sm border space-y-6 mx-auto">
             <button onClick={()=>setCfg({...cfg, aberto: !cfg.aberto})} className={`w-full p-6 rounded-3xl font-black uppercase flex items-center justify-center gap-3 transition-all ${cfg.aberto?'bg-green-600 text-white shadow-lg shadow-green-900/20':'bg-red-600 text-white shadow-lg shadow-red-900/20'}`}>
                <Power size={24}/> {cfg.aberto ? 'LOJA ESTÁ ABERTA' : 'LOJA ESTÁ FECHADA'}
             </button>
             <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-gray-400 uppercase">Abre as:</label><input type="time" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={cfg.inicio} onChange={e=>setCfg({...cfg, inicio: e.target.value})}/></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase">Fecha as:</label><input type="time" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={cfg.fim} onChange={e=>setCfg({...cfg, fim: e.target.value})}/></div>
             </div>
             <div><label className="text-[10px] font-black text-gray-400 uppercase">Tempo Médio (Min)</label><input type="number" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={cfg.tempo} onChange={e=>setCfg({...cfg, tempo: e.target.value})} /></div>
             <div><label className="text-[10px] font-black text-gray-400 uppercase">Taxa de Entrega (R$)</label><input type="number" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={cfg.taxa} onChange={e=>setCfg({...cfg, taxa: parseFloat(e.target.value)})}/></div>
             <div><label className="text-[10px] font-black text-gray-400 uppercase">Seu WhatsApp (Ex: 199...)</label><input className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={cfg.zap} onChange={e=>setCfg({...cfg, zap: e.target.value})}/></div>
             <button onClick={async ()=>{await setDoc(doc(db,'loja_config','geral'), cfg); alert('Salvo!')}} className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase shadow-xl">Salvar Tudo</button>
          </div>
        )}

        {['sabores','bebidas','banners'].includes(aba) && (
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase"><tr><th className="p-4">Item</th><th className="p-4 text-right">Ações</th></tr></thead>
              <tbody>{(aba==='sabores'?sabs:aba==='bebidas'?bebs:bans).map(it => (
                <tr key={it.id} className="border-b hover:bg-gray-50"><td className="p-4 font-bold text-gray-800">{it.name||it.title}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={()=>setEdit(it)} className="p-2 text-blue-600"><Edit2 size={16}/></button><button onClick={()=>window.confirm('Excluir?')&&deleteDoc(doc(db, aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':'menu_banners', it.id))} className="p-2 text-red-600"><Trash2 size={16}/></button></td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </main>

      {edit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <form onSubmit={salvar} className="bg-white rounded-[40px] w-full max-w-lg p-8 space-y-4 shadow-2xl">
            <h2 className="text-xl font-black uppercase italic border-b pb-4 flex justify-between">Editar {aba} <button type="button" onClick={()=>setEdit(null)}><X/></button></h2>
            <input placeholder="Nome" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={edit.name||edit.title} onChange={e=>setEdit({...edit, [aba==='banners'?'title':'name']: e.target.value})} required />
            {aba==='sabores' && <div className="grid grid-cols-2 gap-3">{['grande','gigante','meio_metro'].map(t=>(<div key={t}><label className="text-[10px] uppercase font-black">{t}</label><input type="number" className="w-full p-3 border rounded-xl" value={edit.prices?.[t]||0} onChange={e=>setEdit({...edit, prices: {...edit.prices, [t]: parseFloat(e.target.value)}})}/></div>))}</div>}
            {aba==='bebidas' && <input type="number" placeholder="Preço" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={edit.price} onChange={e=>setEdit({...edit, price: parseFloat(e.target.value)})}/>}
            {aba==='banners' && <input placeholder="Link da Imagem" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={edit.imageUrl} onChange={e=>setEdit({...edit, imageUrl: e.target.value})}/>}
            <button type="submit" className="w-full bg-green-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg">Salvar Agora</button>
          </form>
        </div>
      )}
    </div>
  );
}