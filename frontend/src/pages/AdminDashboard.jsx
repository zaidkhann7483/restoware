import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../utils/api';

const AdminDashboard = () => {
    const [tables, setTables] = useState([]);
    const [selectedTableOrders, setSelectedTableOrders] = useState(null);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);
    
    // States for Bill Modal
    const [viewingOrder, setViewingOrder] = useState(null);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const res = await api.get('/tables');
            setTables(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTableClick = async (tableId) => {
        setSelectedTableId(tableId);
        setSidebarOpen(false);
        try {
            const res = await api.get(`/orders/table/${tableId}`);
            setSelectedTableOrders(res.data);
        } catch (err) {
            setSelectedTableOrders([]);
        }
    };

    const markPaid = async (orderId) => {
        setPayingId(orderId);
        try {
            await api.patch(`/orders/${orderId}/pay`);
            fetchTables();
            if (selectedTableId) {
                handleTableClick(selectedTableId);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPayingId(null);
        }
    };

    // Bill Modal Handlers
    const handleViewBill = (order) => {
        setViewingOrder(order);
    };

    const handlePrintBill = () => {
        window.print();
    };

    const handleCloseBill = () => {
        setViewingOrder(null);
    };

    const handleMarkPaidFromBill = async () => {
        if (!viewingOrder) return;
        await markPaid(viewingOrder._id);
        handleCloseBill();
    };

    const occupiedCount = tables.filter(t => t.status === 'Occupied').length;
    const availableCount = tables.filter(t => t.status !== 'Occupied').length;

    // Helper for formatting date cleanly for receipts
    const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
    const fmt = n => Number(n).toFixed(2);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <AdminSidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col">

                {/* Mobile Header */}
                <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 cursor-pointer">
                        <i className="fas fa-bars text-sm"></i>
                    </button>
                    <h1 className="font-bold text-gray-800 dark:text-white text-sm">Orders</h1>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-10">

                    {/* Title */}
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-1">Orders</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Overview of all tables and orders.</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
                        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-2">
                                <i className="fas fa-chair text-indigo-500 dark:text-indigo-400 text-xs sm:text-sm"></i>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{tables.length}</p>
                            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Total Tables</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                                <i className="fas fa-check-circle text-green-500 dark:text-green-400 text-xs sm:text-sm"></i>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{availableCount}</p>
                            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Available</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-2">
                                <i className="fas fa-clock text-red-500 dark:text-red-400 text-xs sm:text-sm"></i>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{occupiedCount}</p>
                            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Occupied</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-2">
                                <i className="fas fa-receipt text-amber-500 dark:text-amber-400 text-xs sm:text-sm"></i>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {selectedTableOrders ? selectedTableOrders.length : '—'}
                            </p>
                            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Selected Orders</p>
                        </div>
                    </div>

                    {/* Table Grid */}
                    <div className="mb-6 sm:mb-8">
                        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 flex items-center gap-2">
                            <i className="fas fa-th-large text-gray-400 text-xs"></i>
                            Tables
                        </h2>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <i className="fas fa-spinner fa-spin text-xl text-gray-300"></i>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
                                {tables.map(table => (
                                    <div
                                        key={table._id}
                                        onClick={() => handleTableClick(table._id)}
                                        className={`cursor-pointer p-3 sm:p-4 lg:p-6 rounded-lg flex flex-col items-center justify-center h-24 sm:h-28 lg:h-32 transition-all duration-200 border-2 ${
                                            selectedTableId === table._id
                                                ? table.status === 'Occupied'
                                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500'
                                                    : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-500'
                                                : table.status === 'Occupied'
                                                    ? 'bg-red-500 text-white border-red-500'
                                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        <span className="text-[10px] sm:text-xs font-medium opacity-60 mb-0.5 sm:mb-1">Table</span>
                                        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-none">{table.tableNumber}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected Table Orders */}
                    {selectedTableOrders && (
                        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 overflow-hidden">
                            {/* Header */}
                            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <i className="fas fa-clipboard-list text-indigo-500 dark:text-indigo-400 text-xs sm:text-sm"></i>
                                    </div>
                                    <div>
                                        <h2 className="text-sm sm:text-base font-bold text-gray-800 dark:text-white">Active Orders</h2>
                                        <p className="text-[11px] sm:text-xs text-gray-400">
                                            {selectedTableOrders.length > 0
                                                ? `${selectedTableOrders.length} order${selectedTableOrders.length > 1 ? 's' : ''}`
                                                : 'No orders at this table'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedTableOrders(null); setSelectedTableId(null); }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                                    <i className="fas fa-times text-xs sm:text-sm"></i>
                                </button>
                            </div>

                            {/* Orders List */}
                            <div className="p-3 sm:p-4 lg:p-5">
                                {selectedTableOrders.length === 0 ? (
                                    <div className="text-center py-8 sm:py-10">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <i className="fas fa-inbox text-gray-300 dark:text-gray-500 text-lg"></i>
                                        </div>
                                        <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">No active orders</p>
                                        <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Select another table to view orders</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {selectedTableOrders.map(order => {
                                            const isEdited = order.updatedAt && order.createdAt && new Date(order.updatedAt).getTime() > new Date(order.createdAt).getTime();
                                            
                                            return (
                                                <div key={order._id} className={`p-3 sm:p-4 border dark:border-gray-700 rounded-lg transition ${
                                                isEdited 
                                                    ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30' 
                                                    : 'bg-gray-50 dark:bg-gray-700/50 border-transparent'
                                            }`}>
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                <span className="font-bold text-sm sm:text-base text-gray-800 dark:text-white">#{order.orderId}</span>
                                                                
                                                                {isEdited && (
                                                                    <span className="text-[10px] sm:text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 sm:px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                                                        <i className="fas fa-pen text-[8px]"></i>Updated
                                                                    </span>
                                                                )}
                                                                
                                                                {order.customerPhone && (
                                                                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1.5 sm:px-2 py-0.5 rounded font-medium flex items-center gap-1 border border-gray-200 dark:border-gray-600">
                                                                        <i className="fas fa-phone-alt text-[8px]"></i>{order.customerPhone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 line-clamp-2">
                                                                {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                                                            </p>
                                                            
                                                            <p className="font-bold text-green-600 dark:text-green-400 mt-1.5 sm:mt-2 text-sm sm:text-base">
                                                                ₹{Number(order.totalAmount).toFixed(2)}
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Action Buttons */}
                                                        <div className="flex sm:flex-col gap-2 flex-shrink-0">
                                                            <button
                                                                onClick={() => handleViewBill(order)}
                                                                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-white border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer flex items-center justify-center gap-2 text-sm font-medium"
                                                            >
                                                                <i className="fas fa-receipt text-xs"></i> View Bill
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    
                </div>
            </div>

            {/* ═══════════════════ BILL / RECEIPT MODAL ═══════════════════ */}
            {viewingOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={handleCloseBill}>
                    <div className="bg-white w-full max-w-[320px] shadow-2xl rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        
                        {/* Action Buttons (Hidden during print) */}
                        <div className="p-4 border-b bg-gray-50 flex gap-2 no-print">
                            <button 
                                onClick={handlePrintBill}
                                className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm cursor-pointer hover:bg-gray-800 transition flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-print text-xs"></i> Print Bill
                            </button>
                            <button 
                                onClick={handleCloseBill}
                                className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium text-sm cursor-pointer hover:bg-gray-100 transition"
                            >
                                Close
                            </button>
                        </div>

                        {/* Actual Printable Bill Content */}
                        <div className="print-area p-6 bg-white text-black font-mono text-[11px] leading-relaxed">
                            
                            {/* Header */}
                            <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-gray-800">
                                <h2 className="text-lg font-bold uppercase tracking-widest mb-1">Your Restaurant</h2>
                                <p className="text-[10px] text-gray-500">123 Food Street, City Name</p>
                                <p className="text-[10px] text-gray-500">Ph: +91 98765 43210</p>
                            </div>

                            {/* Order Meta */}
                            <div className="flex justify-between mb-4 text-[11px]">
                                <div>
                                    <p className="text-gray-500">Date:</p>
                                    <p className="font-bold">{fmtDate(viewingOrder.createdAt)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500">Order ID:</p>
                                    <p className="font-bold">#{viewingOrder.orderId}</p>
                                </div>
                            </div>

                            {/* Table Info */}
                            <div className="bg-gray-50 px-3 py-2 rounded mb-4 flex justify-between text-[11px] border border-gray-200">
                                <span className="font-bold">Table: T{viewingOrder.tableId?.tableNumber || 'N/A'}</span>
                                <span className="text-gray-500">
                                    {viewingOrder.customerPhone ? `Ph: ${viewingOrder.customerPhone}` : 'Walk-in'}
                                </span>
                            </div>

                            {/* Items Table */}
                            <table className="w-full mb-4 text-[11px] border-collapse:collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-800">
                                        <th className="text-left py-1.5 font-bold">Item</th>
                                        <th className="text-center py-1.5 font-bold w-12">Qty</th>
                                        <th className="text-right py-1.5 font-bold">Rate</th>
                                        <th className="text-right py-1.5 font-bold">Amt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingOrder.items.map((item, i) => (
                                        <tr key={i} className="border-b border-dashed border-gray-200">
                                            <td className="py-1.5 pr-2 capitalize break-words" style={{maxWidth: '140px'}}>{item.name}</td>
                                            <td className="py-1.5 text-center">{item.quantity}</td>
                                            <td className="py-1.5 text-right">₹{fmt(item.price)}</td>
                                            <td className="py-1.5 text-right font-medium">₹{fmt(item.price * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="border-t-2 border-dashed border-gray-800 pt-2 flex justify-between text-sm font-bold">
                                <span>TOTAL</span>
                                <span>₹{Number(viewingOrder.totalAmount).toFixed(2)}</span>
                            </div>

                            {/* Footer */}
                            <div className="mt-6 pt-4 border-t border-dashed border-gray-300 text-center text-[10px] text-gray-500">
                                <p className="font-medium text-gray-700 mb-1">Thank you for dining with us!</p>
                                <p>We look forward to serving you again.</p>
                            </div>

                            {/* Mark Paid Action (Hidden during print) */}
                            <div className="mt-6 pt-4 border-t border-gray-100 no-print">
                                <button 
                                    onClick={handleMarkPaidFromBill}
                                    disabled={payingId === viewingOrder._id}
                                    className="w-full py-3 bg-green-600 text-white rounded-lg font-bold text-sm cursor-pointer hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                                >
                                    {payingId === viewingOrder._id ? (
                                        <><i className="fas fa-spinner fa-spin text-xs"></i> Processing...</>
                                    ) : (
                                        <>
                                            <i className="fas fa-check-circle"></i> Mark Order as Paid
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Specific CSS */}
            <style jsx>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .print-area, .print-area * {
                        visibility: visible !important;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm;
                        margin: 0;
                        padding: 10px;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        background: white !important;
                        color: black !important;
                        font-size: 11px;
                        line-height: 1.4;
                    }
                    .print-area table {
                        border-collapse: collapse;
                    }
                    .print-area th, .print-area td {
                        border: 1px dashed #ccc !important;
                        padding: 4px 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;