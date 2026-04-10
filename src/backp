import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { Pizza, CupSoda, Plus, Edit2, Trash2, X, Flame, ClipboardList, Clock, MapPin, Settings, User, ImageIcon, Power, Phone, Printer, MessageCircle, Send, Upload, Loader2, BarChart3, Users, LogOut, Search } from 'lucide-react';

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
  const [user, setUser] = useState(null); const [perm, setPerm] = useState(false);
  const [aba, setAba] = useState('pedidos'); const [peds, setPeds] = useState([]);
  const [sabs, setSabs] = useState([]); const [bebs, setBebs] = useState([]);
  const [bans, setBanners] = useState([]); const [edit, setEdit] = useState(null);
  const [upL, setUpL] = useState(false); const [masterOk, setMasterOk] = useState(false);
  const [equipe, setEquipe] = useState([]);
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [cfg, setCfg] = useState({ tempo: 40, taxa: 6, aberto: true, zap: '19988723803', logo: 'https://i.ibb.co/WN4kL4xv/logo-pizza.jpg', cabecalho: 'A GRANDONNA', rodape: 'Volte Sempre!' });

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      if (u) {
        if (u.email === OWNER) { setUser(u); setPerm(true); }
        else onSnapshot(collection(db, 'admin_users'), s => {
          if (s.docs.map(d => d.data().email).includes(u.email)) { setUser(u); setPerm(true); }
          else { signOut(auth); alert("Acesso Negado!"); }
        });
      } else setPerm(false);
    });
  }, []);

  useEffect(() => {
    if (!perm) return;
    onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => setPeds(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_sabores'), s => setSabs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_bebidas'), s => setBebs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'admin_users'), s => setEquipe(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(doc(db, 'loja_config', 'geral'), s => s.exists() && setCfg(s.data()));
  }, [perm]);

  const nPendentes = useMemo(() => peds.filter(p => p.status === 'pendente').length, [peds]);
  
  const statsCaixa = useMemo(() => {
    const pedsDia = peds.filter(p => new Date(p.timestamp).toISOString().split('T')[0] === dataFiltro && p.status === 'entregue');
    const total = pedsDia.reduce((a, b) => a + (b.total || 0), 0);
    const contagem = {};
    pedsDia.flatMap(p => p.items).forEach(i => {
      const nome = i.tipo === 'pizza' ? `Pizza ${i.tamanho?.name}` : i.name;
      contagem[nome] = (contagem[nome] || 0) + 1;
    });
    return { total, qtd: pedsDia.length, detalhes: Object.entries(contagem) };
  }, [peds, dataFiltro]);

  const handleUp = async (file, cb) => {
    setUpL(true); const fd = new FormData(); fd.append('image', file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
    const d = await res.json(); cb(d.data.url); setUpL(false);
  };

  const salvar = async (e) => {
    e.preventDefault(); const col = aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':aba==='banners'?'menu_banners':'admin_users';
    const d = {...edit}; delete d.id;
    if(edit.id) await updateDoc(doc(db, col, edit.id), d); else await addDoc(collection(db, col), d);
    setEdit(null);
  };

  if (!perm) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 p-10 rounded-[50px] w-full max-w-sm text-center border border-gray-800 shadow-2xl">
        <img src={cfg.logo} className="w-24 h-24 rounded-full mx-auto mb-6 border-2 border-yellow-500 shadow-lg object-cover"/>
        <button onClick={()=>signInWithPopup(auth, provider)} className="w-full bg-white text-black p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl">
          <img src="https://www.google.com/favicon.ico" className="w-5"/> Entrar com Google
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4 shadow-2xl z-30">
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-2">
          <img src={cfg.logo} className="w-10 h-10 rounded-full border border-yellow-500 object-cover"/>
          <p className="font-black text-yellow-500 text-[10px] uppercase">A Grandonna Admin</p>
        </div>
        <nav className="space-y-1 flex-1">
          {['pedidos','sabores','bebidas','banners','caixa','equipe','sistema'].map(m => (
            <button key={m} onClick={()=>setAba(m)} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-between ${aba===m?'bg-red-600 text-white shadow-lg':'text-gray-500 hover:bg-gray-900'}`}>
              <div className="flex items-center gap-2">{m}</div>
              {m==='pedidos' && nPendentes > 0 && <span className="bg-white text-red-600 px-2 rounded-full animate-bounce">{nPendentes}</span>}
            </button>
          ))}
        </nav>
        <button onClick={()=>signOut(auth)} className="mt-auto text-gray-600 font-bold text-[10px] uppercase flex items-center gap-2 hover:text-red-500"><LogOut size={14}/> Sair</button>
      </aside>

      <main className={`flex-1 p-4 md:p-10 overflow-y-auto transition-colors duration-500 ${aba === 'pedidos' ? 'bg-gray-300' : 'bg-gray-50'}`}>
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-black uppercase italic">{aba}</h1>
          {['sabores','bebidas','banners','equipe'].includes(aba) && <button onClick={()=>{
              if(aba==='equipe' && !masterOk) { const p = prompt("Senha Master:"); if(p==='GRAN2026') setMasterOk(true); else return; }
              setEdit(aba==='sabores'?{name:'',desc:'',prices:{grande:0,gigante:0,meio_metro:0},img:''} : aba==='equipe'?{nome:'',email:''} : aba==='bebidas'?{name:'',price:0,img:''} : {title:'',imageUrl:''});
          }} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl">Novo {aba}</button>}
        </header>

        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {peds.map(p => (
              <div key={p.id} className={`bg-white rounded-[40px] shadow-2xl border-t-8 p-6 flex flex-col gap-4 ${p.status==='pendente'?'border-red-600 animate-pulse':'border-transparent'}`}>
                <div className="flex justify-between border-b pb-3">
                  <span className="font-black text-xs text-gray-400 uppercase tracking-widest">#{p.id.slice(-4).toUpperCase()}</span>
                  <div className="flex gap-2">
                    <button onClick={()=>window.open(`https://wa.me/55${p.clientPhone}`)} className="p-2 bg-green-50 text-green-600 rounded-full"><Phone size={16}/></button>
                    <button className="p-2 bg-blue-50 text-blue-600 rounded-full"><MessageCircle size={16}/></button>
                  </div>
                </div>
                <div className="font-black uppercase text-sm flex items-center gap-2 text-gray-900"><User size={16} className="text-red-600"/> {p.clientName}</div>
                <div className="text-[10px] font-bold text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100"><MapPin size={12} className="inline mr-1 text-red-500"/> {p.entrega==='retirada'?'BALCÃO':`${p.end?.rua}, ${p.end?.num}`}</div>
                
                <div className="flex-1 py-2 space-y-3 border-y border-gray-100">
                   {p.items?.map((it,idx)=>(
                     <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between font-bold text-xs">
                          <span>1x {it.name || `Pizza ${it.tamanho?.name}`}</span>
                          <span className="text-gray-400">R$ {it.preco?.toFixed(2)}</span>
                        </div>
                        {it.sabores?.map(s => (
                          <div key={s.id} className="bg-gray-50/50 p-1 rounded">
                            <p className="text-[9px] text-red-600 uppercase font-black tracking-tight">{s.name}</p>
                            <p className="text-[8px] text-gray-500 italic leading-none">{s.desc || 'Sem ingredientes'}</p>
                          </div>
                        ))}
                     </div>
                   ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:'pendente'})} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all shadow-sm ${p.status==='pendente'?'bg-red-600 text-white shadow-red-200':'bg-gray-100 text-gray-400'}`}>Pendente</button>
                  <button onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:'preparando'})} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all shadow-sm ${p.status==='preparando'?'bg-yellow-500 text-white shadow-yellow-100':'bg-gray-100 text-gray-400'}`}>Cozinha</button>
                  <button onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:'saiu_entrega'})} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all shadow-sm ${p.status==='saiu_entrega'?'bg-blue-600 text-white shadow-blue-100':'bg-gray-100 text-gray-400'}`}>Entrega</button>
                  <button onClick={()=>updateDoc(doc(db,'pedidos',p.id),{status:'entregue'})} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all shadow-sm ${p.status==='entregue'?'bg-green-600 text-white shadow-green-100':'bg-gray-100 text-gray-400'}`}>Concluído</button>
                </div>
                <div className="font-black text-green-600 text-center text-xl pt-3 border-t">R$ {p.total?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {aba === 'caixa' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border flex items-center gap-4 shadow-sm">
              <Search size={20} className="text-gray-400"/><input type="date" className="bg-transparent font-black outline-none w-full" value={dataFiltro} onChange={e=>setDataFiltro(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border text-center border-green-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Total do Dia</p><p className="text-4xl font-black text-green-600">R$ {statsCaixa.total.toFixed(2)}</p></div>
              <div className="bg-white p-8 rounded-[40px] shadow-sm border text-center"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Finalizados</p><p className="text-4xl font-black">{statsCaixa.qtd}</p></div>
            </div>
          </div>
        )}

        {['sabores','bebidas','banners','equipe'].includes(aba) && (
          <div className="bg-white rounded-[40px] shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase">
                <tr>
                  <th className="p-6">Item / Ingredientes</th>
                  <th className="p-6">Valores Cadastrados</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>{(aba==='sabores'?sabs:aba==='bebidas'?bebs:aba==='banners'?bans:equipe).map(it => (
                <tr key={it.id} className="border-b border-gray-50 hover:bg-gray-50 transition-all">
                  <td className="p-6 flex items-center gap-4">
                    {(it.img || it.imageUrl) && <img src={it.img || it.imageUrl} className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white"/>}
                    <div>
                      <p className="font-black uppercase text-xs tracking-tighter text-gray-900">{it.name||it.title||it.nome}</p>
                      <p className="text-[10px] text-red-600 font-bold italic leading-tight mt-1 max-w-[250px]">{it.desc || it.email || 'Nenhuma descrição / Clique em editar'}</p>
                    </div>
                  </td>
                  <td className="p-6 font-bold text-[10px] text-gray-500 uppercase">
                    {it.price ? `Preço: R$ ${it.price.toFixed(2)}` : it.prices ? (
                      <div className="space-y-1">
                        <p className="bg-gray-100 px-2 py-0.5 rounded inline-block mr-1">G: R$ {it.prices.grande}</p>
                        <p className="bg-gray-100 px-2 py-0.5 rounded inline-block mr-1">GG: R$ {it.prices.gigante}</p>
                        <p className="bg-gray-100 px-2 py-0.5 rounded inline-block">1/2M: R$ {it.prices.meio_metro}</p>
                      </div>
                    ) : it.email || '-'}
                  </td>
                  <td className="p-6 text-right">
                    <button onClick={()=>setEdit(it)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"><Edit2 size={18}/></button>
                    <button onClick={async ()=>{if(window.confirm('Excluir permanentemente?')) await deleteDoc(doc(db, aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':aba==='banners'?'menu_banners':'admin_users', it.id))}} className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {aba === 'sistema' && (
          <div className="max-w-md bg-white p-10 rounded-[50px] shadow-2xl border space-y-8 mx-auto">
             <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                <img src={cfg.logo} className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" />
                <label className="bg-black text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase cursor-pointer flex items-center gap-2 hover:bg-red-600 transition-all shadow-lg">
                  <Upload size={14}/> {upL ? 'Enviando...' : 'Trocar Logo'}
                  <input type="file" className="hidden" onChange={async e => {
                    setUpL(true); const fd = new FormData(); fd.append('image', e.target.files[0]);
                    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
                    const d = await res.json(); setCfg({...cfg, logo: d.data.url}); setUpL(false);
                  }} />
                </label>
             </div>
             <button onClick={()=>setCfg({...cfg, aberto: !cfg.aberto})} className={`w-full p-6 rounded-3xl font-black uppercase flex items-center justify-center gap-3 transition-all ${cfg.aberto?'bg-green-600 text-white shadow-lg shadow-green-200':'bg-red-600 text-white shadow-lg shadow-red-200'}`}>
                <Power size={22}/> {cfg.aberto ? 'LOJA ABERTA' : 'LOJA FECHADA'}
             </button>
             <div className="space-y-4">
                <div><label className="text-[10px] font-black uppercase text-gray-400 px-3">WhatsApp da Loja</label><input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={cfg.zap} onChange={e=>setCfg({...cfg, zap: e.target.value})}/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-3">Tempo Médio</label><input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold" value={cfg.tempo} onChange={e=>setCfg({...cfg, tempo: e.target.value})} /></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-3">Taxa Entrega</label><input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold" value={cfg.taxa} onChange={e=>setCfg({...cfg, taxa: parseFloat(e.target.value)})}/></div>
                </div>
             </div>
             <button onClick={async ()=>{await setDoc(doc(db,'loja_config','geral'), cfg); alert('Sistema Atualizado!')}} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase shadow-xl hover:scale-95 transition-all">Salvar Tudo</button>
          </div>
        )}
      </main>

      {edit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 z-[100]">
          <form onSubmit={salvar} className="bg-white rounded-[50px] w-full max-w-lg p-10 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black uppercase italic border-b pb-6 flex justify-between items-center text-gray-800 tracking-tighter">Editar {aba} <button type="button" onClick={()=>setEdit(null)}><X size={30} className="text-gray-300"/></button></h2>
            {['sabores','bebidas','banners'].includes(aba) && (
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                 <img src={edit.img || edit.imageUrl || cfg.logo} className="w-32 h-32 rounded-[30px] object-cover shadow-xl border-4 border-white" />
                 <label className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase cursor-pointer flex items-center gap-2">
                   <Upload size={16}/> {upL ? 'Subindo...' : 'Carregar Foto'}
                   <input type="file" className="hidden" onChange={async e => {
                     setUpL(true); const fd = new FormData(); fd.append('image', e.target.files[0]);
                     const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
                     const d = await res.json(); setEdit({...edit, [aba==='banners'?'imageUrl':'img']: d.data.url}); setUpL(false);
                   }} />
                 </label>
              </div>
            )}
            <div className="space-y-4">
              <input placeholder="Nome do Item" className="w-full p-5 bg-gray-50 border rounded-3xl font-bold outline-none focus:border-red-500" value={edit.name||edit.title||edit.nome} onChange={e=>setEdit({...edit, [aba==='banners'?'title':aba==='equipe'?'nome':'name']: e.target.value})} required />
              {aba==='sabores' && <textarea placeholder="Ingredientes (Ex: Mussarela, presunto, ovo, cebola...)" className="w-full h-32 p-5 bg-gray-50 border rounded-3xl font-bold outline-none focus:border-red-500" value={edit.desc} onChange={e=>setEdit({...edit, desc: e.target.value})} />}
              {aba==='sabores' && <div className="grid grid-cols-2 gap-4">{['grande','gigante','meio_metro'].map(t=>(<div key={t}><label className="text-[10px] uppercase font-black text-gray-400 px-3">{t}</label><input type="number" step="0.01" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={edit.prices?.[t]||0} onChange={e=>setEdit({...edit, prices: {...edit.prices, [t]: parseFloat(e.target.value)}})}/></div>))}</div>}
              {aba==='bebidas' && <input type="number" step="0.01" placeholder="Preço de Venda" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold" value={edit.price} onChange={e=>setEdit({...edit, price: parseFloat(e.target.value)})}/>}
            </div>
            <button type="submit" disabled={upL} className="w-full bg-red-600 text-white p-6 rounded-[30px] font-black uppercase shadow-xl hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50">Gravar Alterações</button>
          </form>
        </div>
      )}
    </div>
  );
}