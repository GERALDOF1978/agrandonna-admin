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

export default function AdminApp() {
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

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      if (u) {
        if (u.email === OWNER_EMAIL) {
          setUser(u);
          setHasPerm(true);
        } else {
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

  useEffect(() => {
    if (!hasPerm) return;
    const unsubP = onSnapshot(query(collection(db, 'pedidos'), orderBy('timestamp', 'desc')), s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubS = onSnapshot(collection(db, 'menu_sabores'), s => setSabores(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubB = onSnapshot(collection(db, 'menu_bebidas'), s => setBebidas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubN = onSnapshot(collection(db, 'menu_banners'), s => setBanners(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubE = onSnapshot(collection(db, 'admin_users'), s => setEquipe(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubC = onSnapshot(doc(db, 'loja_config', 'geral'), s => s.exists() && setCfg(s.data()));
    return () => { unsubP(); unsubS(); unsubB(); unsubN(); unsubE(); unsubC(); };
  }, [hasPerm]);

  const handleImg = async (file, callback) => {
    setIsUp(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
      const d = await r.json();
      callback(d.data.url);
    } catch (e) { alert("Erro ao carregar imagem."); }
    setIsUp(false);
  };

  const salvar = async (e) => {
    e.preventDefault();
    const col = aba === 'sabores' ? 'menu_sabores' : aba === 'bebidas' ? 'menu_bebidas' : aba === 'banners' ? 'menu_banners' : 'admin_users';
    const data = { ...edit };
    const id = data.id;
    delete data.id;
    try {
      if (id) {
        await setDoc(doc(db, col, String(id)), data, { merge: true });
      } else {
        if (['sabores', 'bebidas'].includes(aba)) { data.isActive = true; }
        await addDoc(collection(db, col), data);
      }
      setEdit(null);
    } catch (err) { alert("Erro ao guardar dados: " + err.message); }
  };

  const toggleActive = async (item) => {
    if (!item || !item.id) return;
    const col = aba === 'sabores' ? 'menu_sabores' : 'menu_bebidas';
    const newState = item.isActive === false ? true : false;
    try {
      await setDoc(doc(db, col, String(item.id)), { isActive: newState }, { merge: true });
    } catch (err) { alert("Erro ao atualizar disponibilidade: " + err.message); }
  };

  if (!hasPerm) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-[40px] border border-gray-800 text-center">
        <img src={cfg.logo} className="w-24 h-24 rounded-full mx-auto border-2 border-yellow-500 mb-6 object-cover"/>
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full bg-white text-black p-4 rounded-2xl font-bold flex items-center justify-center gap-3">
          Entrar com Google
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col gap-4">
        <img src={cfg.logo} className="w-20 h-20 rounded-full mx-auto border-2 border-yellow-500 object-cover mb-2"/>
        <nav className="space-y-1 flex-1">
          {['pedidos', 'sabores', 'bebidas', 'banners', 'caixa', 'equipe', 'sistema'].map(m => (
            <button key={m} onClick={() => setAba(m)} className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 ${aba === m ? 'bg-red-600' : 'text-gray-500 hover:bg-gray-900'}`}>
              {m}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="text-gray-500 font-bold text-[10px] uppercase flex items-center gap-2 p-2 hover:text-red-500"><LogOut size={14}/> Sair</button>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black uppercase italic text-gray-900">{aba}</h1>
          {['sabores', 'bebidas', 'banners', 'equipe'].includes(aba) && (
            <button onClick={() => setEdit(aba === 'sabores' ? { name: '', desc: '', prices: { grande: 0, gigante: 0 }, img: '', isActive: true } : { name: '', price: 0, img: '', isActive: true })} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl">Novo {aba}</button>
          )}
        </header>

        {['sabores', 'bebidas', 'banners', 'equipe'].includes(aba) && (
          <div className="bg-white rounded-[40px] shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase">
                <tr><th className="p-6">Item / Detalhes</th><th className="p-6">Preços / Informação</th><th className="p-6 text-right">Ações</th></tr>
              </thead>
              <tbody>{(aba === 'sabores' ? sabores : aba === 'bebidas' ? bebidas : aba === 'banners' ? banners : equipe).map(it => (
                <tr key={it.id} className={`border-b border-gray-50 transition-all ${it.isActive === false ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                  <td className="p-6 flex items-center gap-4">
                    <img src={it.img || it.imageUrl || cfg.logo} className={`w-14 h-14 rounded-2xl object-cover ${it.isActive === false ? 'grayscale opacity-50' : ''}`}/>
                    <div>
                      <p className={`font-black uppercase text-xs ${it.isActive === false ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{it.name || it.title || it.nome}</p>
                      {it.isActive === false && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded uppercase font-black">Oculto no Cardápio</span>}
                    </div>
                  </td>
                  <td className="p-6 font-black text-[10px] text-gray-500 uppercase">
                    {aba === 'bebidas' && <span>R$ {it.price?.toFixed(2)}</span>}
                    {aba === 'sabores' && <span>G: R$ {it.prices?.grande} | GG: R$ {it.prices?.gigante}</span>}
                  </td>
                  <td className="p-6 text-right space-x-2 whitespace-nowrap">
                    {['sabores', 'bebidas'].includes(aba) && (
                      <button onClick={() => toggleActive(it)} className={`p-3 rounded-2xl transition-all ${it.isActive === false ? 'bg-red-600 text-white' : 'bg-green-50 text-green-600'}`}>
                        {it.isActive === false ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    )}
                    <button onClick={() => setEdit(it)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"><Edit2 size={16}/></button>
                    <button onClick={async () => { if (window.confirm('Eliminar?')) await deleteDoc(doc(db, aba === 'sabores' ? 'menu_sabores' : 'menu_bebidas', String(it.id))); }} className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </main>
      {/* ... Restante do Modal de Edição omitido por brevidade, mas deve seguir a mesma lógica de setDoc ... */}
    </div>
  );
}