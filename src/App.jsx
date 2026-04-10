import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { Pizza, CupSoda, Plus, Edit2, Trash2, Save, X, Flame, ClipboardList, Clock, MapPin, Settings, User, ImageIcon, Bike, Power, Phone, Printer, Send, Upload, Loader2 } from 'lucide-react';

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
  const [bans, setBans] = useState([]); const [edit, setEdit] = useState(null);
  const [upLoading, setUpLoading] = useState(false);
  const [cfg, setCfg] = useState({ tempo: 40, taxa: 6, aberto: true, zap: '19988723803', logo: 'https://i.ibb.co/WN4kL4xv/logo-pizza.jpg', cabecalho: 'A GRANDONNA', rodape: 'Obrigado!' });

  useEffect(() => {
    if (!log) return;
    onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => setPeds(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_sabores'), s => setSabs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_bebidas'), s => setBebidas(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(doc(db, 'loja_config', 'geral'), s => s.exists() && setCfg(s.data()));
  }, [log]);

  const handleUpload = async (file, callback) => {
    setUpLoading(true); const formData = new FormData(); formData.append('image', file);
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: formData });
      const data = await res.json(); callback(data.data.url);
    } catch (e) { alert("Erro upload"); } setUpLoading(false);
  };

  const imprimir = (p) => {
    const win = window.open('', '', 'width=300,height=600');
    win.document.write(`<html><head><style>body{font-family:monospace;width:80mm;padding:10px}hr{border:1px dashed #000}.bold{font-weight:bold}.center{text-align:center}</style></head><body>
      <div class="center bold">${cfg.cabecalho}</div><div class="center">Pedido: #${p.id.slice(-4).toUpperCase()}</div><hr>
      <div class="bold">CLIENTE: ${p.clientName}</div><div>TEL: ${p.clientPhone}</div><hr>
      ${p.items.map(i => `<div>1x ${i.name || i.tamanho?.name} - R$ ${i.preco.toFixed(2)}</div>`).join('')}<hr>
      <div class="bold">TOTAL: R$ ${p.total.toFixed(2)}</div><div>PAG: ${p.pag.toUpperCase()}</div><hr>
      <div>${p.entrega === 'retirada' ? 'RETIRADA' : `${p.end?.rua}, ${p.end?.num}\n${p.end?.bairro}`}</div><hr>
      <div class="center">${cfg.rodape}</div></body></html>`);
    win.document.close(); win.print();
  };

  const salvar = async (e) => {
    e.preventDefault(); const col = aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':'menu_banners';
    if(edit.id) await updateDoc(doc(db, col, edit.id), edit); else await addDoc(collection(db, col), edit);
    setEdit(null);
  };

  if(!log) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-[40px] w-full max-w-sm text-center border border-gray-800 shadow-2xl">
        <img src={cfg.logo} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-yellow-500 object-cover"/>
        <input type="password" placeholder="SENHA" className="w-full bg-black text-white p-4 rounded-2xl text-center mb-4 border border-gray-800" value={pass} onChange={e=>setPass(e.target.value)} />
        <button onClick={()=>pass==='1234'?setLog(true):alert('Erro')} className="w-full bg-red-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg">Entrar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col items-center gap-2 border-b border-gray-800 pb-4">
          <img src={cfg.logo} className="w-16 h-16 rounded-full border-2 border-yellow-500 object-cover"/>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${cfg.aberto ? 'bg-green-600' : 'bg-red-600'}`}>{cfg.aberto ? 'Online' : 'Offline'}</div>
        </div>
        <nav className="space-y-2">{['pedidos','sabores','bebidas','banners','sistema'].map(m => (
            <button key={m} onClick={()=>setAba(m)} className={`w-full p-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 ${aba===m?'bg-red-600 shadow-md':'text-gray-500 hover:bg-gray-900'}`}>{m}</button>
          ))}</nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border">
          <h1 className="text-2xl font-black text-gray-800 uppercase italic">{aba}</h1>
          {['sabores','bebidas','banners'].includes(aba) && <button onClick={()=>setEdit(aba==='sabores'?{name:'',prices:{grande:0,gigante:0,meio_metro:0},img:''} : aba==='bebidas'?{name:'',price:0,img:''} : {title:'',imageUrl:''})} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black uppercase"><Plus size={16}/></button>}
        </header>

        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {peds.map(p => (
              <div key={p.id} className={`bg-white rounded-3xl shadow-md border-2 p-5 flex flex-col gap-3 ${p.status==='pendente'?'border-red-500 animate-pulse':'border-transparent'}`}>
                <div className="flex justify-between font-black text-xs border-b pb-2"><span>#{p.id.slice(-4).toUpperCase()}</span><button onClick={()=>imprimir(p)} className="text-blue-600 flex items-center gap-1"><Printer size={14}/> Imprimir</button></div>
                <div className="font-bold text-sm text-gray-800 flex items-center gap-2"><User size={14} className="text-red-600"/> {p.clientName}</div>
                <div className="flex gap-2">
                   <button onClick={()=>window.open(`https://wa.me/55${p.clientPhone}`)} className="bg-green-100 text-green-700 p-2 rounded-lg flex-1 text-[10px] font-black uppercase flex items-center justify-center gap-1"><Phone size={14}/> Zap</button>
                   <button className="bg-blue-100 text-blue-700 p-2 rounded-lg flex-1 text-[10px] font-black uppercase flex items-center justify-center gap-1"><MessageCircle size={14}/> Chat</button>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl text-[10px] font-bold"><MapPin size={12} className="inline mr-1 text-red-500"/> {p.entrega==='retirada'?'RETIRADA':`${p.end?.rua}, ${p.end?.num}`}</div>
                <div className="flex-1 text-[11px] font-bold text-gray-700 py-2 border-y">{p.items?.map((it,idx)=><div key={idx} className="flex justify-between"><span>1x {it.name || it.tamanho?.name}</span><span>R$ {it.preco.toFixed(2)}</span></div>)}</div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:'pendente'})} className={`p-2 rounded-lg text-[8px] font-black uppercase ${p.status==='pendente'?'bg-red-600 text-white':'bg-gray-100'}`}>Pendente</button>
                  <button onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:'preparando'})} className={`p-2 rounded-lg text-[8px] font-black uppercase ${p.status==='preparando'?'bg-yellow-500 text-white':'bg-gray-100'}`}>Cozinha</button>
                  <button onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:'saiu_entrega'})} className={`p-2 rounded-lg text-[8px] font-black uppercase ${p.status==='saiu_entrega'?'bg-blue-600 text-white':'bg-gray-100'}`}>Entrega</button>
                  <button onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:'entregue'})} className={`p-2 rounded-lg text-[8px] font-black uppercase ${p.status==='entregue'?'bg-green-600 text-white':'bg-gray-100'}`}>Concluído</button>
                </div>
                <div className="font-black text-green-600 text-center text-lg mt-2 pt-2 border-t">TOTAL R$ {p.total?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {aba === 'sistema' && (
          <div className="max-w-md bg-white p-8 rounded-[40px] shadow-sm border space-y-4 mx-auto">
             <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                <img src={cfg.logo} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" />
                <label className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer flex items-center gap-2">
                  <Upload size={14}/> {upLoading ? 'Aguarde...' : 'Trocar Logo'}
                  <input type="file" className="hidden" onChange={e => handleUpload(e.target.files[0], (url) => setCfg({...cfg, logo: url}))} />
                </label>
             </div>
             <button onClick={()=>setCfg({...cfg, aberto: !cfg.aberto})} className={`w-full p-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3 transition-all ${cfg.aberto?'bg-green-600 text-white shadow-lg shadow-green-900/10':'bg-red-600 text-white'}`}>
                <Power size={20}/> {cfg.aberto ? 'LOJA ABERTA' : 'LOJA FECHADA'}
             </button>
             <div><label className="text-[10px] font-black text-gray-400 uppercase">WhatsApp Loja</label><input className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={cfg.zap} onChange={e=>setCfg({...cfg, zap: e.target.value})}/></div>
             <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-gray-400 uppercase">Tempo Médio</label><input type="number" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={cfg.tempo} onChange={e=>setCfg({...cfg, tempo: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase">Taxa Entrega</label><input type="number" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={cfg.taxa} onChange={e=>setCfg({...cfg, taxa: parseFloat(e.target.value)})}/></div>
             </div>
             <button onClick={async ()=>{await setDoc(doc(db,'loja_config','geral'), cfg); alert('Atualizado!')}} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase shadow-xl">Salvar Tudo</button>
          </div>
        )}

        {['sabores','bebidas','banners'].includes(aba) && (
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase"><tr><th className="p-4">Foto</th><th className="p-4">Nome</th><th className="p-4 text-right">Ações</th></tr></thead>
              <tbody>{(aba==='sabores'?sabs:aba==='bebidas'?bebs:bans).map(it => (
                <tr key={it.id} className="border-b hover:bg-gray-50">
                  <td className="p-4"><img src={it.img || it.imageUrl || cfg.logo} className="w-10 h-10 rounded-lg object-cover border shadow-sm" /></td>
                  <td className="p-4 font-bold text-gray-800">{it.name||it.title}</td>
                  <td className="p-4 text-right flex justify-end gap-2"><button onClick={()=>setEdit(it)} className="p-2 text-blue-600"><Edit2 size={16}/></button><button onClick={()=>window.confirm('Excluir?')&&deleteDoc(doc(db, aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':'menu_banners', it.id))} className="p-2 text-red-600"><Trash2 size={16}/></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </main>

      {edit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <form onSubmit={salvar} className="bg-white rounded-[40px] w-full max-w-lg p-8 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-black uppercase italic border-b pb-4 flex justify-between">Editar {aba} <button type="button" onClick={()=>setEdit(null)}><X/></button></h2>
            <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
               <img src={edit.img || edit.imageUrl || cfg.logo} className="w-24 h-24 rounded-2xl object-cover shadow-md" />
               <label className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer flex items-center gap-2">
                 {upLoading ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Carregar Foto
                 <input type="file" className="hidden" onChange={e => handleUpload(e.target.files[0], (url) => setEdit({...edit, [aba==='banners'?'imageUrl':'img']: url}))} />
               </label>
            </div>
            <input placeholder="Nome" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={edit.name||edit.title} onChange={e=>setEdit({...edit, [aba==='banners'?'title':'name']: e.target.value})} required />
            {aba==='sabores' && <div className="grid grid-cols-2 gap-3">{['grande','gigante','meio_metro'].map(t=>(<div key={t}><label className="text-[10px] uppercase font-black">{t}</label><input type="number" className="w-full p-3 border rounded-xl" value={edit.prices?.[t] || 0} onChange={e=>setEdit({...edit, prices: {...edit.prices, [t]: parseFloat(e.target.value)}})}/></div>))}</div>}
            {aba==='bebidas' && <input type="number" placeholder="Preço" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={edit.price} onChange={e=>setEdit({...edit, price: parseFloat(e.target.value)})}/>}
            <button type="submit" disabled={upLoading} className="w-full bg-green-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50">Salvar Item</button>
          </form>
        </div>
      )}
    </div>
  );
}