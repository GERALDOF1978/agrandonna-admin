import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc, where } from 'firebase/firestore';
import { Pizza, CupSoda, Plus, Edit2, Trash2, Save, X, Flame, ClipboardList, Clock, MapPin, Settings, User, ImageIcon, Bike, Power, Phone, Printer, Send, Upload, Loader2, BarChart3, Users } from 'lucide-react';

const config = {
  apiKey: "AIzaSyCeeWoPLjf14v12RguHdlL4GjpKs3TGrjA",
  authDomain: "pizzaria-a-grandonna.firebaseapp.com",
  projectId: "pizzaria-a-grandonna",
  storageBucket: "pizzaria-a-grandonna.firebasestorage.app",
  messagingSenderId: "961510711770",
  appId: "1:961510711770:web:44fca1ff969613fc2f20e3"
};

const app = initializeApp(config); const db = getFirestore(app);
const IMGBB_KEY = "00f5e74d2657312c5173d6aa4018c614";

export default function Admin() {
  const [log, setLog] = useState(false); const [pass, setPass] = useState('');
  const [aba, setAba] = useState('pedidos'); const [peds, setPeds] = useState([]);
  const [sabs, setSabs] = useState([]); const [bebs, setBebs] = useState([]);
  const [bans, setBanners] = useState([]); const [edit, setEdit] = useState(null);
  const [upLoad, setUpLoad] = useState(false); const [equipe, setEquipe] = useState([]);
  const [cfg, setCfg] = useState({ tempo: 40, taxa: 6, aberto: true, zap: '19988723803', logo: 'https://i.ibb.co/WN4kL4xv/logo-pizza.jpg', cabecalho: 'A GRANDONNA' });

  useEffect(() => {
    if (!log) return;
    onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => setPeds(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_sabores'), s => setSabs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_bebidas'), s => setBebs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'admin_users'), s => setEquipe(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(doc(db, 'loja_config', 'geral'), s => s.exists() && setCfg(s.data()));
  }, [log]);

  const pendentes = useMemo(() => peds.filter(p => p.status === 'pendente').length, [peds]);
  
  const caixa = useMemo(() => {
    const hoje = new Date().toLocaleDateString();
    const doDia = peds.filter(p => new Date(p.timestamp).toLocaleDateString() === hoje && p.status === 'entregue');
    const total = doDia.reduce((acc, p) => acc + p.total, 0);
    const pizzas = doDia.flatMap(p => p.items).filter(i => i.tipo === 'pizza').length;
    return { total, pizzas, qtd: doDia.length };
  }, [peds]);

  const handleUp = async (file, cb) => {
    setUpLoad(true); const fd = new FormData(); fd.append('image', file);
    try { const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
      const d = await res.json(); cb(d.data.url); } catch (e) { alert("Erro"); } setUpLoad(false);
  };

  const salvar = async (e) => {
    e.preventDefault(); const col = aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':aba==='banners'?'menu_banners':'admin_users';
    const d = {...edit}; delete d.id;
    if(edit.id) await updateDoc(doc(db, col, edit.id), d); else await addDoc(collection(db, col), d);
    setEdit(null);
  };

  if(!log) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-[40px] w-full max-w-sm text-center border border-gray-800 shadow-2xl">
        <img src={cfg.logo} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-yellow-500 object-cover"/>
        <input type="password" placeholder="SENHA" className="w-full bg-black text-white p-4 rounded-2xl text-center mb-4 border border-gray-800 font-bold" value={pass} onChange={e=>setPass(e.target.value)} />
        <button onClick={()=>pass==='1234'?setLog(true):alert('Erro')} className="w-full bg-yellow-500 text-black p-4 rounded-2xl font-black uppercase shadow-lg shadow-yellow-500/20">Entrar no Sistema</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4 shadow-xl z-20">
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
          <img src={cfg.logo} className="w-12 h-12 rounded-full border border-yellow-500 object-cover"/>
          <h2 className="font-black italic text-yellow-500 text-xs uppercase">Gestão A Grandonna</h2>
        </div>
        <nav className="space-y-1">
          {['pedidos','sabores','bebidas','banners','caixa','equipe','sistema'].map(m => (
            <button key={m} onClick={()=>setAba(m)} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-between transition-all ${aba===m?'bg-red-600 text-white shadow-lg shadow-red-600/20':'text-gray-500 hover:bg-gray-900'}`}>
              <div className="flex items-center gap-2">
                {m==='pedidos'&&<ClipboardList size={16}/>}{m==='sabores'&&<Pizza size={16}/>}{m==='bebidas'&&<CupSoda size={16}/>}
                {m==='caixa'&&<BarChart3 size={16}/>}{m==='equipe'&&<Users size={16}/>}{m==='banners'&&<ImageIcon size={16}/>}{m==='sistema'&&<Settings size={16}/>} {m}
              </div>
              {m==='pedidos' && pendentes > 0 && <span className="bg-white text-red-600 w-5 h-5 flex items-center justify-center rounded-full text-[10px] animate-bounce">{pendentes}</span>}
            </button>
          ))}</nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border">
          <h1 className="text-2xl font-black text-gray-800 uppercase italic leading-none">{aba}</h1>
          {['sabores','bebidas','banners','equipe'].includes(aba) && <button onClick={()=>setEdit(aba==='sabores'?{name:'',prices:{grande:0,gigante:0},img:''} : aba==='equipe'?{nome:'',cargo:'admin'} : aba==='bebidas'?{name:'',price:0,img:''} : {title:'',imageUrl:''})} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2"><Plus size={14}/> Novo Item</button>}
        </header>

        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {peds.map(p => (
              <div key={p.id} className={`bg-white rounded-3xl shadow-md border-2 p-5 flex flex-col gap-3 ${p.status==='pendente'?'border-red-500 animate-pulse':'border-transparent'}`}>
                <div className="flex justify-between font-black text-xs border-b pb-2"><span>#{p.id.slice(-4).toUpperCase()}</span><span className="text-gray-400">{new Date(p.timestamp).toLocaleTimeString()}</span></div>
                <div className="font-bold text-sm flex items-center gap-2 text-gray-800"><User size={14} className="text-red-600"/> {p.clientName}</div>
                <div className="bg-gray-50 p-3 rounded-xl text-[10px] font-bold text-gray-600"><MapPin size={12} className="inline mr-1 text-red-500"/> {p.entrega==='retirada'?'RETIRADA NO BALCÃO':`${p.end?.rua}, ${p.end?.num}`}</div>
                <div className="flex-1 text-[11px] font-bold text-gray-700 py-2 border-y space-y-1">{p.items?.map((it,idx)=><div key={idx} className="flex justify-between"><span>1x {it.name || it.tamanho?.name}</span><span className="text-gray-400">R$ {it.preco?.toFixed(2)}</span></div>)}</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['pendente','preparando','saiu_entrega','entregue'].map(st => (
                    <button key={st} onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:st})} className={`p-2 rounded-lg text-[8px] font-black uppercase ${p.status===st?'bg-red-600 text-white':'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{st.replace('_',' ')}</button>
                  ))}
                </div>
                <div className="font-black text-green-600 text-center text-lg mt-2 pt-2 border-t">TOTAL R$ {p.total?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {aba === 'caixa' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-green-100 text-center"><p className="text-[10px] font-black text-gray-400 uppercase">Vendas Hoje (Finalizadas)</p><p className="text-3xl font-black text-green-600">R$ {caixa.total.toFixed(2)}</p></div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border text-center"><p className="text-[10px] font-black text-gray-400 uppercase">Total de Pedidos</p><p className="text-3xl font-black text-gray-800">{caixa.qtd}</p></div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border text-center"><p className="text-[10px] font-black text-gray-400 uppercase">Pizzas Vendidas</p><p className="text-3xl font-black text-red-600">{caixa.pizzas}</p></div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
               <table className="w-full text-left text-[11px] font-bold">
                 <thead className="bg-gray-50 text-gray-400 uppercase"><tr><th className="p-4">Data</th><th className="p-4">Cliente</th><th className="p-4">Valor</th><th className="p-4">Pagamento</th></tr></thead>
                 <tbody>{peds.filter(p=>p.status==='entregue').map(p=>(<tr key={p.id} className="border-b">
                   <td className="p-4">{new Date(p.timestamp).toLocaleDateString()}</td><td className="p-4 uppercase">{p.clientName}</td><td className="p-4 text-green-600">R$ {p.total.toFixed(2)}</td><td className="p-4 uppercase">{p.pag}</td>
                 </tr>))}</tbody>
               </table>
            </div>
          </div>
        )}

        {['sabores','bebidas','banners','equipe'].includes(aba) && (
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase"><tr><th className="p-4">Item</th><th className="p-4 text-right">Ações</th></tr></thead>
              <tbody>{(aba==='sabores'?sabs:aba==='bebidas'?bebs:aba==='banners'?bans:equipe).map(it => (
                <tr key={it.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    {it.img || it.imageUrl ? <img src={it.img || it.imageUrl} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><User size={16}/></div>}
                    <div className="font-bold text-gray-800 uppercase text-xs">{it.name||it.title||it.nome}</div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={()=>setEdit(it)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={()=>window.confirm('Excluir?')&&deleteDoc(doc(db, aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':aba==='banners'?'menu_banners':'admin_users', it.id))} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {aba === 'sistema' && (
          <div className="max-w-md bg-white p-8 rounded-[40px] shadow-sm border space-y-6 mx-auto">
             <button onClick={()=>setCfg({...cfg, aberto: !cfg.aberto})} className={`w-full p-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3 transition-all ${cfg.aberto?'bg-green-600 text-white shadow-lg shadow-green-900/10':'bg-red-600 text-white shadow-lg shadow-red-900/20'}`}>
                <Power size={20}/> {cfg.aberto ? 'LOJA ESTÁ ABERTA' : 'LOJA ESTÁ FECHADA'}
             </button>
             <div><label className="text-[10px] font-black uppercase text-gray-400 px-1">WhatsApp Loja</label><input className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={cfg.zap} onChange={e=>setCfg({...cfg, zap: e.target.value})}/></div>
             <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase text-gray-400 px-1">Tempo Médio</label><input type="number" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={cfg.tempo} onChange={e=>setCfg({...cfg, tempo: e.target.value})} /></div>
                <div><label className="text-[10px] font-black uppercase text-gray-400 px-1">Taxa Entrega</label><input type="number" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={cfg.taxa} onChange={e=>setCfg({...cfg, taxa: parseFloat(e.target.value)})}/></div>
             </div>
             <button onClick={async ()=>{await setDoc(doc(db,'loja_config','geral'), cfg); alert('Salvo!')}} className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase shadow-xl hover:scale-95 transition-all">Salvar Tudo</button>
          </div>
        )}
      </main>

      {edit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-[100]">
          <form onSubmit={salvar} className="bg-white rounded-[40px] w-full max-w-lg p-8 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-black uppercase italic border-b pb-4 flex justify-between items-center text-gray-800">Editar {aba} <button type="button" onClick={()=>setEdit(null)}><X size={24} className="text-gray-400"/></button></h2>
            {['sabores','bebidas','banners'].includes(aba) && (
              <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-[30px] border-2 border-dashed border-gray-200">
                 <img src={edit.img || edit.imageUrl || cfg.logo} className="w-24 h-24 rounded-2xl object-cover shadow-md" />
                 <label className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer flex items-center gap-2 hover:bg-blue-700">
                   {upLoad ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Carregar Foto
                   <input type="file" className="hidden" onChange={e => handleUp(e.target.files[0], (url) => setEdit({...edit, [aba==='banners'?'imageUrl':'img']: url}))} />
                 </label>
              </div>
            )}
            <input placeholder="Nome" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={edit.name||edit.title||edit.nome} onChange={e=>setEdit({...edit, [aba==='banners'?'title':aba==='equipe'?'nome':'name']: e.target.value})} required />
            {aba==='sabores' && <div className="grid grid-cols-2 gap-3">{['grande','gigante','meio_metro'].map(t=>(<div key={t}><label className="text-[10px] uppercase font-black text-gray-400 px-1">{t}</label><input type="number" className="w-full p-3 border rounded-xl font-bold" value={edit.prices?.[t] || 0} onChange={e=>setEdit({...edit, prices: {...edit.prices, [t]: parseFloat(e.target.value)}})}/></div>))}</div>}
            {aba==='bebidas' && <div><label className="text-[10px] uppercase font-black text-gray-400 px-1">Preço</label><input type="number" step="0.01" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={edit.price} onChange={e=>setEdit({...edit, price: parseFloat(e.target.value)})}/></div>}
            <button type="submit" disabled={upLoad} className="w-full bg-green-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50 hover:bg-green-700 active:scale-95 transition-all mt-4">Salvar Alterações</button>
          </form>
        </div>
      )}
    </div>
  );
}