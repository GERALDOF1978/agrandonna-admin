import React, { useState, useEffect, useMemo, useRef, Component } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { Pizza, CupSoda, Plus, Edit2, Trash2, X, ClipboardList, MapPin, Settings, User, ImageIcon, Power, Phone, Printer, MessageCircle, Send, Upload, BarChart3, Users, LogOut, Search, Loader2, Eye, EyeOff, Flame, History, Image as ImgIcon, Wand2, Save, CircleDashed, Package, Ticket, Calculator, Minus, AlertTriangle, CheckCircle2, ArrowLeft, ShoppingBag, Store } from 'lucide-react';

// SISTEMA ANTI-TELA BRANCA REAL
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
          <h1 className="text-3xl font-black mb-4 uppercase italic tracking-wider">Modo de Segurança Ativado</h1>
          <p className="mb-6 font-bold text-sm max-w-md">Ocorreu um erro interno. A tela branca foi evitada para não travar o sistema.</p>
          <div className="bg-black/40 p-4 rounded-xl mb-6 font-mono text-xs text-left max-w-xl w-full overflow-auto">
            {this.state.errorMsg}
          </div>
          <button onClick={() => window.location.reload()} className="bg-white text-red-600 px-8 py-4 rounded-full font-black uppercase shadow-lg active:scale-95 transition-all">Tentar Recarregar</button>
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

const getCollectionName = (tab) => {
  switch(tab) {
    case 'sabores': return 'menu_sabores';
    case 'bordas': return 'menu_bordas';
    case 'bebidas': return 'menu_bebidas';
    case 'combos': return 'menu_combos';
    case 'ofertas': return 'menu_ofertas';
    case 'banners': return 'menu_banners';
    case 'equipe': return 'admin_users';
    default: return '';
  }
};

const TAMANHOS_FIXOS = [
  { id: 'broto', name: 'Broto', description: '4 Pedaços', maxFlavors: 1, icon: '🍕', order: 1 },
  { id: 'grande', name: 'Grande', description: '8 Pedaços', maxFlavors: 2, icon: '🍕', order: 2 },
  { id: 'gigante', name: 'Gigante', description: '16 Pedaços', maxFlavors: 4, icon: '🤤', order: 3 },
  { id: 'meio_metro', name: '1/2 Metro', description: 'Até 3 Sabores', maxFlavors: 3, icon: '📏', order: 4 },
  { id: 'um_metro', name: '1 Metro', description: 'Até 3 Sabores', maxFlavors: 3, icon: '📏', order: 5 }
];

const isPizzaDoce = (sabor) => {
  if (!sabor) return false;
  if (sabor.isDoce === true) return true;
  if (sabor.isDoce === false) return false;
  const docesNomes = ['chocolate', 'morango', 'nutella', 'prestígio', 'prestigio', 'banana', 'confete', 'sorvete', 'doce', 'romeu', 'julieta', 'brigadeiro', 'ouro branco', 'kit kat'];
  const nomeSabor = sabor.name ? String(sabor.name).toLowerCase() : '';
  return docesNomes.some(p => nomeSabor.includes(p));
};

