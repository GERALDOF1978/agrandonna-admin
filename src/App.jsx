import React, { useState, useEffect, useMemo, useRef, Component } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc, where } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  Pizza, CupSoda, Plus, Edit2, Trash2, X, ClipboardList, MapPin, Settings, User, 
  ImageIcon, Power, Phone, Printer, MessageCircle, Send, Upload, BarChart3, Users, 
  LogOut, Search, Loader2, Eye, EyeOff, Flame, History, Image as ImgIcon, Wand2, 
  Save, CircleDashed, Package, Ticket, Calculator, Minus, AlertTriangle, 
  CheckCircle2, Check, ArrowLeft, ShoppingBag, Store, ChevronRight, UserCircle, Clock,
  ShoppingCart
} from 'lucide-react';

// ==========================================
// 1. SISTEMA ANTI-ERRO (ERROR BOUNDARY)
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
          <AlertTriangle size={80} className="mb-6 text-white/40 animate-pulse" />
          <h1 className="text-4xl font-black mb-4 uppercase italic tracking-tighter text-white">Erro Detectado</h1>
          <p className="mb-6 font-bold text-lg max-w-md">O sistema interceptou um erro de dados. A tela branca foi evitada.</p>
          <div className="bg-black/40 p-6 rounded-3xl mb-8 font-mono text-xs text-left max-w-2xl w-full overflow-auto border border-white/10 shadow-2xl">
            {this.state.errorMsg}
          </div>
          <button onClick={() => window.location.reload()} className="bg-white text-red-600 px-12 py-5 rounded-full font-black uppercase shadow-2xl hover:scale-105 transition-all">Reiniciar Painel Grandonna</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 2. CONFIGURAÇÕES E CONSTANTES
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

// TAMANHOS CORRIGIDOS (Gigante 4 sabores, Metros 3 sabores)
const TAMANHOS_FIXOS = [
  { id: 'broto', name: 'Broto', description: '4 Pedaços', maxFlavors: 1, icon: '🍕', order: 1 },
  { id: 'grande', name: 'Grande', description: '8 Pedaços', maxFlavors: 2, icon: '🍕', order: 2 },
  { id: 'gigante', name: 'Gigante', description: '16 Pedaços', maxFlavors: 4, icon: '🤤', order: 3 },
  { id: 'meio_metro', name: '1/2 Metro', description: 'Até 3 Sabores', maxFlavors: 3, icon: '📏', order: 4 },
  { id: 'um_metro', name: '1 Metro', description: 'Até 3 Sabores', maxFlavors: 3, icon: '📏', order: 5 }
];

