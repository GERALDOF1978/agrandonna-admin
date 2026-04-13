import React, { useState, useEffect, useMemo, useRef, Component } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { Pizza, CupSoda, Plus, Edit2, Trash2, X, ClipboardList, MapPin, Settings, User, ImageIcon, Power, Phone, Printer, MessageCircle, Send, Upload, BarChart3, Users, LogOut, Search, Loader2, Eye, EyeOff, Flame, History, Image as ImgIcon, Wand2, Save, CircleDashed, Package, Ticket, Calculator, Minus, AlertTriangle, CheckCircle2, Check, ArrowLeft, ShoppingBag } from 'lucide-react';

// ERROR BOUNDARY - EVITA PÂNICO NO SISTEMA
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
          <h1 className="text-3xl font-black mb-4 uppercase italic">Modo de Segurança</h1>
          <p className="mb-6 font-bold text-sm max-w-md">Ocorreu um erro ao processar os dados. Tire um print e envie ao suporte.</p>
          <div className="bg-black/40 p-4 rounded-xl mb-6 font-mono text-xs text-left max-w-xl w-full overflow-auto">{this.state.errorMsg}</div>
          <button onClick={() => window.location.reload()} className="bg-white text-red-600 px-8 py-4 rounded-full font-black uppercase shadow-lg">Reiniciar Painel</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

