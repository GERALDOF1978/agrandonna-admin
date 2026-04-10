import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { Pizza, CupSoda, Plus, Edit2, Trash2, X, ClipboardList, MapPin, Settings, User, ImageIcon, Power, Phone, Printer, MessageCircle, Send, Upload, BarChart3, Users, LogOut, Search } from 'lucide-react';

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
const OWNER = "geraldof1978@gmail.com";

export default function Admin() {
  const [u, setU] = useState(null); const [prm, setPrm] = useState(false);
  const [aba, setAba] = useState('pedidos'); const [peds, setPeds] = useState([]);
  const [sabs, setSabs] = useState([]); const [bebs, setBebs] = useState([]);
  const [bans, setBans] = useState([]); const [edit, setEdit] = useState(null);
  const [upL, setUpL] = useState(false); const [mst, setMst] = useState(false);
  const [equipe, setEquipe] = useState([]); const [filtro, setFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [cfg, setCfg] = useState({ tempo: 40, taxa: 6, aberto: true, zap: '19988723803', logo: 'https://i.ibb.co/WN4kL4xv/logo-pizza.jpg', topo: 'A GRANDONNA', pe: 'Obrigado!' });

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      if (user) {
        if (user.email === OWNER) { setU(user); setPrm(true); }
        else onSnapshot(collection(db, 'admin_users'), s => {
          if (s.docs.map(d => d.data().email).includes(user.email)) { setU(user); setPrm(true); }
          else { signOut(auth); alert("Acesso Negado!"); }
        });
      } else setPrm(false);
    });
  }, []);

  useEffect(() => {
    if (!prm) return;
    onSnapshot(query(collection(db,'pedidos'), orderBy('timestamp','desc')), s => setPeds(s.docs.map(d=>({id:d.id,...d.data()}))));
    onSnapshot(collection(db,'menu_sabores'), s => setSabs(s.docs.map(d=>({id:d.id,...d.data()}))));
    onSnapshot(collection(db,'menu_bebidas'), s => setBebs(s.docs.map(d=>({id:d.id,...d.data()}))));
    onSnapshot(collection(db,'menu_banners'), s => setBans(s.docs.map(d=>({id:d.id,...d.data()}))));
    onSnapshot(collection(db,'admin_users'), s => setEquipe(s.docs.map(d=>({id:d.id,...d.data()}))));
    onSnapshot(doc(db,'loja_config','geral'), s => s.exists() && setCfg(s.data()));
  }, [prm]);

  const pndt = useMemo(() => peds.filter(p => p.status === 'pendente').length, [peds]);
  const cx = useMemo(() => {
    const d = peds.filter(p => new Date(p.timestamp).toISOString().split('T')[0] === filtro && p.status === 'entregue');
    const t = d.reduce((a, b) => a + (b.total || 0), 0);
    const m = {}; d.flatMap(p => p.items).forEach(i => { const n = i.name || `PZ ${i.tamanho?.name}`; m[n] = (m[n] || 0) + 1; });
    return { t, q: d.length, i: Object.entries(m), avg: d.length ? t/d.length : 0 };
  }, [peds, filtro]);

  const handleUp = async (f, cb) => {
    setUpL(true); const fd = new FormData(); fd.append('image', f);
    const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
    const d = await r.json(); cb(d.data.url); setUpL(false);
  };

  const salvar = async (e) => {
    e.preventDefault(); const c = aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':aba==='banners'?'menu_banners':'admin_users';
    const d = {...edit}; delete d.id; if(edit.id) await updateDoc(doc(db,c,edit.id),d); else await addDoc(collection(db,c),d);
    setEdit(null);
  };

  if (!prm) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <button onClick={()=>signInWithPopup(auth,provider)} className="bg-white text-black p-5 rounded-3xl font-black uppercase flex items-center gap-3 shadow-xl">
        <img src="https://www.google.com/favicon.ico" className="w-5"/> Entrar com Google
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4 shadow-2xl z-30">
        <img src={cfg.logo} className="w-16 h-16 rounded-full mx-auto border-2 border-yellow-500 object-cover mb-4"/>
        <nav className="space-y-1 flex-1">
          {['pedidos','sabores','bebidas','banners','caixa','equipe','sistema'].map(m => (
            <button key={m} onClick={()=>setAba(m)} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-between ${aba===m?'bg-red-600 shadow-lg':'text-gray-500 hover:bg-gray-900'}`}>
              <div className="flex items-center gap-2">{m}</div>
              {m==='pedidos' && pndt > 0 && <span className="bg-white text-red-600 px-2 rounded-full animate-bounce">{pndt}</span>}
            </button>
          ))}
        </nav>
        <button onClick={()=>signOut(auth)} className="text-gray-600 font-bold text-[10px] uppercase flex items-center gap-2"><LogOut size={14}/> Sair</button>
      </aside>

      <main className={`flex-1 p-4 md:p-10 overflow-y-auto ${aba==='pedidos'?'bg-gray-200':'bg-gray-50'}`}>
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">{aba}</h1>
          {['sabores','bebidas','banners','equipe'].includes(aba) && <button onClick={()=>{
              if(aba==='equipe'&&!mst){const p=prompt("Senha Master:");if(p==='GRAN2026')setMst(true);else return;}
              setEdit(aba==='sabores'?{name:'',desc:'',prices:{grande:0,gigante:0},img:''}:aba==='bebidas'?{name:'',price:0,img:''}:{title:'',imageUrl:''});
          }} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase">Novo</button>}
        </header>

        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {peds.map(p => (
              <div key={p.id} className={`bg-white rounded-[40px] shadow-xl border-t-8 p-6 flex flex-col gap-3 ${p.status==='pendente'?'border-red-600 animate-pulse':'border-transparent'}`}>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-black text-[10px] text-gray-400 tracking-widest">#{p.id.slice(-4).toUpperCase()}</span>
                  <div className="flex gap-2">
                    <button onClick={()=>window.open(`https://wa.me/55${p.clientPhone}`)} className="p-2 bg-green-50 text-green-600 rounded-full"><Phone size={14}/></button>
                    <button className="p-2 bg-blue-50 text-blue-600 rounded-full"><MessageCircle size={14}/></button>
                  </div>
                </div>
                <div className="font-black uppercase text-sm">{p.clientName}</div>
                <div className="text-[10px] font-bold text-gray-500 bg-gray-50 p-2 rounded-xl"><MapPin size={10} className="inline mr-1 text-red-500"/> {p.entrega==='retirada'?'BALCÃO':`${p.end?.rua}, ${p.end?.num}`}</div>
                <div className="flex-1 py-2 space-y-2 border-y">
                   {p.items?.map((it,idx)=>(<div key={idx}>
                    <div className="flex justify-between font-bold text-xs"><span>1x {it.name||`Pizza ${it.tamanho?.name}`}</span><span>R$ {it.preco?.toFixed(2)}</span></div>
                    {it.sabores?.map(s=>(<p key={s.id} className="text-[9px] text-gray-400 italic">+ {s.name} ({s.desc})</p>))}
                   </div>))}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {['pendente','preparando','saiu_entrega','entregue'].map(st=>(<button key={st} onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:st})} className={`p-2 rounded-xl text-[7px] font-black uppercase ${p.status===st?'bg-red-600 text-white shadow-md':'bg-gray-100 text-gray-400'}`}>{st}</button>))}
                </div>
                <div className="font-black text-green-600 text-center text-lg pt-2">R$ {p.total?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {aba === 'caixa' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border flex items-center gap-4 shadow-sm">
              <Search size={20} className="text-gray-400"/><input type="date" className="bg-transparent font-black outline-none w-full" value={filtro} onChange={e=>setFiltro(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white p-8 rounded-[40px] border border-green-100"><p className="text-[10px] font-black text-gray-400 uppercase">Faturamento</p><p className="text-3xl font-black text-green-600">R$ {cx.t.toFixed(2)}</p></div>
              <div className="bg-white p-8 rounded-[40px] border"><p className="text-[10px] font-black text-gray-400 uppercase">Ticket Médio</p><p className="text-3xl font-black">R$ {cx.avg.toFixed(2)}</p></div>
              <div className="bg-white p-8 rounded-[40px] border"><p className="text-[10px] font-black text-gray-400 uppercase">Pedidos OK</p><p className="text-3xl font-black">{cx.q}</p></div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border shadow-sm">
              <h3 className="font-black uppercase text-xs text-gray-400 border-b pb-4 mb-4">Relatório de Itens</h3>
              {cx.i.map(([n, q]) => (
                <div key={n} className="flex justify-between font-bold text-sm border-b border-gray-50 py-2"><span>{n}</span><span className="bg-red-50 text-red-600 px-3 rounded-full text-xs flex items-center">{q}x</span></div>
              ))}
            </div>
          </div>
        )}

        {['sabores','bebidas','banners'].includes(aba) && (
          <div className="bg-white rounded-[40px] shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase">
                <tr><th className="p-6">Produto / Ingredientes</th><th className="p-6">Preços</th><th className="p-6 text-right">Ações</th></tr>
              </thead>
              <tbody>{(aba==='sabores'?sabs:aba==='bebidas'?bebs:bans).map(it => (
                <tr key={it.id} className="border-b hover:bg-gray-50 transition-all">
                  <td className="p-6 flex items-center gap-4">
                    <img src={it.img || it.imageUrl || cfg.logo} className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white"/>
                    <div>
                      <p className="font-black uppercase text-xs text-gray-900">{it.name||it.title}</p>
                      {aba==='sabores' && <p className="text-[10px] text-red-600 font-bold italic leading-tight mt-1 max-w-[300px]">{it.desc || 'Sem ingredientes cadastrados'}</p>}
                    </div>
                  </td>
                  <td className="p-6 font-bold text-[10px] text-gray-500">
                    {it.price ? `R$ ${it.price.toFixed(2)}` : it.prices ? `G: ${it.prices.grande} | GG: ${it.prices.gigante}` : '-'}
                  </td>
                  <td className="p-6 text-right">
                    <button onClick={()=>setEdit(it)} className="p-2 text-blue-600 mr-2"><Edit2 size={16}/></button>
                    <button onClick={async ()=>{if(window.confirm('Excluir?')) await deleteDoc(doc(db,aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':'menu_banners', it.id))}} className="p-2 text-red-600"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {aba === 'sistema' && (
          <div className="max-w-md bg-white p-10 rounded-[50px] shadow-xl border space-y-6 mx-auto">
             <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-[40px] border-2 border-dashed">
                <img src={cfg.logo} className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" />
                <label className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black cursor-pointer"><Upload size={14}/>
                  <input type="file" className="hidden" onChange={async e => await handleUp(e.target.files[0], (url)=>setCfg({...cfg, logo: url}))} />
                </label>
             </div>
             <button onClick={()=>setCfg({...cfg, aberto: !cfg.aberto})} className={`w-full p-5 rounded-3xl font-black uppercase ${cfg.aberto?'bg-green-600 text-white':'bg-red-600 text-white'}`}><Power size={18}/> {cfg.aberto ? 'LOJA ABERTA' : 'LOJA FECHADA'}</button>
             <div className="space-y-4">
                <div><label className="text-[10px] font-black uppercase text-gray-400 px-3">WhatsApp</label><input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold" value={cfg.zap} onChange={e=>setCfg({...cfg, zap: e.target.value})}/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-3">Tempo</label><input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold" value={cfg.tempo} onChange={e=>setCfg({...cfg, tempo: e.target.value})} /></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-3">Taxa</label><input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold" value={cfg.taxa} onChange={e=>setCfg({...cfg, taxa: parseFloat(e.target.value)})}/></div>
                </div>
                <div><label className="text-[10px] font-black uppercase text-gray-400 px-3">Topo Cupom</label><input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold" value={cfg.topo} onChange={e=>setCfg({...cfg, topo: e.target.value})}/></div>
             </div>
             <button onClick={async ()=>{await setDoc(doc(db,'loja_config','geral'), cfg); alert('Salvo!')}} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase">Salvar Tudo</button>
          </div>
        )}
      </main>

      {edit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 z-[100]">
          <form onSubmit={salvar} className="bg-white rounded-[50px] w-full max-w-lg p-10 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black uppercase italic border-b pb-4 flex justify-between items-center text-gray-800">Editar {aba} <button type="button" onClick={()=>setEdit(null)}><X size={30}/></button></h2>
            {['sabores','bebidas','banners'].includes(aba) && (
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                 <img src={edit.img || edit.imageUrl || cfg.logo} className="w-32 h-32 rounded-[30px] object-cover shadow-xl border-4 border-white" />
                 <label className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase cursor-pointer flex items-center gap-2 hover:bg-red-600 transition-all">
                   <Upload size={16}/> {upL ? 'Subindo...' : 'Carregar Imagem'}
                   <input type="file" className="hidden" onChange={async e => await handleUp(e.target.files[0], (url)=>setEdit({...edit, [aba==='banners'?'imageUrl':'img']: url}))} />
                 </label>
              </div>
            )}
            <div className="space-y-4">
              <input placeholder="Nome" className="w-full p-5 bg-gray-50 border rounded-3xl font-bold outline-none" value={edit.name||edit.title} onChange={e=>setEdit({...edit, [aba==='banners'?'title':'name']: e.target.value})} required />
              {aba==='sabores' && <textarea placeholder="Ingredientes (Ex: Mussarela, molho, manjericão)" className="w-full h-32 p-5 bg-gray-50 border rounded-3xl font-bold outline-none" value={edit.desc} onChange={e=>setEdit({...edit, desc: e.target.value})} />}
              {aba==='sabores' && <div className="grid grid-cols-2 gap-4">{['grande','gigante','meio_metro'].map(t=>(<div key={t}><label className="text-[10px] uppercase font-black text-gray-400 px-3">{t}</label><input type="number" step="0.01" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={edit.prices?.[t]||0} onChange={e=>setEdit({...edit, prices: {...edit.prices, [t]: parseFloat(e.target.value)}})}/></div>))}</div>}
              {aba==='bebidas' && <input type="number" step="0.01" placeholder="Preço" className="w-full p-5 bg-gray-50 border rounded-3xl font-bold" value={edit.price} onChange={e=>setEdit({...edit, price: parseFloat(e.target.value)})}/>}
              {aba==='equipe' && <input placeholder="Gmail" className="w-full p-5 bg-gray-50 border rounded-3xl font-bold outline-none" value={edit.email} onChange={e=>setEdit({...edit, email: e.target.value})} />}
            </div>
            <button type="submit" disabled={upL} className="w-full bg-red-600 text-white p-6 rounded-[30px] font-black uppercase shadow-xl hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50">Gravar Dados</button>
          </form>
        </div>
      )}
    </div>
  );
}