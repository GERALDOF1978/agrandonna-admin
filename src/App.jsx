import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, query, orderBy, where, deleteDoc } from 'firebase/firestore';
import { Pizza, ShoppingBag, Trash2, ArrowLeft, CheckCircle2, CreditCard, MapPin, Flame, X, Plus, Clock, Store, Bike, History, User, Loader2, QrCode, Phone, MessageCircle, Send, Check } from 'lucide-react';

const config = {
  apiKey: "AIzaSyCeeWoPLjf14v12RguHdlL4GjpKs3TGrjA",
  authDomain: "pizzaria-a-grandonna.firebaseapp.com",
  projectId: "pizzaria-a-grandonna",
  storageBucket: "pizzaria-a-grandonna.firebasestorage.app",
  messagingSenderId: "961510711770",
  appId: "1:961510711770:web:44fca1ff969613fc2f20e3"
};

const LOGO = "https://i.ibb.co/WN4kL4xv/logo-pizza.jpg";
const ZAP_LOJA = "5519988723803"; 
const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

const TAMANHOS_FIXOS = [
  { id: 'grande', name: 'Grande', description: '8 Pedaços', maxFlavors: 2, icon: '🍕', order: 1 },
  { id: 'gigante', name: 'Gigante', description: '16 Pedaços', maxFlavors: 3, icon: '🤤', order: 2 },
  { id: 'meio_metro', name: '1/2 Metro', description: 'Até 3 Sabores', maxFlavors: 3, icon: '📏', order: 3 }
];

