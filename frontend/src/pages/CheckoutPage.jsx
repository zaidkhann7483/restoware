import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const CheckoutPage = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [cart] = useState(location.state?.cart || []);
    const [selectedOrder] = useState(location.state?.selectedOrder || null);
    
    // FIX: Only auto-fill phone if it's an existing order being updated
    const [customerPhone, setCustomerPhone] = useState(
        (location.state?.selectedOrder ? (location.state?.customerPhone || localStorage.getItem('customerPhone')) : '') || ''
    );
    
    const [tableNumber, setTableNumber] = useState('');
    const [isPlacing, setIsPlacing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState('');
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (!cart || cart.length === 0) { navigate(`/order/${tableId}`); return; }
        axios.get(`${API}/tables/${tableId}`)
            .then(res => setTableNumber(res.data.tableNumber))
            .catch(() => setTableNumber(''));
    }, [cart, tableId, navigate]);

    const total = cart.reduce((a, i) => a + (i.price * i.quantity), 0);
    const totalItems = cart.reduce((a, i) => a + i.quantity, 0);
    const fmt = n => Number(n).toFixed(2);

    const validatePhone = () => {
        if (!customerPhone.trim()) { setPhoneError('Please enter your phone number'); return false; }
        if (customerPhone.replace(/\D/g, '').length < 6) { setPhoneError('Enter a valid number (min 6 digits)'); return false; }
        setPhoneError('');
        return true;
    };

    const handlePlaceOrder = async () => {
        setError('');
        if (!validatePhone()) return;
        setIsPlacing(true);
        localStorage.setItem('customerPhone', customerPhone.trim());

        const orderData = {
            tableId,
            customerPhone: customerPhone.trim(),
            items: cart.map(i => ({ menuItemId: i._id, quantity: i.quantity, name: i.name, price: i.price })),
            existingOrderId: selectedOrder ? selectedOrder._id : null
        };

        try {
            const res = await axios.post(`${API}/orders`, orderData);
            setPlacedOrderId(res.data.orderId);
            setOrderPlaced(true);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to place order. Please try again.');
        } finally { setIsPlacing(false); }
    };

    // ════════════ SUCCESS SCREEN ════════════
    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white border border-gray-100 p-8 sm:p-10 max-w-sm w-full text-center shadow-sm rounded-xl">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
                        <i className="fas fa-check text-green-600 text-xl"></i>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Order Placed</h1>
                    <p className="text-gray-500 text-sm mb-8">Please show this number to your server.</p>

                    <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Order Number</p>
                        <p className="text-3xl font-bold text-gray-900 mb-4">#{placedOrderId}</p>
                        
                        {/* Added Total Amount */}
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                            <span className="text-sm text-gray-500">Total Amount</span>
                            <span className="text-xl font-bold text-gray-900">₹{fmt(total)}</span>
                        </div>

                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Table {tableNumber}</span>
                            <span>{customerPhone}</span>
                        </div>
                    </div>

                    <button onClick={() => navigate('/')} className="w-full py-3 bg-gray-900 text-white font-bold cursor-pointer hover:bg-gray-800 transition text-sm rounded-lg">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // ════════════ CHECKOUT FORM ════════════
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile top bar */}
            <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(`/order/${tableId}`)} className="w-9 h-9 bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer rounded-lg">
                    <i className="fas fa-arrow-left text-sm"></i>
                </button>
                <h1 className="font-bold text-gray-800 text-sm">Checkout</h1>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    T{tableNumber}
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 pt-14 lg:pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    
                    {/* ──── LEFT: Order Summary ──── */}
                    <div className="lg:col-span-3 order-2 lg:order-1">
                        <button onClick={() => navigate(`/order/${tableId}`)} className="hidden lg:flex items-center text-gray-500 hover:text-gray-900 font-medium gap-2 mb-6 text-sm cursor-pointer transition">
                            <i className="fas fa-arrow-left text-xs"></i> Back to Menu
                        </button>

                        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        Order Summary
                                    </h1>
                                    <p className="text-gray-400 text-xs mt-0.5">{totalItems} {totalItems === 1 ? 'item' : 'items'}{selectedOrder ? ' · Updating' : ''}</p>
                                </div>
                                <div className="bg-gray-50 px-3 py-1.5 rounded-lg">
                                    <span className="text-sm font-bold text-gray-900">T{tableNumber}</span>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className={`p-6 divide-y divide-gray-50 max-h-[60vh] overflow-y-auto ${step === 2 ? 'hidden lg:block' : ''}`}>
                                {cart.map((item) => (
                                    <div key={item._id} className="flex items-center gap-4 py-4">
                                        <div className="relative flex-shrink-0">
                                            {item.image ? (
                                                <img src={item.image} className="w-14 h-14 object-cover rounded-lg" alt={item.name} />
                                            ) : (
                                                <div className="w-14 h-14 bg-gray-50 flex items-center justify-center rounded-lg">
                                                    <i className="fas fa-utensils text-gray-200 text-lg"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{item.quantity} x ₹{fmt(item.price)}</p>
                                        </div>
                                        <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">₹{fmt(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                                <div className="flex justify-between text-base font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>₹{fmt(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ──── RIGHT: Checkout Actions ──── */}
                    <div className="lg:col-span-2 order-1 lg:order-2">
                        <div className="bg-white border border-gray-100 rounded-xl p-6 lg:sticky lg:top-10">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Complete Order</h2>
                            <p className="text-gray-400 text-xs mb-6">Step {step} of 2</p>

                            {selectedOrder && (
                                <div className="mb-5 p-3 bg-amber-50 border border-amber-100 flex items-center gap-2 text-xs text-amber-800 font-medium rounded-lg">
                                    <i className="fas fa-sync-alt text-[10px]"></i>
                                    Updating Order #{selectedOrder.orderId}
                                </div>
                            )}

                            {/* Step Indicators (Modern Pill Style) */}
                            <div className="flex bg-gray-50 p-1 rounded-lg mb-6">
                                <button onClick={() => setStep(1)} className={`flex-1 py-2 text-xs font-medium rounded-md transition cursor-pointer ${step === 1 ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                                    1. Details
                                </button>
                                <button onClick={() => step >= 2 && setStep(2)} className={`flex-1 py-2 text-xs font-medium rounded-md transition cursor-pointer ${step >= 2 ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                                    2. Review & Pay
                                </button>
                            </div>

                            {/* Step 1 Content */}
                            <div className={`${step === 2 ? 'hidden lg:block' : ''}`}>
                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 cursor-pointer">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className={`w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-gray-900 outline-none text-sm transition cursor-text rounded-lg ${phoneError ? 'focus:ring-red-500 bg-red-50' : ''}`}
                                        placeholder="Enter your phone number"
                                        type="tel"
                                        value={customerPhone}
                                        onChange={e => { setCustomerPhone(e.target.value); setPhoneError(''); }}
                                    />
                                    {phoneError && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><i className="fas fa-circle-exclamation text-[10px]"></i>{phoneError}</p>}
                                    <p className="text-[11px] text-gray-400 mt-1.5">Use this to track or continue your order later</p>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-100 flex items-start gap-2 text-xs text-red-700 rounded-lg">
                                        <i className="fas fa-exclamation-triangle mt-0.5 text-[10px]"></i>
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={() => { if (validatePhone()) setStep(2); }}
                                    className="w-full py-2.5 bg-gray-900 text-white font-medium hover:bg-gray-800 transition cursor-pointer text-sm rounded-lg"
                                >
                                    Continue to Review
                                </button>
                            </div>

                            {/* Step 2 Content */}
                            <div className={`${step === 1 ? 'hidden lg:block' : ''}`}>
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-100 flex items-start gap-2 text-xs text-red-700 rounded-lg">
                                        <i className="fas fa-exclamation-triangle mt-0.5 text-[10px]"></i>
                                        {error}
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-lg p-5 mb-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Total Amount</p>
                                            <p className="text-3xl font-bold text-gray-900">₹{fmt(total)}</p>
                                        </div>
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            <p>Table {tableNumber}</p>
                                            <p className="mt-1 font-medium text-gray-700">{customerPhone}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={isPlacing}
                                    className="w-full py-2.5 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition cursor-pointer text-sm rounded-lg"
                                >
                                    {isPlacing ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Placing...</>
                                    ) : (
                                        selectedOrder ? `Update Order ` : `Place Order `
                                    )}
                                </button>
                                <button onClick={() => setStep(1)} className="w-full mt-2 py-2 text-gray-500 font-medium text-xs transition cursor-pointer hover:text-gray-700">
                                    <i className="fas fa-arrow-left mr-1 text-[10px]"></i> Back to details
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-3 mt-6 text-[10px] text-gray-300 uppercase tracking-widest">
                                <span>Secure</span>
                                <span>•</span>
                                <span>Pay at Table</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;