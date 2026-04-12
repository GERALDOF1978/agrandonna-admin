import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { Pizza, CupSoda, Plus, Edit2, Trash2, X, ClipboardList, MapPin, Settings, User, ImageIcon, Power, Phone, Printer, MessageCircle, Send, Upload, BarChart3, Users, LogOut, Search, Loader2, Eye, EyeOff, Flame, History, Image as ImgIcon, Wand2, Save, CircleDashed, Package } from 'lucide-react';

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

export default function App() {
  const [user, setUser] = useState(null);
  const [hasPerm, setHasPerm] = useState(false);
  const [aba, setAba] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [sabores, setSabores] = useState([]);
  const [bordas, setBordas] = useState([]); 
  const [bebidas, setBebidas] = useState([]);
  const [combos, setCombos] = useState([]); // NOVO ESTADO: COMBOS
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

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      if (u) {
        if (u.email === OWNER_EMAIL) {
          setUser(u); setHasPerm(true);
        } else {
          onSnapshot(collection(db, 'admin_users'), s => {
            const lista = s.docs.map(d => d.data().email);
            if (lista.includes(u.email)) { setUser(u); setHasPerm(true); } 
            else { signOut(auth); alert("Acesso Negado!"); }
          });
        }
      } else {
        setHasPerm(false); setUser(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!hasPerm) return;

    const unsubP = onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      const novosPendentes = data.filter(p => p.status === 'pendente').length;
      if (novosPendentes > qtdPendentes.current) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Áudio bloqueado."));
      }
      qtdPendentes.current = novosPendentes;
      setPedidos(data);
    });

    const unsubS = onSnapshot(collection(db, 'menu_sabores'), s => setSabores(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBordas = onSnapshot(collection(db, 'menu_bordas'), s => setBordas(s.docs.map(d => ({ id: d.id, ...d.data() })))); 
    const unsubB = onSnapshot(collection(db, 'menu_bebidas'), s => setBebidas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCombos = onSnapshot(collection(db, 'menu_combos'), s => setCombos(s.docs.map(d => ({ id: d.id, ...d.data() })))); // ESCUTA OS COMBOS
    const unsubN = onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubE = onSnapshot(collection(db, 'admin_users'), s => setEquipe(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const unsubC = onSnapshot(doc(db, 'loja_config', 'geral'), s => {
      if(s.exists()){
        const data = s.data();
        setCfg({
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
        });
      }
    });

    return () => { unsubP(); unsubS(); unsubBordas(); unsubB(); unsubCombos(); unsubN(); unsubE(); unsubC(); };
  }, [hasPerm]);

  useEffect(() => {
    if (!hasPerm || pedidos.length === 0) return;
    const ativos = [...new Set(pedidos.filter(p => ['pendente', 'preparando', 'saiu_entrega'].includes(p.status)).map(p => p.userId))];
    
    const unsubs = ativos.map(uid => {
      return onSnapshot(query(collection(db, 'artifacts', 'grandonna-oficial', 'users', uid, 'chat'), orderBy('timestamp', 'desc')), s => {
        if (!s.empty) {
          const lastMsg = s.docs[0].data();
          if (lastMsg.sender === 'user') setAlertasChat(prev => [...new Set([...prev, uid])]);
          else setAlertasChat(prev => prev.filter(id => id !== uid));
        }
      });
    });

    return () => unsubs.forEach(u => u());
  }, [pedidos, hasPerm]);

  useEffect(() => {
    if (!chatAberto) return;
    const unsub = onSnapshot(collection(db, 'artifacts', 'grandonna-oficial', 'users', chatAberto.userId, 'chat'), s => {
      setChatMsgs(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>a.timestamp-b.timestamp));
      setTimeout(() => scrollRef.current?.scrollIntoView({behavior:'smooth'}), 100);
    });
    return () => unsub();
  }, [chatAberto]);

  const enviarMsgAdmin = async (e) => {
    e.preventDefault(); if (!adminMsg.trim()) return;
    await addDoc(collection(db, 'artifacts', 'grandonna-oficial', 'users', chatAberto.userId, 'chat'), { 
      text: adminMsg, sender: 'admin', timestamp: Date.now() 
    });
    setAdminMsg('');
  };

  const arrumarBancoDeDados = async () => {
    if (!window.confirm("Essa função vai ler todas as pizzas, marcar as doces automaticamente e colocar os preços padroes que faltam. Quer continuar?")) return;
    setLoadingMagic(true);
    let atualizadas = 0;
    const docesNomes = ['chocolate', 'morango', 'nutella', 'prestígio', 'prestigio', 'banana', 'confete', 'sorvete', 'doce', 'romeu', 'julieta', 'brigadeiro', 'ouro branco', 'kit kat'];

    for (const sabor of sabores) {
      const nomeSabor = sabor.name.toLowerCase();
      const isDoce = sabor.isDoce || docesNomes.some(palavra => nomeSabor.includes(palavra));
      const precos = { ...sabor.prices };
      
      if (isDoce) {
        precos.broto = 0; precos.gigante = 0; precos.um_metro = 0;
      } else {
        if (!precos.broto || precos.broto === 0) precos.broto = 34.00;
        if (!precos.um_metro || precos.um_metro === 0) precos.um_metro = 87.90;
      }
      
      await updateDoc(doc(db, 'menu_sabores', String(sabor.id)), { prices: precos, isDoce: isDoce });
      atualizadas++;
    }
    setLoadingMagic(false);
    alert(`Mágica Feita! ${atualizadas} pizzas foram ajustadas.`);
  };

  const imprimirPedido = (p) => {
    const janela = window.open('', '', 'width=300,height=600');
    janela.document.write(`
      <html>
        <head>
          <title>Cupom #${String(p.id).slice(-4).toUpperCase()}</title>
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
          <h1>${cfg.topo || 'A GRANDONNA'}</h1>
          <div class="text-center margin-bot">PEDIDO #${String(p.id).slice(-4).toUpperCase()}</div>
          <div class="text-center margin-bot">${new Date(p.timestamp).toLocaleDateString()} - ${new Date(p.timestamp).toLocaleTimeString()}</div>
          <div class="divisor"></div>
          <div class="bold">CLIENTE:</div>
          <div>${p.clientName}</div>
          <div class="margin-bot">Tel: ${p.clientPhone}</div>
          
          ${p.obs ? `<div class="obs-box">OBS: ${p.obs}</div>` : ''}

          <div class="divisor"></div>
          <div class="bold">${p.entrega === 'retirada' ? 'BALCAO / RETIRADA' : 'DELIVERY'}</div>
          ${p.entrega === 'entrega' ? `
            <div class="margin-bot">${p.end?.rua}, ${p.end?.num} ${p.end?.ref ? `(${p.end.ref})` : ''} - ${p.end?.bairro}</div>
            ${p.end?.distancia ? `<div>Distancia: ${p.end.distancia} km</div>` : ''}
            <div>Frete Cobrado: R$ ${Number(p.end?.taxaCobrada || 0).toFixed(2)}</div>
          ` : ''}
          <div class="divisor"></div>
          <div class="bold margin-bot">ITENS:</div>
          ${p.items?.map(it => `
            <div class="flex bold"><span>1x ${it.name || (it.tipo === 'combo' ? 'Combo' : `PZ ${it.tamanho?.name}`)}</span><span>R$ ${Number(it.precoPizza || it.preco || 0).toFixed(2)}</span></div>
            ${it.sabores ? `<div style="font-size:12px; margin-bottom:2px; padding-left:10px;">${it.sabores.map(s => '+ ' + s.name).join('<br>')}</div>` : ''}
            ${it.bebidasCombo ? `<div style="font-size:12px; margin-bottom:2px; padding-left:10px; color: #555;">Bebidas: ${it.bebidasCombo.map(b => b.name).join(', ')}</div>` : ''}
            ${it.borda ? `<div class="flex" style="font-size:12px; padding-left:10px; font-style: italic;"><span>+ Borda: ${it.borda.name}</span><span>R$ ${Number(it.borda.precoVendido || 0).toFixed(2)}</span></div>` : ''}
            ${(it.borda || it.tipo === 'combo') ? `<div class="flex bold" style="font-size:12px; padding-left:10px; margin-bottom:8px; margin-top:2px; border-top: 1px dotted #ccc;"><span>Subtotal do Item:</span><span>R$ ${Number(it.preco || 0).toFixed(2)}</span></div>` : '<div style="margin-bottom:8px;"></div>'}
          `).join('')}
          <div class="divisor"></div>
          <div class="flex bold" style="font-size: 16px;"><span>TOTAL:</span><span>R$ ${Number(p.total || 0).toFixed(2)}</span></div>
          <div class="divisor"></div>
          <div class="margin-bot">Pagamento: ${p.pag === 'pix_app' ? 'PIX APP' : p.pag.toUpperCase()}</div>
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
    const pedsDoDia = pedidos.filter(p => getDataLocalStr(p.timestamp) === filtroCaixa && p.status === 'entregue');
    const total = pedsDoDia.reduce((a, b) => a + Number(b.total || 0), 0);
    const contagem = {};
    pedsDoDia.flatMap(p => p.items || []).forEach(i => {
      const nome = i.name || (i.tipo === 'combo' ? `Combo ${i.tamanho?.name}` : `PZ ${i.tamanho?.name || 'Pizza'}`);
      contagem[nome] = (contagem[nome] || 0) + 1;
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
    const col = aba === 'sabores' ? 'menu_sabores' : aba === 'bordas' ? 'menu_bordas' : aba === 'bebidas' ? 'menu_bebidas' : aba === 'combos' ? 'menu_combos' : aba === 'banners' ? 'menu_banners' : 'admin_users';
    const data = { ...edit }; const id = data.id; delete data.id;

    try {
      if (id) await setDoc(doc(db, col, String(id)), data, { merge: true });
      else {
        if (['sabores', 'bordas', 'bebidas', 'combos'].includes(aba)) data.isActive = true;
        await addDoc(collection(db, col), data);
      }
      setEdit(null);
    } catch (err) { alert("Erro ao guardar os dados: " + err.message); }
  };

  const toggleActive = async (item) => {
    if (!item || !item.id) return;
    const col = aba === 'sabores' ? 'menu_sabores' : aba === 'bordas' ? 'menu_bordas' : aba === 'combos' ? 'menu_combos' : 'menu_bebidas';
    const newState = item.isActive === false ? true : false;
    try { await setDoc(doc(db, col, String(item.id)), { isActive: newState }, { merge: true }); } 
    catch (err) { alert("Erro ao atualizar disponibilidade: " + err.message); }
  };

  const renderPedidoCard = (p) => {
    const isLatestForUser = pedidos.find(x => x.userId === p.userId)?.id === p.id;
    const temAlerta = alertasChat.includes(p.userId) && isLatestForUser;

    return (
      <div key={p.id} className={`bg-white rounded-[40px] shadow-2xl border-t-8 p-6 flex flex-col gap-4 relative overflow-hidden ${p.status === 'pendente' ? 'border-red-600' : 'border-transparent shadow-gray-200'}`}>
        {p.status === 'pendente' && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none"/>}
        
        <div className="flex justify-between border-b border-gray-50 pb-2 relative z-10">
          <div>
            <span className="font-black text-[10px] text-gray-400 tracking-widest uppercase block">Cod: {String(p.id).slice(-4)}</span>
            <span className="text-[9px] font-bold text-gray-400">{new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div className="flex gap-2">
            {p.status !== 'pendente' && (
              <button onClick={() => imprimirPedido(p)} className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:scale-110 transition-transform shadow-sm" title="Imprimir Pedido">
                <Printer size={14}/>
              </button>
            )}
            <button onClick={() => window.open(`https://wa.me/55${p.clientPhone}`)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:scale-110 transition-transform shadow-sm" title="WhatsApp"><Phone size={14}/></button>
            <button onClick={() => setChatAberto({userId: p.userId, clientName: p.clientName || 'Cliente'})} 
              className={`p-2 rounded-xl transition-all shadow-sm flex items-center gap-1 ${temAlerta ? 'bg-red-600 text-white animate-pulse shadow-red-500/40' : 'bg-blue-50 text-blue-600 hover:scale-110'}`} title="Chat">
              <MessageCircle size={14}/>
              {temAlerta && <span className="text-[8px] font-black uppercase tracking-widest">Nova Msg</span>}
            </button>
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="font-black uppercase text-sm text-gray-900 leading-tight">{p.clientName || 'Cliente sem nome'}</div>
          <div className="text-[10px] font-bold text-gray-500">{p.clientPhone || 'Sem telefone'}</div>
        </div>

        <div className="text-[10px] font-bold text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-2 relative z-10">
          <MapPin size={12} className="text-red-500 shrink-0 mt-0.5"/> 
          <div>
            {p.entrega === 'retirada' ? 'BALCÃO / RETIRADA' : `${p.end?.rua}, ${p.end?.num} ${p.end?.ref ? `(${p.end.ref})` : ''} - ${p.end?.bairro}`}
            {p.entrega === 'entrega' && p.end?.distancia && <span className="block text-[8px] text-blue-500 mt-1">KM Calculado: {p.end.distancia} km | Taxa: R$ {Number(p.end.taxaCobrada || 0).toFixed(2)}</span>}
          </div>
        </div>
        
        <div className="flex-1 py-2 space-y-3 border-y border-gray-50 relative z-10">
          {p.items?.map((it, idx) => (
            <div key={idx} className="flex flex-col border-b border-gray-50 pb-2 last:border-0">
              <div className="flex justify-between font-bold text-xs text-gray-800">
                <span>1x {it.name || (it.tipo === 'combo' ? 'Combo' : `Pizza ${it.tamanho?.name}`)}</span>
                <span className="text-gray-400">R$ {Number(it.precoPizza || it.preco || 0).toFixed(2)}</span>
              </div>
              {it.sabores?.map((s, si) => (
                <p key={si} className="text-[9px] text-red-600 font-bold italic leading-tight mt-1">
                  + {s.name} <span className="text-gray-400 font-medium lowercase">({s.desc || s.description})</span>
                </p>
              ))}
              
              {/* Exibe bebidas do combo se for combo */}
              {it.bebidasCombo && (
                <div className="text-[9px] text-blue-600 font-bold italic leading-tight mt-1 flex flex-col gap-0.5">
                  <span className="text-gray-500 uppercase">Incluso:</span>
                  {it.bebidasCombo.map((b, bi) => <span key={bi}>+ {b.name}</span>)}
                </div>
              )}

              {it.borda && (
                <div className="flex justify-between items-center text-[9px] text-orange-500 font-bold italic leading-tight mt-1">
                  <span>+ Borda: {it.borda.name}</span>
                  <span>R$ {Number(it.borda.precoVendido || 0).toFixed(2)}</span>
                </div>
              )}
              {(it.tipo === 'pizza' && it.borda) || it.tipo === 'combo' ? (
                <div className="flex justify-end text-[10px] text-yellow-600 font-black mt-1">
                  Subtotal: R$ {Number(it.preco || 0).toFixed(2)}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {p.obs && (
          <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 relative z-10">
            <span className="text-[9px] font-black uppercase text-yellow-700 block mb-1 flex items-center gap-1"><Flame size={12}/> Observação do Cliente:</span>
            <span className="text-xs font-bold text-gray-800 italic">{p.obs}</span>
          </div>
        )}

        <div className="bg-gray-50 p-2 rounded-xl text-center border border-gray-100 relative z-10 mt-2">
          <span className="text-[9px] font-black uppercase text-gray-500">
            Pagamento: <span className="text-gray-800">{p.pag === 'pix_app' ? 'PIX APP' : p.pag}</span>
            {p.pag === 'dinheiro' && p.troco && <span className="text-red-500"> (Troco p/ R$ {p.troco})</span>}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5 mt-1 relative z-10">
          <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'pendente' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p.status === 'pendente' ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Pendente</button>
          <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'preparando' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p.status === 'preparando' ? 'bg-yellow-500 text-white shadow-md shadow-yellow-500/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Cozinha</button>
          <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'saiu_entrega' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p.status === 'saiu_entrega' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Entrega</button>
          <button onClick={() => updateDoc(doc(db, 'pedidos', String(p.id)), { status: 'entregue' })} className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${p.status === 'entregue' ? 'bg-green-600 text-white shadow-md shadow-green-500/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Concluído</button>
        </div>
        
        <div className="font-black text-green-600 text-center text-xl pt-2 relative z-10 border-t border-gray-50 mt-1">R$ {Number(p.total || 0).toFixed(2)}</div>
      </div>
    );
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
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4 shadow-2xl z-40 overflow-y-auto">
        <img src={cfg.logo} className="w-20 h-20 rounded-full mx-auto border-2 border-yellow-500 object-cover mb-2 shadow-lg"/>
        <nav className="space-y-1 flex-1">
          {/* ADD ABA COMBOS AQUI */}
          {['pedidos', 'historico', 'sabores', 'bordas', 'bebidas', 'combos', 'banners', 'caixa', 'equipe', 'sistema'].map(m => (
            <button key={m} onClick={() => { setAba(m); setEdit(null); }} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-between transition-all ${aba === m ? 'bg-red-600 shadow-xl scale-105' : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}>
              <div className="flex items-center gap-2">
                {m === 'pedidos' && <ClipboardList size={16}/>}
                {m === 'historico' && <History size={16}/>}
                {m === 'sabores' && <Pizza size={16}/>}
                {m === 'bordas' && <CircleDashed size={16}/>}
                {m === 'bebidas' && <CupSoda size={16}/>}
                {m === 'combos' && <Package size={16}/>}
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

      <main className={`flex-1 p-4 md:p-10 overflow-y-auto transition-colors duration-300 ${['pedidos','historico'].includes(aba) ? 'bg-gray-300' : 'bg-gray-50'}`}>
        <header className="flex justify-between items-center mb-8 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/50 shadow-sm">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900">{aba}</h1>
          {['sabores', 'bordas', 'bebidas', 'combos', 'banners', 'equipe'].includes(aba) && (
            <button onClick={() => {
              if (aba === 'equipe' && !isMst) {
                const p = prompt("Senha Master:");
                if (p === 'GRAN2026') setIsMst(true); else return alert("Senha Incorreta");
              }
              setEdit(
                aba === 'sabores' ? { name: '', desc: '', description: '', prices: { broto: 0, grande: 0, gigante: 0, meio_metro: 0, um_metro: 0 }, img: '', isActive: true, isPromo: false, isDoce: false } :
                aba === 'bordas' ? { name: '', prices: { broto: 0, grande: 0, gigante: 0, meio_metro: 0, um_metro: 0 }, isActive: true } :
                aba === 'combos' ? { name: '', desc: '', price: 0, tamanhoId: 'gigante', qtdBebidas: 1, img: '', isActive: true } :
                aba === 'bebidas' ? { name: '', price: 0, img: '', isActive: true } :
                aba === 'equipe' ? { nome: '', email: '' } :
                { title: '', imageUrl: '' }
              );
            }} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-green-700 active:scale-95 transition-all">Novo {aba}</button>
          )}
        </header>

        {aba === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pedidos
              .filter(p => p.status !== 'entregue' || getDataLocalStr(p.timestamp) === getDataLocalStr())
              .map(renderPedidoCard)}
            {pedidos.filter(p => p.status !== 'entregue' || getDataLocalStr(p.timestamp) === getDataLocalStr()).length === 0 && (
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
              {pedidos.filter(p => getDataLocalStr(p.timestamp) === filtroHist).map(renderPedidoCard)}
              {pedidos.filter(p => getDataLocalStr(p.timestamp) === filtroHist).length === 0 && (
                <p className="col-span-full text-center text-gray-500 font-bold py-10 uppercase">Nenhum pedido encontrado nesta data.</p>
              )}
            </div>
          </div>
        )}

        {/* TABELAS DE PRODUTOS */}
        {['sabores', 'bordas', 'bebidas', 'combos', 'banners', 'equipe'].includes(aba) && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase">
                <tr><th className="p-6">Item / Detalhes</th><th className="p-6">Preços / Informação</th><th className="p-6 text-right">Ações</th></tr>
              </thead>
              <tbody>{(aba === 'sabores' ? sabores : aba === 'bordas' ? bordas : aba === 'combos' ? combos : aba === 'bebidas' ? bebidas : aba === 'banners' ? banners : equipe).map(it => (
                <tr key={it.id} className={`border-b border-gray-50 transition-all group ${it.isActive === false ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                  <td className="p-6 flex items-center gap-4">
                    <div className="relative shrink-0">
                      {(it.img || it.imageUrl) ? (
                        <img src={it.img || it.imageUrl} className={`w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white ${it.isActive === false ? 'grayscale opacity-50' : ''}`}/>
                      ) : (
                        <div className={`w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-white ${it.isActive === false ? 'text-red-300' : 'text-gray-300'}`}>
                          {aba === 'sabores' ? <Pizza size={24}/> : aba === 'bordas' ? <CircleDashed size={24}/> : aba === 'combos' ? <Package size={24}/> : aba === 'bebidas' ? <CupSoda size={24}/> : <User size={24}/>}
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

                        {['sabores', 'bordas', 'bebidas', 'combos'].includes(aba) && it.isActive === false && (
                          <span className="bg-red-100 text-red-600 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider">Esgotado</span>
                        )}
                      </div>
                      
                      {['sabores', 'combos'].includes(aba) && (
                        <p className={`text-[11px] font-black italic mt-1 max-w-[350px] leading-tight uppercase ${it.isActive === false ? 'text-gray-400' : 'text-red-600'}`}>
                          {it.desc || it.description || (aba === 'sabores' ? '⚠️ Sem ingredientes.' : '⚠️ Sem descrição.')}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-6 font-black text-[10px] text-gray-500 uppercase">
                    {aba === 'bebidas' && it.price && <span className={`font-bold px-2 py-1 rounded ${it.isActive === false ? 'text-gray-400 bg-gray-100' : 'text-green-600 bg-green-50'}`}>R$ {Number(it.price || 0).toFixed(2)}</span>}
                    
                    {/* VISUAL DA COLUNA NOVO PARA COMBOS */}
                    {aba === 'combos' && (
                      <div>
                         <span className={`font-bold px-2 py-1 rounded ${it.isActive === false ? 'text-gray-400 bg-gray-100' : 'text-green-600 bg-green-50'}`}>R$ {Number(it.price || 0).toFixed(2)}</span>
                         <p className="text-[9px] mt-1 text-gray-500 uppercase">Tamanho: {it.tamanhoId?.replace('_', ' ')} | Bebidas: {it.qtdBebidas}</p>
                      </div>
                    )}

                    {['sabores', 'bordas'].includes(aba) && it.prices && (
                      <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {it.prices.broto > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Bro: R$ {it.prices.broto}</span>}
                        {it.prices.grande > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Gra: R$ {it.prices.grande}</span>}
                        {it.prices.gigante > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Gig: R$ {it.prices.gigante}</span>}
                        {it.prices.meio_metro > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>1/2M: R$ {it.prices.meio_metro}</span>}
                        {it.prices.um_metro > 0 && <span className={`px-2 py-0.5 rounded text-[9px] ${it.isActive === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>1M: R$ {it.prices.um_metro}</span>}
                      </div>
                    )}
                    {aba === 'equipe' && <span className="lowercase">{it.email}</span>}
                    {aba === 'banners' && <span className="text-[8px] text-gray-300 truncate max-w-[150px] block">{it.imageUrl}</span>}
                  </td>
                  <td className="p-6 text-right space-x-2 whitespace-nowrap">
                    {['sabores', 'bordas', 'bebidas', 'combos'].includes(aba) && (
                      <button onClick={() => toggleActive(it)} className={`p-3 rounded-2xl transition-all mr-2 ${it.isActive === false ? 'text-gray-400 hover:bg-gray-200' : 'text-green-600 hover:bg-green-50'}`}>
                        {it.isActive === false ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    )}
                    <button onClick={() => setEdit(it)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"><Edit2 size={16}/></button>
                    <button onClick={async () => { 
                      if (window.confirm('Eliminar permanentemente?')) {
                        const colName = aba === 'sabores' ? 'menu_sabores' : aba === 'bordas' ? 'menu_bordas' : aba === 'bebidas' ? 'menu_bebidas' : aba === 'combos' ? 'menu_combos' : aba === 'banners' ? 'menu_banners' : 'admin_users';
                        await deleteDoc(doc(db, colName, String(it.id)));
                      }
                    }} className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}</tbody>
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
              {stats.itens.map(([n, q]) => (
                <div key={n} className="flex justify-between font-bold text-sm border-b border-gray-50 pb-2">
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
                <img src={cfg.logo} className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" />
                <label className="bg-black text-white px-6 py-2 rounded-2xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all uppercase flex items-center gap-2">
                  {isUp ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Trocar Logo
                  <input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setCfg({ ...cfg, logo: url }))} />
                </label>
             </div>
             
             <button onClick={() => setCfg({ ...cfg, aberto: !cfg.aberto })} className={`w-full p-6 rounded-3xl font-black uppercase transition-all shadow-lg ${cfg.aberto ? 'bg-green-600 text-white shadow-green-100' : 'bg-red-600 text-white shadow-red-100'}`}>
               <Power size={22} className="inline mr-2"/> {cfg.aberto ? 'LOJA ABERTA' : 'LOJA FECHADA'}
             </button>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-black text-xs text-gray-400 uppercase text-center mb-2">Mensagem de Loja Fechada</h3>
                <div>
                  <textarea 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:border-red-500 resize-none h-24" 
                    value={cfg.msgFechado} 
                    onChange={e => setCfg({ ...cfg, msgFechado: e.target.value })} 
                    placeholder="Ex: Estamos fechados. Abriremos às 18h."
                  />
                  <p className="text-[9px] text-gray-400 font-bold mt-1 text-center uppercase">Essa mensagem aparece para o cliente quando o botão acima estiver vermelho.</p>
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-black text-xs text-blue-500 uppercase text-center mb-2 flex justify-center items-center gap-1"><MapPin size={14}/> Configuração de Frete por KM</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">CEP da Loja</label><input className="w-full p-4 bg-blue-50 border border-blue-100 rounded-[24px] font-bold outline-none focus:border-blue-500 text-blue-900" value={cfg.cepLoja} onChange={e => setCfg({ ...cfg, cepLoja: e.target.value })} placeholder="Ex: 13500000"/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Nº da Loja</label><input type="text" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-[24px] font-bold outline-none focus:border-blue-500 text-blue-900" value={cfg.numLoja} onChange={e => setCfg({ ...cfg, numLoja: e.target.value })} placeholder="Ex: 3021"/></div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-[9px] font-black uppercase text-gray-400 px-2 mb-1 block text-center">Taxa Mínima</label><input type="number" step="0.5" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none text-center" value={cfg.taxaMinima} onChange={e => setCfg({ ...cfg, taxaMinima: parseFloat(e.target.value) })}/></div>
                  <div><label className="text-[9px] font-black uppercase text-gray-400 px-2 mb-1 block text-center">KM Incluso (Mínima)</label><input type="number" step="0.5" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none text-center" value={cfg.kmIncluso} onChange={e => setCfg({ ...cfg, kmIncluso: parseFloat(e.target.value) })}/></div>
                  <div><label className="text-[9px] font-black uppercase text-gray-400 px-2 mb-1 block text-center">Valor por KM Extra</label><input type="number" step="0.5" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none text-center" value={cfg.valorKm} onChange={e => setCfg({ ...cfg, valorKm: parseFloat(e.target.value) })}/></div>
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100 bg-red-50 p-6 rounded-3xl border border-red-100">
                <h3 className="font-black text-xs text-red-600 uppercase text-center mb-2 flex justify-center items-center gap-1"><Wand2 size={14}/> Assistente Mágico</h3>
                <p className="text-[10px] text-red-500 font-bold text-center mb-4">Clique aqui uma vez para o sistema corrigir todas as Pizzas Doces e colocar os preços que faltam (Broto R$34 / 1 Metro R$87,90) nas Salgadas.</p>
                <button onClick={arrumarBancoDeDados} disabled={loadingMagic} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase shadow-lg hover:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {loadingMagic ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18}/>} Aplicar Preços em Massa
                </button>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-black text-xs text-purple-500 uppercase text-center mb-2 flex justify-center items-center gap-1"><ImgIcon size={14}/> Splash Screen (Tela de Aviso)</h3>
                {cfg.splashImg && (
                  <div className="flex justify-center"><img src={cfg.splashImg} className="w-full max-w-[200px] h-auto rounded-2xl shadow-md border border-gray-200" /></div>
                )}
                <div className="flex items-center gap-4 justify-between bg-gray-50 p-4 rounded-3xl border border-gray-100">
                  <label className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black cursor-pointer hover:bg-purple-600 transition-all uppercase flex items-center gap-2">
                    <Upload size={12}/> Foto do Aviso
                    <input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setCfg({ ...cfg, splashImg: url }))} />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 accent-purple-600" checked={cfg.splashAtivo} onChange={e => setCfg({ ...cfg, splashAtivo: e.target.checked })} />
                    <span className="font-bold text-xs uppercase text-purple-600">Ativar Splash</span>
                  </label>
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-black text-xs text-orange-500 uppercase text-center mb-2 flex justify-center items-center gap-1"><Flame size={14}/> Configurar Preços das Promoções Fixo no App</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={cfg.promoBroto} onChange={e => setCfg({ ...cfg, promoBroto: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-gray-700">Promo Broto</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-orange-500 text-orange-600" value={cfg.precoPromoBroto} onChange={e => setCfg({ ...cfg, precoPromoBroto: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={cfg.promoGrande} onChange={e => setCfg({ ...cfg, promoGrande: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-gray-700">Promo Grande</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-orange-500 text-orange-600" value={cfg.precoPromoGrande} onChange={e => setCfg({ ...cfg, precoPromoGrande: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={cfg.promoGigante} onChange={e => setCfg({ ...cfg, promoGigante: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-gray-700">Promo Gigante</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-orange-500 text-orange-600" value={cfg.precoPromoGigante} onChange={e => setCfg({ ...cfg, precoPromoGigante: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={cfg.promoMeioMetro} onChange={e => setCfg({ ...cfg, promoMeioMetro: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-gray-700">Promo 1/2 Metro</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-orange-500 text-orange-600" value={cfg.precoPromoMeioMetro} onChange={e => setCfg({ ...cfg, precoPromoMeioMetro: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={cfg.promoUmMetro} onChange={e => setCfg({ ...cfg, promoUmMetro: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-gray-700">Promo 1 Metro</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-orange-500 text-orange-600" value={cfg.precoPromoUmMetro} onChange={e => setCfg({ ...cfg, precoPromoUmMetro: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" className="w-5 h-5 accent-pink-500" checked={cfg.promoDoce} onChange={e => setCfg({ ...cfg, promoDoce: e.target.checked })} /> 
                      <span className="font-bold text-[10px] uppercase text-pink-600">Promo Doce (Gra.)</span>
                    </label>
                    <input type="number" step="0.01" className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs focus:border-pink-500 text-pink-600" value={cfg.precoPromoDoce} onChange={e => setCfg({ ...cfg, precoPromoDoce: parseFloat(e.target.value) })} placeholder="Preço"/>
                  </div>
                </div>
                
                <button onClick={async () => { await setDoc(doc(db, 'loja_config', 'geral'), cfg); alert('Sistema Salvo e Publicado no App do Cliente!'); }} className="w-full bg-green-500 text-white py-4 rounded-2xl font-black uppercase shadow-lg hover:scale-95 transition-all mt-4 flex justify-center items-center gap-2">
                  <Save size={18}/> Salvar Todas as Configurações
                </button>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-black text-xs text-gray-400 uppercase text-center mb-2">Outras Configurações</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">WhatsApp da Loja</label><input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:border-red-500" value={cfg.zap} onChange={e => setCfg({ ...cfg, zap: e.target.value })}/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Tempo Médio</label><input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none" value={cfg.tempo} onChange={e => setCfg({ ...cfg, tempo: e.target.value })} placeholder="Minutos"/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Horário Abertura</label><input type="time" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:border-red-500" value={cfg.horaAbre} onChange={e => setCfg({ ...cfg, horaAbre: e.target.value })}/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-1 block">Título da Impressão</label><input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:border-red-500" value={cfg.topo} onChange={e => setCfg({ ...cfg, topo: e.target.value })}/></div>
                </div>
             </div>

             <button onClick={async () => { await setDoc(doc(db, 'loja_config', 'geral'), cfg); alert('Sistema Salvo com Sucesso!'); }} className="w-full bg-black text-white py-6 rounded-[30px] font-black uppercase shadow-xl hover:scale-95 transition-all flex justify-center items-center gap-2">
               <Save size={20}/> Guardar Configurações Gerais
             </button>
          </div>
        )}
      </main>

      {/* MODAL DE EDIÇÃO */}
      {edit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 z-[100]">
          <form onSubmit={salvar} className="bg-white rounded-[50px] w-full max-w-lg p-10 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black uppercase italic border-b pb-4 flex justify-between items-center text-gray-800 tracking-tighter">Configurar {aba} <button type="button" onClick={() => setEdit(null)}><X size={30} className="text-gray-300 hover:text-black"/></button></h2>
            
            {['sabores', 'bordas', 'bebidas', 'combos', 'banners'].includes(aba) && (
              <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                 {aba !== 'bordas' && <img src={edit.img || edit.imageUrl || cfg.logo} className="w-28 h-28 rounded-[28px] object-cover shadow-xl border-4 border-white" />}
                 <label className="bg-black text-white px-6 py-2 rounded-2xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all flex gap-2 items-center uppercase">
                   {isUp ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} {isUp ? 'Aguarde...' : 'Subir Foto'}
                   <input type="file" className="hidden" onChange={async e => await handleImg(e.target.files[0], (url) => setEdit({ ...edit, [aba === 'banners' ? 'imageUrl' : 'img']: url }))} />
                 </label>
              </div>
            )}
            
            <div className="space-y-4">
              <input placeholder="Nome / Título" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500 transition-colors" value={edit.name || edit.title || edit.nome} onChange={e => setEdit({ ...edit, [aba === 'banners' ? 'title' : aba === 'equipe' ? 'nome' : 'name']: e.target.value })} required />
              
              {['sabores', 'combos'].includes(aba) && <textarea placeholder={aba === 'combos' ? "Descrição do Combo (Ex: 1 Pizza + 1 Refri)" : "Ingredientes..."} className="w-full h-24 p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500 transition-colors resize-none" value={edit.desc || edit.description || ''} onChange={e => setEdit({ ...edit, desc: e.target.value, description: e.target.value })} />}
              
              {/* CONFIGURAÇÕES ESPECIAIS DE COMBOS */}
              {aba === 'combos' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-400 px-3">Tamanho da Pizza</label>
                      <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-red-500" value={edit.tamanhoId} onChange={e => setEdit({...edit, tamanhoId: e.target.value})}>
                        <option value="broto">Broto</option>
                        <option value="grande">Grande</option>
                        <option value="gigante">Gigante</option>
                        <option value="meio_metro">1/2 Metro</option>
                        <option value="um_metro">1 Metro</option>
                      </select>
                    </div>
                    <div>
                       <label className="text-[10px] uppercase font-black text-gray-400 px-3">Qtd. Bebidas</label>
                       <input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-red-500" value={edit.qtdBebidas} onChange={e => setEdit({...edit, qtdBebidas: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 px-3">Preço Fixo do Combo</label>
                    <input type="number" step="0.01" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.price} onChange={e => setEdit({ ...edit, price: parseFloat(e.target.value) })}/>
                  </div>
                </>
              )}

              {aba === 'sabores' && (
                <div className="flex gap-4">
                  <label className="flex-1 flex flex-col items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-3xl cursor-pointer hover:bg-red-100 transition-colors text-center">
                    <input type="checkbox" className="w-5 h-5 accent-red-600 rounded" checked={edit.isPromo || false} onChange={e => setEdit({ ...edit, isPromo: e.target.checked })} />
                    <span className="font-bold text-red-600 text-xs flex items-center gap-1 uppercase"><Flame size={14}/> Destacar Promoção</span>
                  </label>
                  
                  <label className="flex-1 flex flex-col items-center gap-2 p-4 bg-pink-50 border border-pink-100 rounded-3xl cursor-pointer hover:bg-pink-100 transition-colors text-center">
                    <input type="checkbox" className="w-5 h-5 accent-pink-600 rounded" checked={edit.isDoce || false} onChange={e => setEdit({ ...edit, isDoce: e.target.checked })} />
                    <span className="font-bold text-pink-600 text-xs uppercase">🍬 É Pizza Doce?</span>
                  </label>
                </div>
              )}

              {['sabores', 'bordas'].includes(aba) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['broto', 'grande', 'gigante', 'meio_metro', 'um_metro'].map(t => (
                    <div key={t}>
                      <label className="text-[10px] uppercase font-black text-gray-400 px-3">{t.replace('_',' ')}</label>
                      <input type="number" step="0.01" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-red-500 transition-colors" value={edit.prices?.[t] || 0} onChange={e => setEdit({ ...edit, prices: { ...edit.prices, [t]: parseFloat(e.target.value) } })}/>
                    </div>
                  ))}
                </div>
              )}
              
              {aba === 'bebidas' && <input type="number" step="0.01" placeholder="Preço" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.price} onChange={e => setEdit({ ...edit, price: parseFloat(e.target.value) })}/>}
              {aba === 'equipe' && <input placeholder="E-mail" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:border-red-500" value={edit.email} onChange={e => setEdit({ ...edit, email: e.target.value })} />}
            </div>
            
            <button type="submit" disabled={isUp} className="w-full bg-green-600 text-white p-6 rounded-[30px] font-black uppercase shadow-xl hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all">Confirmar Alterações</button>
          </form>
        </div>
      )}

      {chatAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-[200] animate-in fade-in">
          <div className="w-full md:w-96 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 bg-black text-white flex justify-between items-center rounded-bl-[40px]">
              <div>
                <h3 className="font-black italic uppercase text-lg leading-tight">{chatAberto.clientName}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Online no App
                </p>
              </div>
              <button onClick={() => setChatAberto(null)} className="p-2 bg-gray-900 rounded-full hover:bg-red-600 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {chatMsgs.length === 0 && <p className="text-center text-gray-400 text-xs font-bold mt-10 uppercase">Nenhuma mensagem.</p>}
              {chatMsgs.map(m => (
                <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-[24px] max-w-[85%] text-sm font-medium shadow-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                    {m.text}
                    <span className={`block text-[8px] font-bold mt-1 uppercase ${m.sender === 'admin' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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