// LÓGICA MATEMÁTICA PARA DISTÂNCIA (Fórmula de Haversine)
const getDistanciaKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function App() {
  const [aba, setAba] = useState('menu'); 
  const [passo, setPasso] = useState('menu');
  const [cart, setCart] = useState([]); 
  const [tamanhos] = useState(TAMANHOS_FIXOS);
  const [sabores, setSabores] = useState([]); 
  const [bebidas, setBebidas] = useState([]);
  const [banners, setBanners] = useState([]); 
  
  // Conf Atualizado com defaults
  const [conf, setConf] = useState({ tempo: 40, taxaMinima: 6, kmIncluso: 3, valorKm: 1, cepLoja: '13500000' });
  
  const [load, setLoad] = useState(true); 
  const [selT, setSelT] = useState(null);
  const [selS, setSelS] = useState([]); 
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState({ nome: '', telefone: '' }); 
  const [hist, setHist] = useState([]);
  const [entrega, setEntrega] = useState('entrega'); 
  
  // Endereço agora guarda a taxa dinâmica calculada
  const [end, setEnd] = useState({ cep: '', rua: '', num: '', bairro: '', cidade: '', ref: '', distancia: 0, taxaCobrada: 0 });
  const [calculandoFrete, setCalculandoFrete] = useState(false);

  const [pag, setPag] = useState('pix_app'); 
  const [troco, setTroco] = useState('');
  const [chatOpen, setChatOpen] = useState(false); 
  const [msgs, setMsgs] = useState([]); 
  const [newMsg, setNewMsg] = useState('');
  
  const scrollRef = useRef(null);
  
  // Refs para controle de áudio (não piscar na primeira vez que abre o app)
  const isFirstLoadStatus = useRef(true);
  const isFirstLoadChat = useRef(true);
  const statusAtualRef = useRef('');
  const msgCountRef = useRef(0);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Erro no Auth", err));

    return onAuthStateChanged(auth, u => { 
      if(u) { 
        setUser(u); 
        
        onSnapshot(doc(db, 'users', u.uid), s => {
          if(s.exists()) setPerfil(s.data());
        });
        
        onSnapshot(query(collection(db, 'pedidos'), where('userId', '==', u.uid)), s => {
          const meusPedidos = s.docs.map(d => ({id: d.id, ...d.data()}));
          meusPedidos.sort((a, b) => b.timestamp - a.timestamp);
          
          // LÓGICA DE ALERTA DO CLIENTE (MUDANÇA DE STATUS)
          if (meusPedidos.length > 0) {
            const pedidoAtivo = meusPedidos[0]; // Avalia sempre o pedido mais recente
            if (!isFirstLoadStatus.current && pedidoAtivo.status !== statusAtualRef.current && pedidoAtivo.status !== 'pendente') {
               const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
               audio.play().catch(e=>console.log("Audio silenciado"));
            }
            statusAtualRef.current = pedidoAtivo.status;
            isFirstLoadStatus.current = false;
          }
          setHist(meusPedidos);
        });

        onSnapshot(collection(db, 'artifacts', 'grandonna-oficial', 'users', u.uid, 'chat'), s => {
          const m = s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>a.timestamp-b.timestamp);
          
          // LÓGICA DE ALERTA DO CLIENTE (MENSAGEM NOVA DO ADMIN)
          if (!isFirstLoadChat.current && m.length > msgCountRef.current) {
            const ultimaMsg = m[m.length - 1];
            if (ultimaMsg.sender === 'admin') {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
              audio.play().catch(e=>console.log("Audio silenciado"));
            }
          }
          msgCountRef.current = m.length;
          isFirstLoadChat.current = false;

          setMsgs(m);
        });
      }
    });
  }, []);

  useEffect(() => {
    onSnapshot(collection(db, 'menu_sabores'), s => setSabores(s.docs.map(d => ({id: d.id, ...d.data()})).filter(i => i.isActive !== false)));
    onSnapshot(collection(db, 'menu_bebidas'), s => setBebidas(s.docs.map(d => ({id: d.id, ...d.data()})).filter(i => i.isActive !== false)));
    onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({id: d.id, ...d.data()}))));
    
    onSnapshot(doc(db, 'loja_config', 'geral'), s => {
      if(s.exists()) {
        const data = s.data();
        setConf({
          ...data,
          taxaMinima: data.taxaMinima ?? data.taxa ?? 6,
          kmIncluso: data.kmIncluso ?? 3,
          valorKm: data.valorKm ?? 1,
          cepLoja: data.cepLoja ?? '13500000'
        });
      }
    });
    
    setTimeout(() => setLoad(false), 1200);
  }, []);

  // FUNÇÃO MESTRA DE BUSCA DE CEP E CÁLCULO DE DISTÂNCIA
  const buscarCEP = async (v) => {
    const cepCliente = v.replace(/\D/g, ''); 
    setEnd({...end, cep: cepCliente});
    
    if (cepCliente.length === 8) {
      setCalculandoFrete(true);
      try {
        // 1. Acha a rua no ViaCEP
        const res = await fetch(`https://viacep.com.br/ws/${cepCliente}/json/`); 
        const d = await res.json();
        
        if (!d.erro) {
          let novaTaxa = conf.taxaMinima;
          let distanciaFinal = 0;

          // 2. Tenta usar o Geocoder Gratuito (OpenStreetMap) para achar coordenada do Cliente
          const buscaCliente = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(d.logradouro + ', ' + d.localidade)}`);
          const cordCliente = await buscaCliente.json();

          // 3. Tenta achar coordenada da Loja pelo CEP da Configuração
          const buscaLoja = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${conf.cepLoja}&country=Brazil`);
          const cordLoja = await buscaLoja.json();

          // 4. Se conseguiu as duas coordenadas, calcula a matemática do Frete
          if (cordCliente.length > 0 && cordLoja.length > 0) {
            const lat1 = parseFloat(cordLoja[0].lat);
            const lon1 = parseFloat(cordLoja[0].lon);
            const lat2 = parseFloat(cordCliente[0].lat);
            const lon2 = parseFloat(cordCliente[0].lon);
            
            distanciaFinal = getDistanciaKm(lat1, lon1, lat2, lon2);
            
            // Se a distância for maior que a franquia grátis, adiciona o valor por KM
            if (distanciaFinal > conf.kmIncluso) {
               const kmExtra = distanciaFinal - conf.kmIncluso;
               novaTaxa = conf.taxaMinima + (kmExtra * conf.valorKm);
            }
          } else {
             console.log("Coordenada não encontrada pelo serviço gratuito. Aplicando taxa mínima por segurança.");
          }

          setEnd(p => ({...p, rua: d.logradouro, bairro: d.bairro, cidade: d.localidade, distancia: distanciaFinal.toFixed(1), taxaCobrada: novaTaxa}));
        }
      } catch (err) {
        console.error("Erro na busca de CEP", err);
      }
      setCalculandoFrete(false);
    }
  };

  const enviarChat = async (e) => {
    e.preventDefault(); if (!newMsg.trim()) return;
    await addDoc(collection(db, 'artifacts', 'grandonna-oficial', 'users', user.uid, 'chat'), { text: newMsg, sender: 'user', timestamp: Date.now() });
    setNewMsg(''); setTimeout(() => scrollRef.current?.scrollIntoView({behavior:'smooth'}), 100);
  };

  const cancelarPedido = async (id) => {
    if (window.confirm("Você tem certeza que deseja cancelar e excluir este pedido?")) {
      try { await deleteDoc(doc(db, 'pedidos', String(id))); } 
      catch (error) { alert("Erro ao tentar cancelar. Fale conosco pelo Chat ou WhatsApp."); }
    }
  };

  // O total agora usa a taxaCobrada que calculamos no mapa (ou 0 se for retirada)
  const total = useMemo(() => {
    const somaItens = cart.reduce((a, i) => a + i.preco, 0);
    const taxaFrete = entrega === 'entrega' && cart.length ? (end.taxaCobrada || conf.taxaMinima) : 0;
    return somaItens + taxaFrete;
  }, [cart, entrega, end.taxaCobrada, conf.taxaMinima]);

  const statusSteps = ['pendente', 'preparando', 'saiu_entrega', 'entregue'];
  const statusLabels = {
    'pendente': 'Aguardando',
    'preparando': 'Na Cozinha',
    'saiu_entrega': 'A Caminho',
    'entregue': 'Entregue'
  };

  if (load) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-500"><Loader2 className="animate-spin" size={40}/></div>;

  if (conf.aberto === false) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6 border-x border-gray-900 max-w-md mx-auto">
      <img src={LOGO} className="w-24 h-24 rounded-full border-2 border-red-600 grayscale mb-6"/>
      <h1 className="text-3xl font-black italic uppercase text-red-600 mb-2">Loja Fechada</h1>
      <p className="text-gray-400 font-bold">Infelizmente não estamos recebendo pedidos no momento. Volte mais tarde!</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans max-w-md mx-auto border-x border-gray-900 relative">
      <header className="fixed top-0 w-full max-w-md z-50 bg-black/95 backdrop-blur-md border-b border-gray-900 p-4 flex justify-between items-center shadow-2xl shadow-yellow-900/10">
        <div className="flex items-center gap-3">
          <img src={conf.logo || LOGO} className="w-10 h-10 rounded-full border border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] object-cover"/>
          <h1 className="font-black italic text-yellow-500 uppercase tracking-tighter">{conf.topo || 'A GRANDONNA'}</h1>
        </div>
        <button onClick={() => { setAba('menu'); setPasso('cart'); }} className="relative p-2 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors">
          <ShoppingBag className="text-yellow-500"/>
          {cart.length>0 && <span className="absolute -top-2 -right-2 bg-red-600 text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-[0_0_10px_rgba(220,38,38,0.5)]">{cart.length}</span>}
        </button>
      </header>

      <div className="pt-24 pb-32 px-4">
        {/* --- ABA MENU PRINCIPAL --- */}
        {aba === 'menu' && passo === 'menu' && (
          <div className="space-y-6">
            <div className="bg-gray-900 p-3 rounded-2xl flex justify-center gap-4 text-[10px] font-black uppercase text-gray-400 border border-gray-800">
              <span className="flex items-center gap-1"><Clock size={14} className="text-yellow-500"/> {conf.tempo || 40} MIN</span>
              <span className="flex items-center gap-1" title="Taxa base calculada por distância"><Bike size={14} className="text-red-500"/> FRETE: A partir R$ {conf.taxaMinima?.toFixed(2)}</span>
            </div>
            {banners.map(b => <img key={b.id} src={b.imageUrl} className="w-full h-40 object-cover rounded-[32px] border border-gray-800 shadow-xl" />)}
            
            <section className="space-y-4">
              <h2 className="text-yellow-500 font-black italic uppercase text-xs flex items-center gap-2"><Flame size={18} fill="currentColor"/> Promoções</h2>
              <div onClick={() => {setSelT(tamanhos.find(s=>s.id==='grande')); setPasso('sabores');}} className="bg-gradient-to-br from-red-600 to-red-900 p-6 rounded-[32px] cursor-pointer shadow-[0_0_30px_rgba(220,38,38,0.2)] active:scale-95 transition-all border border-red-500/30">
                <span className="bg-black/30 text-white text-[10px] font-black px-2 py-1 rounded mb-2 inline-block uppercase">8 Pedaços</span>
                <h3 className="text-3xl font-black italic leading-none uppercase">Pizza Grande</h3>
                <p className="text-yellow-400 text-4xl font-black mt-2">R$ 47,90</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => {setSelT(tamanhos.find(s=>s.id==='gigante')); setPasso('sabores');}} className="bg-gradient-to-br from-orange-600 to-orange-900 p-5 rounded-[28px] cursor-pointer shadow-lg border border-orange-500/30 active:scale-95 transition-all">
                  <span className="text-[10px] font-bold text-white/50 uppercase">16 Pedaços</span><h3 className="font-black italic text-lg leading-tight">GIGANTE</h3><p className="text-yellow-300 font-black text-2xl mt-1">R$ 72,99</p>
                </div>
                <div onClick={() => {setSelT(tamanhos.find(s=>s.id==='meio_metro')); setPasso('sabores');}} className="bg-gradient-to-br from-yellow-600 to-yellow-900 p-5 rounded-[28px] cursor-pointer shadow-lg border border-yellow-500/30 active:scale-95 transition-all">
                  <span className="text-[10px] font-bold text-white/50 uppercase">Até 3 Sabores</span><h3 className="font-black italic text-lg leading-tight">1/2 METRO</h3><p className="text-white font-black text-2xl mt-1">R$ 52,90</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-black italic uppercase text-xs border-l-4 border-red-600 pl-3">Cardápio de Pizzas</h2>
              <div className="grid gap-3">{tamanhos.map(t => (
                <div key={t.id} onClick={() => {setSelT(t); setPasso('sabores');}} className="bg-gray-900/60 p-4 rounded-2xl flex justify-between items-center border border-gray-800 cursor-pointer hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-4"><span className="text-3xl">{t.icon}</span><div><p className="font-bold">{t.name}</p><p className="text-[10px] text-gray-500 uppercase">{t.description}</p></div></div><ArrowLeft size={18} className="rotate-180 text-gray-700"/>
                </div>
              ))}</div>
            </section>

            <section className="space-y-4 pb-28">
              <h2 className="font-black italic uppercase text-xs border-l-4 border-yellow-500 pl-3">Bebidas Geladas</h2>
              {bebidas.length === 0 && <p className="text-gray-500 text-xs italic">Nenhuma bebida cadastrada ainda.</p>}
              <div className="grid gap-3">{bebidas.map(b => (
                <div key={b.id} className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    {b.img && <img src={b.img} className="w-12 h-12 rounded-xl object-cover border border-gray-800"/>}
                    <div><h4 className="font-bold">{b.name}</h4><p className="text-yellow-500 font-black text-sm">R$ {b.price?.toFixed(2)}</p></div>
                  </div>
                  <button onClick={() => setCart([...cart, { id: Date.now(), preco: b.price, name: b.name }])} className="bg-red-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)] active:scale-90 transition-transform"><Plus size={24}/></button>
                </div>
              ))}</div>
            </section>

            {cart.length > 0 && (
              <div className="fixed bottom-[80px] left-0 right-0 p-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
                <button onClick={() => setPasso('cart')} className="w-full bg-green-600 text-white p-4 rounded-[20px] font-black flex justify-between items-center shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95 transition-all border border-green-400">
                  <div className="bg-black/30 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
                    <ShoppingBag size={14}/> {cart.length} item(s)
                  </div>
                  <span className="uppercase tracking-widest text-sm">Ver Carrinho</span>
                  <span className="bg-black/30 px-3 py-1.5 rounded-xl text-sm">R$ {total.toFixed(2)}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- TELA DE SABORES --- */}
        {aba === 'menu' && passo === 'sabores' && (
          <div className="space-y-6">
            <button onClick={() => setPasso('menu')} className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2 hover:text-white"><ArrowLeft size={16}/> Voltar</button>
            <div className="bg-red-600/10 p-5 rounded-3xl border border-red-600/20 text-center"><h2 className="text-2xl font-black italic uppercase tracking-wider">Pizza {selT?.name}</h2><p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Escolha até {selT?.maxFlavors} sabores</p></div>
            
            <div className="space-y-3 pb-24">
              {sabores.filter(s => s.prices?.[selT?.id] > 0).length === 0 && <p className="text-center text-gray-500 text-sm mt-10">Nenhum sabor cadastrado para este tamanho.</p>}
              
              {sabores.filter(s => s.prices?.[selT?.id] > 0).map(s => {
                const sel = selS.find(x => x.id === s.id); const lim = !sel && selS.length >= selT.maxFlavors;
                return (
                  <div key={s.id} onClick={() => !lim && (sel ? setSelS(selS.filter(x=>x.id!==s.id)) : setSelS([...selS, s]))} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${sel ? 'border-red-600 bg-red-600/10 shadow-[0_0_15px_rgba(220,38,38,0.15)]' : lim ? 'opacity-30 border-gray-900' : 'border-gray-800 bg-gray-900/40 hover:bg-gray-900'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 flex gap-4">
                        {s.img && <img src={s.img} className="w-14 h-14 rounded-xl object-cover border border-gray-800"/>}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-bold ${sel?'text-red-500':'text-white'}`}>{s.name}</h4>
                            {s.isPromo && (
                              <span className="bg-red-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase shadow-[0_0_8px_rgba(220,38,38,0.8)] flex items-center gap-1 animate-pulse">
                                <Flame size={10}/> Promo
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] leading-tight">{s.desc || s.description}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2 shrink-0">
                        <span className="font-bold text-yellow-500 text-sm">R$ {s.prices[selT.id].toFixed(2)}</span>
                        {sel && <CheckCircle2 className="text-red-500" size={18}/>}
                      </div>
                    </div>
                  </div>
                );
            })}</div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-gray-900 z-50 flex justify-between items-center max-w-md mx-auto shadow-2xl">
              <div className="flex flex-col">
                <span className="font-black text-xl">{selS.length} / {selT?.maxFlavors}</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold">Sabores</span>
              </div>
              <button onClick={() => { setCart([...cart, { id: Date.now(), tipo: 'pizza', tamanho: selT, sabores: selS, preco: Math.max(...selS.map(x=>x.prices[selT.id])) }]); setPasso('menu'); setSelS([]); }} disabled={selS.length === 0} className="bg-red-600 px-8 py-4 rounded-2xl font-black uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50 flex items-center gap-2 active:scale-95 transition-all">
                <Plus size={18} /> Adicionar
              </button>
            </div>
          </div>
        )}

        {/* --- TELA DE CARRINHO --- */}
        {aba === 'menu' && passo === 'cart' && (
          <div className="space-y-6">
            <button onClick={() => setPasso('menu')} className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><ArrowLeft size={16}/> Continuar Comprando</button>
            <h2 className="text-2xl font-black italic uppercase">Meu Carrinho</h2>
            {cart.map(i => (
              <div key={i.id} className="bg-gray-900/50 p-4 rounded-2xl flex justify-between items-center border border-gray-800 shadow-sm">
                <div>
                  <p className="font-bold text-sm">{i.name || `Pizza ${i.tamanho?.name}`}</p>
                  {i.sabores && <p className="text-[10px] text-gray-500">{i.sabores.map(s=>s.name).join(' + ')}</p>}
                  <p className="text-yellow-500 font-black text-xs mt-1">R$ {i.preco.toFixed(2)}</p>
                </div>
                <button onClick={() => setCart(cart.filter(x=>x.id!==i.id))} className="p-2 hover:bg-gray-800 rounded-lg"><Trash2 size={20} className="text-gray-500 hover:text-red-500 transition-colors"/></button>
              </div>
            ))}
            {cart.length === 0 && <p className="text-center text-gray-500 font-bold uppercase py-10">Carrinho Vazio</p>}
            {cart.length > 0 && (
              <div className="p-8 bg-gradient-to-br from-gray-900 to-black rounded-[40px] text-center border border-gray-800 shadow-2xl mt-10">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Total Mínimo Estimado</p>
                <p className="text-yellow-500 text-5xl font-black shadow-yellow-500/20 drop-shadow-lg">R$ {total.toFixed(2)}</p>
                <button onClick={() => setPasso('final')} className="w-full bg-red-600 py-5 rounded-2xl mt-8 font-black uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 transition-all flex justify-center items-center gap-2"><Check size={20}/> Ir para o Checkout</button>
              </div>
            )}
          </div>
        )}

        {/* --- TELA FINAL (CHECKOUT COM DISTÂNCIA) --- */}
        {aba === 'menu' && passo === 'final' && (
          <div className="space-y-6">
            <button onClick={() => setPasso('cart')} className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><ArrowLeft size={16}/> Voltar ao Carrinho</button>
            <h2 className="text-2xl font-black italic uppercase text-center">Finalizar Pedido</h2>
            
            <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 shadow-sm space-y-4">
              <h3 className="font-black text-xs text-yellow-500 uppercase flex items-center gap-2"><User size={14}/> Seus Dados</h3>
              <div className="grid gap-3">
                <input placeholder="Seu Nome Completo" className="w-full p-4 bg-black rounded-xl border border-gray-800 font-bold outline-none focus:border-yellow-500 transition-colors" value={perfil.nome} onChange={e=>setPerfil({...perfil, nome: e.target.value})} />
                <input placeholder="WhatsApp (Apenas números)" type="number" className="w-full p-4 bg-black rounded-xl border border-gray-800 font-bold outline-none focus:border-yellow-500 transition-colors" value={perfil.telefone} onChange={e=>setPerfil({...perfil, telefone: e.target.value})} />
              </div>
            </div>

            <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800">
              <button onClick={()=>{setEntrega('entrega'); if(!end.taxaCobrada) setEnd({...end, taxaCobrada: conf.taxaMinima});}} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${entrega==='entrega'?'bg-red-600 text-white shadow-lg':'text-gray-500'}`}>ENTREGA</button>
              <button onClick={()=>setEntrega('retirada')} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${entrega==='retirada'?'bg-yellow-500 text-black shadow-lg':'text-gray-500'}`}>RETIRADA</button>
            </div>
            
            {/* LÓGICA DE ENDEREÇO COM CEP E VALOR DINÂMICO */}
            {entrega === 'entrega' && (
              <div className="space-y-3 bg-gray-900/50 p-6 rounded-3xl border border-gray-800 shadow-sm">
                <div className="relative">
                  <input placeholder="Digite seu CEP" className="w-full p-4 bg-black rounded-xl border border-gray-800 font-bold outline-none focus:border-red-500 transition-colors" value={end.cep} onChange={e=>buscarCEP(e.target.value)} />
                  {calculandoFrete && <Loader2 size={18} className="absolute right-4 top-4 text-gray-500 animate-spin"/>}
                </div>

                {end.rua && (
                  <div className="space-y-3 animate-in fade-in duration-500">
                    <input disabled className="w-full p-4 bg-black/50 rounded-xl text-gray-400 border border-gray-800" value={`${end.rua}, ${end.bairro} - ${end.cidade}`} />
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="Nº" className="col-span-1 p-4 bg-black rounded-xl border border-gray-800 font-bold outline-none focus:border-red-500" value={end.num} onChange={e=>setEnd({...end, num: e.target.value})} />
                      <input placeholder="Referência (opcional)" className="col-span-2 p-4 bg-black rounded-xl border border-gray-800 font-bold outline-none focus:border-red-500" value={end.ref} onChange={e=>setEnd({...end, ref: e.target.value})} />
                    </div>
                    {/* EXIBE A MATEMÁTICA DO FRETE PRO CLIENTE */}
                    <div className="p-3 bg-blue-900/20 border border-blue-900/50 rounded-xl text-center">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Distância e Frete</p>
                      {end.distancia > 0 ? (
                        <p className="text-sm font-black mt-1 text-white">KM Calculado: {end.distancia} km | Taxa de Frete: R$ {end.taxaCobrada?.toFixed(2)}</p>
                      ) : (
                        <p className="text-xs font-bold mt-1 text-gray-400 italic">Usando taxa mínima padrão.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TOTALZÃO ATUALIZADO */}
            <div className="p-6 bg-black rounded-3xl border border-gray-800 text-center shadow-lg">
               <span className="text-[10px] text-gray-500 uppercase font-black">Total a Pagar (Itens + Frete)</span>
               <p className="text-3xl font-black text-yellow-500 mt-1">R$ {total.toFixed(2)}</p>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 space-y-4 shadow-sm">
              <h3 className="font-black text-xs text-gray-400 uppercase text-center mb-4">Pagamento na Entrega</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={()=>setPag('pix_app')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${pag==='pix_app'?'border-teal-500 bg-teal-500/10 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]':'border-gray-800 text-gray-500'}`}><QrCode size={20}/><span className="text-[10px] font-bold">PIX NO APP</span></button>
                <button onClick={()=>setPag('maquininha')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${pag==='maquininha'?'border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]':'border-gray-800 text-gray-500'}`}><CreditCard size={20}/><span className="text-[10px] font-bold uppercase">Maquininha</span></button>
                <button onClick={()=>setPag('dinheiro')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 col-span-2 transition-all ${pag==='dinheiro'?'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]':'border-gray-800 text-gray-500'}`}><p className="text-xl font-black leading-none">R$</p><span className="text-[10px] font-bold uppercase tracking-widest">Dinheiro</span></button>
              </div>
              {pag === 'dinheiro' && <input placeholder="Troco para quanto?" className="w-full p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500 font-bold outline-none text-center" value={troco} onChange={e=>setTroco(e.target.value)} />}
            </div>

            <button onClick={async () => { 
              if(!perfil.nome || !perfil.telefone) return alert("Por favor, preencha seu Nome e WhatsApp na seção 'Seus Dados'!");
              if(entrega === 'entrega' && (!end.rua || !end.num)) return alert("Preencha o endereço de entrega completo!");
              
              await setDoc(doc(db, 'users', user.uid), perfil);
              await addDoc(collection(db, 'pedidos'), { items: cart, total, entrega, end, pag, troco, timestamp: Date.now(), status: 'pendente', userId: user.uid, clientName: perfil.nome, clientPhone: perfil.telefone }); 
              setCart([]); setPasso('sucesso'); 
            }} className="w-full bg-green-600 py-5 rounded-2xl font-black uppercase shadow-[0_0_20px_rgba(34,197,94,0.4)] active:scale-95 transition-all">CONFIRMAR E PEDIR</button>
          </div>
        )}

        {aba === 'menu' && passo === 'sucesso' && (
          <div className="text-center py-20 space-y-8 animate-in zoom-in duration-500">
            <div className="w-32 h-32 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(34,197,94,0.3)] border border-green-500/30">
              <CheckCircle2 size={64} className="animate-bounce" />
            </div>
            <h2 className="text-4xl font-black italic uppercase leading-none text-white">Pedido Recebido!</h2>
            <p className="text-gray-400 font-bold text-sm">A cozinha já foi notificada.</p>
            <button onClick={()=>{setPasso('menu'); setAba('hist');}} className="w-full bg-gray-900 py-5 rounded-2xl font-black uppercase border border-gray-800 tracking-widest hover:bg-gray-800 transition-all shadow-lg text-yellow-500">Acompanhar Status</button>
          </div>
        )}

        {/* --- ABA ACOMPANHAMENTO --- */}
        {aba === 'hist' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic uppercase flex items-center gap-3 border-l-4 border-red-600 pl-3">Acompanhamento</h2>
            {hist.length === 0 && <p className="text-center text-gray-500 font-bold mt-10">Você ainda não tem pedidos.</p>}
            
            {hist.map(o => {
              const currentStepIndex = statusSteps.indexOf(o.status || 'pendente');
              
              return (
                <div key={o.id} className="bg-gray-900/60 p-6 rounded-[32px] border border-gray-800 shadow-xl relative overflow-hidden">
                  <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full pointer-events-none ${
                    o.status === 'pendente' ? 'bg-red-500' : 
                    o.status === 'preparando' ? 'bg-yellow-500' : 
                    o.status === 'saiu_entrega' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="text-[10px] font-black text-gray-500 uppercase block">{new Date(o.timestamp).toLocaleDateString()} • {new Date(o.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="text-xs font-bold text-gray-300">Total: R$ {o.total?.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] font-black bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800 text-gray-400">ID: {String(o.id).slice(-4).toUpperCase()}</span>
                  </div>

                  <div className="mb-8 relative">
                     <div className="absolute top-3 left-0 w-full h-1 bg-gray-800 rounded-full" />
                     <div className="absolute top-3 left-0 h-1 rounded-full transition-all duration-700" 
                          style={{ 
                            width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
                            background: o.status === 'pendente' ? '#ef4444' : o.status === 'preparando' ? '#eab308' : o.status === 'saiu_entrega' ? '#3b82f6' : '#22c55e',
                            boxShadow: `0 0 10px ${o.status === 'pendente' ? '#ef4444' : o.status === 'preparando' ? '#eab308' : o.status === 'saiu_entrega' ? '#3b82f6' : '#22c55e'}`
                          }} 
                     />
                     
                     <div className="relative flex justify-between">
                       {statusSteps.map((step, idx) => {
                         const isPast = idx < currentStepIndex;
                         const isCurrent = idx === currentStepIndex;
                         return (
                           <div key={step} className="flex flex-col items-center gap-2 z-10 w-1/4">
                             <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors duration-500 ${
                               isPast ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)] border-2 border-green-500' :
                               isCurrent ? 
                                (step === 'pendente' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] border-2 border-red-600' :
                                 step === 'preparando' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.6)] border-2 border-yellow-500' :
                                 step === 'saiu_entrega' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] border-2 border-blue-600' :
                                 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.6)] border-2 border-green-500')
                               : 'bg-gray-900 text-gray-600 border-2 border-gray-700'
                             }`}>
                               {isPast ? <Check size={14}/> : (idx + 1)}
                             </div>
                             <span className={`text-[8px] font-black uppercase text-center leading-tight ${isCurrent ? 'text-white' : 'text-gray-500'}`}>{statusLabels[step]}</span>
                           </div>
                         )
                       })}
                     </div>
                  </div>

                  <div className="bg-black/30 p-4 rounded-2xl space-y-1 mb-4 text-xs font-bold text-gray-300 border border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-2 border-b border-gray-800 pb-1">Resumo do Pedido</p>
                    <p className="text-yellow-500 mb-2">{o.clientName} • {o.clientPhone}</p>
                    {o.entrega === 'entrega' ? (
                      <p className="text-gray-400 mb-4 flex items-start gap-1"><MapPin size={12} className="shrink-0 mt-0.5 text-red-500"/> {o.end?.rua}, {o.end?.num} {o.end?.ref ? `(${o.end.ref})` : ''} - {o.end?.bairro}</p>
                    ) : (
                      <p className="text-gray-400 mb-4 flex items-start gap-1"><Store size={12} className="shrink-0 mt-0.5 text-yellow-500"/> Retirar no Balcão</p>
                    )}
                    
                    {o.items?.map((it, idx) => <p key={idx} className="flex justify-between"><span>1x {it.name || `Pizza ${it.tamanho?.name}`}</span></p>)}
                  </div>
                  
                  {o.status === 'pendente' && (
                    <button onClick={() => cancelarPedido(o.id)} className="w-full bg-red-600/10 text-red-500 border border-red-600/30 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 mb-4 hover:bg-red-600 hover:text-white transition-colors">
                      <X size={14}/> Cancelar Pedido
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button onClick={()=>window.open(`https://wa.me/${ZAP_LOJA}`)} className="flex-1 bg-gray-900 border border-gray-800 hover:border-green-500 text-green-500 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors"><Phone size={14}/> Loja</button>
                    <button onClick={()=>setChatOpen(true)} className="flex-1 bg-gray-900 border border-gray-800 hover:border-blue-500 text-blue-400 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors"><MessageCircle size={14}/> Chat</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {passo === 'menu' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-gray-900 p-3 flex justify-around items-center max-w-md mx-auto z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <button onClick={()=>{setAba('menu'); setPasso('menu');}} className={`flex-1 flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl mx-2 ${aba==='menu'?'text-yellow-500 bg-yellow-500/10':'text-gray-600 hover:text-gray-400'}`}><Store size={22}/><span className="text-[9px] font-black uppercase tracking-widest">Início</span></button>
          <button onClick={()=>setAba('hist')} className={`flex-1 flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl mx-2 ${aba==='hist'?'text-red-500 bg-red-600/10':'text-gray-600 hover:text-gray-400'}`}><History size={22}/><span className="text-[9px] font-black uppercase tracking-widest">Pedidos</span></button>
        </nav>
      )}

      {chatOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="p-4 border-b border-gray-900 flex justify-between items-center bg-black/50"><div className="flex items-center gap-3"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/><span className="font-black italic uppercase text-sm">Suporte A Grandonna</span></div><button onClick={()=>setChatOpen(false)} className="bg-gray-900 p-2 rounded-full hover:bg-gray-800"><X size={20}/></button></div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">{msgs.map(m=>(<div key={m.id} className={`flex ${m.sender==='user'?'justify-end':'justify-start'}`}><div className={`p-4 rounded-[24px] max-w-[80%] text-sm font-medium shadow-md ${m.sender==='user'?'bg-red-600 text-white rounded-tr-none shadow-[0_5px_15px_rgba(220,38,38,0.2)]':'bg-gray-800 text-gray-200 rounded-tl-none'}`}>{m.text}</div></div>))}<div ref={scrollRef}/></div>
           <form onSubmit={enviarChat} className="p-4 bg-black border-t border-gray-900 flex gap-2 pb-10"><input value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder="Escreva sua mensagem..." className="flex-1 bg-gray-900 p-4 rounded-2xl outline-none border border-gray-800 text-sm focus:border-red-500 transition-colors" /><button className="bg-red-600 w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 shadow-[0_0_15px_rgba(220,38,38,0.3)]"><Send size={20}/></button></form>
        </div>
      )}
    </div>
  );
}