const getDataLocalStr = (timestamp) => {
  const d = timestamp ? new Date(timestamp) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const TAMANHOS_FIXOS = [
  { id: 'broto', name: 'Broto', description: '4 Pedaços', maxFlavors: 1, icon: '🍕', order: 1 },
  { id: 'grande', name: 'Grande', description: '8 Pedaços', maxFlavors: 2, icon: '🍕', order: 2 },
  { id: 'gigante', name: 'Gigante', description: '16 Pedaços', maxFlavors: 4, icon: '🤤', order: 3 },
  { id: 'meio_metro', name: '1/2 Metro', description: 'Até 3 Sabores', maxFlavors: 3, icon: '📏', order: 4 },
  { id: 'um_metro', name: '1 Metro', description: 'Até 3 Sabores', maxFlavors: 3, icon: '📏', order: 5 }
];

function MainApp() {
  const [user, setUser] = useState(null);
  const [atendente, setAtendente] = useState(null);
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
    aberto: true, msgFechado: 'Fechado!', zap: '19988723803', logo: 'https://i.ibb.co/WN4kL4xv/logo-pizza.jpg', topo: 'A GRANDONNA',
    splashAtivo: false, splashImg: '', promoBroto: true, precoPromoBroto: 34.00, promoGrande: true, precoPromoGrande: 47.90, promoGigante: true, precoPromoGigante: 72.99, promoMeioMetro: true, precoPromoMeioMetro: 52.90, promoUmMetro: true, precoPromoUmMetro: 79.90, promoDoce: true, precoPromoDoce: 53.00
  });

  const [chatAberto, setChatAberto] = useState(null);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [adminMsg, setAdminMsg] = useState('');
  const [alertasChat, setAlertasChat] = useState([]); 
  const scrollRef = useRef(null);
  const qtdPendentes = useRef(0);

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

  // Lógica de Preços Manual (Sem Adivinhação)
  const getPrecoSabor = (sabor, tId) => {
    if (!sabor || !tId) return 0;
    if (pdvConfig?.tipo === 'combo' || pdvConfig?.tipo === 'oferta') return 0;
    return Number(sabor.prices?.[tId] || 0);
  };
  const getPrecoBorda = (borda, tId) => {
    if (!borda || !tId || pdvConfig?.tipo === 'combo' || pdvConfig?.tipo === 'oferta') return 0;
    return Number(borda.prices?.[tId] || 0);
  };

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      if (u) {
        onSnapshot(collection(db, 'admin_users'), s => {
          const lista = s.docs.map(d => ({id: d.id, ...d.data()}));
          const userAutenticado = lista.find(x => x.email === u.email);
          if (u.email === OWNER_EMAIL || userAutenticado) {
            setUser(u); setHasPerm(true);
            setAtendente(userAutenticado || { nome: 'Administrador', cargo: 'Admin', img: u.photoURL });
          } else { signOut(auth); alert("Acesso Negado!"); }
        });
      } else { setHasPerm(false); setUser(null); setAtendente(null); }
    });
  }, []);

  useEffect(() => {
    if (!hasPerm) return;
    const unsubP = onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => {
      setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubS = onSnapshot(collection(db, 'menu_sabores'), s => setSabores(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBordas = onSnapshot(collection(db, 'menu_bordas'), s => setBordas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubB = onSnapshot(collection(db, 'menu_bebidas'), s => setBebidas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubC = onSnapshot(collection(db, 'menu_combos'), s => setCombos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubO = onSnapshot(collection(db, 'menu_ofertas'), s => setOfertas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubN = onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubE = onSnapshot(collection(db, 'admin_users'), s => setEquipe(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCfg = onSnapshot(doc(db, 'loja_config', 'geral'), s => { if(s.exists()) setCfg(s.data()); });
    return () => { unsubP(); unsubS(); unsubBordas(); unsubB(); unsubC(); unsubO(); unsubN(); unsubE(); unsubCfg(); };
  }, [hasPerm]);

  // PDV: ADICIONAR ITEM
  const totalPDV = useMemo(() => {
    const itens = (pdvCart || []).reduce((acc, curr) => acc + Number(curr.preco || 0), 0);
    const hasFree = (pdvCart || []).some(i => i.tipo === 'oferta');
    const taxa = (pdvEntrega === 'entrega' && !hasFree) ? Number(pdvTaxa || 0) : 0;
    return itens + taxa;
  }, [pdvCart, pdvEntrega, pdvTaxa]);

  const addPdvItem = () => {
    if(!pdvConfig) return;
    let pPizza = 0, pBorda = 0, pTotal = 0, nome = '';
    if (pdvConfig.tipo === 'pizza') {
      const precos = (pdvSelS || []).map(x => getPrecoSabor(x, pdvConfig.tamanho.id));
      pPizza = Math.max(...precos);
      pBorda = pdvSelBorda ? getPrecoBorda(pdvSelBorda, pdvConfig.tamanho.id) : 0;
      pTotal = pPizza + pBorda;
      nome = `Pizza ${pdvConfig.tamanho.name}`;
    } else {
      pTotal = Number(pdvConfig.item?.price || 0);
      nome = pdvConfig.item?.name || 'Item';
    }
    setPdvCart([...pdvCart, { id: Math.random().toString(36), tipo: pdvConfig.tipo, name: nome, tamanho: pdvConfig.tamanho, sabores: pdvSelS, borda: pdvSelBorda ? {...pdvSelBorda, precoVendido: pBorda} : null, bebidasCombo: pdvSelBebidas, preco: pTotal, qtd: 1 }]);
    setPdvConfig(null); setPdvSelS([]); setPdvSelBorda(null); setPdvSelBebidas([]); setPdvStep('cart');
  };

  const handlePdvDrinkQtd = (bebida, delta) => {
    const idx = pdvCart.findIndex(c => c.tipo === 'bebida' && c.itemId === bebida.id);
    if (idx >= 0) {
      const newCart = [...pdvCart];
      const newQtd = newCart[idx].qtd + delta;
      if (newQtd <= 0) newCart.splice(idx, 1);
      else { newCart[idx].qtd = newQtd; newCart[idx].preco = newQtd * (newCart[idx].precoBase || bebida.price); }
      setPdvCart(newCart);
    } else if (delta > 0) {
      setPdvCart([...pdvCart, { id: Math.random().toString(36), itemId: bebida.id, tipo: 'bebida', precoBase: Number(bebida.price || 0), preco: Number(bebida.price || 0), name: bebida.name, qtd: 1 }]);
    }
  };

  const lancarPedido = async () => {
    if(!pdvNome.trim()) return alert("Nome do cliente obrigatório.");
    const hasFree = pdvCart.some(i => i.tipo === 'oferta');
    const ped = { items: pdvCart, total: totalPDV, entrega: pdvEntrega, end: pdvEntrega === 'entrega' ? { rua: pdvEnd, taxaCobrada: hasFree ? 0 : Number(pdvTaxa || 0) } : {}, pag: pdvPag, troco: pdvTroco, obs: pdvObs, freteGratis: hasFree, timestamp: Date.now(), status: 'pendente', userId: 'balcao', clientName: pdvNome, clientPhone: pdvTel || 'Balcão', atendente: atendente?.nome || 'Admin' };
    await addDoc(collection(db, 'pedidos'), ped);
    alert("Lançado!"); setPdvCart([]); setPdvNome(''); setPdvTel(''); setPdvEnd(''); setPdvTaxa(''); setPdvObs(''); setPdvTroco(''); setPdvStep('cart');
  };

  const imprimir = (p) => {
    const win = window.open('', '', 'width=300,height=600');
    win.document.write(`<html><body style="font-family:monospace; font-size:12px;"><h2>${cfg.topo}</h2><p>PEDIDO #${p.id.slice(-4).toUpperCase()}</p><p>ATENDENTE: ${p.atendente || 'Admin'}</p><hr/><p>CLIENTE: ${p.clientName}</p><p>TOTAL: R$ ${p.total.toFixed(2)}</p></body></html>`);
    win.print(); win.close();
  };

  if (!hasPerm) return <div className="min-h-screen bg-black flex items-center justify-center p-8"><button onClick={() => signInWithPopup(auth, provider)} className="bg-white p-4 rounded-xl font-bold">Entrar no Sistema Grandonna</button></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* BARRA LATERAL */}
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col shadow-2xl z-40">
        <img src={cfg.logo} className="w-20 h-20 rounded-full mx-auto border-2 border-yellow-500 mb-6 object-cover"/>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {['pdv', 'pedidos', 'historico', 'sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'banners', 'caixa', 'equipe', 'sistema'].map(m => (
            <button key={m} onClick={() => { setAba(m); setEdit(null); }} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 transition-all ${aba === m ? 'bg-red-600' : 'text-gray-500 hover:text-white'}`}>
              {m === 'pdv' ? <Calculator size={16}/> : m === 'pedidos' ? <ClipboardList size={16}/> : <Settings size={16}/>}
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

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-50">
        
        {aba === 'pdv' && (
          <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-100px)]">
            
            {/* CARDÁPIO DINÂMICO */}
            <div className="flex-1 bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
               <h2 className="text-2xl font-black italic uppercase mb-4 text-gray-800">Cardápio Rápido</h2>
               
               <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 mb-4">
                 {(() => {
                    const btns = [];
                    if(sabores.some(s => s.isPromo)) btns.push('promo');
                    btns.push('tradicionais', 'doces');
                    if(combos.length > 0) btns.push('combos');
                    if(ofertas.length > 0) btns.push('ofertas');
                    if(bebidas.length > 0) btns.push('bebidas');
                    return btns.map(t => (
                      <button key={t} onClick={()=>{setPdvAba(t); setPdvStep('cart');}} className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase transition-all ${pdvAba === t ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {t === 'promo' ? '🔥 Promo' : t}
                      </button>
                    ));
                 })()}
               </div>

               <div className="flex-1 overflow-y-auto pr-2 grid gap-3 align-top content-start">
                  {['tradicionais', 'doces', 'promo'].includes(pdvAba) && (tamanhos || []).map((t, idx) => {
                     const temValido = sabores.some(s => {
                        if(pdvAba === 'doces' && !isPizzaDoce(s)) return false;
                        if(pdvAba === 'tradicionais' && isPizzaDoce(s)) return false;
                        if(pdvAba === 'promo' && !s.isPromo) return false;
                        return Number(s.prices?.[t.id] || 0) > 0;
                     });
                     if(!temValido) return null;
                     return (
                       <div key={idx} onClick={() => setPdvConfig({ tipo: 'pizza', isDoce: pdvAba==='doces', isPromoOnly: pdvAba==='promo', tamanho: t, maxFlavors: t.maxFlavors })} className="bg-gray-50 p-4 rounded-3xl border border-gray-200 hover:border-red-500 cursor-pointer transition-all flex justify-between items-center group">
                          <div className="flex items-center gap-4"><span className="text-3xl">{t.icon}</span><div><h4 className="font-black text-lg text-gray-800">{t.name}</h4><p className="text-[10px] text-gray-400 font-bold">{t.description}</p></div></div>
                          <Plus size={24} className="text-gray-300 group-hover:text-red-500"/>
                       </div>
                     )
                  })}
                  {pdvAba === 'combos' && combos.map((c, idx) => (
                    <div key={idx} onClick={() => setPdvConfig({ tipo: 'combo', item: c, tamanho: tamanhos.find(t=>t.id===c.tamanhoId), maxFlavors: tamanhos.find(t=>t.id===c.tamanhoId)?.maxFlavors || 1, maxBebidas: c.qtdBebidas })} className="bg-purple-50 p-5 rounded-3xl border border-purple-100 cursor-pointer flex justify-between items-center">
                       <div><span className="text-[8px] bg-purple-200 text-purple-600 px-2 py-1 rounded font-black uppercase mb-1 inline-block">Combo</span><h4 className="font-black text-lg text-gray-800">{c.name}</h4></div><Plus size={24} className="text-purple-300"/>
                    </div>
                  ))}
                  {pdvAba === 'ofertas' && ofertas.map((o, idx) => (
                    <div key={idx} onClick={() => setPdvConfig({ tipo: 'oferta', item: o, tamanho: tamanhos.find(t=>t.id===o.tamanhoId), maxFlavors: tamanhos.find(t=>t.id===o.tamanhoId)?.maxFlavors || 1 })} className="bg-green-50 p-5 rounded-3xl border border-green-100 cursor-pointer flex justify-between items-center">
                       <div><span className="text-[8px] bg-green-200 text-green-600 px-2 py-1 rounded font-black uppercase mb-1 inline-block">Frete Grátis</span><h4 className="font-black text-lg text-gray-800">{o.name}</h4></div><Plus size={24} className="text-green-300"/>
                    </div>
                  ))}
                  {pdvAba === 'bebidas' && bebidas.map((b, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-3xl border border-gray-200 flex justify-between items-center">
                      <h4 className="font-black text-gray-800 uppercase">{b.name}</h4>
                      <div className="flex items-center gap-2"><button onClick={()=>handlePdvDrinkQtd(b, -1)} className="w-8 h-8 bg-gray-200 rounded-lg"><Minus size={14}/></button><button onClick={()=>handlePdvDrinkQtd(b, 1)} className="w-8 h-8 bg-blue-600 text-white rounded-lg"><Plus size={14}/></button></div>
                    </div>
                  ))}
               </div>
            </div>

            {/* CARRINHO E RESUMO LADO DIREITO */}
            <div className="w-full xl:w-[450px] bg-gray-900 p-6 rounded-[40px] shadow-2xl border border-gray-800 flex flex-col h-full overflow-hidden">
               {pdvStep === 'cart' ? (
                 <div className="flex flex-col h-full animate-in fade-in">
                    <h2 className="text-xl font-black italic uppercase mb-4 text-white border-b border-gray-800 pb-4 flex items-center gap-2"><ShoppingBag className="text-yellow-500"/> Resumo do Pedido</h2>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                       {pdvCart.map((i, idx) => (
                         <div key={idx} className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                           <div className="flex justify-between items-start">
                             <div><p className="font-bold text-white text-sm">{(i.qtd>1)?`${i.qtd}x `:''}{i.name}</p>
                             {i.sabores && <p className="text-[10px] text-gray-400 mt-1">{i.sabores.map(s=>s.name).join(' + ')}</p>}</div>
                             <div className="text-right text-yellow-500 font-black text-xs">R$ {i.preco.toFixed(2)}<button onClick={()=>setPdvCart(pdvCart.filter(x=>x.id!==i.id))} className="block text-red-500 mt-2"><Trash2 size={14}/></button></div>
                           </div>
                         </div>
                       ))}
                       {pdvCart.length === 0 && <p className="text-center text-gray-700 font-bold uppercase mt-20">Carrinho Vazio</p>}
                    </div>
                    <div className="pt-4 border-t border-gray-800 mt-4 space-y-4">
                       <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl"><span className="text-gray-400 font-black uppercase text-[10px]">Subtotal:</span><span className="text-2xl font-black text-green-500">R$ {totalPDV.toFixed(2)}</span></div>
                       <div className="flex gap-2">
                          <button onClick={()=>{if(pdvCart.length>0){setPdvEntrega('entrega'); setPdvStep('checkout');}}} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-xs flex flex-col items-center gap-1 shadow-lg active:scale-95"><MapPin size={18}/> DELIVERY</button>
                          <button onClick={()=>{if(pdvCart.length>0){setPdvEntrega('retirada'); setPdvStep('checkout');}}} className="flex-1 bg-yellow-500 text-black py-4 rounded-2xl font-black text-xs flex flex-col items-center gap-1 shadow-lg active:scale-95"><Store size={18}/> BALCÃO</button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                    <button onClick={()=>setPdvStep('cart')} className="text-gray-500 hover:text-white flex items-center gap-2 mb-4 text-[10px] font-black uppercase"><ArrowLeft size={14}/> Voltar ao Carrinho</button>
                    <h2 className="text-xl font-black uppercase text-white mb-6">Finalizar {pdvEntrega==='entrega'?'Delivery':'Balcão'}</h2>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-6">
                       <div className="space-y-3"><input placeholder="Nome do Cliente" value={pdvNome} onChange={e=>setPdvNome(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold outline-none"/><input placeholder="WhatsApp" value={pdvTel} onChange={e=>setPdvTel(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold outline-none"/></div>
                       {pdvEntrega==='entrega' && <div className="space-y-3"><textarea placeholder="Endereço Completo" value={pdvEnd} onChange={e=>setPdvEnd(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold outline-none h-24 resize-none"/><input placeholder="Taxa Entrega R$" type="number" value={pdvTaxa} onChange={e=>setPdvTaxa(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-black outline-none" disabled={pdvCart.some(i=>i.tipo==='oferta')}/></div>}
                       <div className="space-y-3"><select value={pdvPag} onChange={e=>setPdvPag(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold"><option value="dinheiro">Dinheiro</option><option value="maquininha">Maquininha</option><option value="pix_app">PIX</option></select>{pdvPag==='dinheiro' && <input placeholder="Troco para R$" value={pdvTroco} onChange={e=>setPdvTroco(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold"/>}</div>
                       <input placeholder="Observação do Pedido" value={pdvObs} onChange={e=>setPdvObs(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-yellow-500 font-bold outline-none"/>
                    </div>
                    <div className="pt-4 border-t border-gray-800 mt-auto"><div className="flex justify-between items-center mb-4 bg-black/40 p-4 rounded-2xl"><span className="text-gray-400 font-black uppercase text-[10px]">Total Final:</span><span className="text-3xl font-black text-green-500">R$ {totalPDV.toFixed(2)}</span></div><button onClick={lancarPedido} className="w-full bg-green-600 text-white py-5 rounded-[24px] font-black text-lg shadow-lg active:scale-95 transition-all">LançAR PEDIDO</button></div>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* MODAL CONFIGURAÇÃO PIZZA PDV */}
        {pdvConfig && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center p-4 z-[200]">
            <div className="bg-white rounded-[40px] w-full max-w-lg p-8 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center border-b pb-4 mb-4"><h2 className="text-xl font-black uppercase italic text-gray-800">{pdvConfig.tipo==='pizza' ? `Montar Pizza ${pdvConfig.tamanho?.name}` : pdvConfig.item?.name}</h2><button onClick={()=>setPdvConfig(null)} className="p-2 bg-gray-100 rounded-full"><X/></button></div>
              <div className="flex-1 overflow-y-auto space-y-6">
                 <div><h3 className="font-black text-xs text-gray-500 uppercase mb-3 flex justify-between"><span>Escolha os Sabores ({(pdvSelS || []).length} / {pdvConfig.maxFlavors})</span>{(pdvSelS || []).length === pdvConfig.maxFlavors && <CheckCircle2 size={16} className="text-green-500"/>}</h3>
                    <div className="grid grid-cols-2 gap-2">{(() => {
                        let list = (sabores || []);
                        if(pdvConfig.tipo === 'combo') list = list.filter(s => s.isCombo);
                        else if(pdvConfig.tipo === 'oferta') list = list.filter(s => s.isOferta);
                        else if(pdvConfig.isPromoOnly) list = list.filter(s => s.isPromo);
                        else list = list.filter(s => pdvConfig.isDoce ? isPizzaDoce(s) : !isPizzaDoce(s));
                        const validos = list.filter(s => pdvConfig.tipo !== 'pizza' || Number(s.prices?.[pdvConfig.tamanho?.id] || 0) > 0);
                        return validos.map(s => {
                          const isSel = pdvSelS.some(x => x.id === s.id);
                          const isFull = !isSel && pdvSelS.length >= pdvConfig.maxFlavors;
                          return (
                            <div key={s.id} onClick={() => { if(isSel){ setPdvSelS(pdvSelS.filter(x=>x.id!==s.id)); } else if(!isFull){ setPdvSelS([...pdvSelS, s]); } }} className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${isSel ? 'border-red-600 bg-red-50' : isFull ? 'opacity-40 border-gray-100' : 'border-gray-200 hover:border-gray-300'}`}>
                               <p className="text-[10px] font-black uppercase leading-tight">{s.name}</p>
                               <p className="text-[8px] text-gray-400 mt-1 line-clamp-2 leading-tight">{s.desc || s.description}</p>
                            </div>
                          )
                        });
                    })()}</div>
                 </div>
                 {pdvConfig.tipo === 'pizza' && (
                    <div><h3 className="font-black text-xs text-gray-500 uppercase mb-3">Borda Recheada</h3>
                      <div className="grid grid-cols-2 gap-2"><div onClick={()=>setPdvSelBorda(null)} className={`p-3 rounded-2xl border-2 ${!pdvSelBorda ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>Sem Borda</div>{bordas.filter(b=>getPrecoBorda(b, pdvConfig.tamanho.id)>0).map(b => (
                        <div key={b.id} onClick={()=>setPdvSelBorda(b)} className={`p-3 rounded-2xl border-2 ${pdvSelBorda?.id === b.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>{b.name}</div>
                      ))}</div>
                    </div>
                 )}
                 {pdvConfig.tipo === 'combo' && pdvConfig.maxBebidas > 0 && (
                   <div><h3 className="font-black text-xs text-gray-500 uppercase mb-3">Bebidas do Combo ({pdvSelBebidas.length} / {pdvConfig.maxBebidas})</h3>
                      <div className="grid grid-cols-2 gap-2">{bebidas.filter(b=>b.isCombo).map(b => {
                        const q = pdvSelBebidas.filter(x=>x.id===b.id).length;
                        return (
                          <div key={b.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex justify-between items-center"><p className="text-[10px] font-black">{b.name}</p><button onClick={()=>{if(pdvSelBebidas.length < pdvConfig.maxBebidas) setPdvSelBebidas([...pdvSelBebidas, b])}} className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center"><Plus size={14}/></button></div>
                        )
                      })}</div>
                   </div>
                 )}
              </div>
              <button onClick={addPdvItem} disabled={pdvSelS.length === 0} className="mt-6 w-full bg-red-600 text-white p-5 rounded-2xl font-black uppercase shadow-xl active:scale-95 disabled:opacity-50 transition-all">Adicionar ao Pedido</button>
            </div>
          </div>
        )}

        {/* OUTRAS ABAS (SABORES, EQUIPE, ETC) */}
        {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'banners', 'equipe'].includes(aba) && (
          <div>
            <header className="flex justify-between items-center mb-8 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/50 shadow-sm">
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900">{aba}</h1>
              <button onClick={() => setEdit(aba==='equipe'?{nome:'', email:'', cargo:'Atendente'}:aba==='sabores'?{name:'', desc:'', prices:{broto:0,grande:0,gigante:0,meio_metro:0,um_metro:0}, isActive:true}:aba==='combos'?{name:'', price:0, tamanhoId:'gigante', qtdBebidas:1}:{name:'', price:0})} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Novo {aba}</button>
            </header>
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase"><tr><th className="p-6">Item</th><th className="p-6">Info</th><th className="p-6 text-right">Ações</th></tr></thead>
                  <tbody>{getTabelaAtual().map((it, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-all group">
                       <td className="p-6 flex items-center gap-4"><div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden">{(it.img || it.imageUrl) ? <img src={it.img || it.imageUrl} className="w-full h-full object-cover"/> : <ImgIcon size={20}/>}</div><div><p className="font-black uppercase text-xs text-gray-900">{it.name || it.nome || it.title}</p>{it.cargo && <p className="text-[8px] font-bold text-red-500 uppercase">{it.cargo}</p>}</div></td>
                       <td className="p-6 font-black text-[10px] text-gray-500 uppercase">{it.price ? `R$ ${it.price.toFixed(2)}` : it.email || (it.prices ? 'Tamanhos OK' : '--')}</td>
                       <td className="p-6 text-right"><button onClick={()=>setEdit(it)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl mr-2"><Edit2 size={16}/></button><button onClick={async()=> {if(window.confirm('Excluir?')) await deleteDoc(doc(db, getCollectionName(aba), it.id))}} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}</tbody>
               </table>
            </div>
          </div>
        )}

        {/* LISTA DE PEDIDOS PRINCIPAL */}
        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pedidos.filter(p => p && (p.status !== 'entregue' || getDataLocalStr(p.timestamp) === getDataLocalStr())).map((p, idx) => renderPedidoCard(p, idx))}
          </div>
        )}

        {/* HISTÓRICO */}
        {aba === 'historico' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex items-center gap-4 w-full md:w-1/3"><Search className="text-gray-400" size={20}/><input type="date" className="bg-transparent font-black outline-none w-full text-gray-900" value={filtroHist} onChange={e => setFiltroHist(e.target.value)} /></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">{pedidos.filter(p => p && getDataLocalStr(p.timestamp) === filtroHist).map((p, idx) => renderPedidoCard(p, idx))}</div>
          </div>
        )}

        {/* CAIXA / ESTATISTICAS */}
        {aba === 'caixa' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex items-center gap-4 w-1/3"><input type="date" className="bg-transparent font-black outline-none w-full" value={filtroCaixa} onChange={e => setFiltroCaixa(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-green-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Faturamento</p><p className="text-3xl font-black text-green-600">R$ {stats.total.toFixed(2)}</p></div>
              <div className="bg-white p-8 rounded-[40px] shadow-sm border"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Pedidos OK</p><p className="text-4xl font-black text-blue-600">{stats.qtd}</p></div>
              <div className="bg-white p-8 rounded-[40px] shadow-sm border"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Ticket Médio</p><p className="text-3xl font-black text-gray-800">R$ {(stats.total/(stats.qtd||1)).toFixed(2)}</p></div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-black uppercase text-xs text-gray-400 border-b pb-4">Ranking de Vendas</h3>
              {stats.itens.map(([n, q], idx) => (<div key={idx} className="flex justify-between font-bold text-sm border-b border-gray-50 pb-2"><span className="text-gray-800 uppercase text-xs">{n}</span><span className="bg-red-50 text-red-600 px-4 py-1 rounded-full text-xs font-black">{q}x</span></div>))}
            </div>
          </div>
        )}

        {/* CONFIGURAÇÕES GERAIS */}
        {aba === 'sistema' && (
          <div className="max-w-2xl bg-white p-10 rounded-[50px] shadow-2xl border border-gray-100 space-y-6 mx-auto">
             <button onClick={() => setCfg({ ...cfg, aberto: !cfg.aberto })} className={`w-full p-6 rounded-3xl font-black uppercase shadow-lg transition-all ${cfg.aberto ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{cfg.aberto ? 'LOJA ABERTA' : 'LOJA FECHADA'}</button>
             <div className="space-y-4 pt-4 border-t"><h3 className="font-black text-xs text-blue-500 uppercase text-center flex justify-center items-center gap-1">Configurações de Frete</h3><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black text-gray-400 px-4 block">CEP DA LOJA</label><input className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={cfg.cepLoja} onChange={e => setCfg({...cfg, cepLoja: e.target.value})}/></div><div><label className="text-[10px] font-black text-gray-400 px-4 block">Nº DA LOJA</label><input className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={cfg.numLoja} onChange={e => setCfg({...cfg, numLoja: e.target.value})}/></div></div></div>
             <button onClick={arrumarBancoDeDados} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase shadow-lg">Ajustar Sabores Doces Automático</button>
             <button onClick={async () => { await setDoc(doc(db, 'loja_config', 'geral'), cfg); alert('Salvo!'); }} className="w-full bg-black text-white py-6 rounded-[30px] font-black uppercase shadow-xl flex justify-center items-center gap-2"><Save size={20}/> Guardar Tudo</button>
          </div>
        )}
      </main>

      {/* MODAL DE EDIÇÃO ABAS COMUNS */}
      {edit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 z-[100]">
          <form onSubmit={salvar} className="bg-white rounded-[50px] w-full max-w-lg p-10 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black uppercase italic border-b pb-4 flex justify-between items-center text-gray-800">Configurar {aba} <button type="button" onClick={() => setEdit(null)}><X size={30} className="text-gray-300 hover:text-black"/></button></h2>
            
            {['sabores', 'bebidas', 'combos', 'ofertas', 'banners', 'equipe'].includes(aba) && (
              <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                 {aba !== 'bordas' && (
                    (edit.img || edit.imageUrl) ? <img src={edit.img || edit.imageUrl} className="w-28 h-28 rounded-3xl object-cover shadow-xl"/> : <div className="w-28 h-28 bg-gray-200 rounded-3xl flex items-center justify-center text-gray-400"><User size={40}/></div>
                 )}
                 <label className="bg-black text-white px-6 py-2 rounded-2xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all uppercase flex items-center gap-2">
                   {isUp ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Subir Foto
                   <input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setEdit({ ...edit, [aba === 'banners' ? 'imageUrl' : 'img']: url }))} />
                 </label>
              </div>
            )}
            
            <div className="space-y-4">
              <input placeholder="Nome / Título" className="w-full p-5 bg-gray-50 border rounded-3xl font-bold outline-none" value={edit.name || edit.title || edit.nome || ''} onChange={e => setEdit({ ...edit, [aba === 'banners' ? 'title' : aba === 'equipe' ? 'nome' : 'name']: e.target.value })} required />
              
              {aba === 'sabores' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <label className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-xl text-center"><input type="checkbox" className="w-4 h-4 accent-red-600" checked={edit.isPromo || false} onChange={e => setEdit({ ...edit, isPromo: e.target.checked })} /><span className="text-[9px] font-black uppercase">Promo?</span></label>
                  <label className="flex flex-col items-center gap-1 p-2 bg-pink-50 rounded-xl text-center"><input type="checkbox" className="w-4 h-4 accent-pink-600" checked={edit.isDoce || false} onChange={e => setEdit({ ...edit, isDoce: e.target.checked })} /><span className="text-[9px] font-black uppercase">Doce?</span></label>
                  <label className="flex flex-col items-center gap-1 p-2 bg-purple-50 rounded-xl text-center"><input type="checkbox" className="w-4 h-4 accent-purple-600" checked={edit.isCombo || false} onChange={e => setEdit({ ...edit, isCombo: e.target.checked })} /><span className="text-[9px] font-black uppercase">Combo?</span></label>
                  <label className="flex flex-col items-center gap-1 p-2 bg-green-50 rounded-xl text-center"><input type="checkbox" className="w-4 h-4 accent-green-600" checked={edit.isOferta || false} onChange={e => setEdit({ ...edit, isOferta: e.target.checked })} /><span className="text-[9px] font-black uppercase">Oferta?</span></label>
                </div>
              )}

              {['sabores', 'combos', 'ofertas'].includes(aba) && <textarea placeholder="Descrição / Ingredientes..." className="w-full h-24 p-5 bg-gray-50 border rounded-3xl font-bold outline-none resize-none" value={edit.desc || edit.description || ''} onChange={e => setEdit({ ...edit, desc: e.target.value, description: e.target.value })} />}
              
              {['sabores', 'bordas'].includes(aba) && (
                <div className="grid grid-cols-2 gap-4">
                  {['broto', 'grande', 'gigante', 'meio_metro', 'um_metro'].map(t => (
                    <div key={t}><label className="text-[10px] uppercase font-black text-gray-400 px-3">{t.replace('_',' ')}</label><input type="number" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" value={edit.prices?.[t] || ''} onChange={e => setEdit({ ...edit, prices: { ...(edit.prices || {}), [t]: parseFloat(e.target.value) } })}/></div>
                  ))}
                </div>
              )}
              
              {aba === 'equipe' && (
                <>
                  <input placeholder="E-mail GMAIL Autorizado" type="email" className="w-full p-5 bg-gray-50 border rounded-3xl font-bold outline-none" value={edit.email || ''} onChange={e => setEdit({ ...edit, email: e.target.value })} />
                  <select className="w-full p-5 bg-gray-50 border rounded-3xl font-bold outline-none" value={edit.cargo || 'Atendente'} onChange={e => setEdit({...edit, cargo: e.target.value})}>
                      <option value="Atendente">Atendente</option>
                      <option value="Gerente">Gerente</option>
                      <option value="Admin">Administrador</option>
                  </select>
                </>
              )}

              {['bebidas', 'combos', 'ofertas'].includes(aba) && (
                <div className="space-y-4">
                   <input type="number" placeholder="Preço R$" className="w-full p-5 bg-gray-50 border rounded-3xl font-bold" value={edit.price || 0} onChange={e => setEdit({ ...edit, price: parseFloat(e.target.value) })}/>
                   {aba !== 'bebidas' && <select className="w-full p-5 bg-gray-50 border rounded-3xl font-bold" value={edit.tamanhoId || 'gigante'} onChange={e => setEdit({...edit, tamanhoId: e.target.value})}>{tamanhos.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}</select>}
                </div>
              )}
            </div>
            <button type="submit" disabled={isUp} className="w-full bg-green-600 text-white p-6 rounded-[30px] font-black uppercase shadow-xl hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all">Confirmar Alterações</button>
          </form>
        </div>
      )}

      {/* CHAT ABERTO */}
      {chatAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-[200] animate-in fade-in">
          <div className="w-full md:w-96 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 bg-black text-white flex justify-between items-center"><div><h3 className="font-black italic uppercase text-lg leading-tight">{chatAberto.clientName || 'Cliente'}</h3><p className="text-[10px] text-green-500 uppercase tracking-widest flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Online</p></div><button onClick={() => setChatAberto(null)} className="p-2 bg-gray-900 rounded-full hover:bg-red-600 transition-colors"><X size={20}/></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">{chatMsgs.map((m, idx) => (<div key={idx} className={`flex ${m?.sender === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`p-4 rounded-[24px] max-w-[85%] text-sm font-medium shadow-sm ${m?.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>{m?.text || ''}</div></div>))}<div ref={scrollRef}/></div>
            <form onSubmit={enviarMsgAdmin} className="p-4 bg-white border-t border-gray-100 flex gap-2"><input value={adminMsg} onChange={e=>setAdminMsg(e.target.value)} placeholder="Responder cliente..." className="flex-1 bg-gray-100 p-4 rounded-2xl outline-none border text-sm" /><button type="submit" disabled={!adminMsg.trim()} className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90"><Send size={20}/></button></form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}