function MainApp() {
  // --- ESTADOS DE AUTH E USUÁRIO ---
  const [user, setUser] = useState(null);
  const [atendente, setAtendente] = useState(null);
  const [hasPerm, setHasPerm] = useState(false);
  const [aba, setAba] = useState('pdv'); 
  
  // --- ESTADOS DE BANCO DE DADOS ---
  const [pedidos, setPedidos] = useState([]);
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
  
  const [filtroCaixa, setFiltroCaixa] = useState(getDataLocalStr(Date.now()));
  const [filtroHist, setFiltroHist] = useState(getDataLocalStr(Date.now()));
  
  const [cfg, setCfg] = useState({ 
    tempo: 40, taxaMinima: 6, kmIncluso: 3, valorKm: 1, cepLoja: '13500000', numLoja: '', horaAbre: '18:00',
    aberto: true, msgFechado: 'Estamos fechados no momento.', zap: '19988723803', logo: 'https://i.ibb.co/WN4kL4xv/logo-pizza.jpg', topo: 'A GRANDONNA'
  });

  const [chatAberto, setChatAberto] = useState(null);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [adminMsg, setAdminMsg] = useState('');
  const [alertasChat, setAlertasChat] = useState([]); 
  const scrollRef = useRef(null);

  // --- PDV ESTADOS (2 ETAPAS) ---
  const [pdvAba, setPdvAba] = useState('tradicionais');
  const [pdvStep, setPdvStep] = useState('cart'); // 'cart' ou 'checkout'
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
  // 3. SINCRONIZAÇÃO E SEGURANÇA
  // ==========================================

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      if (u) {
        onSnapshot(collection(db, 'admin_users'), s => {
          const lista = s.docs.map(d => ({id: d.id, ...d.data()}));
          const userAutenticado = lista.find(x => x.email === u.email);
          if (u.email === OWNER_EMAIL || userAutenticado) {
            setUser(u); setHasPerm(true);
            setAtendente(userAutenticado || { nome: 'Dono / Admin', cargo: 'Admin', img: u.photoURL });
          } else { signOut(auth); alert("Seu e-mail não tem permissão de acesso!"); }
        });
      } else { setHasPerm(false); setUser(null); setAtendente(null); }
    });
  }, []);

  useEffect(() => {
    if (!hasPerm) return;
    const unsubP = onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubS = onSnapshot(collection(db, 'menu_sabores'), s => setSabores(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBordas = onSnapshot(collection(db, 'menu_bordas'), s => setBordas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubB = onSnapshot(collection(db, 'menu_bebidas'), s => setBebidas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubC = onSnapshot(collection(db, 'menu_combos'), s => setCombos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubO = onSnapshot(collection(db, 'menu_ofertas'), s => setOfertas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubN = onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCfg = onSnapshot(doc(db, 'loja_config', 'geral'), s => { if(s.exists()) setCfg(s.data()); });
    return () => { unsubP(); unsubS(); unsubBordas(); unsubB(); unsubC(); unsubO(); unsubN(); unsubCfg(); };
  }, [hasPerm]);

  // ==========================================
  // 4. LÓGICA DO CARRINHO PDV (BLINDADO)
  // ==========================================

  const totalPDV = useMemo(() => {
    const itensTotal = (pdvCart || []).reduce((acc, curr) => acc + (Number(curr.preco) * (curr.qtd || 1)), 0);
    const hasFree = (pdvCart || []).some(i => i.tipo === 'oferta');
    const taxa = (pdvEntrega === 'entrega' && !hasFree) ? Number(pdvTaxa || 0) : 0;
    return itensTotal + taxa;
  }, [pdvCart, pdvEntrega, pdvTaxa]);

  const addPdvItem = () => {
    if(!pdvConfig) return;
    let pTotal = 0, nomeItem = '';
    
    if (pdvConfig.tipo === 'pizza') {
      const precosSabores = pdvSelS.map(s => Number(s.prices?.[pdvConfig.tamanho.id] || 0));
      const pBase = Math.max(...precosSabores);
      const pBorda = pdvSelBorda ? Number(pdvSelBorda.prices?.[pdvConfig.tamanho.id] || 0) : 0;
      pTotal = pBase + pBorda;
      nomeItem = `Pizza ${pdvConfig.tamanho.name}`;
    } else {
      pTotal = Number(pdvConfig.item?.price || 0);
      nomeItem = pdvConfig.item?.name || 'Item';
    }

    const itemFinal = {
      id: Math.random().toString(36).substr(2, 9),
      tipo: pdvConfig.tipo,
      name: nomeItem,
      tamanho: pdvConfig.tamanho, 
      sabores: pdvSelS,
      borda: pdvSelBorda ? { ...pdvSelBorda, precoVendido: (pdvConfig.tipo === 'pizza' ? Number(pdvSelBorda.prices?.[pdvConfig.tamanho.id] || 0) : 0) } : null,
      bebidasCombo: pdvSelBebidas,
      preco: pTotal,
      qtd: 1
    };

    setPdvCart(prev => [...prev, itemFinal]);
    setPdvConfig(null); setPdvSelS([]); setPdvSelBorda(null); setPdvSelBebidas([]); setPdvStep('cart');
  };

  const handlePdvDrinkQtd = (bebida, delta) => {
    const idx = pdvCart.findIndex(c => c.tipo === 'bebida' && c.itemId === bebida.id);
    if (idx >= 0) {
      const newCart = [...pdvCart];
      const newQtd = newCart[idx].qtd + delta;
      if (newQtd <= 0) newCart.splice(idx, 1);
      else {
        newCart[idx].qtd = newQtd;
        newCart[idx].preco = newQtd * (newCart[idx].precoBase || bebida.price);
      }
      setPdvCart(newCart);
    } else if (delta > 0) {
      setPdvCart(prev => [...prev, { 
        id: Math.random().toString(36).substr(2, 9), 
        itemId: bebida.id, 
        tipo: 'bebida', 
        precoBase: Number(bebida.price || 0), 
        preco: Number(bebida.price || 0), 
        name: bebida.name, 
        qtd: 1 
      }]);
    }
  };

  const lancarPedidoPDV = async () => {
    if(!pdvNome.trim()) return alert("O nome do cliente é obrigatório!");
    const ped = {
      items: pdvCart,
      total: totalPDV,
      entrega: pdvEntrega,
      end: pdvEntrega === 'entrega' ? { rua: pdvEnd, taxaCobrada: Number(pdvTaxa || 0) } : {},
      pag: pdvPag,
      troco: pdvTroco,
      obs: pdvObs,
      timestamp: Date.now(),
      status: 'pendente',
      userId: 'balcao_' + (atendente?.nome || 'admin'),
      clientName: pdvNome,
      clientPhone: pdvTel || 'Balcão',
      atendente: atendente?.nome || 'Sistema'
    };

    try {
      await addDoc(collection(db, 'pedidos'), ped);
      alert("Sucesso! Pedido lançado.");
      setPdvCart([]); setPdvNome(''); setPdvTel(''); setPdvEnd(''); setPdvTaxa(''); setPdvObs(''); setPdvTroco(''); setPdvStep('cart');
    } catch(e) { alert("Erro ao salvar no Firebase."); }
  };

  const toggleStatus = async (p, novo) => {
    await updateDoc(doc(db, 'pedidos', p.id), { status: novo });
  };

  const imprimirPedido = (p) => {
    if (!p) return;
    const win = window.open('', '', 'width=300,height=600');
    win.document.write(`
      <html><body style="font-family:monospace; font-size:12px; padding:10px;">
        <h2 style="text-align:center;">${cfg.topo}</h2>
        <p>PEDIDO: #${p.id.slice(-4).toUpperCase()}</p>
        <p>ATENDENTE: ${p.atendente || 'Sistema'}</p>
        <hr/>
        <p>CLIENTE: ${p.clientName}</p>
        <p>ENTREGA: ${p.entrega.toUpperCase()}</p>
        ${p.end?.rua ? `<p>END: ${p.end.rua}</p>` : ''}
        <hr/>
        ${p.items.map(it => `<div>${it.qtd}x ${it.name} (${it.tamanho?.name}) - R$ ${Number(it.preco).toFixed(2)}</div>`).join('')}
        <hr/>
        <h3>TOTAL: R$ ${Number(p.total).toFixed(2)}</h3>
        <p>PAGAMENTO: ${p.pag.toUpperCase()}</p>
      </body></html>
    `);
    win.print(); win.close();
  };

  const handleImgUpload = async (file, callback) => {
    setIsUp(true);
    const fd = new FormData(); fd.append('image', file);
    try {
      const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
      const d = await r.json(); callback(d.data.url);
    } catch(e) { alert("Erro no upload."); }
    setIsUp(false);
  };

  const salvarDados = async (e) => {
    e.preventDefault();
    const col = getCollectionNameByTab(aba);
    const data = { ...edit }; const id = data.id; delete data.id;
    try {
      if(id) await updateDoc(doc(db, col, id), data);
      else await addDoc(collection(db, col), data);
      setEdit(null);
    } catch(e) { alert("Erro ao salvar."); }
  };

  const getCollectionNameByTab = (t) => {
    const map = { sabores: 'menu_sabores', bordas: 'menu_bordas', bebidas: 'menu_bebidas', combos: 'menu_combos', ofertas: 'menu_ofertas', equipe: 'admin_users', banners: 'menu_banners' };
    return map[t] || '';
  };

  const stats = useMemo(() => {
    const dia = pedidos.filter(p => getDataLocalStr(p.timestamp) === filtroCaixa && p.status === 'entregue');
    const total = dia.reduce((a,b) => a + Number(b.total || 0), 0);
    const rankings = {};
    dia.flatMap(p => p.items || []).forEach(it => { rankings[it.name] = (rankings[it.name] || 0) + (it.qtd || 1); });
    return { total, qtd: dia.length, itens: Object.entries(rankings) };
  }, [pedidos, filtroCaixa]);

  // ==========================================
  // 5. RENDERIZAÇÃO DA INTERFACE (UI)
  // ==========================================

  if (!hasPerm) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="bg-gray-900 p-12 rounded-[50px] border border-white/5 text-center shadow-2xl">
        <img src={cfg.logo} className="w-24 h-24 rounded-full mx-auto mb-6 border-2 border-yellow-500"/>
        <h1 className="text-white font-black text-2xl mb-8 uppercase tracking-tighter italic">A Grandonna Admin</h1>
        <button onClick={() => signInWithPopup(auth, provider)} className="bg-white text-black px-12 py-5 rounded-3xl font-black flex items-center gap-4 hover:bg-gray-200 transition-all shadow-xl">
          <img src="https://www.google.com/favicon.ico" className="w-6"/> ENTRAR COM GOOGLE
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* BARRA LATERAL PRETA */}
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col shadow-2xl z-40 overflow-y-auto shrink-0 border-r border-white/5">
        <img src={cfg.logo} className="w-24 h-24 rounded-full mx-auto border-4 border-yellow-500 mb-8 object-cover shadow-2xl ring-4 ring-yellow-500/20"/>
        <nav className="space-y-1 flex-1">
          {[
            { id: 'pdv', label: 'PDV / CAIXA', icon: <Calculator size={18}/> },
            { id: 'pedidos', label: 'COZINHA', icon: <ClipboardList size={18}/> },
            { id: 'historico', label: 'HISTÓRICO', icon: <History size={18}/> },
            { id: 'sabores', label: 'PIZZAS', icon: <Pizza size={18}/> },
            { id: 'bordas', label: 'BORDAS', icon: <CircleDashed size={18}/> },
            { id: 'bebidas', label: 'BEBIDAS', icon: <CupSoda size={18}/> },
            { id: 'combos', label: 'COMBOS', icon: <Package size={18}/> },
            { id: 'ofertas', label: 'OFERTAS', icon: <Ticket size={18}/> },
            { id: 'caixa', label: 'CAIXA', icon: <BarChart3 size={18}/> },
            { id: 'equipe', label: 'EQUIPE', icon: <Users size={18}/> },
            { id: 'sistema', label: 'SISTEMA', icon: <Settings size={18}/> }
          ].map(m => (
            <button key={m.id} onClick={() => { setAba(m.id); setEdit(null); }} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 transition-all duration-200 ${aba === m.id ? 'bg-red-600 text-white shadow-xl translate-x-2' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
              {m.icon} {m.label}
            </button>
          ))}
        </nav>

        {/* PERFIL ATENDENTE LOGADO */}
        {atendente && (
          <div className="mt-8 p-4 bg-gray-900/80 rounded-3xl flex items-center gap-3 border border-white/5">
             <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center font-black overflow-hidden border border-white/10 shrink-0">
               {atendente.img ? <img src={atendente.img} className="w-full h-full object-cover"/> : <User size={24}/>}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black text-white truncate uppercase tracking-tighter">{atendente.nome}</p>
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">{atendente.cargo}</p>
             </div>
          </div>
        )}
        <button onClick={() => signOut(auth)} className="text-gray-600 font-bold text-[10px] uppercase flex items-center gap-2 p-4 hover:text-red-500 transition-colors"><LogOut size={14}/> Sair</button>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-100 relative">
        
        {/* ==========================================
            ABA PDV: TELA DIVIDIDA EM 2 ETAPAS
            ========================================== */}
        {aba === 'pdv' && (
          <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-100px)]">
            
            {/* COLUNA ESQUERDA: CATÁLOGO */}
            <div className="flex-1 bg-white p-6 rounded-[45px] shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
               <h2 className="text-2xl font-black italic uppercase mb-6 text-gray-800 tracking-tighter">Cardápio Rápido</h2>
               
               {/* MENU DE CATEGORIAS COM FLEX-WRAP (NUNCA MAIS SOME) */}
               <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-6 mb-6">
                 {(() => {
                    const abasDisp = [];
                    if(sabores.some(s => s && s.isPromo)) abasDisp.push('promo');
                    abasDisp.push('tradicionais', 'doces');
                    if(combos.length > 0) abasDisp.push('combos');
                    if(ofertas.length > 0) abasDisp.push('ofertas');
                    if(bebidas.length > 0) abasDisp.push('bebidas');

                    return abasDisp.map(t => (
                      <button key={t} onClick={()=>{setPdvAba(t); setPdvStep('cart');}} className={`px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm border-2 ${pdvAba === t ? 'bg-red-600 border-red-600 text-white shadow-red-200' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                        {t === 'promo' ? '🔥 Promoções' : t}
                      </button>
                    ));
                 })()}
               </div>

               <div className="flex-1 overflow-y-auto pr-2 grid gap-3 align-top content-start">
                  {/* TAMANHOS: FILTRAGEM INTELIGENTE (SÓ MOSTRA O QUE TEM PREÇO) */}
                  {['tradicionais', 'doces', 'promo'].includes(pdvAba) && (tamanhos || []).map((t, idx) => {
                     const temPrecoParaTamanho = sabores.some(s => {
                        if(!s) return false;
                        if(pdvAba === 'doces' && !isPizzaDoce(s)) return false;
                        if(pdvAba === 'tradicionais' && isPizzaDoce(s)) return false;
                        if(pdvAba === 'promo' && !s.isPromo) return false;
                        return Number(s.prices?.[t.id] || 0) > 0;
                     });
                     if(!temPrecoParaTamanho) return null; // ESCONDE CATEGORIA VAZIA

                     return (
                       <div key={idx} onClick={() => setPdvConfig({ tipo: 'pizza', isDoce: pdvAba==='doces', isPromoOnly: pdvAba==='promo', tamanho: t, maxFlavors: t.maxFlavors })} className="bg-gray-50 p-5 rounded-[30px] border border-gray-200 hover:border-red-500 cursor-pointer transition-all flex justify-between items-center group hover:bg-white hover:shadow-xl">
                          <div className="flex items-center gap-5"><div className="text-4xl bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">{t.icon}</div><div><h4 className="font-black text-xl text-gray-800 uppercase tracking-tighter">{t.name} {pdvAba==='doces'?'Doce':''}</h4><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.description} • {t.maxFlavors} Sabores</p></div></div>
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 group-hover:bg-red-600 group-hover:text-white transition-all"><Plus size={20}/></div>
                       </div>
                     )
                  })}

                  {pdvAba === 'combos' && combos.map((c, idx) => (
                    <div key={idx} onClick={() => setPdvConfig({ tipo: 'combo', item: c, tamanho: tamanhos.find(t=>t.id===c.tamanhoId), maxFlavors: tamanhos.find(t=>t.id===c.tamanhoId)?.maxFlavors || 1, maxBebidas: c.qtdBebidas })} className="bg-purple-50 p-6 rounded-[35px] border border-purple-100 cursor-pointer flex justify-between items-center group hover:shadow-xl transition-all border-l-8 border-l-purple-500">
                       <div><span className="text-[9px] bg-purple-200 text-purple-700 px-3 py-1 rounded-full font-black uppercase mb-2 inline-block">Combo Especial</span><h4 className="font-black text-xl text-gray-800 uppercase tracking-tighter">{c.name}</h4><p className="text-xs text-purple-600 font-bold mt-1">R$ {Number(c.price || 0).toFixed(2)}</p></div><div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-all"><Plus size={20}/></div>
                    </div>
                  ))}

                  {pdvAba === 'ofertas' && ofertas.map((o, idx) => (
                    <div key={idx} onClick={() => setPdvConfig({ tipo: 'oferta', item: o, tamanho: tamanhos.find(t=>t.id===o.tamanhoId), maxFlavors: tamanhos.find(t=>t.id===o.tamanhoId)?.maxFlavors || 1 })} className="bg-green-50 p-6 rounded-[35px] border border-green-100 cursor-pointer flex justify-between items-center group hover:shadow-xl transition-all border-l-8 border-l-green-500">
                       <div><span className="text-[9px] bg-green-200 text-green-700 px-3 py-1 rounded-full font-black uppercase mb-2 inline-block">🚚 Frete Grátis</span><h4 className="font-black text-xl text-gray-800 uppercase tracking-tighter">{o.name}</h4><p className="text-xs text-green-700 font-bold mt-1">R$ {Number(o.price || 0).toFixed(2)}</p></div><div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-green-200 group-hover:bg-green-600 group-hover:text-white transition-all"><Plus size={20}/></div>
                    </div>
                  ))}

                  {pdvAba === 'bebidas' && bebidas.map((b, idx) => (
                    <div key={idx} className="bg-gray-50 p-5 rounded-[30px] border border-gray-200 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-4"><div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-gray-100 text-blue-500"><CupSoda size={28}/></div><div><h4 className="font-black text-lg text-gray-800 uppercase tracking-tighter">{b.name}</h4><p className="text-xs text-blue-600 font-bold">R$ {Number(b.price || 0).toFixed(2)}</p></div></div>
                      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100"><button onClick={()=>handlePdvDrinkQtd(b, -1)} className="w-10 h-10 bg-gray-100 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center"><Minus size={16}/></button><span className="w-6 text-center font-black text-gray-800">{pdvCart.find(x => x.itemId === b.id)?.qtd || 0}</span><button onClick={()=>handlePdvDrinkQtd(b, 1)} className="w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center"><Plus size={16}/></button></div>
                    </div>
                  ))}
               </div>
            </div>

            {/* COLUNA DIREITA: RESUMO GIGANTE E CHECKOUT */}
            <div className="w-full xl:w-[480px] bg-gray-900 p-8 rounded-[50px] shadow-2xl border border-gray-800 flex flex-col h-full overflow-hidden relative ring-8 ring-black/5">
               
               {pdvStep === 'cart' ? (
                 <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                       <h2 className="text-2xl font-black italic uppercase text-white flex items-center gap-3"><ShoppingBag size={28} className="text-yellow-500"/> Resumo do Pedido</h2>
                       <div className="bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-red-600/30 uppercase tracking-widest">{pdvCart.reduce((a,b)=>a+(b.qtd||1),0)} itens</div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-3 scrollbar-thin scrollbar-thumb-gray-700">
                       {pdvCart.map((i) => (
                         <div key={i.id} className="bg-gray-800/60 p-5 rounded-3xl border border-white/5 flex justify-between items-start text-white group relative">
                           <div className="flex-1 pr-4">
                             <div className="flex items-center gap-2 mb-1"><span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">{i.tamanho?.name || 'Item'}</span><p className="font-black text-white text-base leading-tight">{(i.qtd>1)?`${i.qtd}x `:''}{i.name}</p></div>
                             {i.sabores && <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold leading-relaxed">{i.sabores.map(s=>s.name).join(' + ')}</p>}
                             {i.borda && <div className="flex items-center gap-1.5 mt-2 text-orange-400 font-bold italic text-[10px]"><CircleDashed size={12}/> Borda: {i.borda.name}</div>}
                           </div>
                           <div className="text-right shrink-0">
                             <p className="text-green-500 font-black text-sm">R$ {Number(i.preco).toFixed(2)}</p>
                             <button onClick={() => setPdvCart(prev => prev.filter(x => x.id !== i.id))} className="text-red-500 mt-4 ml-auto block bg-red-500/10 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all shadow-lg"><Trash2 size={16}/></button>
                           </div>
                         </div>
                       ))}
                       {pdvCart.length === 0 && <div className="h-full flex flex-col items-center justify-center py-20"><ShoppingBag size={64} className="text-white/10 mb-4"/><p className="font-black uppercase text-[10px] text-gray-600 tracking-widest text-center">Aguardando itens do catálogo...</p></div>}
                    </div>

                    <div className="pt-8 border-t border-white/10 mt-6">
                       <div className="flex justify-between items-center bg-black p-6 rounded-[30px] mb-6 border border-white/5 shadow-inner">
                          <span className="text-gray-500 font-black uppercase text-xs tracking-widest">Total dos Itens</span>
                          <span className="text-4xl font-black text-green-500 font-mono tracking-tighter">R$ {totalPDV.toFixed(2)}</span>
                       </div>
                       <div className="flex gap-3">
                          <button onClick={()=>{if(pdvCart.length>0){setPdvEntrega('entrega'); setPdvStep('checkout');}}} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-6 rounded-3xl font-black text-xs flex flex-col items-center gap-2 shadow-2xl active:scale-95 transition-all"><MapPin size={24}/> DELIVERY</button>
                          <button onClick={()=>{if(pdvCart.length>0){setPdvEntrega('retirada'); setPdvStep('checkout');}}} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-6 rounded-3xl font-black text-xs flex flex-col items-center gap-2 shadow-2xl active:scale-95 transition-all"><Store size={24}/> BALCÃO</button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                    <button onClick={()=>setPdvStep('cart')} className="text-gray-500 hover:text-white flex items-center gap-2 mb-8 font-black uppercase text-[10px] tracking-widest self-start group transition-all">
                       <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all"><ArrowLeft size={16}/></div> Voltar ao Carrinho
                    </button>
                    <h2 className="text-2xl font-black uppercase text-white mb-8 border-b border-white/10 pb-4 italic tracking-tighter">Finalizar Pedido</h2>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-3 pb-8 scrollbar-thin">
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><label className="text-[9px] font-black text-gray-500 uppercase ml-3">Cliente</label><input placeholder="Nome" value={pdvNome} onChange={e=>setPdvNome(e.target.value)} className="w-full p-4 bg-black border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-red-500 text-sm"/></div>
                          <div className="space-y-1"><label className="text-[9px] font-black text-gray-500 uppercase ml-3">Celular</label><input placeholder="(00) 00000-0000" value={pdvTel} onChange={e=>setPdvTel(e.target.value)} className="w-full p-4 bg-black border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-red-500 text-sm"/></div>
                       </div>

                       {pdvEntrega === 'entrega' && (
                         <div className="space-y-4 bg-white/5 p-5 rounded-[30px] border border-white/5 shadow-inner">
                            <div className="space-y-1"><label className="text-[9px] font-black text-gray-500 uppercase ml-3">Endereço de Entrega</label><textarea placeholder="Rua, número, bairro e referência..." value={pdvEnd} onChange={e=>setPdvEnd(e.target.value)} className="w-full p-4 bg-black border border-white/10 rounded-2xl text-white font-bold h-24 resize-none focus:border-red-500 text-sm"/></div>
                            <div className="flex items-center gap-4 bg-black p-4 rounded-2xl border border-white/10"><MapPin size={18} className="text-red-500"/><span className="text-[10px] font-black text-gray-400 uppercase w-20">Taxa R$:</span><input placeholder="0.00" type="number" value={pdvTaxa} onChange={e=>setPdvTaxa(e.target.value)} className="flex-1 bg-transparent text-white font-black text-lg outline-none" disabled={pdvCart.some(i=>i.tipo==='oferta')}/></div>
                         </div>
                       )}

                       <div className="bg-white/5 p-5 rounded-[30px] border border-white/5 space-y-4 shadow-inner">
                          <div className="space-y-1"><label className="text-[9px] font-black text-gray-500 uppercase ml-3">Pagamento</label>
                            <div className="grid grid-cols-3 gap-2">
                               {['dinheiro','maquininha','pix_app'].map(pag => (
                                 <button key={pag} onClick={()=>setPdvPag(pag)} className={`py-3 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${pdvPag === pag ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-black border-white/10 text-gray-500 hover:border-white/20'}`}>{pag === 'dinheiro' ? '💵 Din' : pag === 'maquininha' ? '💳 Cart' : '📱 Pix'}</button>
                               ))}
                            </div>
                          </div>
                          {pdvPag === 'dinheiro' && <div className="animate-in fade-in duration-300"><label className="text-[9px] font-black text-gray-500 uppercase ml-3 tracking-widest">Troco para quanto?</label><input placeholder="Ex: 100.00" type="number" value={pdvTroco} onChange={e=>setPdvTroco(e.target.value)} className="w-full p-4 bg-black border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-red-500 text-sm shadow-inner"/></div>}
                       </div>

                       <div className="space-y-1"><label className="text-[9px] font-black text-gray-500 uppercase ml-3">Observação Geral</label><input placeholder="Ex: Sem cebola, caprichar no queijo..." value={pdvObs} onChange={e=>setPdvObs(e.target.value)} className="w-full p-4 bg-black border border-white/10 rounded-2xl text-yellow-500 font-bold outline-none focus:border-yellow-500 text-sm shadow-inner"/></div>
                    </div>

                    <div className="pt-8 border-t border-white/10 mt-auto">
                       <div className="flex justify-between items-center bg-green-500/10 p-6 rounded-3xl mb-6 border border-green-500/20 shadow-inner"><span className="text-green-500 font-black text-xs uppercase tracking-widest">Total Final:</span><span className="text-3xl font-black text-green-500 font-mono tracking-tighter">R$ {totalPDV.toFixed(2)}</span></div>
                       <button onClick={lancarPedidoPDV} className="w-full bg-green-600 hover:bg-green-500 text-white py-6 rounded-[30px] font-black text-xl shadow-2xl active:scale-95 transition-all shadow-green-600/20 flex items-center justify-center gap-3">
                          <CheckCircle2 size={24}/> FINALIZAR E IMPRIMIR
                       </button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* MODAL CONFIGURAÇÃO PIZZA (BLINDAGEM TOTAL ANTI-TELA VERMELHA) */}
        {pdvConfig && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex justify-center items-center p-4 z-[200] animate-in fade-in duration-200">
            <div className="bg-white rounded-[50px] w-full max-w-xl p-8 flex flex-col max-h-[90vh] shadow-2xl relative border-t-[10px] border-red-600 animate-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black uppercase italic text-gray-900 tracking-tighter">{pdvConfig.tipo === 'pizza' ? 'Montar Pizza' : pdvConfig.item?.name}</h2>
                  {pdvConfig.tamanho && <p className="text-xs font-black text-red-600 uppercase tracking-widest mt-1">{pdvConfig.tamanho.name} • ATÉ {pdvConfig.maxFlavors} SABORES</p>}
                </div>
                <button onClick={() => setPdvConfig(null)} className="p-3 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-600 transition-all"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-thin">
                <div>
                  <div className="flex items-center justify-between mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest">SABORES ({(pdvSelS || []).length} / {pdvConfig.maxFlavors})</h3>
                    {(pdvSelS || []).length === pdvConfig.maxFlavors && <div className="flex items-center gap-2 text-green-600 font-black text-[10px] animate-bounce"><Check size={16}/> PIZZA COMPLETA</div>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(() => {
                      let list = (sabores || []).filter(s => s && s.isActive !== false);
                      if(pdvConfig.tipo==='combo') list = list.filter(s=>s.isCombo);
                      else if(pdvConfig.tipo==='oferta') list = list.filter(s=>s.isOferta);
                      else if(pdvConfig.isPromoOnly) list = list.filter(s=>s.isPromo);
                      else list = list.filter(s => pdvConfig.isDoce ? isPizzaDoce(s) : !isPizzaDoce(s));

                      const validos = list.filter(s => pdvConfig.tipo !== 'pizza' || (Number(s.prices?.[pdvConfig.tamanho?.id] || 0) > 0));

                      return validos.map(s => {
                        const isSel = (pdvSelS || []).some(x => x && x.id === s.id);
                        const isFull = !isSel && (pdvSelS || []).length >= pdvConfig.maxFlavors;
                        return (
                          <div key={s.id} onClick={()=>{ if(isSel){ setPdvSelS(prev => prev.filter(x=>x.id!==s.id)); } else if(!isFull){ setPdvSelS(prev => [...(prev || []), s]); } }} className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative ${isSel ? 'border-red-600 bg-red-50 shadow-lg shadow-red-100' : isFull ? 'opacity-40 border-gray-100 grayscale' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                            {isSel && <div className="absolute top-2 right-2 text-red-600 animate-in zoom-in"><CheckCircle2 size={18}/></div>}
                            <div className="flex justify-between items-start gap-2 pr-4"><p className={`text-xs font-black uppercase leading-tight ${isSel ? 'text-red-700' : 'text-gray-800'}`}>{s.name}</p>{s.isPromo && <Flame size={14} className="text-red-500 shrink-0"/>}</div>
                            <p className="text-[9px] text-gray-500 mt-2 font-bold leading-relaxed line-clamp-2">{(s.desc || s.description || 'Ingredientes Grandonna.')}</p>
                            {pdvConfig.tipo === 'pizza' && <p className="text-[10px] font-black text-gray-900 mt-3 bg-white/50 inline-block px-2 py-0.5 rounded-lg border border-gray-100">R$ {Number(s.prices?.[pdvConfig.tamanho.id]).toFixed(2)}</p>}
                          </div>
                        )
                      });
                    })()}
                  </div>
                </div>

                {pdvConfig.tipo === 'pizza' && (
                   <div><h3 className="font-black text-xs text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2"><CircleDashed size={16} className="text-orange-500"/> Borda Recheada</h3><div className="grid grid-cols-2 gap-3"><div onClick={()=>setPdvSelBorda(null)} className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-center font-black uppercase text-[10px] ${!pdvSelBorda ? 'border-orange-600 bg-orange-50 text-orange-600 shadow-lg shadow-orange-100' : 'border-gray-200 text-gray-400'}`}>Sem Borda</div>{bordas.filter(b => Number(b.prices?.[pdvConfig.tamanho.id] || 0) > 0).map(b => (<div key={b.id} onClick={()=>setPdvSelBorda(b)} className={`p-4 rounded-3xl border-2 cursor-pointer transition-all text-center ${pdvSelBorda?.id === b.id ? 'border-orange-600 bg-orange-50 text-orange-600 shadow-lg shadow-orange-100' : 'border-gray-200 text-gray-800 hover:border-gray-300'}`}><p className="text-[10px] font-black uppercase">{b.name}</p><p className="text-[9px] font-bold opacity-60">+ R$ {Number(b.prices?.[pdvConfig.tamanho.id]).toFixed(2)}</p></div>))}</div></div>
                )}
              </div>
              <div className="pt-6 mt-6 border-t border-gray-100"><button onClick={addPdvItem} disabled={(pdvSelS || []).length === 0} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-6 rounded-[30px] font-black text-lg uppercase shadow-2xl shadow-red-600/30 active:scale-95 transition-all">ADICIONAR AO PEDIDO</button></div>
            </div>
          </div>
        )}

        {/* ==========================================
            OUTRAS ABAS (SABORES, EQUIPE, SISTEMA, ETC)
            ========================================== */}
        {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'caixa', 'equipe', 'sistema'].includes(aba) && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div><h1 className="text-4xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">{aba}</h1><p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Gestão de dados e segurança Grandonna</p></div>
                {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'equipe'].includes(aba) && (
                   <button onClick={() => {
                      if (aba === 'equipe' && !isMst) { const p = prompt("SENHA MASTER:"); if (p === 'GRAN2026') setIsMst(true); else return alert("Acesso Negado!"); }
                      setEdit(
                         aba === 'sabores' ? { name: '', desc: '', prices: { broto: 0, grande: 0, gigante: 0, meio_metro: 0, um_metro: 0 }, isActive: true, isPromo: false, isDoce: false, isCombo: false, isOferta: false } :
                         aba === 'bordas' ? { name: '', prices: { broto: 0, grande: 0, gigante: 0, meio_metro: 0, um_metro: 0 }, isActive: true } :
                         aba === 'equipe' ? { nome: '', email: '', cargo: 'Atendente', img: '' } :
                         { name: '', price: 0, isActive: true }
                      );
                   }} className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={20}/> NOVO ITEM</button>
                )}
             </header>

             <div className="bg-white rounded-[50px] shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="p-8">Detalhes do Item</th><th className="p-8 text-center">Info Adicional</th><th className="p-8 text-right">Ações</th></tr></thead>
                   <tbody>{getTabelaAtual().map((it, idx) => (
                    <tr key={it.id || idx} className={`border-b border-gray-100 transition-all ${!it.isActive ? 'bg-red-50/10 opacity-60' : 'hover:bg-gray-50'}`}>
                       <td className="p-8"><div className="flex items-center gap-6"><div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-300 overflow-hidden border border-gray-100">{(it.img || it.imageUrl) ? <img src={it.img || it.imageUrl} className="w-full h-full object-cover"/> : <ImgIcon size={24}/>}</div><div><p className="font-black uppercase text-sm text-gray-900 tracking-tighter leading-tight">{it.name || it.nome || it.title}</p>{it.cargo && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 tracking-widest">{it.cargo}</p>}{it.isPromo && <span className="bg-red-100 text-red-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase mt-2 inline-block">🔥 PROMO</span>}</div></div></td>
                       <td className="p-8 text-center font-black text-[10px] text-gray-500 uppercase">{it.price !== undefined && <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-xl text-xs">R$ {Number(it.price).toFixed(2)}</span>}{it.prices && <div className="flex flex-wrap justify-center gap-2">{Object.entries(it.prices).filter(([_,v]) => Number(v)>0).map(([k,v]) => <span key={k} className="bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">{k.slice(0,3)}: {v}</span>)}</div>}{it.email && <span className="lowercase font-bold text-blue-600 border-b border-blue-100">{it.email}</span>}</td>
                       <td className="p-8 text-right whitespace-nowrap"><div className="flex justify-end gap-3">{it.isActive !== undefined && (<button onClick={()=>toggleActiveItem(it)} className={`p-3 rounded-2xl transition-all ${it.isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>{it.isActive ? <Eye size={20}/> : <EyeOff size={20}/>}</button>)}<button onClick={()=>setEdit(it)} className="p-3 text-blue-600 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-all shadow-sm"><Edit2 size={20}/></button><button onClick={async()=> {if(window.confirm('CUIDADO! Excluir permanentemente?')) await deleteDoc(doc(db, getCollectionNameByTab(aba), String(it.id)))}} className="p-3 text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-all shadow-sm"><Trash2 size={20}/></button></div></td>
                    </tr>
                  ))}</tbody>
                </table>
             </div>

             {/* ABA CAIXA: ESTATÍSTICAS */}
             {aba === 'caixa' && (
                <div className="mt-10 space-y-8">
                   <div className="flex items-center gap-6"><div className="bg-white p-6 rounded-[35px] shadow-sm border flex items-center gap-4 w-full md:w-1/3"><Search className="text-gray-400"/><input type="date" className="bg-transparent font-black outline-none w-full text-gray-900" value={filtroCaixa} onChange={e => setFiltroCaixa(e.target.value)} /></div></div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                     <div className="bg-white p-10 rounded-[50px] shadow-sm border border-green-100 flex flex-col items-center"><div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4"><Calculator size={32}/></div><p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Faturamento do Dia</p><p className="text-4xl font-black text-green-600 font-mono tracking-tighter">R$ {stats.total.toFixed(2)}</p></div>
                     <div className="bg-white p-10 rounded-[50px] shadow-sm border border-blue-100 flex flex-col items-center"><div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4"><ShoppingCart size={32}/></div><p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Pedidos Concluídos</p><p className="text-5xl font-black text-blue-600 font-mono tracking-tighter">{stats.qtd}</p></div>
                     <div className="bg-white p-10 rounded-[50px] shadow-sm border border-gray-200 flex flex-col items-center"><div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 mb-4"><BarChart3 size={32}/></div><p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Ticket Médio</p><p className="text-4xl font-black text-gray-800 font-mono tracking-tighter">R$ {(stats.total/(stats.qtd||1)).toFixed(2)}</p></div>
                   </div>
                   <div className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-sm space-y-4 shadow-xl">
                      <h3 className="font-black uppercase text-xs text-gray-400 border-b border-gray-50 pb-6 mb-4 tracking-widest flex items-center gap-2"><Flame size={16} className="text-red-500"/> Ranking de Vendas por Item</h3>
                      {stats.itens.map(([n, q], idx) => (<div key={idx} className="flex justify-between font-bold text-sm border-b border-gray-50 pb-3 hover:bg-gray-50 px-4 rounded-xl transition-all"><span className="text-gray-800 uppercase text-xs tracking-tighter">{n}</span><span className="bg-red-50 text-red-600 px-6 py-1.5 rounded-full text-xs font-black shadow-sm">{q}x vendidos</span></div>))}
                      {stats.itens.length === 0 && <p className="text-center text-gray-300 py-20 font-bold uppercase tracking-widest">Nenhuma venda registrada.</p>}
                   </div>
                </div>
             )}

             {/* ABA SISTEMA: AJUSTES FINAIS */}
             {aba === 'sistema' && (
                <div className="max-w-3xl bg-white p-12 rounded-[60px] shadow-2xl border border-gray-200 space-y-10 mx-auto mt-10">
                   <div className="flex flex-col items-center gap-6 p-8 bg-gray-50 rounded-[45px] border-2 border-dashed border-gray-200">
                      <img src={cfg.logo} className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover ring-8 ring-white/50" />
                      <label className="bg-black text-white px-10 py-4 rounded-3xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all uppercase flex items-center gap-3 tracking-widest">{isUp ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20}/>} Trocar Logomarca Grandonna<input type="file" className="hidden" onChange={async e => await handleImgUpload(e.target.files[0], (url) => setCfg({ ...cfg, logo: url }))} /></label>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button onClick={() => setCfg({ ...cfg, aberto: !cfg.aberto })} className={`p-8 rounded-[35px] font-black uppercase shadow-2xl transition-all flex flex-col items-center gap-3 border-4 ${cfg.aberto ? 'bg-green-600 text-white border-green-500 shadow-green-200' : 'bg-red-600 text-white border-red-500 shadow-red-200'}`}>{cfg.aberto ? <Power size={32}/> : <Power size={32} className="rotate-180"/>} {cfg.aberto ? 'LOJA ABERTA' : 'LOJA FECHADA'}</button>
                      <button onClick={arrumarBancoDeDados} disabled={loadingMagic} className="p-8 bg-white border-4 border-gray-100 rounded-[35px] font-black text-gray-800 uppercase shadow-xl hover:bg-gray-50 transition-all flex flex-col items-center gap-3"> {loadingMagic ? <Loader2 className="animate-spin" size={32}/> : <Wand2 size={32} className="text-purple-500"/>} Mágica: Ajustar Tudo</button>
                   </div>
                   <div className="space-y-6 pt-8 border-t border-gray-100">
                      <h3 className="font-black text-xs text-blue-500 uppercase text-center flex justify-center items-center gap-2"><MapPin size={18}/> Endereço e Frete</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 px-4 block">CEP DA LOJA</label><input className="w-full p-5 bg-gray-50 border rounded-3xl font-black text-blue-600 text-center text-xl outline-none focus:border-blue-500" value={cfg.cepLoja} onChange={e => setCfg({...cfg, cepLoja: e.target.value})}/></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 px-4 block">Nº DA LOJA</label><input className="w-full p-5 bg-gray-50 border rounded-3xl font-black text-blue-600 text-center text-xl outline-none focus:border-blue-500" value={cfg.numLoja} onChange={e => setCfg({...cfg, numLoja: e.target.value})}/></div>
                      </div>
                   </div>
                   <button onClick={async () => { await setDoc(doc(db, 'loja_config', 'geral'), cfg); alert('Sistema Atualizado com Sucesso!'); }} className="w-full bg-black hover:bg-gray-900 text-white py-8 rounded-[40px] font-black uppercase shadow-2xl flex justify-center items-center gap-4 transition-all text-xl tracking-tighter"><Save size={28}/> GUARDAR TUDO AGORA</button>
                </div>
             )}
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL DE EDIÇÃO (O MONSTRO DE 1500 LINHAS)
          ========================================== */}
      {edit && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex justify-center items-center p-4 z-[100] animate-in fade-in duration-300">
          <form onSubmit={salvarDados} className="bg-white rounded-[60px] w-full max-w-xl p-12 space-y-8 shadow-2xl overflow-y-auto max-h-[90vh] relative border-t-[15px] border-green-600">
            <h2 className="text-3xl font-black uppercase italic border-b border-gray-100 pb-8 flex justify-between items-center text-gray-900 tracking-tighter">Editando: {aba} <button type="button" onClick={() => setEdit(null)} className="p-3 bg-gray-100 rounded-full hover:rotate-90 transition-all duration-300 shadow-sm"><X size={28}/></button></h2>
            
            {['sabores', 'bebidas', 'combos', 'ofertas', 'banners', 'equipe'].includes(aba) && (
              <div className="flex flex-col items-center gap-6 p-8 bg-gray-50 rounded-[45px] border-2 border-dashed border-gray-200 shadow-inner">
                 {(edit.img || edit.imageUrl) ? <img src={edit.img || edit.imageUrl} className="w-40 h-40 rounded-[50px] object-cover shadow-2xl border-4 border-white ring-8 ring-black/5"/> : <div className="w-40 h-40 bg-white rounded-[50px] flex items-center justify-center text-gray-200 border-2 border-gray-100 shadow-inner"><User size={64}/></div>}
                 <label className="bg-black text-white px-10 py-4 rounded-3xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all uppercase flex items-center gap-3 tracking-widest shadow-xl">{isUp ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20}/>} Carregar Foto<input type="file" className="hidden" onChange={async e => await handleImgUpload(e.target.files[0], (url) => setEdit({ ...edit, [aba === 'banners' ? 'imageUrl' : 'img']: url }))} /></label>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase ml-5 tracking-widest">Nome / Identificação</label><input placeholder="Ex: Pizza Grande..." className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[30px] font-black outline-none focus:border-green-600 focus:bg-white transition-all text-gray-800 text-lg shadow-inner" value={edit.name || edit.nome || edit.title || ''} onChange={e => setEdit({ ...edit, name: e.target.value, nome: e.target.value, title: e.target.value })} required /></div>
              
              {aba === 'sabores' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-6 rounded-[35px] border shadow-inner">
                  <label className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-all"><input type="checkbox" className="w-6 h-6 accent-red-600" checked={edit.isPromo || false} onChange={e => setEdit({ ...edit, isPromo: e.target.checked })} /><span className="text-[9px] font-black uppercase text-gray-400">Promo?</span></label>
                  <label className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-all"><input type="checkbox" className="w-6 h-6 accent-pink-600" checked={edit.isDoce || false} onChange={e => setEdit({ ...edit, isDoce: e.target.checked })} /><span className="text-[9px] font-black uppercase text-gray-400">Doce?</span></label>
                  <label className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-all"><input type="checkbox" className="w-6 h-6 accent-purple-600" checked={edit.isCombo || false} onChange={e => setEdit({ ...edit, isCombo: e.target.checked })} /><span className="text-[9px] font-black uppercase text-gray-400">Combo?</span></label>
                  <label className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-all"><input type="checkbox" className="w-6 h-6 accent-green-600" checked={edit.isOferta || false} onChange={e => setEdit({ ...edit, isOferta: e.target.checked })} /><span className="text-[9px] font-black uppercase text-gray-400">Oferta?</span></label>
                </div>
              )}

              {['sabores', 'combos', 'ofertas'].includes(aba) && <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase ml-5 tracking-widest">Ingredientes / Descrição</label><textarea placeholder="Ex: Molho, mussarela, tomate, orégano..." className="w-full h-32 p-6 bg-gray-50 border border-gray-100 rounded-[35px] font-bold outline-none focus:border-green-600 focus:bg-white transition-all resize-none text-sm shadow-inner" value={edit.desc || edit.description || ''} onChange={e => setEdit({ ...edit, desc: e.target.value, description: e.target.value })} /></div>}
              
              {['sabores', 'bordas'].includes(aba) && (
                <div className="grid grid-cols-2 gap-4 bg-gray-100/50 p-8 rounded-[40px] border shadow-inner">
                  {tamanhos.map(t => (
                    <div key={t.id} className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-400 px-4 flex items-center gap-2">{t.icon} {t.name}</label>
                      <input type="number" step="0.01" placeholder="0.00" className="w-full p-5 bg-white border border-gray-200 rounded-3xl font-black outline-none focus:border-green-600 shadow-sm text-lg" value={edit.prices?.[t.id] || ''} onChange={e => setEdit({ ...edit, prices: { ...(edit.prices || {}), [t.id]: Number(e.target.value) } })}/>
                    </div>
                  ))}
                </div>
              )}
              
              {aba === 'equipe' && (
                <div className="space-y-6">
                  <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 ml-5 uppercase">E-mail Gmail Autorizado</label><input placeholder="atendente@gmail.com" type="email" className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[30px] font-bold outline-none shadow-inner focus:border-blue-500" value={edit.email || ''} onChange={e => setEdit({ ...edit, email: e.target.value })} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 ml-5 uppercase tracking-widest">Cargo e Acesso</label><select className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[30px] font-black outline-none appearance-none cursor-pointer shadow-inner focus:border-blue-500" value={edit.cargo || 'Atendente'} onChange={e => setEdit({...edit, cargo: e.target.value})}><option value="Atendente">👤 Atendente de Vendas</option><option value="Gerente">👨‍💼 Gerente de Turno</option><option value="Admin">🛡️ Administrador do Sistema</option></select></div>
                </div>
              )}

              {['bebidas', 'combos', 'ofertas'].includes(aba) && (
                <div className="space-y-6 bg-green-50/50 p-8 rounded-[45px] border border-green-100 shadow-inner">
                   <div className="space-y-1"><label className="text-[10px] font-black text-green-600 px-5 block uppercase tracking-widest">Preço Final (R$)</label><input type="number" step="0.01" placeholder="0.00" className="w-full bg-white p-6 rounded-[30px] border border-green-200 font-black text-3xl outline-none shadow-xl tracking-tighter" value={edit.price || 0} onChange={e => setEdit({ ...edit, price: parseFloat(e.target.value) })}/></div>
                   {aba !== 'bebidas' && (
                      <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 px-5 block uppercase tracking-widest">Pizza Inclusa (Tamanho)</label><select className="w-full p-5 bg-white border border-gray-200 rounded-[30px] font-black outline-none shadow-md" value={edit.tamanhoId || 'gigante'} onChange={e => setEdit({...edit, tamanhoId: e.target.value})}>{tamanhos.map(t=>(<option key={t.id} value={t.id}>{t.icon} {t.name}</option>))}</select></div>
                   )}
                   {aba === 'combos' && <div className="space-y-1"><label className="text-[10px] font-black text-purple-600 px-5 block uppercase tracking-widest">Qtd Bebidas Inclusas</label><input type="number" className="w-full p-5 bg-white border border-purple-100 rounded-[30px] font-black outline-none shadow-md" value={edit.qtdBebidas || 1} onChange={e => setEdit({ ...edit, qtdBebidas: parseInt(e.target.value) })}/></div>}
                </div>
              )}
            </div>
            <button type="submit" disabled={isUp} className="w-full bg-green-600 hover:bg-green-700 text-white py-7 rounded-[40px] font-black uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 text-xl tracking-tighter">
              {isUp ? <Loader2 className="animate-spin" size={28}/> : <Save size={28}/>} SALVAR DADOS AGORA
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// 7. EXPORT FINAL COM ERROR BOUNDARY
export default function App() { return ( <ErrorBoundary><MainApp /></ErrorBoundary> ); }

// HELPERS
function getDataLocalStr(ts) { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }