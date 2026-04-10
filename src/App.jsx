import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc, where } from 'firebase/firestore';
import { 
  Pizza, Image as ImageIcon, CupSoda, Plus, Edit2, Trash2, 
  Save, X, Lock, Flame, ClipboardList, CheckCircle2, Clock, Truck, MapPin, 
  Settings, AlertTriangle, MessageCircle, Phone, History, Store, Bike, Send, User
} from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCeeWoPLjf14v12RguHdlL4GjpKs3TGrjA",
  authDomain: "pizzaria-a-grandonna.firebaseapp.com",
  projectId: "pizzaria-a-grandonna",
  storageBucket: "pizzaria-a-grandonna.firebasestorage.app",
  messagingSenderId: "961510711770",
  appId: "1:961510711770:web:44fca1ff969613fc2f20e3",
  measurementId: "G-T9ZXS4C0G8"
};

const LOGO_URL = "https://i.ibb.co/WN4kL4xv/logo-pizza.jpg";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function AdminApp() {
  const [logado, setLogado] = useState(false);
  const [senha, setSenha] = useState('');
  const [aba, setAba] = useState('pedidos'); 
  const [pedidos, setPedidos] = useState([]);
  const [sabores, setSabores] = useState([]);
  const [bebidas, setBebidas] = useState([]);
  const [banners, setBanners] = useState([]);
  const [config, setConfig] = useState({ tempoEntrega: 40, taxaMinima: 6 });
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    if (!logado) return;
    // Listeners com segurança para evitar tela branca
    const unsubP = onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => setPedidos(s.docs.map(d => ({id: d.id, ...d.data()}))), e => console.log(e));
    const unsubS = onSnapshot(collection(db, 'menu_sabores'), s => setSabores(s.docs.map(d => ({id: d.id, ...d.data()}))), e => console.log(e));
    const unsubB = onSnapshot(collection(db, 'menu_bebidas'), s => setBebidas(s.docs.map(d => ({id: d.id, ...d.data()}))), e => console.log(e));
    const unsubN = onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({id: d.id, ...d.data()}))), e => console.log(e));
    const unsubC = onSnapshot(doc(db, 'loja_config', 'geral'), s => s.exists() && setConfig(s.data()), e => console.log(e));
    return () => { unsubP(); unsubS(); unsubB(); unsubN(); unsubC(); };
  }, [logado]);

  if (!logado) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-black p-8 rounded-[40px] border border-gray-800 w-full max-w-sm text-center shadow-2xl">
        <img src={LOGO_URL} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-yellow-500 object-cover" />
        <h1 className="text-xl font-black text-white italic mb-6 uppercase">A Grandonna Admin</h1>
        <input type="password" placeholder="SENHA" className="w-full bg-gray-900 text-white p-4 rounded-2xl text-center mb-4 border border-gray-800 outline-none focus:border-red-600 font-black tracking-widest" value={senha} onChange={e=>setSenha(e.target.value)} />
        <button onClick={() => senha === '1234' ? setLogado(true) : alert('Senha Errada')} className="w-full bg-red-600 text-white p-4 rounded-2xl font-black uppercase hover:bg-red-700 transition-all">Entrar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      {/* MENU LATERAL */}
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-6 shadow-xl z-20">
        <div className="flex items-center gap-3 border-b border-gray-800 pb-6">
          <img src={LOGO_URL} className="w-10 h-10 rounded-full border border-yellow-500" />
          <h2 className="font-black italic text-yellow-500 text-sm uppercase">Painel de Gestão</h2>
        </div>
        <nav className="space-y-2">
          {['pedidos', 'sabores', 'bebidas', 'banners', 'sistema'].map(m => (
            <button key={m} onClick={() => setAba(m)} className={`w-full p-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 transition-all ${aba === m ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-900'}`}>
              {m === 'pedidos' && <ClipboardList size={18}/>}
              {m === 'sabores' && <Pizza size={18}/>}
              {m === 'bebidas' && <CupSoda size={18}/>}
              {m === 'sistema' && <Settings size={18}/>}
              {m}
            </button>
          ))}
        </nav>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div><h1 className="text-2xl font-black text-gray-800 uppercase italic leading-none">{aba}</h1><p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">Acompanhamento em tempo real</p></div>
          {aba !== 'pedidos' && aba !== 'sistema' && <button onClick={()=>setEditando({})} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center gap-2"><Plus size={16}/> Novo Item</button>}
        </header>

        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pedidos.map(p => (
              <div key={p.id} className={`bg-white rounded-3xl shadow-md border-2 p-5 flex flex-col gap-4 ${p.status === 'pendente' ? 'border-red-500 animate-pulse-slow' : 'border-transparent'}`}>
                <div className="flex justify-between items-center border-b pb-3">
                  <span className="font-black text-gray-800">#{p.id.slice(-4).toUpperCase()}</span>
                  <span className="text-xs font-bold text-gray-400">{new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div>
                  <h3 className="font-black text-gray-800 uppercase text-sm flex items-center gap-2"><User size={16} className="text-red-500"/> {p.clientName}</h3>
                  <p className="text-xs text-gray-500 font-bold mt-1">{p.clientPhone}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 flex items-center gap-1"><MapPin size={12}/> {p.deliveryType}</p>
                  {p.endereco && <p className="text-xs font-bold text-gray-700 leading-tight">{p.endereco.rua}, {p.endereco.numero} - {p.endereco.bairro}</p>}
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Itens do Pedido</p>
                   {p.items?.map((it, idx) => (
                     <div key={idx} className="text-xs font-bold text-gray-800 mb-1 flex items-start gap-1"><span className="text-red-600">1x</span> {it.tipo === 'pizza' ? it.tamanho.name : it.name}</div>
                   ))}
                </div>
                {p.metodoPagamento === 'dinheiro' && p.trocoPara && (
                  <div className="bg-yellow-50 p-2 rounded-xl border border-yellow-200 text-[10px] font-black text-yellow-700 uppercase">Troco para: R$ {p.trocoPara}</div>
                )}
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-black text-green-600">R$ {p.total?.toFixed(2)}</span>
                  <select value={p.status} onChange={async (e)=> await updateDoc(doc(db, 'pedidos', p.id), {status: e.target.value})} className="bg-gray-100 text-[10px] font-black p-2 rounded-lg outline-none uppercase cursor-pointer">
                    <option value="pendente">Pendente</option>
                    <option value="preparando">Preparando</option>
                    <option value="saiu_entrega">Saiu Entrega</option>
                    <option value="entregue">Finalizado</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === 'sistema' && (
          <div className="max-w-md bg-white p-8 rounded-[40px] shadow-sm border space-y-6">
             <div><label className="text-xs font-black text-gray-400 uppercase mb-2 block">Tempo Médio (Minutos)</label><input type="number" className="w-full bg-gray-50 p-4 rounded-2xl border font-black text-xl" value={config.tempoEntrega} onChange={e=>setConfig({...config, tempoEntrega: e.target.value})} /></div>
             <div><label className="text-xs font-black text-gray-400 uppercase mb-2 block">Taxa de Entrega (R$)</label><input type="number" className="w-full bg-gray-50 p-4 rounded-2xl border font-black text-xl" value={config.taxaMinima} onChange={e=>setConfig({...config, taxaMinima: e.target.value})} /></div>
             <button onClick={async ()=> {await setDoc(doc(db, 'loja_config', 'geral'), config); alert('Salvo!')}} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase shadow-lg shadow-red-900/20">Salvar Alterações</button>
          </div>
        )}
      </main>
    </div>
  );
}