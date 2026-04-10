import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { 
  Pizza, Image as ImageIcon, CupSoda, Plus, Edit2, Trash2, 
  Save, X, Lock, Flame, ClipboardList, CheckCircle2, Clock, Truck, MapPin
} from 'lucide-react';

// --- SUAS CHAVES DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCeeWoPLjf14v12RguHdlL4GjpKs3TGrjA",
  authDomain: "pizzaria-a-grandonna.firebaseapp.com",
  projectId: "pizzaria-a-grandonna",
  storageBucket: "pizzaria-a-grandonna.firebasestorage.app",
  messagingSenderId: "961510711770",
  appId: "1:961510711770:web:44fca1ff969613fc2f20e3",
  measurementId: "G-T9ZXS4C0G8"
};

let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Erro Firebase", e);
}

export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // Nova aba: pedidos
  const [activeTab, setActiveTab] = useState('pedidos'); 
  
  // Dados do BD
  const [banners, setBanners] = useState([]);
  const [flavors, setFlavors] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [orders, setOrders] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === '1234') { 
      setIsAuthenticated(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  useEffect(() => {
    if (!db || !isAuthenticated) return;

    const unsubBanners = onSnapshot(collection(db, 'menu_banners'), (snap) => {
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubFlavors = onSnapshot(collection(db, 'menu_sabores'), (snap) => {
      setFlavors(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.name.localeCompare(b.name)));
    });

    const unsubDrinks = onSnapshot(collection(db, 'menu_bebidas'), (snap) => {
      setDrinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Ouvindo os pedidos em tempo real (ordenados do mais novo para o mais velho)
    const qOrders = query(collection(db, 'pedidos'), orderBy('timestamp', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubBanners(); unsubFlavors(); unsubDrinks(); unsubOrders(); };
  }, [isAuthenticated]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const collectionName = activeTab === 'banners' ? 'menu_banners' : activeTab === 'sabores' ? 'menu_sabores' : 'menu_bebidas';
      if (editItem.id) {
        const docRef = doc(db, collectionName, editItem.id);
        const dataToSave = { ...editItem };
        delete dataToSave.id;
        await updateDoc(docRef, dataToSave);
      } else {
        await addDoc(collection(db, collectionName), editItem);
      }
      setIsEditing(false);
      setEditItem(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar.");
    }
  };

  const handleDelete = async (id, collectionName) => {
    if (window.confirm("Excluir este item?")) {
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'pedidos', orderId), { status: newStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const openEditor = (item = null) => {
    if (item) {
      setEditItem(item);
    } else {
      if (activeTab === 'banners') setEditItem({ title: '', imageUrl: '', active: true });
      if (activeTab === 'sabores') setEditItem({ name: '', description: '', category: 'salgada', isPromo: false, prices: { media: 0, grande: 0, gigante: 0, meio_metro: 0, metro: 0 } });
      if (activeTab === 'bebidas') setEditItem({ name: '', price: 0, order: 99 });
    }
    setIsEditing(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-black p-8 rounded-3xl shadow-2xl border border-gray-800 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <Lock size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white italic mb-2">Acesso Admin</h1>
          <p className="text-gray-400 text-sm mb-6">Pizzaria A Grandonna</p>
          <input type="password" placeholder="Senha" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-gray-900 text-white p-4 rounded-xl text-center tracking-[0.5em] mb-4 border border-gray-800 outline-none focus:border-red-500" />
          <button type="submit" className="w-full bg-red-600 text-white p-4 rounded-xl font-bold uppercase tracking-widest hover:bg-red-700">Entrar</button>
        </form>
      </div>
    );
  }

  // Conta quantos pedidos estão pendentes/preparando
  const activeOrdersCount = orders.filter(o => o.status === 'pendente' || o.status === 'preparando').length;

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
      
      {/* MENU LATERAL */}
      <aside className="w-full md:w-64 bg-black text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-black italic text-yellow-500 uppercase">A Grandonna</h2>
          <p className="text-xs text-gray-400">Painel de Controle</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('pedidos')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${activeTab === 'pedidos' ? 'bg-red-600 text-white' : 'hover:bg-gray-900 text-gray-400'}`}>
            <div className="flex items-center gap-3"><ClipboardList size={20} /> <span className="font-bold">Pedidos</span></div>
            {activeOrdersCount > 0 && <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{activeOrdersCount}</span>}
          </button>
          <button onClick={() => setActiveTab('banners')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'banners' ? 'bg-red-600 text-white' : 'hover:bg-gray-900 text-gray-400'}`}>
            <ImageIcon size={20} /> <span className="font-bold">Banners</span>
          </button>
          <button onClick={() => setActiveTab('sabores')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'sabores' ? 'bg-red-600 text-white' : 'hover:bg-gray-900 text-gray-400'}`}>
            <Pizza size={20} /> <span className="font-bold">Sabores</span>
          </button>
          <button onClick={() => setActiveTab('bebidas')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'bebidas' ? 'bg-red-600 text-white' : 'hover:bg-gray-900 text-gray-400'}`}>
            <CupSoda size={20} /> <span className="font-bold">Bebidas</span>
          </button>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-black text-gray-800 capitalize">{activeTab}</h1>
            <p className="text-gray-500">Gerencie sua pizzaria em tempo real.</p>
          </div>
          {activeTab !== 'pedidos' && (
            <button onClick={() => openEditor()} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg active:scale-95 transition-transform">
              <Plus size={20} /> Adicionar Novo
            </button>
          )}
        </div>

        {/* LISTAGEM: PEDIDOS (NOVO) */}
        {activeTab === 'pedidos' && (
          <div className="space-y-4">
            {orders.length === 0 && <div className="text-center py-20 text-gray-400"><ClipboardList size={48} className="mx-auto mb-4 opacity-50"/><p>Nenhum pedido no momento.</p></div>}
            
            {orders.map(order => (
              <div key={order.id} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${order.status === 'pendente' ? 'border-red-400' : order.status === 'preparando' ? 'border-yellow-400' : 'border-gray-200'}`}>
                {/* Cabeçalho do Pedido */}
                <div className="bg-gray-50 p-4 border-b flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded-lg text-sm">#{order.id.slice(-5).toUpperCase()}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14}/> {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                  <div className="font-black text-lg text-green-700">R$ {order.total.toFixed(2)} ({order.paymentMethod.toUpperCase()})</div>
                </div>

                {/* Corpo do Pedido */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Itens do Pedido</h4>
                    <ul className="space-y-2 text-sm">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="font-bold text-red-600">1x</span>
                          <div>
                            <p className="font-bold text-gray-700">{item.type === 'pizza' ? `Pizza ${item.size.name}` : item.name}</p>
                            {item.type === 'pizza' && <p className="text-gray-500 text-xs">{item.flavors.map(f => f.name).join(' / ')}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2"><MapPin size={16}/> Entrega</h4>
                    <p className="text-sm text-orange-900 font-medium">{order.address.street}, {order.address.number}</p>
                    <p className="text-sm text-orange-700">{order.address.neighborhood}</p>
                  </div>
                </div>

                {/* Rodapé: Ações de Status */}
                <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-2">
                  <button onClick={() => updateOrderStatus(order.id, 'pendente')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 ${order.status === 'pendente' ? 'bg-red-100 text-red-700 border border-red-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                    <Clock size={16}/> Pendente
                  </button>
                  <button onClick={() => updateOrderStatus(order.id, 'preparando')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 ${order.status === 'preparando' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                    <Flame size={16}/> Preparando
                  </button>
                  <button onClick={() => updateOrderStatus(order.id, 'saiu_entrega')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 ${order.status === 'saiu_entrega' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                    <Truck size={16}/> Saiu p/ Entrega
                  </button>
                  <button onClick={() => updateOrderStatus(order.id, 'entregue')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 ${order.status === 'entregue' ? 'bg-green-100 text-green-700 border border-green-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                    <CheckCircle2 size={16}/> Entregue
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LISTAGEM: BANNERS */}
        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.length === 0 && <p className="text-gray-500">Nenhum banner cadastrado.</p>}
            {banners.map(banner => (
              <div key={banner.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-40 object-cover bg-gray-100" />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-800">{banner.title}</h3>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {banner.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditor(banner)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1"><Edit2 size={16}/> Editar</button>
                    <button onClick={() => handleDelete(banner.id, 'menu_banners')} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LISTAGEM: SABORES (Simplificada) */}
        {activeTab === 'sabores' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 text-sm">
                  <th className="p-4 font-semibold">Sabor</th>
                  <th className="p-4 font-semibold hidden md:table-cell">Categoria</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {flavors.map(flavor => (
                  <tr key={flavor.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold text-gray-800 flex items-center gap-2">{flavor.name} {flavor.isPromo && <Flame size={14} className="text-red-500"/>}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{flavor.description}</div>
                    </td>
                    <td className="p-4 capitalize text-sm hidden md:table-cell">{flavor.category}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEditor(flavor)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-block"><Edit2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LISTAGEM: BEBIDAS */}
        {activeTab === 'bebidas' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drinks.map(drink => (
              <div key={drink.id} className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center">
                <div><h3 className="font-bold text-gray-800">{drink.name}</h3><p className="text-green-600 font-bold">R$ {drink.price.toFixed(2)}</p></div>
                <div className="flex gap-1 flex-col"><button onClick={() => openEditor(drink)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={16}/></button></div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE EDIÇÃO RESTAURADO DO CÓDIGO ANTERIOR */}
      {isEditing && editItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold">{editItem.id ? 'Editar' : 'Novo'} Item</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400"><X size={24}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'banners' && (
                <>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                  <input type="text" className="w-full p-3 border rounded-xl" value={editItem.title} onChange={e => setEditItem({...editItem, title: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">URL da Imagem</label>
                  <input type="text" className="w-full p-3 border rounded-xl" value={editItem.imageUrl} onChange={e => setEditItem({...editItem, imageUrl: e.target.value})} /></div>
                  <label className="flex items-center gap-2"><input type="checkbox" className="w-5 h-5" checked={editItem.active} onChange={e => setEditItem({...editItem, active: e.target.checked})} /> Ativo</label>
                </>
              )}
              {activeTab === 'bebidas' && (
                <>
                  <div><label className="block text-sm font-bold mb-1">Nome</label><input type="text" className="w-full p-3 border rounded-xl" value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold mb-1">Preço (R$)</label><input type="number" className="w-full p-3 border rounded-xl" value={editItem.price} onChange={e => setEditItem({...editItem, price: parseFloat(e.target.value)||0})} /></div>
                </>
              )}
              {activeTab === 'sabores' && (
                <>
                  <div><label className="block text-sm font-bold mb-1">Sabor</label><input type="text" className="w-full p-3 border rounded-xl" value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold mb-1">Descrição</label><textarea className="w-full p-3 border rounded-xl" value={editItem.description} onChange={e => setEditItem({...editItem, description: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <select className="w-full p-3 border rounded-xl" value={editItem.category} onChange={e => setEditItem({...editItem, category: e.target.value})}><option value="salgada">Salgada</option><option value="doce">Doce</option></select>
                    <label className="flex items-center gap-2"><input type="checkbox" className="w-5 h-5" checked={editItem.isPromo} onChange={e => setEditItem({...editItem, isPromo: e.target.checked})} /> Promoção?</label>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border mt-4">
                    <h4 className="font-bold text-gray-800 mb-3">Preços (R$)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {['media', 'grande', 'gigante', 'meio_metro', 'metro'].map(t => (
                        <div key={t}><label className="block text-xs text-gray-500 capitalize">{t.replace('_',' ')}</label><input type="number" className="w-full p-2 border rounded-lg" value={editItem.prices[t]} onChange={e => setEditItem({...editItem, prices: {...editItem.prices, [t]: parseFloat(e.target.value)||0}})} /></div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="px-6 py-3 font-bold text-gray-600">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-3 font-bold text-white bg-green-600 rounded-xl"><Save size={20}/> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}