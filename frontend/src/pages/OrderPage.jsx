import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

const OrderPage = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();

    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    const [phoneOrders, setPhoneOrders] = useState([]);
    const [phoneLookupDone, setPhoneLookupDone] = useState(false);
    const [phoneLooking, setPhoneLooking] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('customerPhone');
        if (saved) setPhoneInput(saved);
    }, []);

    useEffect(() => {
        axios.get(`${API}/menu`).then(res => setMenu(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        axios.get(`${API}/orders/table/${tableId}`)
            .then(res => {
                if (res.data.length > 0) setActiveOrders(res.data);
                else setShowModal(false);
            }).catch(console.error);
    }, [tableId]);

    const lookupPhone = async () => {
        if (phoneInput.replace(/\D/g, '').length < 4) return;
        setPhoneLooking(true);
        try {
            const res = await axios.get(`${API}/orders/phone/${phoneInput.trim()}`);
            setPhoneOrders(res.data);
            setPhoneLookupDone(true);
            localStorage.setItem('customerPhone', phoneInput.trim());
        } catch { setPhoneOrders([]); }
        setPhoneLooking(false);
    };

    const addToCart = (item) => {
        setCart(prev => {
            const exists = prev.find(i => i._id === item._id);
            if (exists) return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...item, quantity: 1 }];
        });
        setShowCart(true);
    };

    const decrease = (id) => {
        setCart(prev => {
            const item = prev.find(i => i._id === id);
            if (item && item.quantity > 1) return prev.map(i => i._id === id ? { ...i, quantity: i.quantity - 1 } : i);
            return prev.filter(i => i._id !== id);
        });
    };

    const remove = (id) => setCart(prev => prev.filter(i => i._id !== id));

    const buildCartFromOrder = (order) => {
        return order.items.map(orderItem => {
            const menuItem = menu.find(m => m._id === (orderItem.menuItemId || orderItem._id));
            return {
                ...orderItem,
                _id: orderItem.menuItemId || orderItem._id,
                image: menuItem?.image || orderItem.image || ''
            };
        });
    };

    const handleAddMoreItems = (order) => {
        setSelectedOrder(order);
        setCart(buildCartFromOrder(order));
        setShowModal(false);
    };

    const handleProceedToCheckout = (order) => {
        const updatedCart = buildCartFromOrder(order);
        setCart(updatedCart);
        setSelectedOrder(order);
        navigate(`/checkout/${tableId}`, { state: { cart: updatedCart, selectedOrder: order, customerPhone: phoneInput } });
    };

    const handleNewOrder = () => { setSelectedOrder(null); setCart([]); setShowModal(false); };

    const handleCheckout = () => {
        navigate(`/checkout/${tableId}`, { state: { cart, selectedOrder, customerPhone: phoneInput } });
    };

    const total = cart.reduce((a, i) => a + (i.price * i.quantity), 0);
    const totalItems = cart.reduce((a, i) => a + i.quantity, 0);
    const filteredMenu = menu.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const fmt = n => Number(n).toFixed(2);

    const mergedOrders = (() => {
        const seen = new Set();
        const all = [...phoneOrders, ...activeOrders];
        return all.filter(o => {
            if (seen.has(o._id)) return false;
            seen.add(o._id);
            return true;
        });
    })();

    const OrderCard = ({ order, type }) => (
        <div className={`p-4 mb-3 rounded-xl shadow-sm ${type === 'phone' ? 'bg-indigo-50/50' : 'bg-white'}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">#{order.orderId}</span>
                        {order.tableId?.tableNumber && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">T{order.tableId.tableNumber}</span>
                        )}
                        {type === 'table' && order.customerPhone && (
                            <span className="text-[10px] text-indigo-600 font-medium"><i className="fas fa-phone-alt text-[8px] mr-1"></i>{order.customerPhone}</span>
                        )}
                    </div>
                    <p className="text-sm font-bold text-gray-800">Continue Dinning</p>
                    <p className="text-xs text-gray-500 truncate mb-2">{order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                    <p className="text-sm font-bold text-gray-800">₹{fmt(order.totalAmount)}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                    <button 
                        onClick={() => handleAddMoreItems(order)}
                        className="px-4 py-2 bg-white text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition shadow-sm cursor-pointer"
                    >
                        + Add Items
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen font-sans">

            {/* ════════ ORDER IDENTIFICATION MODAL ════════ */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md shadow-2xl overflow-hidden rounded-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-gray-900 p-6 text-white">
                            <h2 className="text-xl font-bold">Table {activeOrders.length > 0 ? activeOrders[0].tableId?.tableNumber : ''}</h2>
                            <p className="text-gray-400 text-sm mt-1">Look up your order or start new</p>
                        </div>

                        <div className="p-6 max-h-[75vh] overflow-y-auto">
                            {/* Phone Lookup */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 cursor-pointer">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        className="flex-1 px-4 py-3 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/20 outline-none text-sm transition cursor-text"
                                        placeholder="Enter phone number"
                                        type="tel"
                                        value={phoneInput}
                                        onChange={e => { setPhoneInput(e.target.value); setPhoneLookupDone(false); }}
                                        onKeyDown={e => e.key === 'Enter' && lookupPhone()}
                                    />
                                    <button
                                        onClick={lookupPhone}
                                        disabled={phoneInput.replace(/\D/g, '').length < 4 || phoneLooking}
                                        className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg shadow-gray-900/20 cursor-pointer"
                                    >
                                        {phoneLooking ? <i className="fas fa-spinner fa-spin"></i> : 'Find'}
                                    </button>
                                </div>
                            </div>

                            {/* Phone Results */}
                            {phoneLookupDone && (
                                <div className="mb-6">
                                    {phoneOrders.length > 0 ? (
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Found via Phone</p>
                                            {phoneOrders.map(order => <OrderCard key={order._id} order={order} type="phone" />)}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 rounded-xl mb-6 bg-gray-50">
                                            <p className="text-sm text-gray-500">No active orders found for this number</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Divider */}
                            {activeOrders.length > 0 && phoneLookupDone && (
                                <div className="my-6"></div>
                            )}

                            {/* Table Active Orders */}
                            {activeOrders.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Current Table Orders</p>
                                    {activeOrders.map(order => <OrderCard key={order._id} order={order} type="table" />)}
                                </div>
                            )}

                            {/* Start New Order */}
                            <button onClick={handleNewOrder}
                                className="w-full py-3.5 bg-white text-gray-600 font-bold hover:bg-gray-50 transition rounded-xl text-sm cursor-pointer shadow-sm">
                                Start New Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ MAIN CONTENT ════════ */}
            <div className="flex flex-col lg:flex-row flex-1 max-w-7xl mx-auto w-full p-4 gap-6 overflow-hidden">
                
                {/* ──── Menu Grid ──── */}
                <div className="flex-1 overflow-y-auto pr-2 lg:pr-0 scroll-smooth">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm py-4 mb-4">
                        <div className="flex gap-3 items-center">
                            <button onClick={() => navigate('/')} className="text-gray-600 p-2.5 hover:bg-gray-200 rounded-full transition cursor-pointer">
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <div className="flex-1 relative">
                                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
                                <input
                                    className="w-full pl-11 pr-4 py-3 bg-white rounded-xl focus:ring-2 focus:ring-gray-900/10 outline-none text-sm shadow-sm transition cursor-text"
                                    placeholder="Search menu..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer bg-gray-100 p-1 rounded-full w-6 h-6 flex items-center justify-center">
                                        <i className="fas fa-times text-xs"></i>
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setShowCart(true)}
                                className="lg:hidden relative p-3 bg-gray-900 text-white rounded-xl shadow-lg shadow-gray-900/20 cursor-pointer hover:bg-gray-800 transition">
                                <i className="fas fa-shopping-bag text-sm"></i>
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center font-bold border-2 border-gray-50 rounded-full">{totalItems}</span>
                                )}
                            </button>
                        </div>
                        {selectedOrder && (
                            <div className="mt-4 flex items-center justify-between bg-amber-50 px-4 py-3 rounded-xl text-xs text-amber-800 font-medium cursor-pointer hover:bg-amber-100 transition" onClick={() => setShowModal(true)}>
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-edit"></i>
                                    <span>Updating Order #{selectedOrder.orderId}</span>
                                </div>
                                <i className="fas fa-chevron-right text-[10px]"></i>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24 lg:pb-4">
                        {filteredMenu.map(item => {
                            const inCart = cart.find(c => c._id === item._id);
                            return (
                                <div key={item._id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative">
                                    {inCart && (
                                        <div className="absolute top-3 left-3 z-10 bg-gray-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                                            <i className="fas fa-check text-[8px]"></i> {inCart.quantity}
                                        </div>
                                    )}
                                    {/* Removed group-hover and scale effects */}
                                    <div className="relative w-full h-36 overflow-hidden bg-gray-100">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                                <i className="fas fa-utensils text-3xl opacity-20"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex flex-col flex-1">
                                        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-1">{item.name}</h3>
                                        <div className="mt-auto pt-2 flex items-center justify-between">
                                            <span className="font-bold text-gray-900 text-sm">₹{fmt(item.price)}</span>
                                            <button onClick={() => addToCart(item)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer ${
                                                    inCart 
                                                    ? 'bg-green-50 text-green-700' 
                                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                                }`}>
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredMenu.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl">
                                <i className="fas fa-search text-4xl mb-3 text-gray-200"></i>
                                <p className="font-medium text-gray-500">No items found</p>
                                <p className="text-sm mt-1">Try a different search term</p>
                            </div>
                        )}
                    </div>

                    {/* ──── Credits Footer ──── */}
                    <div className="w-full py-8 flex flex-col items-center justify-center gap-2 mt-8">
                        <p className="text-xs text-gray-400 tracking-wide">
                            Developed by <a 
                                href="https://mohammedzaidprotfolio.netlify.app" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                            >
                                Zaid
                            </a>
                        </p>
                    </div>
                </div>

                {/* ════════ MOBILE CART ════════ */}
                <div className={`lg:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out ${showCart ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] max-h-[85vh] flex flex-col">
                        <div className="flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setShowCart(false)}>
                            <div className="w-10 h-1.5 bg-gray-300 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-6 py-4">
                            <h2 className="font-bold text-gray-900 text-lg">Your Order</h2>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{totalItems} Items</span>
                                <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                                    <i className="fas fa-times text-lg"></i>
                                </button>
                            </div>
                        </div>
                        <CartItems cart={cart} decrease={decrease} remove={remove} add={addToCart} fmt={fmt} />
                        <CartFooter total={total} fmt={fmt} disabled={cart.length === 0} onClick={handleCheckout} selectedOrder={selectedOrder} />
                    </div>
                </div>

                {/* ════════ DESKTOP CART ════════ */}
                <div className="hidden lg:flex w-96 flex-col bg-white rounded-2xl shadow-sm h-[calc(100vh-2rem)] sticky top-4 overflow-hidden flex-shrink-0">
                    <div className="p-6 bg-gray-50/50">
                        <h2 className="font-bold text-gray-900 text-lg">Current Order</h2>
                        <p className="text-xs text-gray-500 mt-1">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
                    </div>
                    <CartItems cart={cart} decrease={decrease} remove={remove} add={addToCart} fmt={fmt} />
                    <CartFooter total={total} fmt={fmt} disabled={cart.length === 0} onClick={handleCheckout} selectedOrder={selectedOrder} />
                </div>
            </div>

            {showCart && <div className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-[2px] cursor-pointer" onClick={() => setShowCart(false)}></div>}
        </div>
    );
};

/* ───── Cart Items Component ───── */
const CartItems = ({ cart, decrease, remove, add, fmt }) => (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <i className="fas fa-shopping-basket text-2xl text-gray-300"></i>
                </div>
                <p className="font-medium text-gray-500 text-sm">Your cart is empty</p>
                <p className="text-xs text-gray-400">Add items from the menu</p>
            </div>
        ) : (
            cart.map(item => (
                <div key={item._id} className="flex items-center gap-4 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {item.image ? (
                        <img src={item.image} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" alt={item.name} />
                    ) : (
                        <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-utensils text-gray-200"></i>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-sm truncate mb-1">{item.name}</h4>
                        <span className="text-xs font-semibold text-gray-500">₹{fmt(item.price)}</span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-gray-900 text-sm">₹{fmt(item.price * item.quantity)}</span>
                        <div className="flex items-center bg-gray-50 rounded-lg p-0.5">
                            <button onClick={() => decrease(item._id)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition cursor-pointer">−</button>
                            <span className="w-6 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                            <button onClick={() => add(item)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition cursor-pointer">+</button>
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
);

/* ───── Cart Footer Component ───── */
const CartFooter = ({ total, fmt, disabled, onClick, selectedOrder }) => (
    <div className="p-4 lg:p-6 bg-white">
        <div className="flex justify-between items-end text-xl font-bold text-gray-900 mb-4">
            <span className="text-gray-500 text-sm font-medium mb-1.5">Total Amount</span>
            <span>₹{fmt(total)}</span>
        </div>
        {selectedOrder && (
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-2.5 mb-4 rounded-lg text-xs text-amber-800">
                <i className="fas fa-info-circle"></i>
                Updating order #{selectedOrder.orderId}
            </div>
        )}
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20 cursor-pointer text-sm tracking-wide uppercase"
        >
            {selectedOrder ? 'Update Order' : 'Proceed to Checkout'}
        </button>
    </div>
);

export default OrderPage;