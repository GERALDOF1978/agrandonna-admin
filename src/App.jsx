import React, { useState, useEffect, useMemo, useRef, Component } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc, where } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  Pizza, CupSoda, Plus, Edit2, Trash2, X, ClipboardList, MapPin, Settings, User, 
  ImageIcon, Power, Phone, Printer, MessageCircle, Send, Upload, BarChart3, Users, 
  LogOut, Search, Loader2, Eye, EyeOff, Flame, History, Image as ImgIcon, Wand2, 
  Save, CircleDashed, Package, Ticket, Calculator, Minus, AlertTriangle, 
  CheckCircle2, Check, ArrowLeft, ShoppingBag, Store, ChevronRight
} from 'lucide-react';

// ==========================================
// 1. SISTEMA ANTI-ERRO (MODO DE SEGURANÇA)
// ==========================================
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.toString() };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-600 flex flex-col items-center justify-center p-10 text-center text-white font-sans">
          <AlertTriangle size={64} className="mb-4 text-white/50" />
          <h1 className="text-3xl font-black mb-4 uppercase italic">Erro no Sistema</h1>
          <p className="mb-6 font-bold text-sm max-w-md">Ocorreu um erro ao processar os dados. A tela branca foi evitada.</p>
          <div className="bg-black/40 p-4 rounded-xl mb-6 font-mono text-xs text-left max-w-xl w-full overflow-auto">
            {this.state.errorMsg}
          </div>
          <button onClick={() => window.location.reload()} className="bg-white text-red-600 px-8 py-4 rounded-full font-black uppercase shadow-lg active:scale-95 transition-all">Reiniciar Painel</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 2. CONFIGURAÇÃO E CONSTANTES
// ==========================================
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

const TAMANHOS_FIXOS = [
  { id: 'broto', name: 'Broto', description: '4 Pedaços', maxFlavors: 1, icon: '🍕', order: 1 },
  { id: 'grande', name: 'Grande', description: '8 Pedaços', maxFlavors: 2, icon: '🍕', order: 2 },
  { id: 'gigante', name: 'Gigante', description: '16 Pedaços', maxFlavors: 4, icon: '🤤', order: 3 },
  { id: 'meio_metro', name: '1/2 Metro', description: 'Até 3 Sabores', maxFlavors: 3, icon: '📏', order: 4 },
  { id: 'um_metro', name: '1 Metro', description: 'Até 3 Sabores', maxFlavors: 3, icon: '📏', order: 5 }
];

const isPizzaDoce = (sabor) => {
  if (!sabor) return false;
  const docesNomes = ['chocolate', 'morango', 'nutella', 'prestígio', 'prestigio', 'banana', 'confete', 'sorvete', 'doce', 'romeu', 'julieta', 'brigadeiro', 'ouro branco', 'kit kat'];
  const nomeSabor = (sabor.name || '').toLowerCase();
  return sabor.isDoce || docesNomes.some(p => nomeSabor.includes(p));
};

