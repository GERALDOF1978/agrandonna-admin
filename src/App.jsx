import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { Pizza, CupSoda, Plus, Edit2, Trash2, Save, X, Flame, ClipboardList, Clock, MapPin, Settings, MessageCircle, Phone, History, Store, Bike, Send, User, ImageIcon } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyCeeWoPLjf14v12RguHdlL4GjpKs3TGrjA",
  authDomain: "pizzaria-a-grandonna.firebaseapp.com",
  projectId: "pizzaria-a-grandonna",
  storageBucket: "pizzaria-a-grandonna.firebasestorage.app",
  messagingSenderId: "961510711770",
  appId: "1:961510711770:web:44fca1ff969613fc2f20e3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function AdminApp() {
  const [logado, setLogado] = useState(false);
  const [senha, setSenha] = useState('');
  const [aba, setAba] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]); const [sabores, setSabores] = useState([]);
  const [bebidas, setBebidas] = useState([]); const [banners, setBanners] = useState([]);
  const [conf, setConf] = useState({ tempoEntrega: 40, taxaMinima: 6 });
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    if (!logado) return;
    onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => setPedidos(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_sabores'), s => setSabores(s.docs.map(d => ({id: d.id, ...d.data()}))).sort((a,b)=>a.name?.localeCompare(b.name)));
    onSnapshot(collection(db, 'menu_bebidas'), s => setBebidas(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(doc(db, 'loja_config', 'geral'), s => s.exists() && setConf(s.data()));
  }, [logado]);

  const salvarItem = async (e) => {
    e.preventDefault();
    const col = aba === 'sabores' ? 'menu_sabores' : aba === 'bebidas' ? 'menu_bebidas' : 'menu_banners';
    if (editando.id) await updateDoc(doc(db, col, editando.id), editando);
    else await addDoc(collection(db, col), editando);
    setEditando(null);
  };

  if (!logado) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-black p-8 rounded-[40px] border border-gray-800 w-full max-w-sm text-center">
        <h1 className="text-xl font-black text-white italic mb-6 uppercase text-yellow-500">A Grandonna Admin</h1>
        <input type="password" placeholder="SENHA" className="w-full bg-gray-900 text-white p-4 rounded-2xl text-center mb-4 border border-gray-800 font-black" value={senha} onChange={e=>setSenha(e.target.value)} />
        <button onClick={() => senha === '1234' ? setLogado(true) : alert('Senha Errada')} className="w-full bg-red-600 text-white p-4 rounded-2xl font-black uppercase">Entrar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4 shadow-xl">
        <h2 className="font-black italic text-yellow-500 uppercase text-center border-b border-gray-800 pb-4">Central de Comando</h2>
        <nav className="space-y-2">
          {['pedidos', 'sabores', 'bebidas', 'banners', 'sistema'].map(m => (
            <button key={m} onClick={() => setAba(m)} className={`w-full p-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 ${aba === m ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-900'}`}>
              {m === 'pedidos' && <ClipboardList size={18}/>} {m === 'sabores' && <Pizza size={18}/>} {m === 'bebidas' && <CupSoda size={18}/>} {m === 'banners' && <ImageIcon size={18}/>} {m === 'sistema' && <Settings size={18}/>} {m}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm">
          <h1 className="text-2xl font-black text-gray-800 uppercase italic">{aba}</h1>
          {['sabores', 'bebidas', 'banners'].includes(aba) && <button onClick={()=>setEditando(aba==='sabores'?{name:'',prices:{grande:0,gigante:0,meio_metro:0},category:'salgada'}:aba==='bebidas'?{name:'',price:0}:{title:'',imageUrl:''})} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2"><Plus size={16}/> Novo</button>}
        </header>

        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pedidos.map(p => (
              <div key={p.id} className={`bg-white rounded-3xl shadow-md border-2 p-5 flex flex-col gap-3 ${p.status === 'pendente' ? 'border-red-500 ring-4 ring-red-500/10' : 'border-transparent'}`}>
                <div className="flex justify-between font-black text-gray-800 border-b pb-2 text-sm"><span>#{p.id.slice(-4).toUpperCase()}</span><span className="text-gray-400">{new Date(p.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div>
                <div className="font-bold text-sm text-gray-800 flex items-center gap-2"><User size={14} className="text-red-600"/> {p.clientName} <span className="text-[10px] text-gray-400">{p.clientPhone}</span></div>
                <div className="bg-gray-50 p-3 rounded-xl text-[11px] font-bold text-gray-600"><MapPin size={12} className="inline mr-1 text-red-500"/> {p.entrega === 'retirada' ? 'RETIRADA NO BALCÃO' : `${p.end?.rua}, ${p.end?.num}`}</div>
                <div className="flex-1 space-y-1 py-2">{p.items?.map((it, idx) => <div key={idx} className="text-[11px] font-bold flex gap-1"><span className="text-red-600">1x</span> {it.tipo === 'pizza' ? `Pizza ${it.tamanho?.name}` : it.name}</div>)}</div>
                {p.pag === 'dinheiro' && p.troco && <div className="bg-yellow-100 p-2 rounded-lg text-[10px] font-black text-yellow-700 uppercase">TROCO PARA: R$ {p.troco}</div>}
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-black text-green-600 text-lg">R$ {p.total?.toFixed(2)}</span>
                  <select value={p.status} onChange={(e)=> updateDoc(doc(db, 'pedidos', p.id), {status: e.target.value})} className="bg-gray-100 text-[10px] font-black p-2 rounded-lg uppercase">
                    <option value="pendente">Pendente</option><option value="preparando">Preparando</option><option value="saiu_entrega">Saiu Entrega</option><option value="entregue">Finalizado</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {['sabores', 'bebidas', 'banners'].includes(aba) && (
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-gray-400 font-black uppercase text-[10px]"><tr><th className="p-4">Item</th><th className="p-4 text-right">Ações</th></tr></thead>
              <tbody>
                {(aba==='sabores'?sabores:aba==='bebidas'?bebidas:banners).map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-800">{item.name || item.title}</td>
                    <td className="p-4 text-right">
                      <button onClick={()=>setEditando(item)} className="p-2 text-blue-600"><Edit2 size={16}/></button>
                      <button onClick={()=>window.confirm('Excluir?') && deleteDoc(doc(db, aba==='sabores'?'menu_sabores':aba==='bebidas'?'menu_bebidas':'menu_banners', item.id))} className="p-2 text-red-600"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {aba === 'sistema' && (
          <div className="max-w-md bg-white p-8 rounded-[40px] shadow-sm border space-y-6">
             <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Tempo de Entrega (Min)</label><input type="number" className="w-full bg-gray-50 p-4 rounded-2xl border font-black text-xl" value={conf.tempoEntrega} onChange={e=>setConf({...conf, tempoEntrega: e.target.value})} /></div>
             <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Taxa de Entrega (R$)</label><input type="number" className="w-full bg-gray-50 p-4 rounded-2xl border font-black text-xl" value={conf.taxaMinima} onChange={e=>setConf({...conf, taxaMinima: parseFloat(e.target.value)})}/></div>
             <button onClick={async ()=> {await setDoc(doc(db, 'loja_config', 'geral'), conf); alert('Configurações Salvas!')}} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase">Salvar Sistema</button>
          </div>
        )}
      </main>

      {editando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <form onSubmit={salvarItem} className="bg-white rounded-[40px] w-full max-w-lg p-8 space-y-4">
            <h2 className="text-xl font-black uppercase italic border-b pb-4">Editar {aba}</h2>
            <input placeholder="Nome/Título" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={editando.name || editando.title} onChange={e=>setEditando({...editando, [aba==='banners'?'title':'name']: e.target.value})} required />
            {aba === 'sabores' && <div className="grid grid-cols-2 gap-3">
              {['grande', 'gigante', 'meio_metro'].map(t => (
                <div key={t}><label className="text-[10px] font-black text-gray-400 uppercase">{t}</label><input type="number" className="w-full p-3 border rounded-xl" value={editando.prices[t]} onChange={e=>setEditando({...editando, prices: {...editando.prices, [t]: parseFloat(e.target.value)}})}/></div>
              ))}
            </div>}
            {aba === 'bebidas' && <input type="number" placeholder="Preço" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={editando.price} onChange={e=>setEditando({...editando, price: parseFloat(e.target.value)})} />}
            {aba === 'banners' && <input placeholder="Link da Imagem" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={editando.imageUrl} onChange={e=>setEditando({...editando, imageUrl: e.target.value})} />}
            <div className="flex gap-4 pt-4"><button type="button" onClick={()=>setEditando(null)} className="flex-1 font-black uppercase text-gray-400">Cancelar</button><button type="submit" className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black uppercase">Salvar</button></div>
          </form>
        </div>
      )}
    </div>
  );
}