function MainApp() {
  const [user, setUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null); // <-- NOVO: DADOS DO ATENDENTE LOGADO
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
    aberto: true, msgFechado: 'Nossa loja está fechada no momento. Retornaremos em breve!', zap: '19988723803', logo: 'https://i.ibb.co/WN4kL4xv/logo-pizza.jpg', topo: 'A GRANDONNA',
    splashAtivo: false, splashImg: '', 
    promoBroto: true, precoPromoBroto: 34.00,
    promoGrande: true, precoPromoGrande: 47.90, 
    promoGigante: true, precoPromoGigante: 72.99, 
    promoMeioMetro: true, precoPromoMeioMetro: 52.90, 
    promoUmMetro: true, precoPromoUmMetro: 79.90,
    promoDoce: true, precoPromoDoce: 53.00
  });

  const [chatAberto, setChatAberto] = useState(null);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [adminMsg, setAdminMsg] = useState('');
  const [alertasChat, setAlertasChat] = useState([]); 
  const scrollRef = useRef(null);
  const qtdPendentes = useRef(0);

  // PDV ESTADOS ATUALIZADOS
  const [pdvAba, setPdvAba] = useState('tradicionais');
  const [pdvStep, setPdvStep] = useState('cart'); // <-- NOVO: Controla se mostra o Carrinho ou o Formulário de Pagamento
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
    if (!sabor || !tId) return 0;
    if (pdvConfig?.tipo === 'combo' || pdvConfig?.tipo === 'oferta') return 0; 
    return Number(sabor.prices?.[tId] || 0); 
  };

  const getPrecoBorda = (borda, tId) => {
    if (!borda || !tId) return 0;
    if (pdvConfig?.tipo === 'combo' || pdvConfig?.tipo === 'oferta') return 0; 
    return Number(borda.prices?.[tId] || 0);
  };

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      if (u) {
        onSnapshot(collection(db, 'admin_users'), s => {
          const lista = s.docs.map(d => d.data());
          const emailsPermitidos = lista.map(x => x.email);
          const userData = lista.find(x => x.email === u.email);

          if (u.email === OWNER_EMAIL) { 
            setUser(u); setHasPerm(true); 
            setCurrentUserData({ nome: 'Dono / Admin', cargo: 'Admin', email: u.email, img: u.photoURL });
          } else if (emailsPermitidos.includes(u.email)) { 
            setUser(u); setHasPerm(true); 
            setCurrentUserData(userData || { nome: 'Atendente', cargo: 'Atendente', email: u.email, img: u.photoURL });
          } else { 
            signOut(auth); alert("Acesso Negado!"); 
          }
        });
      } else {
        setHasPerm(false); setUser(null); setCurrentUserData(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!hasPerm) return;

    const unsubP = onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      const novosPendentes = data.filter(p => p?.status === 'pendente').length;
      if (novosPendentes > qtdPendentes.current) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Áudio silenciado pelo navegador."));
      }
      qtdPendentes.current = novosPendentes;
      setPedidos(data || []);
    });

    const unsubS = onSnapshot(collection(db, 'menu_sabores'), s => setSabores(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBordas = onSnapshot(collection(db, 'menu_bordas'), s => setBordas(s.docs.map(d => ({ id: d.id, ...d.data() })))); 
    const unsubB = onSnapshot(collection(db, 'menu_bebidas'), s => setBebidas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCombos = onSnapshot(collection(db, 'menu_combos'), s => setCombos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubOfertas = onSnapshot(collection(db, 'menu_ofertas'), s => setOfertas(s.docs.map(d => ({ id: d.id, ...d.data() })))); 
    const unsubN = onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubE = onSnapshot(collection(db, 'admin_users'), s => setEquipe(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const unsubC = onSnapshot(doc(db, 'loja_config', 'geral'), s => {
      if(s.exists()){
        const data = s.data() || {};
        setCfg(prev => ({
          ...prev,
          ...data,
          taxaMinima: data.taxaMinima ?? data.taxa ?? 6,
          kmIncluso: data.kmIncluso ?? 3,
          valorKm: data.valorKm ?? 1,
          cepLoja: data.cepLoja ?? '13500000',
          numLoja: data.numLoja ?? '',
          horaAbre: data.horaAbre ?? '18:00',
          msgFechado: data.msgFechado ?? 'Nossa loja está fechada no momento. Retornaremos em breve.', 
          promoBroto: data.promoBroto ?? true, precoPromoBroto: data.precoPromoBroto ?? 34.00,
          promoGrande: data.promoGrande ?? true, precoPromoGrande: data.precoPromoGrande ?? 47.90,
          promoGigante: data.promoGigante ?? true, precoPromoGigante: data.precoPromoGigante ?? 72.99,
          promoMeioMetro: data.promoMeioMetro ?? true, precoPromoMeioMetro: data.precoPromoMeioMetro ?? 52.90,
          promoUmMetro: data.promoUmMetro ?? true, precoPromoUmMetro: data.precoPromoUmMetro ?? 79.90,
          promoDoce: data.promoDoce ?? true, precoPromoDoce: data.precoPromoDoce ?? 53.00
        }));
      }
    });

    return () => { unsubP(); unsubS(); unsubBordas(); unsubB(); unsubCombos(); unsubOfertas(); unsubN(); unsubE(); unsubC(); };
  }, [hasPerm]);

  useEffect(() => {
    if (!hasPerm || !pedidos || pedidos.length === 0) return;
    const ativos = [...new Set((pedidos || []).filter(p => p && p.userId && ['pendente', 'preparando', 'saiu_entrega'].includes(p.status)).map(p => p.userId))];
    
    const unsubs = ativos.map(uid => {
      if (!uid) return () => {};
      return onSnapshot(query(collection(db, 'artifacts', 'grandonna-oficial', 'users', String(uid), 'chat'), orderBy('timestamp', 'desc')), s => {
        if (!s.empty) {
          const lastMsg = s.docs[0].data();
          if (lastMsg?.sender === 'user') setAlertasChat(prev => [...new Set([...prev, uid])]);
          else setAlertasChat(prev => prev.filter(id => id !== uid));
        }
      });
    });

    return () => unsubs.forEach(u => u && u());
  }, [pedidos, hasPerm]);

  useEffect(() => {
    if (!chatAberto || !chatAberto.userId) return;
    const unsub = onSnapshot(collection(db, 'artifacts', 'grandonna-oficial', 'users', String(chatAberto.userId), 'chat'), s => {
      setChatMsgs(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>(a?.timestamp||0)-(b?.timestamp||0)));
      setTimeout(() => scrollRef.current?.scrollIntoView({behavior:'smooth'}), 100);
    });
    return () => unsub();
  }, [chatAberto]);

  const enviarMsgAdmin = async (e) => {
    e.preventDefault(); if (!adminMsg.trim() || !chatAberto?.userId) return;
    await addDoc(collection(db, 'artifacts', 'grandonna-oficial', 'users', String(chatAberto.userId), 'chat'), { 
      text: adminMsg, sender: 'admin', timestamp: Date.now() 
    });
    setAdminMsg('');
  };

  const arrumarBancoDeDados = async () => {
    if (!window.confirm("Ajustar Sabores Doces automaticamente?")) return;
    setLoadingMagic(true);
    let atualizadas = 0;
    const docesNomes = ['chocolate', 'morango', 'nutella', 'prestígio', 'prestigio', 'banana', 'confete', 'sorvete', 'doce', 'romeu', 'julieta', 'brigadeiro', 'ouro branco', 'kit kat'];

    for (const sabor of sabores) {
      if (!sabor) continue;
      const nomeSabor = (sabor.name || '').toLowerCase();
      const isDoce = sabor.isDoce || docesNomes.some(palavra => nomeSabor.includes(palavra));
      
      const precos = { ...(sabor.prices || {}) };
      const isComboDef = !isDoce && ((precos.grande || 0) > 0 && (precos.grande || 0) < 60); 
      const isComboFinal = sabor.isCombo !== undefined ? sabor.isCombo : isComboDef;
      const isOfertaFinal = sabor.isOferta !== undefined ? sabor.isOferta : isComboDef;

      await updateDoc(doc(db, 'menu_sabores', String(sabor.id)), { isDoce: isDoce, isCombo: isComboFinal, isOferta: isOfertaFinal });
      atualizadas++;
    }
    setLoadingMagic(false);
    alert(`Sucesso! ${atualizadas} pizzas foram ajustadas.`);
  };

  const imprimirPedido = (p) => {
    if (!p) return;
    const timeStr = p?.timestamp ? new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
    const dateStr = p?.timestamp ? new Date(p.timestamp).toLocaleDateString() : '--/--/----';
    const atendenteStr = p?.atendente ? `<div class="margin-bot" style="font-size:12px; color:#555;">Atendente: ${p.atendente}</div>` : '';

    const janela = window.open('', '', 'width=300,height=600');
    janela.document.write(`
      <html>
        <head>
          <title>Cupom #${String(p.id || '').slice(-4).toUpperCase()}</title>
          <style>
            body { font-family: monospace; font-size: 14px; margin: 0; padding: 10px; width: 100%; max-width: 300px; color: black; }
            h1 { font-size: 18px; text-align: center; margin: 0 0 10px 0; }
            .divisor { border-bottom: 1px dashed #000; margin: 10px 0; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .text-center { text-align: center; }
            .margin-bot { margin-bottom: 5px; }
            .obs-box { border: 1px solid #000; padding: 5px; margin-top: 5px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${cfg?.topo || 'A GRANDONNA'}</h1>
          <div class="text-center margin-bot">PEDIDO #${String(p.id || '').slice(-4).toUpperCase()}</div>
          <div class="text-center margin-bot">${dateStr} - ${timeStr}</div>
          ${atendenteStr}
          <div class="divisor"></div>
          <div class="bold">CLIENTE:</div>
          <div>${p.clientName || 'Cliente'}</div>
          <div class="margin-bot">Tel: ${p.clientPhone || ''}</div>
          
          ${p.obs ? `<div class="obs-box">OBS: ${p.obs}</div>` : ''}

          <div class="divisor"></div>
          <div class="bold">${p.entrega === 'retirada' ? 'BALCAO / RETIRADA' : 'DELIVERY'}</div>
          ${p.entrega === 'entrega' ? `
            <div class="margin-bot">${p.end?.rua || ''}, ${p.end?.num || ''} ${p.end?.ref ? `(${p.end.ref})` : ''} - ${p.end?.bairro || ''}</div>
            ${p.end?.distancia ? `<div>Distancia: ${p.end.distancia} km</div>` : ''}
            <div>Frete Cobrado: R$ ${p.freteGratis ? '0.00 (GRÁTIS)' : Number(p.end?.taxaCobrada || 0).toFixed(2)}</div>
          ` : ''}
          <div class="divisor"></div>
          <div class="bold margin-bot">ITENS:</div>
          ${Array.isArray(p.items) ? p.items.map(it => {
            if(!it) return '';
            return `
            <div class="flex bold"><span>${it.qtd ? it.qtd + 'x' : '1x'} ${it.name || (it.tipo === 'combo' ? 'Combo' : it.tipo === 'oferta' ? 'Oferta' : `PZ ${it.tamanho?.name || ''}`)}</span><span>R$ ${Number(it.precoPizza || it.preco || 0).toFixed(2)}</span></div>
            ${Array.isArray(it.sabores) && it.sabores.length > 0 ? `<div style="font-size:12px; margin-bottom:2px; padding-left:10px;">${it.sabores.map(s => '+ ' + (s?.name||'')).join('<br>')}</div>` : ''}
            ${Array.isArray(it.bebidasCombo) && it.bebidasCombo.length > 0 ? `<div style="font-size:12px; margin-bottom:2px; padding-left:10px; color: #555;">Bebidas: ${it.bebidasCombo.map(b => b?.name||'').join(', ')}</div>` : ''}
            ${it.borda && typeof it.borda === 'object' ? `<div class="flex" style="font-size:12px; padding-left:10px; font-style: italic;"><span>+ Borda: ${it.borda.name||''}</span><span>R$ ${Number(it.borda.precoVendido || 0).toFixed(2)}</span></div>` : ''}
            ${(it.borda || it.tipo === 'combo' || it.tipo === 'oferta' || it.qtd > 1) ? `<div class="flex bold" style="font-size:12px; padding-left:10px; margin-bottom:8px; margin-top:2px; border-top: 1px dotted #ccc;"><span>Subtotal do Item:</span><span>R$ ${Number(it.preco || 0).toFixed(2)}</span></div>` : '<div style="margin-bottom:8px;"></div>'}
            `
          }).join('') : ''}
          <div class="divisor"></div>
          <div class="flex bold" style="font-size: 16px;"><span>TOTAL:</span><span>R$ ${Number(p.total || 0).toFixed(2)}</span></div>
          <div class="divisor"></div>
          <div class="margin-bot">Pagamento: ${p.pag === 'pix_app' ? 'PIX APP' : String(p.pag || '').toUpperCase()}</div>
          ${p.pag === 'dinheiro' && p.troco ? `<div class="bold">Levar Troco: R$ ${p.troco}</div>` : ''}
          <div class="divisor"></div>
          <div class="text-center margin-bot">Obrigado pela preferencia!</div>
          <div class="text-center">.</div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
          </script>
        </body>
      </html>
    `);
    janela.document.close();
  };

  const stats = useMemo(() => {
    if (!Array.isArray(pedidos)) return { total: 0, qtd: 0, itens: [] };
    const pedsDoDia = pedidos.filter(p => p && getDataLocalStr(p.timestamp) === filtroCaixa && p.status === 'entregue');
    const total = pedsDoDia.reduce((a, b) => a + Number(b?.total || 0), 0);
    const contagem = {};
    pedsDoDia.flatMap(p => p?.items || []).forEach(i => {
      if(!i) return;
      const nome = i.name || (i.tipo === 'combo' ? `Combo ${i.tamanho?.name||''}` : i.tipo === 'oferta' ? `Oferta ${i.tamanho?.name||''}` : `PZ ${i.tamanho?.name || 'Pizza'}`);
      contagem[nome] = (contagem[nome] || 0) + (i.qtd || 1);
    });
    return { total, qtd: pedsDoDia.length, itens: Object.entries(contagem) };
  }, [pedidos, filtroCaixa]);

  const handleImg = async (file, callback) => {
    setIsUp(true);
    const fd = new FormData(); fd.append('image', file);
    try {
      const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
      const d = await r.json(); callback(d.data.url);
    } catch (e) { alert("Erro ao carregar imagem."); }
    setIsUp(false);
  };

const salvar = async (e) => {
  e.preventDefault();
  
  // Ele vai usar a pasta que o botão 'carimbou'. Se não tiver, usa a aba.
  const col = edit.pastaOriginal || getCollectionName(aba);
  const idParaEditar = edit.idOriginal || edit.id; 

  const data = { ...edit };
  delete data.id;
  delete data.idOriginal;
  delete data.pastaOriginal;

  try {
    if (idParaEditar) {
      // Aqui ele vai direto no 'sabor_1' e faz o UPDATE, sem criar duplicata
      await setDoc(doc(db, col, String(idParaEditar)), data, { merge: true });
    } else {
      // Só cria novo se não tiver ID nenhum
      await addDoc(collection(db, col), data);
    }
    setEdit(null);
  } catch (err) {
    alert("Erro: " + err.message);
  }
};

  const toggleActive = async (item) => {
    if (!item || !item.id) return;
    const col = getCollectionName(aba);
    if (!col) return;
    const newState = item.isActive === false ? true : false;
    try { await setDoc(doc(db, col, String(item.id)), { isActive: newState }, { merge: true }); } 
    catch (err) { alert("Erro ao atualizar disponibilidade: " + err.message); }
  };

  const totalPDV = useMemo(() => {
    const somaItens = Array.isArray(pdvCart) ? pdvCart.reduce((acc, curr) => acc + Number(curr?.preco || 0), 0) : 0;
    const hasFreteGratis = Array.isArray(pdvCart) && pdvCart.some(i => i?.tipo === 'oferta');
    const taxaFrete = pdvEntrega === 'entrega' && !hasFreteGratis ? Number(pdvTaxa || 0) : 0;
    return somaItens + taxaFrete;
  }, [pdvCart, pdvEntrega, pdvTaxa]);

  const addPdvItem = () => {
    if(!pdvConfig) return;
    let precoPizza = 0;
    let precoBorda = 0;
    let precoItem = 0;
    let name = '';

    if (pdvConfig.tipo === 'pizza') {
        const listaPrecos = Array.isArray(pdvSelS) && pdvSelS.length > 0 ? pdvSelS.map(x => getPrecoSabor(x, pdvConfig.tamanho?.id)) : [0];
        precoPizza = Math.max(...listaPrecos);
        precoBorda = pdvSelBorda ? getPrecoBorda(pdvSelBorda, pdvConfig.tamanho?.id) : 0;
        precoItem = precoPizza + precoBorda;
        name = `Pizza ${pdvConfig.tamanho?.name || ''}`;
    } else if (pdvConfig.tipo === 'combo') {
        precoItem = Number(pdvConfig.item?.price || 0);
        name = pdvConfig.item?.name || 'Combo';
    } else if (pdvConfig.tipo === 'oferta') {
        precoItem = Number(pdvConfig.item?.price || 0);
        name = pdvConfig.item?.name || 'Oferta';
    }

    setPdvCart([...(pdvCart || []), {
        id: Date.now() + Math.random(),
        tipo: pdvConfig.tipo,
        name: name,
        tamanho: pdvConfig.tamanho,
        sabores: pdvSelS,
        borda: pdvSelBorda ? { ...pdvSelBorda, precoVendido: precoBorda } : null,
        bebidasCombo: pdvSelBebidas,
        precoPizza: precoPizza,
        preco: precoItem,
        qtd: 1
    }]);

    setPdvConfig(null); setPdvSelS([]); setPdvSelBorda(null); setPdvSelBebidas([]);
  };

  const handlePdvDrinkQtd = (bebida, delta) => {
    const existingIdx = (pdvCart || []).findIndex(c => c?.tipo === 'bebida' && c?.itemId === bebida?.id);
    if (existingIdx >= 0) {
      const newCart = [...pdvCart];
      const newQtd = newCart[existingIdx].qtd + delta;
      if (newQtd <= 0) newCart.splice(existingIdx, 1);
      else {
        newCart[existingIdx].qtd = newQtd;
        newCart[existingIdx].preco = newQtd * Number(newCart[existingIdx].precoBase || bebida.price || 0);
      }
      setPdvCart(newCart);
    } else if (delta > 0) {
      setPdvCart([...(pdvCart || []), { 
        id: Date.now() + Math.random(), itemId: bebida.id, tipo: 'bebida', precoBase: Number(bebida.price || 0), preco: Number(bebida.price || 0), name: bebida.name || 'Bebida', qtd: 1 
      }]);
    }
  };

  const lancarPedidoPDV = async () => {
    if(!pdvCart || pdvCart.length === 0) return alert("Carrinho vazio! Adicione algum produto.");
    if(!pdvNome.trim()) return alert("Digite o nome do cliente.");

    const hasFreteGratis = Array.isArray(pdvCart) && pdvCart.some(i => i?.tipo === 'oferta');

    const novoPedido = {
      items: pdvCart,
      total: totalPDV,
      entrega: pdvEntrega,
      end: pdvEntrega === 'entrega' ? { rua: pdvEnd, num: '', bairro: '', ref: '', distancia: 0, taxaCobrada: hasFreteGratis ? 0 : Number(pdvTaxa || 0) } : {},
      pag: pdvPag,
      troco: pdvTroco,
      obs: pdvObs,
      freteGratis: hasFreteGratis,
      timestamp: Date.now(),
      status: 'pendente',
      userId: 'balcao_pdv',
      clientName: pdvNome,
      clientPhone: pdvTel || 'Balcão',
      atendente: currentUserData?.nome || 'Sistema' // <-- SALVA O ATENDENTE NO PEDIDO
    };

    try {
      await addDoc(collection(db, 'pedidos'), novoPedido);
      alert("Pedido lançado com sucesso!");
      setPdvCart([]); setPdvNome(''); setPdvTel(''); setPdvEnd(''); setPdvTaxa(''); setPdvObs(''); setPdvTroco(''); setPdvEntrega('entrega');
      setPdvStep('cart'); // Volta pra tela de carrinho
    } catch (e) {
      alert("Erro ao lançar pedido.");
    }
  };

  const renderPedidoCard = (p, idx) => {
    if (!p) return null;
    const isLatestForUser = Array.isArray(pedidos) ? pedidos.find(x => x?.userId === p?.userId)?.id === p?.id : false;
    const temAlerta = Array.isArray(alertasChat) && p?.userId ? alertasChat.includes(p.userId) && isLatestForUser : false;
    const timeStr = p?.timestamp ? new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';

    return (
      <div key={p.id || `pedido-${idx}`} className={`bg-white rounded-[40px] shadow-2xl border-t-8 p-6 flex flex-col gap-4 relative overflow-hidden ${p?.status === 'pendente' ? 'border-red-600' : 'border-transparent shadow-gray-200'}`}>
        {p?.status === 'pendente' && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none"/>}
        
        <div className="flex justify-between border-b border-gray-50 pb-2 relative z-10">
          <div>
            <span className="font-black text-[10px] text-gray-400 tracking-widest uppercase block">Cod: {String(p?.id || '').slice(-4)}</span>
            <span className="text-[9px] font-bold text-gray-400">{timeStr}</span>
          </div>
          <div className="flex gap-2">
            {p?.status !== 'pendente' && (
              <button onClick={() => imprimirPedido(p)} className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:scale-110 transition-transform shadow-sm" title="Imprimir Pedido">
                <Printer size={14}/>
              </button>
            )}
            <button onClick={() => window.open(`https://wa.me/55${p?.clientPhone || ''}`)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:scale-110 transition-transform shadow-sm" title="WhatsApp"><Phone size={14}/></button>
            <button onClick={() => setChatAberto({userId: p?.userId, clientName: p?.clientName || 'Cliente'})} 
              className={`p-2 rounded-xl transition-all shadow-sm flex items-center gap-1 ${temAlerta ? 'bg-red-600 text-white animate-pulse shadow-red-500/40' : 'bg-blue-50 text-blue-600 hover:scale-110'}`} title="Chat">
              <MessageCircle size={14}/>
              {temAlerta && <span className="text-[8px] font-black uppercase tracking-widest">Nova Msg</span>}
            </button>
          </div>
        </div>
        
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="font-black uppercase text-sm text-gray-900 leading-tight">{p?.clientName || 'Cliente sem nome'}</div>
            <div className="text-[10px] font-bold text-gray-500">{p?.clientPhone || 'Sem telefone'}</div>
          </div>
          {p?.atendente && <span className="text-[8px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-bold uppercase border border-gray-200 text-right max-w-[100px] truncate" title={p.atendente}>👤 {p.atendente}</span>}
        </div>

        <div className="text-[10px] font-bold text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-2 relative z-10">
          <MapPin size={12} className="text-red-500 shrink-0 mt-0.5"/> 
          <div>
            {p?.entrega === 'retirada' ? 'BALCÃO / RETIRADA' : `${p?.end?.rua || ''}, ${p?.end?.num || ''} ${p?.end?.ref ? `(${p.end.ref})` : ''} - ${p?.end?.bairro || ''}`}
            {p?.entrega === 'entrega' && <span className="block text-[8px] text-blue-500 mt-1">KM Calculado: {p?.end?.distancia || 0} km | Taxa: R$ {p?.freteGratis ? '0.00 (GRÁTIS)' : Number(p?.end?.taxaCobrada || 0).toFixed(2)}</span>}
          </div>
        </div>
        
        <div className="flex-1 py-2 space-y-3 border-y border-gray-50 relative z-10">
          {Array.isArray(p?.items) && p.items.map((it, idxItem) => {
            if(!it) return null;
            return (
            <div key={`item-${idxItem}`} className="flex flex-col border-b border-gray-50 pb-2 last:border-0">
              <div className="flex justify-between font-bold text-xs text-gray-800">
                <span>{it.qtd ? it.qtd + 'x' : '1x'} {it.name || (it.tipo === 'combo' ? 'Combo' : it.tipo === 'oferta' ? 'Oferta' : `Pizza ${it.tamanho?.name || ''}`)}</span>
                <span className="text-gray-400">R$ {Number(it.precoPizza || it.preco || 0).toFixed(2)}</span>
              </div>
              {Array.isArray(it.sabores) && it.sabores.map((s, si) => (
                <p key={`sab-${si}`} className="text-[9px] text-red-600 font-bold italic leading-tight mt-1">
                  + {s?.name} <span className="text-gray-400 font-medium lowercase">({s?.desc || s?.description || ''})</span>
                </p>
              ))}
              
              {Array.isArray(it.bebidasCombo) && it.bebidasCombo.length > 0 && (
                <div className="text-[9px] text-blue-600 font-bold italic leading-tight mt-1 flex flex-col gap-0.5">
                  <span className="text-gray-500 uppercase">Incluso:</span>
                  {it.bebidasCombo.map((b, bi) => <span key={`beb-${bi}`}>+ {b?.name}</span>)}
                </div>
              )}

              {it.borda && typeof it.borda === 'object' && (
                <div className="flex justify-between items-center text-[9px] text-orange-500 font-bold italic leading-tight mt-1">
                  <span>+ Borda: {it.borda?.name}</span>
                  <span>R$ {Number(it.borda?.precoVendido || 0).toFixed(2)}</span>
                </div>
              )}
              {(it.borda || it.tipo === 'combo' || it.tipo === 'oferta' || (it.qtd && it.qtd > 1)) ? (
                <div className="flex justify-end text-[10px] text-yellow-600 font-black mt-1">
                  Subtotal: R$ {Number(it.preco || 0).toFixed(2)}
                </div>
              ) : null}
            </div>
          )})}
        </div>

        {p?.obs && (
          <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 relative z-10">
            <span className="text-[9px] font-black uppercase text-yellow-700 block mb-1 flex items-center gap-1"><Flame size={12}/> Observação:</span>
            <span className="text-xs font-bold text-gray-800 italic">{p.obs}</span>
          </div>
        )}

        <div className="bg-gray-50 p-2 rounded-xl text-center border border-gray-100 relative z-10 mt-2">
          <span className="text-[9px] font-black uppercase text-gray-500">
            Pagamento: <span className="text-gray-800">{p?.pag === 'pix_app' ? 'PIX APP' : String(p?.pag || '').toUpperCase()}</span>
            {p?.pag === 'dinheiro' && p?.troco && <span className="text-red-500"> (Troco p/ R$ {p.troco})</span>}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5 mt-1 relative z-10">
          <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'pendente' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p?.status === 'pendente' ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Pendente</button>
          <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'preparando' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p?.status === 'preparando' ? 'bg-yellow-500 text-white shadow-md shadow-yellow-500/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Cozinha</button>
          <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'saiu_entrega' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p?.status === 'saiu_entrega' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Entrega</button>
          <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'entregue' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p?.status === 'entregue' ? 'bg-green-600 text-white shadow-md shadow-green-500/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Concluído</button>
        </div>
        
        <div className="font-black text-green-600 text-center text-xl pt-2 relative z-10 border-t border-gray-50 mt-1">R$ {Number(p?.total || 0).toFixed(2)}</div>
      </div>
    );
  };

  if (!hasPerm) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
      <div className="bg-gray-900 p-8 rounded-[40px] border border-gray-800 shadow-2xl">
        <img src={cfg?.logo || LOGO} className="w-24 h-24 rounded-full mx-auto border-2 border-yellow-500 mb-6 object-cover shadow-lg"/>
        <h1 className="text-white font-black italic mb-6 uppercase tracking-widest text-xl">A Grandonna Admin</h1>
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full bg-white text-black p-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-xl active:scale-95">
          <img src="https://www.google.com/favicon.ico" className="w-5"/> Entrar com Google
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4 shadow-2xl z-40 overflow-y-auto">
        <img src={cfg?.logo || LOGO} className="w-20 h-20 rounded-full mx-auto border-2 border-yellow-500 object-cover mb-2 shadow-lg"/>
        <nav className="space-y-1 flex-1">
          {['pdv', 'pedidos', 'historico', 'sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'banners', 'caixa', 'equipe', 'sistema'].map((m, idx) => (
            <button key={`nav-${idx}`} onClick={() => { setAba(m); setEdit(null); }} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-between transition-all ${aba === m ? 'bg-red-600 shadow-xl scale-105' : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}>
              <div className="flex items-center gap-2">
                {m === 'pdv' && <Calculator size={16}/>}
                {m === 'pedidos' && <ClipboardList size={16}/>}
                {m === 'historico' && <History size={16}/>}
                {m === 'sabores' && <Pizza size={16}/>}
                {m === 'bordas' && <CircleDashed size={16}/>}
                {m === 'bebidas' && <CupSoda size={16}/>}
                {m === 'combos' && <Package size={16}/>}
                {m === 'ofertas' && <Ticket size={16}/>}
                {m === 'caixa' && <BarChart3 size={16}/>}
                {m === 'equipe' && <Users size={16}/>}
                {m === 'banners' && <ImageIcon size={16}/>}
                {m === 'sistema' && <Settings size={16}/>}
                {m === 'pdv' ? 'PDV / NOVO PEDIDO' : m}
              </div>
              {m === 'pedidos' && Array.isArray(pedidos) && pedidos.filter(p => p?.status === 'pendente').length > 0 && (
                <span className="bg-white text-red-600 px-2 rounded-full animate-bounce font-bold">
                  {pedidos.filter(p => p?.status === 'pendente').length}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        {/* PERFIL DO ATENDENTE NA BARRA LATERAL */}
        {currentUserData && (
          <div className="mt-auto border-t border-gray-800 pt-4 flex items-center gap-3 bg-gray-900/50 p-3 rounded-2xl">
             {currentUserData.img ? (
                <img src={currentUserData.img} className="w-10 h-10 rounded-full object-cover border border-gray-700"/>
             ) : (
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-500 border border-gray-700"><User size={20}/></div>
             )}
             <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black text-white truncate">{currentUserData.nome || 'Atendente'}</p>
                <p className="text-[9px] font-bold uppercase text-red-500 tracking-widest">{currentUserData.cargo || 'Sistema'}</p>
             </div>
          </div>
        )}

        <button onClick={() => signOut(auth)} className="text-gray-500 font-bold text-[10px] uppercase flex items-center gap-2 p-2 hover:text-red-500 transition-colors mt-2"><LogOut size={14}/> Sair</button>
      </aside>

      <main className={`flex-1 p-4 md:p-10 overflow-y-auto transition-colors duration-300 ${['pedidos','historico'].includes(aba) ? 'bg-gray-300' : 'bg-gray-50'}`}>
        
        {aba === 'pdv' && (
          <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-80px)]">
            {/* LADO ESQUERDO: CARDÁPIO (MANTIDO) */}
            <div className="flex-1 bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
               <h2 className="text-2xl font-black italic uppercase mb-4 text-gray-800">Cardápio Rápido</h2>
               
               <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 mb-4">
                 {(() => {
                   const abas = [];
                   if ((sabores || []).some(s => s && s.isPromo)) abas.push('promocoes');
                   abas.push('tradicionais', 'doces');
                   if ((combos || []).length > 0) abas.push('combos');
                   if ((ofertas || []).length > 0) abas.push('ofertas');
                   if ((bebidas || []).length > 0) abas.push('bebidas');
                   
                   return abas.map((t, idx) => (
                     <button key={`aba-${idx}`} onClick={()=>{setPdvAba(t); setPdvStep('cart');}} className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${pdvAba === t ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                       {t === 'promocoes' ? '🔥 Promoções' : t}
                     </button>
                   ));
                 })()}
               </div>

               <div className="flex-1 overflow-y-auto pr-2 grid gap-3 align-top content-start">
                  {['tradicionais', 'doces', 'promocoes'].includes(pdvAba) && (tamanhos || []).map((t, idx) => {
                     const validFlavors = (sabores || []).filter(s => {
                        if (!s) return false;
                        if (pdvAba === 'doces' && !isPizzaDoce(s)) return false;
                        if (pdvAba === 'tradicionais' && isPizzaDoce(s)) return false;
                        if (pdvAba === 'promocoes' && !s.isPromo) return false;
                        return Number(s.prices?.[t.id] || 0) > 0;
                     });

                     if (validFlavors.length === 0) return null;

                     return (
                       <div key={`tam-${idx}`} onClick={() => {setPdvConfig({ tipo: 'pizza', isDoce: pdvAba === 'doces', isPromoOnly: pdvAba === 'promocoes', tamanho: t, maxFlavors: t.maxFlavors, item: null }); setPdvStep('cart');}} className="bg-gray-50 p-5 rounded-3xl border border-gray-200 hover:border-red-500 cursor-pointer transition-colors flex justify-between items-center group">
                          <div className="flex items-center gap-4"><span className="text-3xl">{t.icon}</span><div><h4 className="font-black text-lg text-gray-800 uppercase">{t.name} {pdvAba === 'doces' ? 'Doce' : ''}</h4><p className="text-xs text-gray-500 font-bold">{t.description}</p></div></div>
                          <Plus size={24} className="text-gray-300 group-hover:text-red-500"/>
                       </div>
                     )
                  })}

                  {pdvAba === 'combos' && Array.isArray(combos) && combos.map((c, idx) => {
                     if(!c) return null;
                     const tamRef = (tamanhos || []).find(t => t && t.id === c.tamanhoId);
                     return (
                       <div key={c.id || `combo-item-${idx}`} onClick={() => {setPdvConfig({ tipo: 'combo', item: c, tamanho: tamRef, maxFlavors: tamRef?.maxFlavors || 1, maxBebidas: c.qtdBebidas || 1 }); setPdvStep('cart');}} className="bg-purple-50 p-5 rounded-3xl border border-purple-100 hover:border-purple-500 cursor-pointer transition-colors flex justify-between items-center group">
                          <div>
                            <span className="text-[10px] font-black uppercase text-purple-500 tracking-widest bg-purple-200/50 px-2 py-1 rounded-md mb-2 inline-block">Combo Fechado</span>
                            <h4 className="font-black text-lg text-gray-800 uppercase">{c.name}</h4>
                            <p className="text-xs text-purple-600 font-bold mt-1">R$ {Number(c.price || 0).toFixed(2)}</p>
                          </div>
                          <Plus size={24} className="text-purple-300 group-hover:text-purple-600"/>
                       </div>
                     )
                  })}

                  {pdvAba === 'ofertas' && Array.isArray(ofertas) && ofertas.map((o, idx) => {
                     if(!o) return null;
                     const tamRef = (tamanhos || []).find(t => t && t.id === o.tamanhoId);
                     return (
                       <div key={o.id || `oferta-item-${idx}`} onClick={() => {setPdvConfig({ tipo: 'oferta', item: o, tamanho: tamRef, maxFlavors: tamRef?.maxFlavors || 1 }); setPdvStep('cart');}} className="bg-green-50 p-5 rounded-3xl border border-green-100 hover:border-green-500 cursor-pointer transition-colors flex justify-between items-center group">
                          <div>
                            <span className="text-[10px] font-black uppercase text-green-600 tracking-widest bg-green-200/50 px-2 py-1 rounded-md mb-2 inline-block">Frete Grátis</span>
                            <h4 className="font-black text-lg text-gray-800 uppercase">{o.name}</h4>
                            <p className="text-xs text-green-700 font-bold mt-1">R$ {Number(o.price || 0).toFixed(2)}</p>
                          </div>
                          <Plus size={24} className="text-green-300 group-hover:text-green-600"/>
                       </div>
                     )
                  })}

                  {pdvAba === 'bebidas' && Array.isArray(bebidas) && bebidas.map((b, idx) => {
                     if(!b) return null;
                     return (
                     <div key={b.id || `bebida-item-${idx}`} className="bg-gray-50 p-4 rounded-3xl border border-gray-200 flex justify-between items-center">
                        <div>
                          <h4 className="font-black text-gray-800 uppercase">{b.name}</h4>
                          <p className="text-xs text-blue-600 font-bold mt-1">R$ {Number(b.price || 0).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => {handlePdvDrinkQtd(b, -1); setPdvStep('cart');}} className="w-10 h-10 bg-gray-200 rounded-xl text-gray-600 font-black flex items-center justify-center hover:bg-gray-300"><Minus size={18}/></button>
                           <button onClick={() => {handlePdvDrinkQtd(b, 1); setPdvStep('cart');}} className="w-10 h-10 bg-blue-600 rounded-xl text-white font-black flex items-center justify-center hover:bg-blue-700 shadow-md shadow-blue-500/30"><Plus size={18}/></button>
                        </div>
                     </div>
                  )})}
               </div>
            </div>

            {/* LADO DIREITO: CARRINHO E CHECKOUT DIVIDIDO */}
            <div className="w-full xl:w-[450px] bg-gray-900 p-6 rounded-[40px] shadow-2xl border border-gray-800 flex flex-col h-full overflow-hidden relative">
               
               {pdvStep === 'cart' ? (
                 // TELA 1: APENAS O CARRINHO GIGANTE E BOTOÕES DE DELIVERY/BALCAO
                 <div className="flex flex-col h-full animate-in fade-in">
                   <h2 className="text-2xl font-black italic uppercase mb-4 text-white flex items-center justify-between border-b border-gray-800 pb-4">
                     <span className="flex items-center gap-2"><ShoppingBag className="text-yellow-500"/> Resumo</span>
                     {pdvCart.length > 0 && <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full">{pdvCart.reduce((a,b)=>a+(b.qtd||1),0)} ITENS</span>}
                   </h2>
                   
                   <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                      {Array.isArray(pdvCart) && pdvCart.map((i, idx) => {
                        if(!i) return null;
                        return (
                        <div key={`pdv-cart-${i.id || idx}`} className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                              <p className="font-bold text-white text-sm">{(i.qtd && i.qtd > 1) ? `${i.qtd}x ` : ''}{i.name}</p>
                              {Array.isArray(i.sabores) && i.sabores.length > 0 && <p className="text-[10px] text-gray-400 mt-1">{i.sabores.map(s => s?.name || '').join(' + ')}</p>}
                              {Array.isArray(i.bebidasCombo) && i.bebidasCombo.length > 0 && <p className="text-[10px] text-purple-400 italic mt-0.5">+ {i.bebidasCombo.map(b => b?.name || '').join(', ')}</p>}
                              {i.borda && typeof i.borda === 'object' && <p className="text-[10px] text-orange-400 italic mt-0.5">+ Borda: {i.borda.name || ''}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-yellow-500 font-black text-sm mb-2">R$ {Number(i.preco || 0).toFixed(2)}</p>
                              <button onClick={() => setPdvCart(pdvCart.filter(x => x.id !== i.id))} className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded-lg"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        </div>
                      )})}
                      {(!pdvCart || pdvCart.length === 0) && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-4 pt-10">
                           <ShoppingBag size={48} className="opacity-20"/>
                           <p className="font-bold uppercase tracking-widest text-xs">Carrinho Vazio</p>
                        </div>
                      )}
                   </div>

                   <div className="pt-4 border-t border-gray-800">
                      <div className="flex items-center justify-between mb-4 bg-black/40 p-4 rounded-2xl">
                        <span className="text-gray-400 font-black uppercase text-xs tracking-widest">Total S/ Taxa:</span>
                        <span className="text-3xl font-black text-green-500">R$ {Number(totalPDV || 0).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button onClick={() => { if(pdvCart.length===0) return alert("Adicione produtos primeiro!"); setPdvEntrega('entrega'); setPdvStep('checkout'); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-5 rounded-[20px] font-black uppercase text-sm shadow-lg shadow-red-600/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-1">
                          <MapPin size={20}/> Delivery
                        </button>
                        <button onClick={() => { if(pdvCart.length===0) return alert("Adicione produtos primeiro!"); setPdvEntrega('retirada'); setPdvStep('checkout'); }} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-5 rounded-[20px] font-black uppercase text-sm shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-1">
                          <Store size={20}/> Balcão
                        </button>
                      </div>
                   </div>
                 </div>
               ) : (
                 // TELA 2: FORMULÁRIO DE CHECKOUT (NOME, ENDEREÇO, PAGAMENTO)
                 <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                   <button onClick={() => setPdvStep('cart')} className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 font-bold text-[10px] uppercase tracking-widest"><ArrowLeft size={14}/> Voltar ao Resumo</button>
                   
                   <h2 className="text-2xl font-black italic uppercase mb-4 text-white flex justify-between items-center border-b border-gray-800 pb-4">
                     Pagamento
                     <span className={`text-[10px] px-3 py-1 rounded-full ${pdvEntrega === 'entrega' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-black'}`}>{pdvEntrega === 'entrega' ? 'Delivery' : 'Balcão'}</span>
                   </h2>

                   <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-4">
                     <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 space-y-3">
                       <input placeholder="Nome do Cliente" value={pdvNome} onChange={e=>setPdvNome(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold outline-none focus:border-red-500 text-sm"/>
                       <input placeholder="WhatsApp / Telefone" value={pdvTel} onChange={e=>setPdvTel(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold outline-none focus:border-red-500 text-sm"/>
                     </div>

                     {pdvEntrega === 'entrega' && (
                       <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 space-y-3">
                         <textarea placeholder="Endereço Completo (Rua, Nº, Bairro, Ref)" value={pdvEnd} onChange={e=>setPdvEnd(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold outline-none focus:border-red-500 text-sm resize-none h-24"/>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase w-20">Taxa R$:</span>
                            <input type="number" placeholder="Ex: 8.00" value={pdvTaxa} onChange={e=>setPdvTaxa(e.target.value)} disabled={Array.isArray(pdvCart) && pdvCart.some(i => i?.tipo === 'oferta')} className="flex-1 p-4 bg-black border border-gray-700 rounded-xl text-white font-black outline-none focus:border-red-500 text-sm disabled:opacity-50"/>
                         </div>
                         {Array.isArray(pdvCart) && pdvCart.some(i => i?.tipo === 'oferta') && <p className="text-[9px] text-green-500 font-bold uppercase text-right">Taxa Isenta (Oferta Ativa)</p>}
                       </div>
                     )}

                     <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 space-y-3">
                       <select value={pdvPag} onChange={e=>setPdvPag(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold outline-none focus:border-red-500 text-sm appearance-none">
                         <option value="dinheiro">💵 Dinheiro</option>
                         <option value="maquininha">💳 Maquininha (Cartão)</option>
                         <option value="pix_app">📱 PIX (Chave/App)</option>
                       </select>
                       {pdvPag === 'dinheiro' && <input type="number" placeholder="Levar Troco para R$?" value={pdvTroco} onChange={e=>setPdvTroco(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white font-bold outline-none focus:border-red-500 text-sm"/>}
                     </div>

                     <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                       <input placeholder="Observação (Ex: Sem cebola, etc)" value={pdvObs} onChange={e=>setPdvObs(e.target.value)} className="w-full p-4 bg-black border border-gray-700 rounded-xl text-yellow-500 font-bold outline-none focus:border-yellow-500 text-sm"/>
                     </div>
                   </div>

                   <div className="pt-4 border-t border-gray-800">
                      <div className="flex items-center justify-between mb-4 bg-black/40 p-4 rounded-2xl">
                        <span className="text-gray-400 font-black uppercase text-xs tracking-widest">Total Final:</span>
                        <span className="text-3xl font-black text-green-500">R$ {Number(totalPDV || 0).toFixed(2)}</span>
                      </div>
                      <button onClick={lancarPedidoPDV} className="w-full bg-green-600 hover:bg-green-500 text-white py-5 rounded-[20px] font-black uppercase tracking-widest flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg shadow-green-600/20 text-lg">
                        <Send size={20}/> Confirmar e Imprimir
                      </button>
                   </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {aba !== 'pdv' && (
          <header className="flex justify-between items-center mb-8 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/50 shadow-sm">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900">{aba}</h1>
            {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'banners', 'equipe'].includes(aba) && (
              <button onClick={() => {
                if (aba === 'equipe' && !isMst) {
                  const p = prompt("Senha Master:");
                  if (p === 'GRAN2026') setIsMst(true); else return alert("Senha Incorreta");
                }
                setEdit(
                  aba === 'sabores' ? { name: '', desc: '', description: '', prices: { broto: 0, grande: 0, gigante: 0, meio_metro: 0, um_metro: 0 }, img: '', isActive: true, isPromo: false, isDoce: false, isCombo: false, isOferta: false } :
                  aba === 'bordas' ? { name: '', prices: { broto: 0, grande: 0, gigante: 0, meio_metro: 0, um_metro: 0 }, isActive: true } :
                  aba === 'combos' ? { name: '', desc: '', price: 0, tamanhoId: 'gigante', qtdBebidas: 1, img: '', isActive: true } :
                  aba === 'ofertas' ? { name: '', desc: '', price: 0, tamanhoId: 'gigante', img: '', isActive: true } :
                  aba === 'bebidas' ? { name: '', price: 0, img: '', isActive: true, isCombo: false } :
                  aba === 'equipe' ? { nome: '', email: '', cargo: 'Atendente', img: '' } :
                  { title: '', imageUrl: '' }
                );
              }} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-green-700 active:scale-95 transition-all">Novo {aba}</button>
            )}
          </header>
        )}

        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.isArray(pedidos) && pedidos
              .filter(p => p && (p.status !== 'entregue' || getDataLocalStr(p.timestamp) === getDataLocalStr()))
              .map((p, idx) => renderPedidoCard(p, idx))}
            {Array.isArray(pedidos) && pedidos.filter(p => p && (p.status !== 'entregue' || getDataLocalStr(p.timestamp) === getDataLocalStr())).length === 0 && (
              <p className="col-span-full text-center text-gray-500 font-bold py-10 uppercase">Nenhum pedido no momento.</p>
            )}
          </div>
        )}

        {aba === 'historico' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex items-center gap-4 w-full md:w-1/3">
              <Search className="text-gray-400" size={20}/>
              <input type="date" className="bg-transparent font-black outline-none w-full text-gray-900" value={filtroHist} onChange={e => setFiltroHist(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.isArray(pedidos) && pedidos.filter(p => p && getDataLocalStr(p.timestamp) === filtroHist).map((p, idx) => renderPedidoCard(p, idx))}
              {Array.isArray(pedidos) && pedidos.filter(p => p && getDataLocalStr(p.timestamp) === filtroHist).length === 0 && (
                <p className="col-span-full text-center text-gray-500 font-bold py-10 uppercase">Nenhum pedido encontrado nesta data.</p>
              )}
            </div>
          </div>
        )}

        {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'banners', 'equipe'].includes(aba) && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase">
                <tr><th className="p-6">Item / Detalhes</th><th className="p-6">Preços / Informação</th><th className="p-6 text-right">Ações</th></tr>
              </thead>
              <tbody>{(getTabelaAtual() || []).map((it, idx) => {
                if(!it) return null;
                return (
                <tr key={it.id || `tab-${idx}`} className={`border-b border-gray-50 transition-all group ${it.isActive === false ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                  <td className="p-6 flex items-center gap-4">
                    <div className="relative shrink-0">
                      {(it.img || it.imageUrl) ? (
                        <img src={it.img || it.imageUrl} className={`w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white ${it.isActive === false ? 'grayscale opacity-50' : ''}`}/>
                      ) : (
                        <div className={`w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-white ${it.isActive === false ? 'text-red-300' : 'text-gray-300'}`}>
                          {aba === 'sabores' ? <Pizza size={24}/> : aba === 'bordas' ? <CircleDashed size={24}/> : aba === 'combos' ? <Package size={24}/> : aba === 'ofertas' ? <Ticket size={24}/> : aba === 'bebidas' ? <CupSoda size={24}/> : <User size={24}/>}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-black uppercase text-xs tracking-tighter ${it.isActive === false ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {it.name || it.title || it.nome}
                        </p>
                        
                        {aba === 'sabores' && it.isPromo && (
                          <span className="bg-red-100 text-red-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1 border border-red-200">
                            <Flame size={10}/> Promo
                          </span>
                        )}
                        {aba === 'sabores' && it.isDoce && (
                          <span className="bg-pink-100 text-pink-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase border border-pink-200">
                            🍬 Doce
                          </span>
                        )}
                        
                        {['sabores', 'bebidas'].includes(aba) && it.isCombo && (
                          <span className="bg-purple-100 text-purple-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase border border-purple-200 flex items-center gap-1">
                            <Package size={10}/> Combo
                          </span>
                        )}

                        {aba === 'sabores' && it.isOferta && (
                          <span className="bg-green-100 text-green-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase border border-green-200 flex items-center gap-1">
                            <Ticket size={10}/> Oferta
                          </span>
                        )}

                        {aba === 'ofertas' && it.isActive !== false && (
                          <span className="bg-green-100 text-green-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase border border-green-200 flex items-center gap-1">
                            <Ticket size={10}/> Entrega Grátis
                          </span>
                        )}

                        {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas'].includes(aba) && it.isActive === false && (
                          <span className="bg-red-100 text-red-600 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider">Esgotado</span>
                        )}
                      </div>
                      
                      {['sabores', 'combos', 'ofertas'].includes(aba) && (
                        <p className={`text-[11px] font-black italic mt-1 max-w-[350px] leading-tight uppercase ${it.isActive === false ? 'text-gray-400' : 'text-red-600'}`}>
                          {it.desc || it.description || (aba === 'sabores' ? '⚠️ Sem ingredientes.' : '⚠️ Sem descrição.')}
                        </p>
                      )}
                      
                      {aba === 'equipe' && <p className="text-[10px] font-black uppercase text-gray-500 mt-1">{it.cargo || 'Atendente'}</p>}
                    </div>
                  </td>
                  <td className="p-6 font-black text-[10px] text-gray-500 uppercase">
                    {aba === 'bebidas' && it.price !== undefined && <span className={`font-bold px-2 py-1 rounded ${it.isActive === false ? 'text-gray-400 bg-gray-100' : 'text-green-600 bg-green-50'}`}>R$ {Number(it.price || 0).toFixed(2)}</span>}
                    
                    {aba === 'combos' && (
                      <div>
                         <span className={`font-bold px-2 py-1 rounded ${it.isActive === false ? 'text-gray-400 bg-gray-100' : 'text-green-600 bg-green-50'}`}>R$ {Number(it.price || 0).toFixed(2)}</span>
                         <p className="text-[9px] mt-1 text-gray-500 uppercase">Tamanho: {it.tamanhoId?.replace('_', ' ')} | Bebidas: {it.qtdBebidas}</p>
                      </div>
                    )}

                    {aba === 'ofertas' && (
                      <div>
                         <span className={`font-bold px-2 py-1 rounded ${it.isActive === false ? 'text-gray-400 bg-gray-100' : 'text-green-600 bg-green-50'}`}>R$ {Number(it.price || 0).toFixed(2)}</span>
                         <p className="text-[9px] mt-1 text-gray-500 uppercase">Tamanho: {it.tamanhoId?.replace('_', ' ')} | FRETE GRÁTIS</p>
                      </div>
                    )}

                    {['sabores', 'bordas'].includes(aba) && it.prices && (
                      <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {it.prices.broto !== undefined && Number(it.prices.broto) > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Bro: R$ {Number(it.prices.broto||0).toFixed(2)}</span>}
                        {it.prices.grande !== undefined && Number(it.prices.grande) > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Gra: R$ {Number(it.prices.grande||0).toFixed(2)}</span>}
                        {it.prices.gigante !== undefined && Number(it.prices.gigante) > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Gig: R$ {Number(it.prices.gigante||0).toFixed(2)}</span>}
                        {it.prices.meio_metro !== undefined && Number(it.prices.meio_metro) > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>1/2M: R$ {Number(it.prices.meio_metro||0).toFixed(2)}</span>}
                        {it.prices.um_metro !== undefined && Number(it.prices.um_metro) > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>1M: R$ {Number(it.prices.um_metro||0).toFixed(2)}</span>}
                      </div>
                    )}
                    {aba === 'equipe' && <span className="lowercase">{it.email}</span>}
                    {aba === 'banners' && <span className="text-[8px] text-gray-300 truncate max-w-[150px] block">{it.imageUrl}</span>}
                  </td>
                  <td className="p-6 text-right space-x-2 whitespace-nowrap">
                    {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas'].includes(aba) && (
                      <button onClick={() => toggleActive(it)} className={`p-3 rounded-2xl transition-all mr-2 ${it.isActive === false ? 'text-gray-400 hover:bg-gray-200' : 'text-green-600 hover:bg-green-50'}`}>
                        {it.isActive === false ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    )}

                    <button 
  onClick={() => setEdit({ 
    ...it, 
    idOriginal: it.id, // Garante que o ID completo (sabor_1) fique guardado
    pastaOriginal: getCollectionName(aba) // Carimba a pasta de onde ele veio
  })} 
  className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
>
  <Edit2 size={16}/>
</button>
                    <button onClick={async () => { 
                      if (window.confirm('Eliminar permanentemente?')) {
                        const colName = getCollectionName(aba);
                        if(colName) await deleteDoc(doc(db, colName, String(it.id)));
                      }
                    }} className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={16}/></button>
                  </td>
                </tr>
              )})}</tbody>
            </table>
          </div>
        )}

        {aba === 'caixa' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex items-center gap-4">
              <Search className="text-gray-400" size={20}/>
              <input type="date" className="bg-transparent font-black outline-none w-full text-gray-900" value={filtroCaixa} onChange={e => setFiltroCaixa(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-green-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Faturamento</p><p className="text-3xl font-black text-green-600">R$ {stats.total.toFixed(2)}</p></div>
              <div className="bg-white p-8 rounded-[40px] shadow-sm border"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Ticket Médio</p><p className="text-3xl font-black text-gray-800">R$ {(stats.total / (stats.qtd || 1)).toFixed(2)}</p></div>
              <div className="bg-white p-8 rounded-[40px] shadow-sm border"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Pedidos OK</p><p className="text-4xl font-black text-blue-600">{stats.qtd}</p></div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-black uppercase text-xs text-gray-400 border-b border-gray-50 pb-4">Ranking de Vendas</h3>
              {stats.itens.map(([n, q], idx) => (
                <div key={`rank-${idx}`} className="flex justify-between font-bold text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-800 uppercase text-xs">{n}</span>
                  <span className="bg-red-50 text-red-600 px-4 py-1 rounded-full text-xs font-black">{q}x</span>
                </div>
              ))}
              {stats.itens.length === 0 && <p className="text-center py-10 text-gray-300 font-bold uppercase">Nenhuma venda.</p>}
            </div>
          </div>
        )}

        {aba === 'sistema' && (
          <div className="max-w-2xl bg-white p-10 rounded-[50px] shadow-2xl border border-gray-100 space-y-6 mx-auto">
             <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                <img src={cfg?.logo || LOGO} className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" />
                <label className="bg-black text-white px-6 py-2 rounded-2xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all uppercase flex items-center gap-2">
                  {isUp ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Trocar Logo
                  <input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setCfg({ ...cfg, logo: url }))} />
                </label>
             </div>
             
             <button onClick={() => setCfg({ ...cfg, aberto: !cfg?.aberto })} className={`w-full p-6 rounded-3xl font-black uppercase transition-all shadow-lg ${cfg?.aberto ? 'bg-green-600 text-white shadow-green-100' : 'bg-red-600 text-white shadow-red-100'}`}>
               <Power size={22} className="inline mr-2"/> {cfg?.aberto ? 'LOJA ABERTA' : 'LOJA FECHADA'}
             </button>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-black text-xs text-gray-400 uppercase text-center mb-2">Mensagem de Loja Fechada</h3>
                <div>
                  <textarea 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:border-red-500 resize-none h-24" 
                    value={cfg?.msgFechado || ''} 
                    onChange={e => setCfg({ ...cfg, msgFechado: e.target.value })} 
                    placeholder="Ex: Estamos fechados. Abriremos às 18h."
                  />
                  <p className="text-[9px] text-gray-400 font-bold mt-1 text-center uppercase">Essa mensagem aparece para o cliente quando o botão acima estiver vermelho.</p>
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-black text-xs text-blue-500 uppercase text-center mb-2 flex justify-center items-center gap-1"><MapPin size={14}/> Configuração de Frete por KM</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">CEP da Loja</label><input className="w-full p-4 bg-blue-50 border border-blue-100 rounded-[24px] font-bold outline-none focus:border-blue-500 text-blue-900" value={cfg?.cepLoja || ''} onChange={e => setCfg({ ...cfg, cepLoja: e.target.value })} placeholder="Ex: 13500000"/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Nº da Loja</label><input type="text" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-[24px] font-bold outline-none focus:border-blue-500 text-blue-900" value={cfg?.numLoja || ''} onChange={e => setCfg({ ...cfg, numLoja: e.target.value })} placeholder="Ex: 3021"/></div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-[9px] font-black uppercase text-gray-400 px-2 mb-1 block text-center">Taxa Mínima</label><input type="number" step="0.5" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none text-center" value={cfg?.taxaMinima || 0} onChange={e => setCfg({ ...cfg, taxaMinima: parseFloat(e.target.value) })}/></div>
                  <div><label className="text-[9px] font-black uppercase text-gray-400 px-2 mb-1 block text-center">KM Incluso</label><input type="number" step="0.5" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none text-center" value={cfg?.kmIncluso || 0} onChange={e => setCfg({ ...cfg, kmIncluso: parseFloat(e.target.value) })}/></div>
                  <div><label className="text-[9px] font-black uppercase text-gray-400 px-2 mb-1 block text-center">Valor KM Extra</label><input type="number" step="0.5" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none text-center" value={cfg?.valorKm || 0} onChange={e => setCfg({ ...cfg, valorKm: parseFloat(e.target.value) })}/></div>
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100 bg-red-50 p-6 rounded-3xl border border-red-100">
                <h3 className="font-black text-xs text-red-600 uppercase text-center mb-2 flex justify-center items-center gap-1"><Wand2 size={14}/> Assistente Mágico</h3>
                <p className="text-[10px] text-red-500 font-bold text-center mb-4">Clique aqui para corrigir as Pizzas Doces e limpar falhas nos preços.</p>
                <button onClick={arrumarBancoDeDados} disabled={loadingMagic} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase shadow-lg hover:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {loadingMagic ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18}/>} Ajustar Banco de Dados
                </button>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-black text-xs text-purple-500 uppercase text-center mb-2 flex justify-center items-center gap-1"><ImgIcon size={14}/> Splash Screen (Tela de Aviso)</h3>
                {cfg?.splashImg && (
                  <div className="flex justify-center"><img src={cfg.splashImg} className="w-full max-w-[200px] h-auto rounded-2xl shadow-md border border-gray-200" /></div>
                )}
                <div className="flex items-center gap-4 justify-between bg-gray-50 p-4 rounded-3xl border border-gray-100">
                  <label className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black cursor-pointer hover:bg-purple-600 transition-all uppercase flex items-center gap-2">
                    <Upload size={12}/> Foto do Aviso
                    <input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setCfg({ ...cfg, splashImg: url }))} />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 accent-purple-600" checked={cfg?.splashAtivo || false} onChange={e => setCfg({ ...cfg, splashAtivo: e.target.checked })} />
                    <span className="font-bold text-xs uppercase text-purple-600">Ativar Splash</span>
                  </label>
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-black text-xs text-orange-500 uppercase text-center mb-2 flex justify-center items-center gap-1"><Flame size={14}/> Configurar Preços das Promoções Fixo no App</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={cfg?.promoBroto || false} onChange={e => setCfg({ ...cfg, promoBroto: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-gray-700">Promo Broto</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-orange-500 text-orange-600" value={cfg?.precoPromoBroto || 0} onChange={e => setCfg({ ...cfg, precoPromoBroto: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={cfg?.promoGrande || false} onChange={e => setCfg({ ...cfg, promoGrande: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-gray-700">Promo Grande</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-orange-500 text-orange-600" value={cfg?.precoPromoGrande || 0} onChange={e => setCfg({ ...cfg, precoPromoGrande: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={cfg?.promoGigante || false} onChange={e => setCfg({ ...cfg, promoGigante: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-gray-700">Promo Gigante</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-orange-500 text-orange-600" value={cfg?.precoPromoGigante || 0} onChange={e => setCfg({ ...cfg, precoPromoGigante: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={cfg?.promoMeioMetro || false} onChange={e => setCfg({ ...cfg, promoMeioMetro: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-gray-700">Promo 1/2 Metro</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-orange-500 text-orange-600" value={cfg?.precoPromoMeioMetro || 0} onChange={e => setCfg({ ...cfg, precoPromoMeioMetro: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={cfg?.promoUmMetro || false} onChange={e => setCfg({ ...cfg, promoUmMetro: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-gray-700">Promo 1 Metro</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-orange-500 text-orange-600" value={cfg?.precoPromoUmMetro || 0} onChange={e => setCfg({ ...cfg, precoPromoUmMetro: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-pink-500" checked={cfg?.promoDoce || false} onChange={e => setCfg({ ...cfg, promoDoce: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-pink-600">Promo Doce (Gra.)</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-pink-500 text-pink-600" value={cfg?.precoPromoDoce || 0} onChange={e => setCfg({ ...cfg, precoPromoDoce: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>
                </div>
                
                <button onClick={async () => { await setDoc(doc(db, 'loja_config', 'geral'), cfg); alert('Sistema Salvo e Publicado no App do Cliente!'); }} className="w-full bg-green-500 text-white py-4 rounded-2xl font-black uppercase shadow-lg hover:scale-95 transition-all mt-4 flex justify-center items-center gap-2">
                  <Save size={18}/> Salvar Todas as Configurações
                </button>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-black text-xs text-gray-400 uppercase text-center mb-2">Outras Configurações</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">WhatsApp da Loja</label><input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:border-red-500" value={cfg?.zap || ''} onChange={e => setCfg({ ...cfg, zap: e.target.value })}/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Tempo Médio</label><input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none" value={cfg?.tempo || 0} onChange={e => setCfg({ ...cfg, tempo: e.target.value })} placeholder="Minutos"/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Horário Abertura</label><input type="time" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:border-red-500" value={cfg?.horaAbre || ''} onChange={e => setCfg({ ...cfg, horaAbre: e.target.value })}/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Título da Impressão</label><input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:border-red-500" value={cfg?.topo || ''} onChange={e => setCfg({ ...cfg, topo: e.target.value })}/></div>
                </div>
             </div>

             <button onClick={async () => { await setDoc(doc(db, 'loja_config', 'geral'), cfg); alert('Sistema Salvo com Sucesso!'); }} className="w-full bg-black text-white py-6 rounded-[30px] font-black uppercase shadow-xl hover:scale-95 transition-all flex justify-center items-center gap-2">
               <Save size={20}/> Guardar Configurações Gerais
             </button>
          </div>
        )}
      </main>

      {/* MODAL DE EDIÇÃO */}
      {edit && !pdvConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 z-[100]">
          <form onSubmit={salvar} className="bg-white rounded-[50px] w-full max-w-lg p-10 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black uppercase italic border-b pb-4 flex justify-between items-center text-gray-800 tracking-tighter">Configurar {aba} <button type="button" onClick={() => setEdit(null)}><X size={30} className="text-gray-300 hover:text-black"/></button></h2>
            
            {/* UPLOAD DE IMAGEM INCLUINDO EQUIPE */}
            {['sabores', 'bordas', 'bebidas', 'combos', 'ofertas', 'banners', 'equipe'].includes(aba) && (
              <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                 {aba !== 'bordas' && (
                    edit.img || edit.imageUrl ? (
                        <img src={edit.img || edit.imageUrl} className="w-28 h-28 rounded-[28px] object-cover shadow-xl border-4 border-white" />
                    ) : (
                        <div className="w-28 h-28 rounded-[28px] bg-gray-200 flex items-center justify-center text-gray-400 border-4 border-white"><User size={40}/></div>
                    )
                 )}
                 <label className="bg-black text-white px-6 py-2 rounded-2xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all flex gap-2 items-center uppercase">
                   {isUp ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} {isUp ? 'Aguarde...' : 'Subir Foto'}
                   <input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setEdit({ ...edit, [aba === 'banners' ? 'imageUrl' : 'img']: url }))} />
                 </label>
              </div>
            )}
            
            <div className="space-y-4">
              <input placeholder="Nome / Título" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500 transition-colors" value={edit.name || edit.title || edit.nome || ''} onChange={e => setEdit({ ...edit, [aba === 'banners' ? 'title' : aba === 'equipe' ? 'nome' : 'name']: e.target.value })} required />
              
              {['sabores', 'combos', 'ofertas'].includes(aba) && <textarea placeholder={aba === 'combos' ? "Descrição do Combo..." : aba === 'ofertas' ? "Descrição da Oferta..." : "Ingredientes..."} className="w-full h-24 p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500 transition-colors resize-none" value={edit.desc || edit.description || ''} onChange={e => setEdit({ ...edit, desc: e.target.value, description: e.target.value })} />}
              
              {aba === 'sabores' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <label className="flex flex-col items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl cursor-pointer hover:bg-red-100 transition-colors text-center">
                    <input type="checkbox" className="w-4 h-4 accent-red-600 rounded" checked={edit.isPromo || false} onChange={e => setEdit({ ...edit, isPromo: e.target.checked })} />
                    <span className="font-bold text-red-600 text-[9px] uppercase"><Flame size={12} className="inline mr-1"/> Promoção?</span>
                  </label>
                  
                  <label className="flex flex-col items-center gap-2 p-3 bg-pink-50 border border-pink-100 rounded-2xl cursor-pointer hover:bg-pink-100 transition-colors text-center">
                    <input type="checkbox" className="w-4 h-4 accent-pink-600 rounded" checked={edit.isDoce || false} onChange={e => setEdit({ ...edit, isDoce: e.target.checked })} />
                    <span className="font-bold text-pink-600 text-[9px] uppercase">🍬 Doce?</span>
                  </label>

                  <label className="flex flex-col items-center gap-2 p-3 bg-purple-50 border border-purple-100 rounded-2xl cursor-pointer hover:bg-purple-100 transition-colors text-center">
                    <input type="checkbox" className="w-4 h-4 accent-purple-600 rounded" checked={edit.isCombo || false} onChange={e => setEdit({ ...edit, isCombo: e.target.checked })} />
                    <span className="font-bold text-purple-600 text-[9px] uppercase"><Package size={12} className="inline mr-1"/> Combo?</span>
                  </label>

                  <label className="flex flex-col items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-2xl cursor-pointer hover:bg-green-100 transition-colors text-center">
                    <input type="checkbox" className="w-4 h-4 accent-green-600 rounded" checked={edit.isOferta || false} onChange={e => setEdit({ ...edit, isOferta: e.target.checked })} />
                    <span className="font-bold text-green-600 text-[9px] uppercase"><Ticket size={12} className="inline mr-1"/> Oferta (Frete)?</span>
                  </label>
                </div>
              )}

              {aba === 'bebidas' && (
                <label className="flex items-center justify-center gap-2 p-4 bg-purple-50 border border-purple-100 rounded-3xl cursor-pointer hover:bg-purple-100 transition-colors text-center">
                  <input type="checkbox" className="w-5 h-5 accent-purple-600 rounded" checked={edit.isCombo || false} onChange={e => setEdit({ ...edit, isCombo: e.target.checked })} />
                  <span className="font-bold text-purple-600 text-xs flex items-center gap-1 uppercase"><Package size={14}/> Faz parte de Combos?</span>
                </label>
              )}

              {aba === 'combos' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-400 px-3">Tamanho da Pizza</label>
                      <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-red-500" value={edit.tamanhoId || 'gigante'} onChange={e => setEdit({...edit, tamanhoId: e.target.value})}>
                        <option value="broto">Broto</option>
                        <option value="grande">Grande</option>
                        <option value="gigante">Gigante</option>
                        <option value="meio_metro">1/2 Metro</option>
                        <option value="um_metro">1 Metro</option>
                      </select>
                    </div>
                    <div>
                       <label className="text-[10px] uppercase font-black text-gray-400 px-3">Qtd. Bebidas</label>
                       <input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-red-500" value={edit.qtdBebidas || 1} onChange={e => setEdit({...edit, qtdBebidas: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 px-3">Preço Fixo do Combo</label>
                    <input type="number" step="0.01" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.price || 0} onChange={e => setEdit({ ...edit, price: parseFloat(e.target.value) })}/>
                  </div>
                </>
              )}

              {aba === 'ofertas' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 px-3">Tamanho da Pizza</label>
                    <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-red-500" value={edit.tamanhoId || 'gigante'} onChange={e => setEdit({...edit, tamanhoId: e.target.value})}>
                      <option value="broto">Broto</option>
                      <option value="grande">Grande</option>
                      <option value="gigante">Gigante</option>
                      <option value="meio_metro">1/2 Metro</option>
                      <option value="um_metro">1 Metro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 px-3">Preço Fixo (Com Frete Grátis)</label>
                    <input type="number" step="0.01" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.price || 0} onChange={e => setEdit({ ...edit, price: parseFloat(e.target.value) })}/>
                  </div>
                </>
              )}

              {['sabores', 'bordas'].includes(aba) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['broto', 'grande', 'gigante', 'meio_metro', 'um_metro'].map((t, idx) => (
                    <div key={`edit-tam-${idx}`}>
                      <label className="text-[10px] uppercase font-black text-gray-400 px-3">{t.replace('_',' ')}</label>
                      <input type="number" step="0.01" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-red-500 transition-colors" value={edit.prices?.[t] || ''} onChange={e => setEdit({ ...edit, prices: { ...(edit.prices || {}), [t]: parseFloat(e.target.value) } })}/>
                    </div>
                  ))}
                </div>
              )}
              
              {aba === 'bebidas' && <input type="number" step="0.01" placeholder="Preço Normal" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.price || 0} onChange={e => setEdit({ ...edit, price: parseFloat(e.target.value) })}/>}
              
              {aba === 'equipe' && (
                <>
                  <input placeholder="E-mail GMAIL Autorizado" type="email" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.email || ''} onChange={e => setEdit({ ...edit, email: e.target.value })} />
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 px-3">Cargo no Sistema</label>
                    <select className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.cargo || 'Atendente'} onChange={e => setEdit({...edit, cargo: e.target.value})}>
                      <option value="Atendente">Atendente</option>
                      <option value="Gerente">Gerente</option>
                      <option value="Admin">Administrador</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            
            <button type="submit" disabled={isUp} className="w-full bg-green-600 text-white p-6 rounded-[30px] font-black uppercase shadow-xl hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all">Confirmar Alterações</button>
          </form>
        </div>
      )}

      {/* MODAL DO PDV - ESCOLHER SABORES */}
      {pdvConfig && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center p-4 z-[200]">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <h2 className="text-xl font-black uppercase italic text-gray-800">
                {pdvConfig.tipo === 'pizza' ? `Montar Pizza ${pdvConfig.tamanho?.name || ''}` : pdvConfig.item?.name || ''}
              </h2>
              <button onClick={() => { setPdvConfig(null); setPdvSelS([]); setPdvSelBorda(null); setPdvSelBebidas([]); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* ESCOLHA DE SABORES */}
              {(pdvConfig.tipo === 'pizza' || pdvConfig.tipo === 'combo' || pdvConfig.tipo === 'oferta') && (
                <div>
                  <h3 className="font-black text-xs text-gray-500 uppercase mb-3 flex justify-between">
                    <span>Sabores ({(pdvSelS || []).length} / {pdvConfig.maxFlavors})</span>
                    {(pdvSelS || []).length === pdvConfig.maxFlavors && <CheckCircle2 size={16} className="text-green-500"/>}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      let lista = [];
                      if (pdvConfig.tipo === 'combo') lista = (sabores || []).filter(s => s && s.isCombo);
                      else if (pdvConfig.tipo === 'oferta') lista = (sabores || []).filter(s => s && s.isOferta);
                      else if (pdvConfig.isPromoOnly) lista = (sabores || []).filter(s => s && s.isPromo);
                      else lista = (sabores || []).filter(s => s && (pdvConfig.isDoce ? isPizzaDoce(s) : !isPizzaDoce(s)));

                      const validos = lista.filter(s => s && (pdvConfig.tipo !== 'pizza' || Number(s.prices?.[pdvConfig.tamanho?.id] || 0) > 0));

                      if(validos.length === 0) return <p className="text-xs text-gray-400 col-span-2">Nenhum sabor habilitado com preço.</p>;

                      return validos.map((s, idx) => {
                        const isSel = (pdvSelS || []).some(x => x && x.id === s.id);
                        const isFull = !isSel && (pdvSelS || []).length >= (pdvConfig.maxFlavors || 1);
                        
                        return (
                          <div key={s.id || `sabor-${idx}`} 
                               onClick={() => {
                                 if (isSel) {
                                   setPdvSelS(prev => prev.filter(x => x && x.id !== s.id));
                                 } else {
                                   if ((pdvSelS || []).length < (pdvConfig.maxFlavors || 1)) {
                                     setPdvSelS(prev => [...(prev || []), s]);
                                   }
                                 }
                               }} 
                               className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${isSel ? 'border-red-500 bg-red-50' : isFull ? 'opacity-40 border-gray-100 cursor-not-allowed' : 'border-gray-200 hover:border-gray-300'}`}>
                            
                            <div className="flex justify-between items-start gap-1">
                               <p className={`text-[10px] font-black uppercase leading-tight ${isSel ? 'text-red-600' : 'text-gray-700'}`}>
                                  {s.name}
                               </p>
                               {s.isPromo && <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded uppercase font-black shrink-0">🔥 Promo</span>}
                            </div>
                            
                            {(s.desc || s.description) && (
                               <p className="text-[8px] text-gray-500 mt-1 line-clamp-2 leading-tight">{(s.desc || s.description)}</p>
                            )}

                            {pdvConfig.tipo === 'pizza' && <p className="text-[9px] font-bold text-gray-800 mt-1">+ R$ {Number(getPrecoSabor(s, pdvConfig.tamanho?.id) || 0).toFixed(2)}</p>}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}

              {/* ESCOLHA DE BORDA */}
              {pdvConfig.tipo === 'pizza' && (pdvSelS || []).length > 0 && (bordas || []).filter(b => b && getPrecoBorda(b, pdvConfig.tamanho?.id) > 0).length > 0 && (
                <div>
                  <h3 className="font-black text-xs text-gray-500 uppercase mb-3">Borda Recheada</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div onClick={() => setPdvSelBorda(null)} className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${!pdvSelBorda ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                      <p className={`text-[10px] font-black uppercase ${!pdvSelBorda ? 'text-orange-600' : 'text-gray-700'}`}>Sem Borda</p>
                    </div>
                    {(bordas || []).filter(b => b && getPrecoBorda(b, pdvConfig.tamanho?.id) > 0).map((b, idx) => {
                      const isSel = pdvSelBorda?.id === b.id;
                      return (
                        <div key={b.id || `borda-${idx}`} onClick={() => setPdvSelBorda(b)} className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${isSel ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <p className={`text-[10px] font-black uppercase ${isSel ? 'text-orange-600' : 'text-gray-700'}`}>{b.name}</p>
                          <p className="text-[9px] text-gray-400 mt-1">+ R$ {Number(getPrecoBorda(b, pdvConfig.tamanho?.id) || 0).toFixed(2)}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* BEBIDAS (SÓ PARA COMBO) */}
              {pdvConfig.tipo === 'combo' && pdvConfig.maxBebidas > 0 && (pdvSelS || []).length > 0 && (
                <div>
                  <h3 className="font-black text-xs text-gray-500 uppercase mb-3 flex justify-between">
                    <span>Bebidas Inclusas ({(pdvSelBebidas || []).length} / {pdvConfig.maxBebidas})</span>
                    {(pdvSelBebidas || []).length === pdvConfig.maxBebidas && <CheckCircle2 size={16} className="text-purple-500"/>}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(bebidas || []).filter(b => b && b.isCombo).map((b, idx) => {
                      const qtd = (pdvSelBebidas || []).filter(x => x && x.id === b.id).length;
                      return (
                        <div key={b.id || `beb-${idx}`} className="p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 flex flex-col justify-between items-center gap-2">
                          <p className="text-[10px] font-black text-gray-700 uppercase text-center leading-tight">{b.name}</p>
                          <div className="flex items-center gap-2">
                            {qtd > 0 && <button onClick={() => {
                              const idx = (pdvSelBebidas || []).findIndex(x => x && x.id === b.id);
                              if(idx !== -1) { const n = [...pdvSelBebidas]; n.splice(idx, 1); setPdvSelBebidas(n); }
                            }} className="w-6 h-6 bg-gray-300 rounded text-gray-700 font-bold flex justify-center items-center"><Minus size={12}/></button>}
                            {qtd > 0 && <span className="text-[10px] font-black text-purple-600">{qtd}</span>}
                            <button onClick={() => {
                              if((pdvSelBebidas || []).length < pdvConfig.maxBebidas) setPdvSelBebidas([...(pdvSelBebidas || []), b]);
                            }} disabled={(pdvSelBebidas || []).length >= pdvConfig.maxBebidas} className="w-6 h-6 bg-purple-600 rounded text-white font-bold flex justify-center items-center disabled:opacity-50"><Plus size={12}/></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={addPdvItem}
              disabled={(pdvSelS || []).length === 0 || (pdvConfig.tipo === 'combo' && (pdvSelBebidas || []).length < pdvConfig.maxBebidas)}
              className="mt-6 w-full bg-red-600 text-white p-4 rounded-[20px] font-black uppercase shadow-xl hover:bg-red-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18}/> Adicionar ao Pedido
            </button>
          </div>
        </div>
      )}

      {chatAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-[200] animate-in fade-in">
          <div className="w-full md:w-96 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 bg-black text-white flex justify-between items-center rounded-bl-[40px]">
              <div>
                <h3 className="font-black italic uppercase text-lg leading-tight">{chatAberto.clientName || 'Cliente'}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Online no App
                </p>
              </div>
              <button onClick={() => setChatAberto(null)} className="p-2 bg-gray-900 rounded-full hover:bg-red-600 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {(!chatMsgs || chatMsgs.length === 0) && <p className="text-center text-gray-400 text-xs font-bold mt-10 uppercase">Nenhuma mensagem.</p>}
              {Array.isArray(chatMsgs) && chatMsgs.map((m, idx) => (
                <div key={m.id || `chat-${idx}`} className={`flex ${m?.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-[24px] max-w-[85%] text-sm font-medium shadow-sm ${m?.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                    {m?.text || ''}
                    <span className={`block text-[8px] font-bold mt-1 uppercase ${m?.sender === 'admin' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(m?.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={scrollRef}/>
            </div>
            
            <form onSubmit={enviarMsgAdmin} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input value={adminMsg} onChange={e=>setAdminMsg(e.target.value)} placeholder="Responder cliente..." className="flex-1 bg-gray-100 p-4 rounded-2xl outline-none border border-transparent focus:border-blue-500 text-sm transition-colors" />
              <button type="submit" disabled={!adminMsg.trim()} className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-md shadow-blue-500/20 disabled:opacity-50"><Send size={20}/></button>
            </form>
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