function MainApp() {
  const [user, setUser] = useState(null);
  const [atendente, setAtendente] = useState(null); // Dados do perfil logado
  const [hasPerm, setHasPerm] = useState(false);
  const [aba, setAba] = useState('pdv'); 
  const [pedidos, setPedidos] = useState([]);
  const [tamanhos] = useState(TAMANHOS_FIXOS);
  const [sabores, setSabores] = useState([]);
  const [bordas, setBordas] = useState([]); 
  const [bebidas, setBebidas] = useState([]);
  const [combos, setCombos] = useState([]); 
  const [ofertas, setOfertas] = useState([]); 
  const [banners, setBanners] = useState([]);
  const [equipe, setEquipe] = useState([]);
  const [edit, setEdit] = useState(null);
  const [isUp, setIsUp] = useState(false);
  const [isMst, setIsMst] = useState(false);
  const [loadingMagic, setLoadingMagic] = useState(false);
  
  const [filtroCaixa, setFiltroCaixa] = useState(getDataLocalStr());
  const [filtroHist, setFiltroHist] = useState(getDataLocalStr());
  
  const [cfg, setCfg] = useState({ 
    tempo: 40, taxaMinima: 6, kmIncluso: 3, valorKm: 1, cepLoja: '13500000', numLoja: '', horaAbre: '18:00',
    aberto: true, msgFechado: 'Fechado no momento.', zap: '19988723803', logo: 'https://i.ibb.co/WN4kL4xv/logo-pizza.jpg', topo: 'A GRANDONNA'
  });

  const [chatAberto, setChatAberto] = useState(null);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [adminMsg, setAdminMsg] = useState('');
  const [alertasChat, setAlertasChat] = useState([]); 
  const scrollRef = useRef(null);

  // PDV ESTADOS
  const [pdvAba, setPdvAba] = useState('tradicionais');
  const [pdvStep, setPdvStep] = useState('cart'); // cart ou checkout
  const [pdvCart, setPdvCart] = useState([]);
  const [pdvNome, setPdvNome] = useState('');
  const [pdvTel, setPdvTel] = useState('');
  const [pdvEntrega, setPdvEntrega] = useState('entrega');
  const [pdvEnd, setPdvEnd] = useState('');
  const [pdvTaxa, setPdvTaxa] = useState('');
  const [pdvPag, setPdvPag] = useState('dinheiro');
  const [pdvTroco, setPdvTroco] = useState('');
  const [pdvObs, setPdvObs] = useState('');
  
  const [pdvConfig, setPdvConfig] = useState(null); 
  const [pdvSelS, setPdvSelS] = useState([]);
  const [pdvSelBorda, setPdvSelBorda] = useState(null);
  const [pdvSelBebidas, setPdvSelBebidas] = useState([]);

  // ==========================================
  // 3. LÓGICA DE DADOS E AUTH
  // ==========================================

  const getTabelaAtual = () => {
    switch(aba) {
      case 'sabores': return sabores || [];
      case 'bordas': return bordas || [];
      case 'combos': return combos || [];
      case 'ofertas': return ofertas || [];
      case 'bebidas': return bebidas || [];
      case 'banners': return banners || [];
      case 'equipe': return equipe || [];
      default: return [];
    }
  };

  const getPrecoSabor = (sabor, tId) => {
    if (!sabor || !tId || pdvConfig?.tipo !== 'pizza') return 0;
    return Number(sabor.prices?.[tId] || 0);
  };

  const getPrecoBorda = (borda, tId) => {
    if (!borda || !tId || pdvConfig?.tipo !== 'pizza') return 0;
    return Number(borda.prices?.[tId] || 0);
  };

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      if (u) {
        onSnapshot(collection(db, 'admin_users'), s => {
          const lista = s.docs.map(d => ({id: d.id, ...d.data()}));
          const autorizado = lista.find(x => x.email === u.email);
          if (u.email === OWNER_EMAIL || autorizado) {
            setUser(u); setHasPerm(true);
            setAtendente(autorizado || { nome: 'Administrador', cargo: 'Admin', img: u.photoURL });
          } else { signOut(auth); alert("Acesso Negado!"); }
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!hasPerm) return;
    onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'menu_sabores'), s => setSabores(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'menu_bordas'), s => setBordas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'menu_bebidas'), s => setBebidas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'menu_combos'), s => setCombos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'menu_ofertas'), s => setOfertas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'admin_users'), s => setEquipe(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(doc(db, 'loja_config', 'geral'), s => { if(s.exists()) setCfg(s.data()); });
  }, [hasPerm]);

  // PDV: ADICIONAR ITEM
  const totalPDV = useMemo(() => {
    const sub = (pdvCart || []).reduce((acc, curr) => acc + Number(curr.preco || 0), 0);
    const taxa = (pdvEntrega === 'entrega' && !pdvCart.some(i => i.tipo === 'oferta')) ? Number(pdvTaxa || 0) : 0;
    return sub + taxa;
  }, [pdvCart, pdvEntrega, pdvTaxa]);

  const addPdvItem = () => {
    if(!pdvConfig) return;
    let preco = 0, nome = '';
    if (pdvConfig.tipo === 'pizza') {
      const pSabor = Math.max(...(pdvSelS.map(x => getPrecoSabor(x, pdvConfig.tamanho.id))));
      const pBorda = pdvSelBorda ? getPrecoBorda(pdvSelBorda, pdvConfig.tamanho.id) : 0;
      preco = pSabor + pBorda;
      nome = `Pizza ${pdvConfig.tamanho.name}`;
    } else {
      preco = Number(pdvConfig.item?.price || 0);
      nome = pdvConfig.item?.name || 'Item';
    }
    const novoItem = { id: Date.now().toString(36), tipo: pdvConfig.tipo, name, tamanho: pdvConfig.tamanho, sabores: pdvSelS, borda: pdvSelBorda, bebidasCombo: pdvSelBebidas, preco, qtd: 1 };
    setPdvCart([...pdvCart, novoItem]);
    setPdvConfig(null); setPdvSelS([]); setPdvSelBorda(null); setPdvSelBebidas([]); setPdvStep('cart');
  };

  const handlePdvDrinkQtd = (bebida, delta) => {
    const idx = pdvCart.findIndex(c => c.tipo === 'bebida' && c.itemId === bebida.id);
    if (idx >= 0) {
      const nc = [...pdvCart];
      const nq = nc[idx].qtd + delta;
      if (nq <= 0) nc.splice(idx, 1);
      else { nc[idx].qtd = nq; nc[idx].preco = nq * (nc[idx].precoBase || bebida.price); }
      setPdvCart(nc);
    } else if (delta > 0) {
      setPdvCart([...pdvCart, { id: Date.now().toString(36), itemId: bebida.id, tipo: 'bebida', precoBase: Number(bebida.price || 0), preco: Number(bebida.price || 0), name: bebida.name, qtd: 1 }]);
    }
  };

  const lancarPedido = async () => {
    if(!pdvNome.trim()) return alert("Nome do cliente obrigatório.");
    const ped = { items: pdvCart, total: totalPDV, entrega: pdvEntrega, end: { rua: pdvEnd, taxaCobrada: Number(pdvTaxa || 0) }, pag: pdvPag, troco: pdvTroco, obs: pdvObs, timestamp: Date.now(), status: 'pendente', userId: 'balcao', clientName: pdvNome, clientPhone: pdvTel || 'Balcão', atendente: atendente?.nome || 'Admin' };
    try {
      await addDoc(collection(db, 'pedidos'), ped);
      alert("Pedido Lançado!"); 
      setPdvCart([]); setPdvNome(''); setPdvTel(''); setPdvEnd(''); setPdvTaxa(''); setPdvObs(''); setPdvTroco(''); setPdvStep('cart');
    } catch(e) { alert("Erro ao lançar."); }
  };

  const toggleActive = async (it) => {
    const col = getCollectionName(aba);
    await updateDoc(doc(db, col, it.id), { isActive: !it.isActive });
  };

  const handleImg = async (file, callback) => {
    setIsUp(true);
    const fd = new FormData(); fd.append('image', file);
    try {
      const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
      const d = await r.json(); callback(d.data.url);
    } catch(e) { alert("Erro upload."); }
    setIsUp(false);
  };

  const salvar = async (e) => {
    e.preventDefault();
    const col = getCollectionName(aba);
    const data = { ...edit }; const id = data.id; delete data.id;
    try {
      if(id) await updateDoc(doc(db, col, id), data);
      else await addDoc(collection(db, col), data);
      setEdit(null);
    } catch(e) { alert("Erro salvar."); }
  };

  const stats = useMemo(() => {
    const dia = pedidos.filter(p => getDataLocalStr(p.timestamp) === filtroCaixa && p.status === 'entregue');
    const total = dia.reduce((a,b) => a + Number(b.total || 0), 0);
    const itens = {};
    dia.flatMap(p => p.items || []).forEach(it => { itens[it.name] = (itens[it.name] || 0) + (it.qtd || 1); });
    return { total, qtd: dia.length, itens: Object.entries(itens) };
  }, [pedidos, filtroCaixa]);

  if (!hasPerm) return <div className="min-h-screen bg-black flex items-center justify-center p-8"><button onClick={() => signInWithPopup(auth, provider)} className="bg-white p-4 rounded-xl font-bold uppercase tracking-widest text-sm">Entrar no Sistema Grandonna</button></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* BARRA LATERAL */}
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col shadow-2xl z-40 overflow-y-auto">
        <img src={cfg.logo} className="w-20 h-20 rounded-full mx-auto border-2 border-yellow-500 mb-8 object-cover shadow-lg"/>
        <nav className="space-y-1 flex-1">
          {['pdv', 'pedidos', 'historico', 'sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'caixa', 'equipe', 'sistema'].map(m => (
            <button key={m} onClick={() => { setAba(m); setEdit(null); }} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 transition-all ${aba === m ? 'bg-red-600 shadow-xl scale-105' : 'text-gray-500 hover:text-white'}`}>
              {m === 'pdv' ? <Calculator size={16}/> : m === 'pedidos' ? <ClipboardList size={16}/> : m === 'caixa' ? <BarChart3 size={16}/> : m === 'equipe' ? <Users size={16}/> : <Settings size={16}/>}
              {m === 'pdv' ? 'PDV / NOVO PEDIDO' : m}
            </button>
          ))}
        </nav>
        {atendente && (
          <div className="mt-4 p-3 bg-gray-900 rounded-2xl flex items-center gap-3 border border-gray-800">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-black overflow-hidden border border-white/20">
               {atendente.img ? <img src={atendente.img} className="w-full h-full object-cover"/> : atendente.nome[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black truncate">{atendente.nome}</p>
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">{atendente.cargo}</p>
            </div>
          </div>
        )}
        <button onClick={() => signOut(auth)} className="text-gray-500 font-bold text-[10px] uppercase flex items-center gap-2 p-2 hover:text-red-500 transition-colors mt-2"><LogOut size={14}/> Sair</button>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-50">
        
        {/* ==========================================
            ABA PDV: TELA DIVIDIDA EM 2 ETAPAS
            ========================================== */}
        {aba === 'pdv' && (
          <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-100px)]">
            
            {/* LADO ESQUERDO: CARDÁPIO DINÂMICO */}
            <div className="flex-1 bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
               <h2 className="text-2xl font-black italic uppercase mb-4 text-gray-800">Cardápio Rápido</h2>
               <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 mb-4">
                 {(() => {
                    const btns = [];
                    if(sabores.some(s => s && s.isPromo)) btns.push('promo');
                    btns.push('tradicionais', 'doces');
                    if(combos.length > 0) btns.push('combos');
                    if(ofertas.length > 0) btns.push('ofertas');
                    if(bebidas.length > 0) btns.push('bebidas');
                    return btns.map(t => (
                      <button key={t} onClick={()=>{setPdvAba(t); setPdvStep('cart');}} className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${pdvAba === t ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {t === 'promo' ? '🔥 Promo' : t}
                      </button>
                    ));
                 })()}
               </div>

               <div className="flex-1 overflow-y-auto pr-2 grid gap-3 align-top content-start">
                  {['tradicionais', 'doces', 'promo'].includes(pdvAba) && (tamanhos || []).map((t, idx) => {
                     const temSabores = sabores.some(s => {
                        if(!s) return false;
                        if(pdvAba === 'doces' && !isPizzaDoce(s)) return false;
                        if(pdvAba === 'tradicionais' && isPizzaDoce(s)) return false;
                        if(pdvAba === 'promo' && !s.isPromo) return false;
                        return Number(s.prices?.[t.id] || 0) > 0;
                     });
                     if(!temSabores) return null;
                     return (
                       <div key={idx} onClick={() => setPdvConfig({ tipo: 'pizza', isDoce: pdvAba==='doces', isPromoOnly: pdvAba==='promo', tamanho: t, maxFlavors: t.maxFlavors })} className="bg-gray-50 p-4 rounded-3xl border border-gray-200 hover:border-red-500 cursor-pointer transition-all flex justify-between items-center group">
                          <div className="flex items-center gap-4"><span className="text-3xl">{t.icon}</span><div><h4 className="font-black text-lg text-gray-800">{t.name}</h4><p className="text-[10px] text-gray-400 font-bold">{t.description}</p></div></div>
                          <Plus size={24} className="text-gray-300 group-hover:text-red-500"/>
                       </div>
                     )
                  })}
                  {pdvAba === 'combos' && combos.map((c, idx) => (
                    <div key={idx} onClick={() => setPdvConfig({ tipo: 'combo', item: c, tamanho: tamanhos.find(t=>t.id===c.tamanhoId), maxFlavors: tamanhos.find(t=>t.id===c.tamanhoId)?.maxFlavors || 1, maxBebidas: c.qtdBebidas })} className="bg-purple-50 p-5 rounded-3xl border border-purple-100 cursor-pointer flex justify-between items-center group transition-all hover:border-purple-500">
                       <div><span className="text-[8px] bg-purple-200 text-purple-600 px-2 py-1 rounded font-black uppercase mb-1 inline-block">Combo</span><h4 className="font-black text-lg text-gray-800">{c.name}</h4></div><Plus size={24} className="text-purple-300"/>
                    </div>
                  ))}
                  {pdvAba === 'ofertas' && ofertas.map((o, idx) => (
                    <div key={idx} onClick={() => setPdvConfig({ tipo: 'oferta', item: o, tamanho: tamanhos.find(t=>t.id===o.tamanhoId), maxFlavors: tamanhos.find(t=>t.id===o.tamanhoId)?.maxFlavors || 1 })} className="bg-green-50 p-5 rounded-3xl border border-green-100 cursor-pointer flex justify-between items-center group transition-all hover:border-green-500">
                       <div><span className="text-[8px] bg-green-200 text-green-600 px-2 py-1 rounded font-black uppercase mb-1 inline-block">Frete Grátis</span><h4 className="font-black text-lg text-gray-800">{o.name}</h4></div><Plus size={24} className="text-green-300"/>
                    </div>
                  ))}
                  {pdvAba === 'bebidas' && bebidas.map((b, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-3xl border border-gray-200 flex justify-between items-center">
                      <h4 className="font-black text-gray-800 uppercase">{b.name}</h4>
                      <div className="flex items-center gap-2"><button onClick={()=>handlePdvDrinkQtd(b, -1)} className="w-10 h-10 bg-gray-200 rounded-xl hover:bg-gray-300"><Minus/></button><button onClick={()=>handlePdvDrinkQtd(b, 1)} className="w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700"><Plus/></button></div>
                    </div>
                  ))}
               </div>
            </div>

            {/* LADO DIREITO: RESUMO EXPANDIDO E CHECKOUT */}
            <div className="w-full xl:w-[450px] bg-gray-900 p-6 rounded-[40px] shadow-2xl border border-gray-800 flex flex-col h-full overflow-hidden relative">
               {pdvStep === 'cart' ? (
                 <div className="flex flex-col h-full animate-in fade-in">
                    <h2 className="text-xl font-black italic uppercase mb-4 text-white border-b border-gray-800 pb-4 flex items-center gap-2"><ShoppingBag size={20} className="text-yellow-500"/> Resumo do Pedido</h2>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                       {pdvCart.map((i, idx) => (
                         <div key={i.id || idx} className="bg-gray-800 p-4 rounded-2xl border border-gray-700 flex justify-between items-start text-white">
                           <div className="flex-1 pr-2">
                             <p className="font-bold text-sm">{(i.qtd>1)?`${i.qtd}x `:''}{i.name}</p>
                             {i.sabores && <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">{i.sabores.map(s=>s.name).join(' + ')}</p>}
                             {i.borda && <p className="text-[10px] text-orange-400 italic mt-1">+ Borda: {i.borda.name}</p>}
                           </div>
                           <div className="text-right">
                             <p className="text-yellow-500 font-black text-xs">R$ {i.preco.toFixed(2)}</p>
                             <button onClick={() => setPdvCart(pdvCart.filter(x => x.id !== i.id))} className="text-red-500 mt-2 ml-auto block hover:bg-red-500/10 p-1 rounded-lg"><Trash2 size={16}/></button>
                           </div>
                         </div>
                       ))}
                       {pdvCart.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-20"><ShoppingBag size={64} className="mb-4"/><p className="font-black uppercase text-xs">Carrinho Vazio</p></div>}
                    </div>
                    <div className="pt-4 border-t border-gray-800 mt-auto space-y-4">
                       <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl"><span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Total S/ Taxa:</span><span className="text-2xl font-black text-green-500 tracking-tighter font-mono">R$ {totalPDV.toFixed(2)}</span></div>
                       <div className="flex gap-2">
                          <button onClick={()=>{if(pdvCart.length>0){setPdvEntrega('entrega'); setPdvStep('checkout');}}} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-5 rounded-2xl font-black text-xs flex flex-col items-center gap-1 shadow-lg shadow-red-600/20 active:scale-95 transition-all"><MapPin size={20}/> DELIVERY</button>
                          <button onClick={()=>{if(pdvCart.length>0){setPdvEntrega('retirada'); setPdvStep('checkout');}}} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-5 rounded-2xl font-black text-xs flex flex-col items-center gap-1 shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"><Store size={20}/> BALCÃO</button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                    <button onClick={()=>setPdvStep('cart')} className="text-gray-500 hover:text-white flex items-center gap-2 mb-6 font-black uppercase text-[10px] tracking-widest transition-colors"><ArrowLeft size={14}/> Voltar ao Resumo</button>
                    <h2 className="text-xl font-black uppercase text-white mb-6 border-b border-gray-800 pb-4">Finalizar {pdvEntrega==='entrega'?'Delivery':'Balcão'}</h2>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-6">
                       <div className="grid grid-cols-2 gap-2"><input placeholder="Nome Cliente" value={pdvNome} onChange={e=>setPdvNome(e.target.value)} className="p-4 bg-black border border-gray-700 rounded-xl text-white font-bold outline-none focus:border-red-500 text-sm"/><input placeholder="WhatsApp" value={pdvTel} onChange={e=>setPdvTel(e.target.value)} className="p-4 bg-black border border-gray-700 rounded-xl text-white font-bold outline-none focus:border-red-500 text-sm"/></div>
                       {pdvEntrega==='entrega' && (
                         <div className="space-y-3">
                           <textarea placeholder="Endereço Completo (Rua, Nº, Bairro, Ref)" value={pdvEnd} onChange={e=>setPdvEnd(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold h-24 resize-none focus:border-red-500 text-sm"/>
                           <div className="flex items-center gap-3 px-4 bg-gray-800 rounded-xl border border-gray-700 py-2"><span className="text-[10px] font-black text-gray-400 uppercase w-20">Taxa R$:</span><input placeholder="8.00" type="number" value={pdvTaxa} onChange={e=>setPdvTaxa(e.target.value)} className="flex-1 bg-transparent text-white font-black outline-none" disabled={pdvCart.some(i=>i.tipo==='oferta')}/></div>
                         </div>
                       )}
                       <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 space-y-3">
                          <select value={pdvPag} onChange={e=>setPdvPag(e.target.value)} className="w-full p-3 bg-black border border-gray-600 rounded-xl text-white font-bold text-sm appearance-none"><option value="dinheiro">💵 Dinheiro</option><option value="maquininha">💳 Maquininha (Cartão)</option><option value="pix_app">📱 PIX</option></select>
                          {pdvPag==='dinheiro' && <input placeholder="Troco p/ R$?" value={pdvTroco} onChange={e=>setPdvTroco(e.target.value)} className="w-full p-4 bg-black border border-gray-600 rounded-xl text-white font-bold text-sm outline-none focus:border-red-500"/>}
                       </div>
                       <input placeholder="Observação Interna" value={pdvObs} onChange={e=>setPdvObs(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-yellow-500 font-bold outline-none focus:border-yellow-500 text-sm"/>
                    </div>
                    <div className="pt-4 border-t border-gray-800 mt-auto">
                       <div className="flex justify-between items-center mb-4 bg-black/40 p-4 rounded-2xl"><span className="text-gray-400 font-black text-[10px] tracking-widest uppercase">Total Final:</span><span className="text-3xl font-black text-green-500 font-mono tracking-tighter">R$ {totalPDV.toFixed(2)}</span></div>
                       <button onClick={lancarPedido} className="w-full bg-green-600 hover:bg-green-500 text-white py-5 rounded-[24px] font-black text-lg shadow-lg active:scale-95 transition-all shadow-green-600/20">LANÇAR PEDIDO</button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* MODAL CONFIGURAÇÃO PIZZA (BLINDAGEM TOTAL ANTI-TELA VERMELHA) */}
        {pdvConfig && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center p-4 z-[200]">
            <div className="bg-white rounded-[40px] w-full max-w-lg p-8 flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in duration-200">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4"><h2 className="text-xl font-black uppercase italic text-gray-800">{pdvConfig.tipo==='pizza'?`Pizza ${pdvConfig.tamanho.name}`:pdvConfig.item.name}</h2><button onClick={()=>setPdvConfig(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button></div>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <div><h3 className="font-black text-xs text-gray-400 uppercase mb-3 flex justify-between items-center">Sabores ({(pdvSelS || []).length} / {pdvConfig.maxFlavors}){(pdvSelS || []).length === pdvConfig.maxFlavors && <CheckCircle2 className="text-green-500" size={18}/>}</h3>
                  <div className="grid grid-cols-2 gap-2">{(() => {
                    let list = (sabores || []);
                    if(pdvConfig.tipo==='combo') list = list.filter(s=>s.isCombo);
                    else if(pdvConfig.tipo==='oferta') list = list.filter(s=>s.isOferta);
                    else if(pdvConfig.isPromoOnly) list = list.filter(s=>s.isPromo);
                    else list = list.filter(s => pdvConfig.isDoce ? isPizzaDoce(s) : !isPizzaDoce(s));
                    const validos = list.filter(s => s && (pdvConfig.tipo !== 'pizza' || Number(s.prices?.[pdvConfig.tamanho?.id] || 0) > 0));
                    return validos.map((s, si) => {
                      const isSel = (pdvSelS || []).some(x => x && x.id === s.id);
                      const isFull = !isSel && (pdvSelS || []).length >= (pdvConfig.maxFlavors || 1);
                      return (
                        <div key={s.id || si} onClick={()=>{ if(isSel){ setPdvSelS(prev => prev.filter(x=>x.id!==s.id)); } else if(!isFull){ setPdvSelS(prev => [...(prev || []), s]); } }} className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${isSel ? 'border-red-500 bg-red-50' : isFull ? 'opacity-40 border-gray-100 cursor-not-allowed' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex justify-between items-start gap-1"><p className={`text-[10px] font-black uppercase leading-tight ${isSel ? 'text-red-600' : 'text-gray-800'}`}>{s.name}</p>{s.isPromo && <Flame size={12} className="text-red-500 shrink-0"/>}</div>
                          <p className="text-[8px] text-gray-500 mt-1 line-clamp-2 leading-tight">{(s.desc || s.description || 'Ingredientes não informados.')}</p>
                        </div>
                      )
                    });
                  })()}</div>
                </div>
                {pdvConfig.tipo === 'pizza' && (
                    <div><h3 className="font-black text-xs text-gray-400 uppercase mb-3 flex items-center gap-1"><CircleDashed size={14}/> Borda Recheada</h3><div className="grid grid-cols-2 gap-2"><div onClick={()=>setPdvSelBorda(null)} className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${!pdvSelBorda ? 'border-orange-500 bg-orange-50 font-black text-orange-600' : 'border-gray-200'}`}>Sem Borda</div>{bordas.filter(b=>getPrecoBorda(b, pdvConfig.tamanho.id)>0).map((b, bi) => (<div key={b.id || bi} onClick={()=>setPdvSelBorda(b)} className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${pdvSelBorda?.id === b.id ? 'border-orange-500 bg-orange-50 font-black text-orange-600' : 'border-gray-200 hover:border-gray-300'}`}>{b.name}</div>))}</div></div>
                )}
              </div>
              <button onClick={addPdvItem} disabled={(pdvSelS || []).length === 0} className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white p-5 rounded-[20px] font-black uppercase shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2">Confirmar Seleção</button>
            </div>
          </div>
        )}

        {/* OUTRAS ABAS (SABORES, EQUIPE, SISTEMA, ETC) - COMPLETAS */}
        {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'caixa', 'equipe', 'sistema'].includes(aba) && (
          <div className="animate-in fade-in duration-300">
             <header className="flex justify-between items-center mb-8 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/50 shadow-sm">
                <h1 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900">{aba}</h1>
                {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'equipe'].includes(aba) && (
                   <button onClick={() => {
                      if (aba === 'equipe' && !isMst) { const p = prompt("Senha Master:"); if (p === 'GRAN2026') setIsMst(true); else return alert("Acesso Negado!"); }
                      setEdit(
                         aba === 'sabores' ? { name: '', desc: '', prices: { broto: 0, grande: 0, gigante: 0, meio_metro: 0, um_metro: 0 }, isActive: true, isPromo: false, isDoce: false, isCombo: false, isOferta: false } :
                         aba === 'bordas' ? { name: '', prices: { broto: 0, grande: 0, gigante: 0, meio_metro: 0, um_metro: 0 }, isActive: true } :
                         aba === 'equipe' ? { nome: '', email: '', cargo: 'Atendente', img: '' } :
                         aba === 'combos' ? { name: '', price: 0, tamanhoId: 'gigante', qtdBebidas: 1, isActive: true } :
                         { name: '', price: 0, isActive: true }
                      );
                   }} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-green-700 active:scale-95 transition-all">Novo {aba}</button>
                )}
             </header>

             {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'equipe'].includes(aba) && (
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase"><tr><th className="p-6">Item / Detalhes</th><th className="p-6">Informações / Preço</th><th className="p-6 text-right">Ações</th></tr></thead>
                      <tbody>{getTabelaAtual().map((it, idx) => (
                        <tr key={it.id || idx} className={`border-b border-gray-50 transition-all ${it.isActive === false ? 'bg-red-50/20 opacity-60' : 'hover:bg-gray-50'}`}>
                           <td className="p-6 flex items-center gap-4">
                              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 overflow-hidden border border-gray-50 shadow-sm shrink-0">{(it.img || it.imageUrl) ? <img src={it.img || it.imageUrl} className="w-full h-full object-cover"/> : <Pizza size={24}/>}</div>
                              <div>
                                <p className="font-black uppercase text-xs text-gray-900 leading-tight">{it.name || it.nome || it.title}</p>
                                {it.cargo && <p className="text-[9px] font-bold text-red-500 uppercase mt-1 tracking-widest">{it.cargo}</p>}
                                {it.isPromo && <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-black uppercase mt-1 inline-block">Promoção</span>}
                                {it.desc && <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 italic">{it.desc}</p>}
                              </div>
                           </td>
                           <td className="p-6 font-black text-[10px] text-gray-500 uppercase">
                              {it.price !== undefined && <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg">R$ {Number(it.price || 0).toFixed(2)}</span>}
                              {it.prices && <div className="flex flex-wrap gap-1 max-w-[250px]">{Object.entries(it.prices).filter(([_, v]) => Number(v)>0).map(([k, v]) => <span key={k} className="bg-gray-100 px-2 py-0.5 rounded text-[8px]">{k.slice(0,3)}: {v}</span>)}</div>}
                              {it.email && <span className="lowercase font-bold text-blue-600">{it.email}</span>}
                           </td>
                           <td className="p-6 text-right space-x-2">
                              {it.isActive !== undefined && <button onClick={()=>toggleActive(it)} className={`p-3 rounded-2xl transition-all ${it.isActive ? 'text-green-600 bg-green-50' : 'text-gray-300 bg-gray-100'}`}>{it.isActive ? <Eye size={16}/> : <EyeOff size={16}/>}</button>}
                              <button onClick={()=>setEdit(it)} className="p-3 text-blue-600 bg-blue-50 rounded-2xl"><Edit2 size={16}/></button>
                              <button onClick={async()=> {if(window.confirm('Excluir Definitivamente?')) await deleteDoc(doc(db, getCollectionName(aba), String(it.id)))}} className="p-3 text-red-600 bg-red-50 rounded-2xl"><Trash2 size={16}/></button>
                           </td>
                        </tr>
                      ))}</tbody>
                   </table>
                </div>
             )}

             {/* CAIXA / RESUMO FINANCEIRO */}
             {aba === 'caixa' && (
                <div className="space-y-6">
                   <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex items-center gap-4 w-1/3"><Search className="text-gray-400" size={20}/><input type="date" className="bg-transparent font-black outline-none w-full text-gray-900" value={filtroCaixa} onChange={e => setFiltroCaixa(e.target.value)} /></div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                     <div className="bg-white p-8 rounded-[40px] shadow-sm border border-green-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Faturamento Entregue</p><p className="text-3xl font-black text-green-600 tracking-tighter font-mono">R$ {stats.total.toFixed(2)}</p></div>
                     <div className="bg-white p-8 rounded-[40px] shadow-sm border"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Pedidos Ok</p><p className="text-4xl font-black text-blue-600 tracking-tighter">{stats.qtd}</p></div>
                     <div className="bg-white p-8 rounded-[40px] shadow-sm border"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Ticket Médio</p><p className="text-3xl font-black text-gray-800 tracking-tighter font-mono">R$ {(stats.total/(stats.qtd||1)).toFixed(2)}</p></div>
                   </div>
                   <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-4">
                      <h3 className="font-black uppercase text-xs text-gray-400 border-b pb-4">Ranking de Vendas</h3>
                      {stats.itens.map(([n, q], idx) => (<div key={idx} className="flex justify-between font-bold text-sm border-b border-gray-50 pb-2 transition-all hover:bg-gray-50 px-2 rounded-lg"><span className="text-gray-800 uppercase text-xs">{n}</span><span className="bg-red-50 text-red-600 px-4 py-1 rounded-full text-xs font-black">{q}x</span></div>))}
                      {stats.itens.length === 0 && <p className="text-center text-gray-300 py-10 font-bold uppercase">Nenhuma venda hoje.</p>}
                   </div>
                </div>
             )}

             {/* SISTEMA / CONFIGURAÇÕES GERAIS */}
             {aba === 'sistema' && (
                <div className="max-w-2xl bg-white p-10 rounded-[50px] shadow-2xl border border-gray-100 space-y-6 mx-auto">
                   <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                      <img src={cfg.logo} className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" />
                      <label className="bg-black text-white px-6 py-2 rounded-2xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all uppercase flex items-center gap-2">{isUp ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Trocar Logo<input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setCfg({ ...cfg, logo: url }))} /></label>
                   </div>
                   <button onClick={() => setCfg({ ...cfg, aberto: !cfg.aberto })} className={`w-full p-6 rounded-3xl font-black uppercase shadow-lg transition-all ${cfg.aberto ? 'bg-green-600 text-white shadow-green-200' : 'bg-red-600 text-white shadow-red-200'}`}>{cfg.aberto ? 'LOJA ABERTA' : 'LOJA FECHADA'}</button>
                   <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h3 className="font-black text-xs text-blue-500 uppercase text-center mb-2 flex justify-center items-center gap-1"><MapPin size={14}/> Configuração de Entrega</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black text-gray-400 px-4 block">CEP LOJA</label><input className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={cfg.cepLoja} onChange={e => setCfg({...cfg, cepLoja: e.target.value})}/></div>
                        <div><label className="text-[10px] font-black text-gray-400 px-4 block">Nº LOJA</label><input className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={cfg.numLoja} onChange={e => setCfg({...cfg, numLoja: e.target.value})}/></div>
                      </div>
                   </div>
                   <button onClick={arrumarBancoDeDados} disabled={loadingMagic} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase shadow-lg hover:scale-95 transition-all flex items-center justify-center gap-2"> {loadingMagic ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18}/>} Ajustar Sabores Automático</button>
                   <button onClick={async () => { await setDoc(doc(db, 'loja_config', 'geral'), cfg); alert('Sistema Salvo!'); }} className="w-full bg-black text-white py-6 rounded-[30px] font-black uppercase shadow-xl flex justify-center items-center gap-2 hover:bg-gray-900 transition-all"><Save size={20}/> Guardar Configurações Gerais</button>
                </div>
             )}
          </div>
        )}

        {/* LISTA DE PEDIDOS PRINCIPAL */}
        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pedidos.filter(p => p && (p.status !== 'entregue' || getDataLocalStr(p.timestamp) === getDataLocalStr())).map((p, idx) => renderPedidoCard(p, idx))}
            {pedidos.filter(p => p && (p.status !== 'entregue' || getDataLocalStr(p.timestamp) === getDataLocalStr())).length === 0 && <p className="col-span-full text-center text-gray-400 font-bold uppercase py-20">Nenhum pedido recebido hoje.</p>}
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL DE EDIÇÃO AVANÇADA (1500+ LINHAS)
          ========================================== */}
      {edit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 z-[100]">
          <form onSubmit={salvar} className="bg-white rounded-[50px] w-full max-w-lg p-10 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black uppercase italic border-b pb-4 flex justify-between items-center text-gray-800 tracking-tighter">Configurar {aba} <button type="button" onClick={() => setEdit(null)}><X size={30} className="text-gray-300 hover:text-black"/></button></h2>
            
            {['sabores', 'bebidas', 'combos', 'ofertas', 'banners', 'equipe'].includes(aba) && (
              <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                 {aba !== 'bordas' && (
                    (edit.img || edit.imageUrl) ? <img src={edit.img || edit.imageUrl} className="w-28 h-28 rounded-3xl object-cover shadow-xl border-4 border-white"/> : <div className="w-28 h-28 bg-gray-200 rounded-3xl flex items-center justify-center text-gray-400"><User size={40}/></div>
                 )}
                 <label className="bg-black text-white px-6 py-2 rounded-2xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all uppercase flex items-center gap-2">
                   {isUp ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Subir Imagem
                   <input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setEdit({ ...edit, [aba === 'banners' ? 'imageUrl' : 'img']: url }))} />
                 </label>
              </div>
            )}
            
            <div className="space-y-4">
              <input placeholder="Nome / Título" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500 transition-colors" value={edit.name || edit.nome || edit.title || ''} onChange={e => setEdit({ ...edit, name: e.target.value, nome: e.target.value, title: e.target.value })} required />
              
              {aba === 'sabores' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <label className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-xl text-center border border-red-100"><input type="checkbox" className="w-4 h-4 accent-red-600" checked={edit.isPromo || false} onChange={e => setEdit({ ...edit, isPromo: e.target.checked })} /><span className="text-[9px] font-black uppercase mt-1">Promo?</span></label>
                  <label className="flex flex-col items-center gap-1 p-2 bg-pink-50 rounded-xl text-center border border-pink-100"><input type="checkbox" className="w-4 h-4 accent-pink-600" checked={edit.isDoce || false} onChange={e => setEdit({ ...edit, isDoce: e.target.checked })} /><span className="text-[9px] font-black uppercase mt-1">Doce?</span></label>
                  <label className="flex flex-col items-center gap-1 p-2 bg-purple-50 rounded-xl text-center border border-purple-100"><input type="checkbox" className="w-4 h-4 accent-purple-600" checked={edit.isCombo || false} onChange={e => setEdit({ ...edit, isCombo: e.target.checked })} /><span className="text-[9px] font-black uppercase mt-1">Combo?</span></label>
                  <label className="flex flex-col items-center gap-1 p-2 bg-green-50 rounded-xl text-center border border-green-100"><input type="checkbox" className="w-4 h-4 accent-green-600" checked={edit.isOferta || false} onChange={e => setEdit({ ...edit, isOferta: e.target.checked })} /><span className="text-[9px] font-black uppercase mt-1">Oferta?</span></label>
                </div>
              )}

              {['sabores', 'combos', 'ofertas'].includes(aba) && <textarea placeholder="Ingredientes / Descrição do Produto..." className="w-full h-24 p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500 transition-colors resize-none text-sm" value={edit.desc || edit.description || ''} onChange={e => setEdit({ ...edit, desc: e.target.value, description: e.target.value })} />}
              
              {['sabores', 'bordas'].includes(aba) && (
                <div className="grid grid-cols-2 gap-4">
                  {tamanhos.map(t => (
                    <div key={t.id}><label className="text-[10px] uppercase font-black text-gray-400 px-3 block mb-1">{t.name}</label><input type="number" step="0.01" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black outline-none focus:border-red-500 text-sm" value={edit.prices?.[t.id] || ''} onChange={e => setEdit({ ...edit, prices: { ...(edit.prices || {}), [t.id]: Number(e.target.value) } })}/></div>
                  ))}
                </div>
              )}
              
              {aba === 'equipe' && (
                <>
                  <input placeholder="E-mail GMAIL Autorizado" type="email" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-blue-500" value={edit.email || ''} onChange={e => setEdit({ ...edit, email: e.target.value })} />
                  <div><label className="text-[10px] font-black text-gray-400 mb-1 ml-3 block">CARGO NO SISTEMA</label><select className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none" value={edit.cargo || 'Atendente'} onChange={e => setEdit({...edit, cargo: e.target.value})}><option value="Atendente">Atendente</option><option value="Gerente">Gerente</option><option value="Admin">Administrador</option></select></div>
                </>
              )}

              {['bebidas', 'combos', 'ofertas'].includes(aba) && (
                <div className="space-y-4">
                   <div className="bg-green-50 p-4 rounded-3xl border border-green-100"><label className="text-[10px] font-black text-green-600 px-2 block mb-1">PREÇO DE VENDA R$</label><input type="number" step="0.01" placeholder="0.00" className="w-full bg-transparent p-1 font-black text-2xl outline-none" value={edit.price || 0} onChange={e => setEdit({ ...edit, price: parseFloat(e.target.value) })}/></div>
                   {aba !== 'bebidas' && (
                      <div className="p-4 bg-gray-50 rounded-3xl border"><label className="text-[10px] font-black text-gray-400 mb-1 block uppercase tracking-widest">Tamanho da Pizza Inclusa</label><select className="w-full bg-transparent font-bold outline-none" value={edit.tamanhoId || 'gigante'} onChange={e => setEdit({...edit, tamanhoId: e.target.value})}>{tamanhos.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}</select></div>
                   )}
                   {aba === 'combos' && <div className="p-4 bg-purple-50 rounded-3xl border border-purple-100"><label className="text-[10px] font-black text-purple-600 mb-1 block uppercase">Quantidade de Bebidas Inclusas</label><input type="number" className="w-full bg-transparent font-bold outline-none" value={edit.qtdBebidas || 1} onChange={e => setEdit({ ...edit, qtdBebidas: parseInt(e.target.value) })}/></div>}
                </div>
              )}
            </div>
            <button type="submit" disabled={isUp} className="w-full bg-green-600 text-white p-6 rounded-[30px] font-black uppercase shadow-xl hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all">Confirmar e Salvar Alterações</button>
          </form>
        </div>
      )}
    </div>
  );
}

// 5. EXPORT FINAL
export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

// FUNÇÃO HELPER DATA
function getDataLocalStr(timestamp) {
  const d = timestamp ? new Date(timestamp) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}