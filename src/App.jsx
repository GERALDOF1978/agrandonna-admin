import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { Pizza, CupSoda, Plus, Edit2, Trash2, X, ClipboardList, MapPin, Settings, User, ImageIcon, Power, Phone, Printer, MessageCircle, Send, Upload, BarChart3, Users, LogOut, Search, Loader2, Eye, EyeOff } from 'lucide-react';

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const IMGBB_KEY = "00f5e74d2657312c5173d6aa4018c614";
const OWNER_EMAIL = "geraldof1978@gmail.com";

export default function App() {
  const [user, setUser] = useState(null);
  const [hasPerm, setHasPerm] = useState(false);
  const [aba, setAba] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [sabores, setSabores] = useState([]);
  const [bebidas, setBebidas] = useState([]);
  const [banners, setBanners] = useState([]);
  const [equipe, setEquipe] = useState([]);
  const [edit, setEdit] = useState(null);
  const [isUp, setIsUp] = useState(false);
  const [isMst, setIsMst] = useState(false);
  const [filtro, setFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [cfg, setCfg] = useState({ tempo: 40, taxa: 6, aberto: true, zap: '19988723803', logo: 'https://i.ibb.co/WN4kL4xv/logo-pizza.jpg', topo: 'A GRANDONNA' });

  // 1. Monitorar Autenticação
  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      if (u) {
        if (u.email === OWNER_EMAIL) {
          setUser(u);
          setHasPerm(true);
        } else {
          // Verifica se o email está na lista de admin_users
          onSnapshot(collection(db, 'admin_users'), s => {
            const lista = s.docs.map(d => d.data().email);
            if (lista.includes(u.email)) {
              setUser(u);
              setHasPerm(true);
            } else {
              signOut(auth);
              alert("Acesso Negado!");
            }
          });
        }
      } else {
        setHasPerm(false);
        setUser(null);
      }
    });
  }, []);

  // 2. Carregar Dados do Firebase
  useEffect(() => {
    if (!hasPerm) return;

    // CORREÇÃO CRÍTICA: ...d.data() vem primeiro, id: d.id vem no final.
    // Isso impede que um 'id' interno (ex: id: 1) sobrescreva o ID real do documento no Firebase.
    const unsubP = onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => 
      setPedidos(s.docs.map(d => ({ ...d.data(), id: d.id })))
    );
    const unsubS = onSnapshot(collection(db, 'menu_sabores'), s => 
      setSabores(s.docs.map(d => ({ ...d.data(), id: d.id })))
    );
    const unsubB = onSnapshot(collection(db, 'menu_bebidas'), s => 
      setBebidas(s.docs.map(d => ({ ...d.data(), id: d.id })))
    );
    const unsubN = onSnapshot(collection(db, 'menu_banners'), s => 
      setBanners(s.docs.map(d => ({ ...d.data(), id: d.id })))
    );
    const unsubE = onSnapshot(collection(db, 'admin_users'), s => 
      setEquipe(s.docs.map(d => ({ ...d.data(), id: d.id })))
    );
    const unsubC = onSnapshot(doc(db, 'loja_config', 'geral'), s => 
      s.exists() && setCfg(s.data())
    );

    return () => {
      unsubP(); unsubS(); unsubB(); unsubN(); unsubE(); unsubC();
    };
  }, [hasPerm]);

  // 3. Estatísticas do Caixa
  const stats = useMemo(() => {
    const pedsDoDia = pedidos.filter(p => 
      new Date(p.timestamp).toISOString().split('T')[0] === filtro && p.status === 'entregue'
    );
    const total = pedsDoDia.reduce((a, b) => a + (b.total || 0), 0);
    const contagem = {};
    pedsDoDia.flatMap(p => p.items || []).forEach(i => {
      const nome = i.name || `PZ ${i.tamanho?.name || 'Pizza'}`;
      contagem[nome] = (contagem[nome] || 0) + 1;
    });
    return { total, qtd: pedsDoDia.length, itens: Object.entries(contagem) };
  }, [pedidos, filtro]);

  // 4. Upload de Imagem (ImgBB)
  const handleImg = async (file, callback) => {
    setIsUp(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
      const d = await r.json();
      callback(d.data.url);
    } catch (e) {
      alert("Erro ao carregar imagem.");
    }
    setIsUp(false);
  };

  // 5. Guardar Item no Banco
  const salvar = async (e) => {
    e.preventDefault();
    const col = aba === 'sabores' ? 'menu_sabores' : aba === 'bebidas' ? 'menu_bebidas' : aba === 'banners' ? 'menu_banners' : 'admin_users';
    const data = { ...edit };
    const id = data.id; // Agora temos a garantia que este é o ID real do Firebase
    delete data.id;

    try {
      if (id) {
        await updateDoc(doc(db, col, String(id)), data);
      } else {
        if (['sabores', 'bebidas'].includes(aba)) {
          data.isActive = true;
        }
        await addDoc(collection(db, col), data);
      }
      setEdit(null);
    } catch (err) {
      console.error("Erro Firebase (Salvar):", err);
      alert("Erro ao guardar os dados: " + err.message);
    }
  };

  // 6. Alternar Disponibilidade
  const toggleActive = async (item) => {
    if (!item || !item.id) return;
    
    const col = aba === 'sabores' ? 'menu_sabores' : 'menu_bebidas';
    const newState = item.isActive === false ? true : false; 
    
    try {
      // Como o ID agora é sempre o ID do Firebase, o updateDoc vai funcionar perfeitamente.
      await updateDoc(doc(db, col, String(item.id)), { isActive: newState });
    } catch (err) {
      console.error("Erro Firebase (Toggle Active):", err);
      alert("Erro ao atualizar disponibilidade: " + err.message);
    }
  };

  if (!hasPerm) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
      <div className="bg-gray-900 p-8 rounded-[40px] border border-gray-800 shadow-2xl">
        <img src={cfg.logo} className="w-24 h-24 rounded-full mx-auto border-2 border-yellow-500 mb-6 object-cover shadow-lg"/>
        <h1 className="text-white font-black italic mb-6 uppercase tracking-widest text-xl">A Grandonna Admin</h1>
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full bg-white text-black p-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-xl active:scale-95">
          <img src="https://www.google.com/favicon.ico" className="w-5"/> Entrar com Google
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      {/* MENU LATERAL */}
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4 shadow-2xl z-40">
        <img src={cfg.logo} className="w-20 h-20 rounded-full mx-auto border-2 border-yellow-500 object-cover mb-2 shadow-lg"/>
        <nav className="space-y-1 flex-1">
          {['pedidos', 'sabores', 'bebidas', 'banners', 'caixa', 'equipe', 'sistema'].map(m => (
            <button key={m} onClick={() => setAba(m)} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-between transition-all ${aba === m ? 'bg-red-600 shadow-xl scale-105' : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}>
              <div className="flex items-center gap-2">
                {m === 'pedidos' && <ClipboardList size={16}/>}
                {m === 'sabores' && <Pizza size={16}/>}
                {m === 'bebidas' && <CupSoda size={16}/>}
                {m === 'caixa' && <BarChart3 size={16}/>}
                {m === 'equipe' && <Users size={16}/>}
                {m === 'banners' && <ImageIcon size={16}/>}
                {m === 'sistema' && <Settings size={16}/>}
                {m}
              </div>
              {m === 'pedidos' && pedidos.filter(p => p.status === 'pendente').length > 0 && (
                <span className="bg-white text-red-600 px-2 rounded-full animate-bounce font-bold">
                  {pedidos.filter(p => p.status === 'pendente').length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="text-gray-500 font-bold text-[10px] uppercase flex items-center gap-2 p-2 hover:text-red-500 transition-colors"><LogOut size={14}/> Sair</button>
      </aside>

      <main className={`flex-1 p-4 md:p-10 overflow-y-auto transition-colors duration-300 ${aba === 'pedidos' ? 'bg-gray-300' : 'bg-gray-50'}`}>
        <header className="flex justify-between items-center mb-8 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/50">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900">{aba}</h1>
          {['sabores', 'bebidas', 'banners', 'equipe'].includes(aba) && (
            <button onClick={() => {
              if (aba === 'equipe' && !isMst) {
                const p = prompt("Senha Master:");
                if (p === 'GRAN2026') setIsMst(true); else return alert("Senha Incorreta");
              }
              setEdit(
                aba === 'sabores' ? { name: '', desc: '', description: '', prices: { grande: 0, gigante: 0, meio_metro: 0 }, img: '', isActive: true } :
                aba === 'bebidas' ? { name: '', price: 0, img: '', isActive: true } :
                aba === 'equipe' ? { nome: '', email: '' } :
                { title: '', imageUrl: '' }
              );
            }} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-green-700 active:scale-95 transition-all">Novo {aba}</button>
          )}
        </header>

        {/* --- PÁGINA DE PEDIDOS --- */}
        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pedidos.map(p => (
              <div key={p.id} className={`bg-white rounded-[40px] shadow-2xl border-t-8 p-6 flex flex-col gap-4 ${p.status === 'pendente' ? 'border-red-600 animate-pulse' : 'border-transparent shadow-gray-200'}`}>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="font-black text-[10px] text-gray-400 tracking-widest uppercase">Cod: {String(p.id).slice(-4)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => window.open(`https://wa.me/55${p.clientPhone}`)} className="p-2 bg-green-50 text-green-600 rounded-full hover:scale-110 transition-transform"><Phone size={14}/></button>
                    <button className="p-2 bg-blue-50 text-blue-600 rounded-full"><MessageCircle size={14}/></button>
                  </div>
                </div>
                <div className="font-black uppercase text-sm text-gray-900">{p.clientName || 'Cliente sem nome'}</div>
                <div className="text-[10px] font-bold text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-2">
                  <MapPin size={12} className="text-red-500 shrink-0"/> {p.entrega === 'retirada' ? 'BALCÃO / RETIRADA' : `${p.end?.rua}, ${p.end?.num}`}
                </div>
                <div className="flex-1 py-2 space-y-3 border-y border-gray-50">
                  {p.items?.map((it, idx) => (
                    <div key={idx} className="flex flex-col">
                      <div className="flex justify-between font-bold text-xs text-gray-800">
                        <span>1x {it.name || `Pizza ${it.tamanho?.name}`}</span>
                        <span className="text-gray-400">R$ {it.preco?.toFixed(2)}</span>
                      </div>
                      {it.sabores?.map((s, si) => (
                        <p key={si} className="text-[9px] text-red-600 font-bold italic leading-tight">
                          + {s.name} <span className="text-gray-400 font-medium lowercase">({s.desc || s.description})</span>
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
                {/* BOTÕES DE STATUS COM CORES FIXAS */}
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'pendente' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p.status === 'pendente' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>Pendente</button>
                  <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'preparando' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p.status === 'preparando' ? 'bg-yellow-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>Cozinha</button>
                  <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'saiu_entrega' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p.status === 'saiu_entrega' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>Entrega</button>
                  <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'entregue' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p.status === 'entregue' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>Concluído</button>
                </div>
                <div className="font-black text-green-600 text-center text-xl pt-2">R$ {p.total?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {/* --- PÁGINA DE SABORES / BEBIDAS / EQUIPE (TABELA UNIFICADA) --- */}
        {['sabores', 'bebidas', 'banners', 'equipe'].includes(aba) && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase">
                <tr><th className="p-6">Item / Detalhes</th><th className="p-6">Preços / Informação</th><th className="p-6 text-right">Ações</th></tr>
              </thead>
              <tbody>{(aba === 'sabores' ? sabores : aba === 'bebidas' ? bebidas : aba === 'banners' ? banners : equipe).map(it => (
                <tr key={it.id} className={`border-b border-gray-50 transition-all group ${it.isActive === false ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                  <td className="p-6 flex items-center gap-4">
                    <div className="relative">
                      {(it.img || it.imageUrl) ? (
                        <img src={it.img || it.imageUrl} className={`w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white ${it.isActive === false ? 'grayscale opacity-50' : ''}`}/>
                      ) : (
                        <div className={`w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-white ${it.isActive === false ? 'text-red-300' : 'text-gray-300'}`}>
                          {aba === 'sabores' ? <Pizza size={24}/> : aba === 'bebidas' ? <CupSoda size={24}/> : <User size={24}/>}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-black uppercase text-xs tracking-tighter ${it.isActive === false ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {it.name || it.title || it.nome}
                        </p>
                        {['sabores', 'bebidas'].includes(aba) && it.isActive === false && (
                          <span className="bg-red-100 text-red-600 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider">Esgotado</span>
                        )}
                      </div>
                      
                      {/* INGREDIENTES EM VERMELHO E NEGRITO (SÓ PARA SABORES) */}
                      {aba === 'sabores' && (
                        <p className={`text-[11px] font-black italic mt-1 max-w-[350px] leading-tight uppercase ${it.isActive === false ? 'text-gray-400' : 'text-red-600'}`}>
                          {it.desc || it.description || '⚠️ Sem ingredientes cadastrados.'}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-6 font-black text-[10px] text-gray-500 uppercase">
                    {aba === 'bebidas' && it.price && <span className={`font-bold px-2 py-1 rounded ${it.isActive === false ? 'text-gray-400 bg-gray-100' : 'text-green-600 bg-green-50'}`}>Preço: R$ {it.price.toFixed(2)}</span>}
                    {aba === 'sabores' && it.prices && (
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>G: R$ {it.prices.grande}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>GG: R$ {it.prices.gigante}</span>
                        {it.prices.meio_metro > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>1/2M: R$ {it.prices.meio_metro}</span>}
                      </div>
                    )}
                    {aba === 'equipe' && <span className="lowercase">{it.email}</span>}
                    {aba === 'banners' && <span className="text-[8px] text-gray-300 truncate max-w-[150px] block">{it.imageUrl}</span>}
                  </td>
                  <td className="p-6 text-right space-x-2 whitespace-nowrap">
                    {['sabores', 'bebidas'].includes(aba) && (
                      <button 
                        onClick={() => toggleActive(it)} 
                        className={`p-3 rounded-2xl transition-all mr-2 ${it.isActive === false ? 'text-gray-400 hover:bg-gray-200' : 'text-green-600 hover:bg-green-50'}`}
                        title={it.isActive === false ? "Voltar a Vender" : "Marcar como Esgotado"}
                      >
                        {it.isActive === false ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    )}
                    <button onClick={() => setEdit(it)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"><Edit2 size={16}/></button>
                    <button onClick={async () => { 
                      if (window.confirm('Eliminar permanentemente?')) {
                        const collectionName = aba === 'sabores' ? 'menu_sabores' : aba === 'bebidas' ? 'menu_bebidas' : aba === 'banners' ? 'menu_banners' : 'admin_users';
                        await deleteDoc(doc(db, collectionName, String(it.id)));
                      }
                    }} className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* --- PÁGINA DO CAIXA --- */}
        {aba === 'caixa' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex items-center gap-4">
              <Search className="text-gray-400" size={20}/>
              <input type="date" className="bg-transparent font-black outline-none w-full text-gray-900" value={filtro} onChange={e => setFiltro(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-green-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Faturamento</p><p className="text-3xl font-black text-green-600">R$ {stats.total.toFixed(2)}</p></div>
              <div className="bg-white p-8 rounded-[40px] shadow-sm border"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Ticket Médio</p><p className="text-3xl font-black text-gray-800">R$ {(stats.total / (stats.qtd || 1)).toFixed(2)}</p></div>
              <div className="bg-white p-8 rounded-[40px] shadow-sm border"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Pedidos OK</p><p className="text-4xl font-black text-blue-600">{stats.qtd}</p></div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-black uppercase text-xs text-gray-400 border-b border-gray-50 pb-4">Ranking de Vendas do Dia</h3>
              {stats.itens.map(([n, q]) => (
                <div key={n} className="flex justify-between font-bold text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-800 uppercase text-xs">{n}</span>
                  <span className="bg-red-50 text-red-600 px-4 py-1 rounded-full text-xs font-black">{q}x</span>
                </div>
              ))}
              {stats.itens.length === 0 && <p className="text-center py-10 text-gray-300 font-bold uppercase">Nenhuma venda hoje.</p>}
            </div>
          </div>
        )}

        {/* --- CONFIGURAÇÕES DO SISTEMA --- */}
        {aba === 'sistema' && (
          <div className="max-w-md bg-white p-10 rounded-[50px] shadow-2xl border border-gray-100 space-y-6 mx-auto">
             <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                <img src={cfg.logo} className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" />
                <label className="bg-black text-white px-6 py-2 rounded-2xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all uppercase flex items-center gap-2">
                  {isUp ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Trocar Logo
                  <input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setCfg({ ...cfg, logo: url }))} />
                </label>
             </div>
             <button onClick={() => setCfg({ ...cfg, aberto: !cfg.aberto })} className={`w-full p-6 rounded-3xl font-black uppercase transition-all shadow-lg ${cfg.aberto ? 'bg-green-600 text-white shadow-green-100' : 'bg-red-600 text-white shadow-red-100'}`}>
               <Power size={22}/> {cfg.aberto ? 'LOJA ESTÁ ABERTA' : 'LOJA FECHADA'}
             </button>
             <div className="space-y-4 pt-4">
                <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">WhatsApp da Loja</label><input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:border-red-500" value={cfg.zap} onChange={e => setCfg({ ...cfg, zap: e.target.value })} placeholder="Ex: 19997650322"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Tempo Médio</label><input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none" value={cfg.tempo} onChange={e => setCfg({ ...cfg, tempo: e.target.value })} placeholder="Minutos"/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Taxa de Entrega</label><input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none" value={cfg.taxa} onChange={e => setCfg({ ...cfg, taxa: parseFloat(e.target.value) })} placeholder="R$"/></div>
                </div>
                <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Título da Impressão</label><input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:border-red-500" value={cfg.topo} onChange={e => setCfg({ ...cfg, topo: e.target.value })} placeholder="A GRANDONNA"/></div>
             </div>
             <button onClick={async () => { await setDoc(doc(db, 'loja_config', 'geral'), cfg); alert('Sistema Atualizado!'); }} className="w-full bg-black text-white py-6 rounded-[30px] font-black uppercase shadow-xl hover:scale-95 transition-all">Guardar Configurações</button>
          </div>
        )}
      </main>

      {/* --- MODAL DE EDIÇÃO --- */}
      {edit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 z-[100]">
          <form onSubmit={salvar} className="bg-white rounded-[50px] w-full max-w-lg p-10 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black uppercase italic border-b pb-4 flex justify-between items-center text-gray-800 tracking-tighter">Configurar {aba} <button type="button" onClick={() => setEdit(null)}><X size={30} className="text-gray-300 hover:text-black"/></button></h2>
            {['sabores', 'bebidas', 'banners'].includes(aba) && (
              <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                 <img src={edit.img || edit.imageUrl || cfg.logo} className="w-28 h-28 rounded-[28px] object-cover shadow-xl border-4 border-white" />
                 <label className="bg-black text-white px-6 py-2 rounded-2xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all flex gap-2 items-center">
                   {isUp ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} {isUp ? 'Aguarde...' : 'Subir Foto'}
                   <input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setEdit({ ...edit, [aba === 'banners' ? 'imageUrl' : 'img']: url }))} />
                 </label>
              </div>
            )}
            <div className="space-y-4">
              <input placeholder="Nome do Item / Título" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.name || edit.title || edit.nome} onChange={e => setEdit({ ...edit, [aba === 'banners' ? 'title' : aba === 'equipe' ? 'nome' : 'name']: e.target.value })} required />
              {aba === 'sabores' && <textarea placeholder="Ingredientes da Pizza (Ex: Mussarela, tomate, manjericão...)" className="w-full h-32 p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.desc || edit.description || ''} onChange={e => setEdit({ ...edit, desc: e.target.value, description: e.target.value })} />}
              {aba === 'sabores' && (
                <div className="grid grid-cols-2 gap-4">
                  {['grande', 'gigante', 'meio_metro'].map(t => (
                    <div key={t}><label className="text-[10px] uppercase font-black text-gray-400 px-3">{t.replace('_',' ')}</label><input type="number" step="0.01" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" value={edit.prices?.[t] || 0} onChange={e => setEdit({ ...edit, prices: { ...edit.prices, [t]: parseFloat(e.target.value) } })}/></div>
                  ))}
                </div>
              )}
              {aba === 'bebidas' && <input type="number" step="0.01" placeholder="Preço de Venda" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none" value={edit.price} onChange={e => setEdit({ ...edit, price: parseFloat(e.target.value) })}/>}
              {aba === 'equipe' && <input placeholder="E-mail Gmail do funcionário" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.email} onChange={e => setEdit({ ...edit, email: e.target.value })} />}
            </div>
            <button type="submit" disabled={isUp} className="w-full bg-red-600 text-white p-6 rounded-[30px] font-black uppercase shadow-xl hover:bg-red-700 active:scale-95 disabled:opacity-50 transition-all">Confirmar Alterações</button>
          </form>
        </div>
      )}
    </div>
  );
}