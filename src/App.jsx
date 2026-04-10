import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { Pizza, CupSoda, Plus, Edit2, Trash2, X, Flame, ClipboardList, Clock, MapPin, Settings, User, ImageIcon, Power, Phone, Printer, MessageCircle, Send, Upload, Loader2, BarChart3, Users, LogOut } from 'lucide-react';

const config = {
  apiKey: "AIzaSyCeeWoPLjf14v12RguHdlL4GjpKs3TGrjA",
  authDomain: "pizzaria-a-grandonna.firebaseapp.com",
  projectId: "pizzaria-a-grandonna",
  storageBucket: "pizzaria-a-grandonna.firebasestorage.app",
  messagingSenderId: "961510711770",
  appId: "1:961510711770:web:44fca1ff969613fc2f20e3"
};

const app = initializeApp(config); const db = getFirestore(app); const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const IMGBB_KEY = "00f5e74d2657312c5173d6aa4018c614";
const SENHA_MASTER = "GRAN2026";
const OWNER_EMAIL = "geraldof1978@gmail.com";

export default function Admin() {
  const [user, setUser] = useState(null); const [perm, setPerm] = useState(false);
  const [loading, setLoading] = useState(true); const [aba, setAba] = useState('pedidos');
  const [peds, setPeds] = useState([]); const [sabs, setSabs] = useState([]);
  const [bebs, setBebs] = useState([]); const [bans, setBans] = useState([]);
  const [equipe, setEquipe] = useState([]); const [edit, setEdit] = useState(null);
  const [upL, setUpL] = useState(false); const [masterOk, setMasterOk] = useState(false);
  const [cfg, setCfg] = useState({ tempo: 40, taxa: 6, aberto: true, logo: 'https://i.ibb.co/WN4kL4xv/logo-pizza.jpg' });

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        if (u.email === OWNER_EMAIL) { setUser(u); setPerm(true); setLoading(false); }
        else {
          onSnapshot(collection(db, 'admin_users'), s => {
            const lista = s.docs.map(d => d.data().email);
            if (lista.includes(u.email)) { setUser(u); setPerm(true); }
            else { alert("Acesso negado."); signOut(auth); }
            setLoading(false);
          });
        }
      } else { setUser(null); setPerm(false); setLoading(false); }
    });
  }, []);

  useEffect(() => {
    if (!perm) return;
    onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => setPeds(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_sabores'), s => setSabs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_bebidas'), s => setBebs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_banners'), s => setBans(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'admin_users'), s => setEquipe(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(doc(db, 'loja_config', 'geral'), s => s.exists() && setCfg(s.data()));
  }, [perm]);

  const login = () => signInWithPopup(auth, provider).catch(e => alert("Erro ao abrir login: " + e.message));
  const salvar = async (e) => {
    e.preventDefault(); const col = aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':aba==='banners'?'menu_banners':'admin_users';
    const d = {...edit}; delete d.id;
    if(edit.id) await updateDoc(doc(db, col, edit.id), d); else await addDoc(collection(db, col), d);
    setEdit(null);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-500 font-black italic">A GRANDONNA...</div>;

  if (!perm) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 p-10 rounded-[50px] w-full max-w-sm text-center border border-gray-800">
        <img src={cfg.logo} className="w-24 h-24 rounded-full mx-auto mb-6 border-2 border-yellow-500 shadow-xl"/>
        <button onClick={login} className="w-full bg-white text-black p-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 shadow-xl">
          <img src="https://www.google.com/favicon.ico" className="w-5"/> Entrar com Google
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4 shadow-2xl z-30">
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-2">
          <img src={cfg.logo} className="w-10 h-10 rounded-full border border-yellow-500 object-cover"/>
          <div><p className="font-black text-yellow-500 text-[10px] uppercase">Pizzaria</p><p className="font-bold text-xs uppercase">A Grandonna</p></div>
        </div>
        <nav className="space-y-1 flex-1">
          {['pedidos','sabores','bebidas','banners','caixa','equipe','sistema'].map(m => (
            <button key={m} onClick={()=>setAba(m)} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 transition-all ${aba===m?'bg-red-600 text-white shadow-lg':'text-gray-500 hover:bg-gray-900'}`}>
              {m}
            </button>
          ))}
        </nav>
        <button onClick={()=>signOut(auth)} className="flex items-center gap-2 p-4 text-gray-500 font-bold text-[10px] uppercase hover:text-red-500"><LogOut size={16}/> Sair</button>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-black uppercase italic">{aba}</h1>
          {['sabores','bebidas','banners','equipe'].includes(aba) && (
            <button onClick={()=>{
              if(aba==='equipe' && !masterOk) { const p = prompt("Senha Master:"); if(p===SENHA_MASTER) setMasterOk(true); else return; }
              setEdit(aba==='sabores'?{name:'',prices:{grande:0,gigante:0},img:''} : aba==='equipe'?{nome:'',email:''} : aba==='bebidas'?{name:'',price:0,img:''} : {title:'',imageUrl:''});
            }} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg"><Plus size={16}/> Novo</button>
          )}
        </header>

        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {peds.map(p => (
              <div key={p.id} className={`bg-white rounded-[40px] shadow-xl border-t-8 p-6 flex flex-col gap-4 ${p.status==='pendente'?'border-red-600':'border-gray-100'}`}>
                <div className="flex justify-between font-black text-gray-400 text-xs border-b pb-4"><span>#{p.id.slice(-4).toUpperCase()}</span><button className="text-blue-600" onClick={()=>{const win=window.open('',''); win.document.write(`Pedido: ${p.clientName}`); win.print();}}><Printer size={16}/></button></div>
                <div className="flex items-center gap-3"><User className="text-red-600"/><p className="font-black uppercase text-sm">{p.clientName}</p></div>
                <div className="bg-gray-50 p-4 rounded-3xl text-[11px] font-bold"><MapPin className="inline text-red-500 mr-1" size={14}/> {p.entrega==='retirada'?'BALCÃO':`${p.end?.rua}, ${p.end?.num}`}</div>
                <div className="flex-1 py-2 space-y-1">{p.items?.map((it,idx)=><div key={idx} className="flex justify-between font-bold text-xs"><span>1x {it.name || it.tamanho?.name}</span><span>R$ {it.preco?.toFixed(2)}</span></div>)}</div>
                <div className="grid grid-cols-4 gap-1">
                  {['pendente','preparando','saiu_entrega','entregue'].map(st=>(<button key={st} onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:st})} className={`p-2 rounded-lg text-[7px] font-black uppercase ${p.status===st?'bg-red-600 text-white':'bg-gray-100'}`}>{st}</button>))}
                </div>
                <div className="font-black text-green-600 text-center text-xl pt-4 border-t">R$ {p.total?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {['sabores','bebidas','banners','equipe'].includes(aba) && (
          <div className="bg-white rounded-[40px] shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase"><tr><th className="p-6">Item</th><th className="p-6">Preço/Email</th><th className="p-6 text-right">Ações</th></tr></thead>
              <tbody>{(aba==='sabores'?sabs:aba==='bebidas'?bebs:aba==='banners'?bans:equipe).map(it => (
                <tr key={it.id} className="border-b border-gray-50 hover:bg-gray-50 transition-all">
                  <td className="p-6 font-black uppercase text-xs flex items-center gap-4">
                    {(it.img || it.imageUrl) && <img src={it.img || it.imageUrl} className="w-12 h-12 rounded-2xl object-cover"/>}
                    {it.name||it.title||it.nome}
                  </td>
                  <td className="p-6 font-bold text-gray-500">{it.price ? `R$ ${it.price.toFixed(2)}` : it.email || it.prices?.grande || '-'}</td>
                  <td className="p-6 text-right">
                    <button onClick={()=>{ if(aba==='equipe'&&!masterOk){const p=prompt("Senha Master:"); if(p===SENHA_MASTER)setMasterOk(true); else return;} setEdit(it)}} className="p-2 text-blue-600 mr-2"><Edit2 size={16}/></button>
                    <button onClick={async ()=>{if(window.confirm('Excluir?')) await deleteDoc(doc(db, aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':aba==='banners'?'menu_banners':'admin_users', it.id))}} className="p-2 text-red-600"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </main>

      {edit && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center p-4 z-[100]">
          <form onSubmit={salvar} className="bg-white rounded-[50px] w-full max-w-lg p-10 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black uppercase italic border-b pb-6 flex justify-between items-center text-gray-800">Editar {aba} <button type="button" onClick={()=>setEdit(null)}><X size={30}/></button></h2>
            {['sabores','bebidas','banners'].includes(aba) && (
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                 <img src={edit.img || edit.imageUrl || cfg.logo} className="w-32 h-32 rounded-[30px] object-cover border-4 border-white shadow-xl" />
                 <label className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase cursor-pointer flex items-center gap-2">
                   <Upload size={16}/> {upL ? 'Subindo...' : 'Carregar Imagem'}
                   <input type="file" className="hidden" onChange={async e => {
                     setUpL(true); const fd = new FormData(); fd.append('image', e.target.files[0]);
                     const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
                     const d = await r.json(); setEdit({...edit, [aba==='banners'?'imageUrl':'img']: d.data.url}); setUpL(false);
                   }} />
                 </label>
              </div>
            )}
            <input placeholder="Nome" className="w-full p-5 bg-gray-50 border rounded-3xl font-bold outline-none" value={edit.name||edit.title||edit.nome} onChange={e=>setEdit({...edit, [aba==='banners'?'title':aba==='equipe'?'nome':'name']: e.target.value})} required />
            {aba==='equipe' && <input placeholder="E-mail Gmail" className="w-full p-5 bg-gray-50 border rounded-3xl font-bold outline-none" value={edit.email} onChange={e=>setEdit({...edit, email: e.target.value})} required />}
            {aba==='sabores' && <div className="grid grid-cols-2 gap-4">{['grande','gigante','meio_metro'].map(t=>(<div key={t}><label className="text-[10px] uppercase font-black text-gray-400 px-3">{t}</label><input type="number" step="0.01" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={edit.prices?.[t]||0} onChange={e=>setEdit({...edit, prices: {...edit.prices, [t]: parseFloat(e.target.value)}})}/></div>))}</div>}
            {aba==='bebidas' && <input type="number" step="0.01" placeholder="Preço" className="w-full p-5 bg-gray-50 border rounded-3xl font-bold" value={edit.price} onChange={e=>setEdit({...edit, price: parseFloat(e.target.value)})}/>}
            <button type="submit" disabled={upL} className="w-full bg-red-600 text-white p-6 rounded-[30px] font-black uppercase shadow-xl hover:scale-95 transition-all">Salvar Agora</button>
          </form>
        </div>
      )}
    </div>
  );
}