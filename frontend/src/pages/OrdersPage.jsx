import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../utils/api';

const API = '/orders';

const OrdersPage = () => {
    const [activeTab, setActiveTab] = useState('analytics');
    const [analytics, setAnalytics] = useState(null);
    const [orders, setOrders] = useState([]);
    const [allOrdersCount, setAllOrdersCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: '', type: '' });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (activeTab === 'analytics') fetchAnalytics();
        else fetchOrders();
    }, [activeTab, statusFilter, page]);

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3000);
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${API}/analytics/summary`);
            setAnalytics(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = { limit: 10, page };
            if (statusFilter !== 'ALL') params.status = statusFilter;
            const res = await api.get(API, { params });
            setOrders(res.data.orders);
            setAllOrdersCount(res.data.total);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const markPaid = async (order) => {
        try {
            await api.patch(`${API}/${order._id}/pay`);
            showToast(`Order #${order.orderId} marked as paid`);
            if (activeTab === 'analytics') fetchAnalytics();
            else fetchOrders();
        } catch (err) {
            showToast('Failed to update order', 'error');
        }
    };

    const viewOrder = (order) => {
        setSelectedOrder(order);
        setShowDetail(true);
    };

    const fmt = (n) => Number(n).toFixed(2);
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // ─── LOADING STATE ─────────────────────────────────────────
    if (loading && !analytics) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <div className="fixed inset-y-0 left-0 z-50 w-64 transform -translate-x-full lg:relative lg:translate-x-0">
                    <AdminSidebar />
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                </div>
            </div>
        );
    }

    // ─── MAIN RENDER ────────────────────────────────────────────
    return (
        <div className="flex min-h-screen bg-gray-100">

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
                <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer">
                        <i className="fas fa-bars text-sm"></i>
                    </button>
                    <h1 className="font-bold text-gray-800 text-sm">Orders & Analytics</h1>
                </div>

                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    {/* Toast */}
                    {toast.show && (
                        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-[60] px-4 py-3 shadow-lg text-white font-medium text-sm flex items-center justify-between ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                            <span><i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>{toast.msg}</span>
                            <button onClick={() => setToast({ show: false, msg: '', type: '' })} className="ml-4 hover:opacity-75 cursor-pointer">&times;</button>
                        </div>
                    )}

                    {/* Header & Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
                        <div className="hidden lg:block">
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h1>
                            <p className="text-gray-500 text-sm mt-1">Track, manage, and analyze your restaurant orders</p>
                        </div>
                        <div className="flex bg-white p-1 shadow-sm border border-gray-200 w-full sm:w-auto">
                            {['analytics', 'all-orders'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setPage(1); }}
                                    className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-sm font-medium transition cursor-pointer ${activeTab === tab ? 'bg-gray-900 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {tab === 'analytics' ? '📊 Analytics' : '📋 Orders'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ──── ANALYTICS TAB ──── */}
                    {activeTab === 'analytics' && analytics && (
                        <>
                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
                                <KPICard icon="fa-indian-rupee-sign" iconBg="bg-green-100" iconColor="text-green-600" label="Today's Revenue" value={`₹${fmt(analytics.summary.todayRevenue)}`} sub={`${analytics.summary.todayOrders} orders`} />
                                <KPICard icon="fa-calendar-week" iconBg="bg-blue-100" iconColor="text-blue-600" label="This Week" value={`₹${fmt(analytics.summary.weekRevenue)}`} sub={`${analytics.summary.weekOrders} orders`} />
                                <KPICard icon="fa-chart-line" iconBg="bg-purple-100" iconColor="text-purple-600" label="This Month" value={`₹${fmt(analytics.summary.monthRevenue)}`} sub={`${analytics.summary.monthOrders} orders`} />
                                <KPICard icon="fa-wallet" iconBg="bg-amber-100" iconColor="text-amber-600" label="Unpaid Amount" value={`₹${fmt(analytics.summary.unpaidTotal)}`} sub={`${analytics.summary.unpaidCount} pending`} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 sm:mb-8">
                                {/* Chart */}
                                <div className="lg:col-span-2 bg-white p-4 sm:p-6 border border-gray-200">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-6">Revenue — Last 7 Days</h3>
                                    <div className="flex items-end gap-1 sm:gap-3 h-48">
                                        {analytics.dailyRevenue.map((d, i) => {
                                            const max = Math.max(...analytics.dailyRevenue.map(r => r.revenue), 1);
                                            const height = (d.revenue / max) * 100;
                                            const isToday = i === analytics.dailyRevenue.length - 1;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                                                    <span className="text-[10px] sm:text-xs font-semibold text-gray-600 hidden sm:block">₹{fmt(d.revenue)}</span>
                                                    <div className="w-full relative" style={{ height: '140px' }}>
                                                        <div
                                                            className={`absolute bottom-0 w-full transition-all duration-500 ${isToday ? 'bg-gray-900' : 'bg-gray-300 hover:bg-gray-400'}`}
                                                            style={{ height: `${Math.max(height, 4)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-[10px] sm:text-xs truncate w-full text-center ${isToday ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{d.date.split(',')[0]}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Status Breakdown */}
                                <div className="bg-white p-4 sm:p-6 border border-gray-200">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-6">Order Status</h3>
                                    <div className="flex justify-center mb-6">
                                        <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${(analytics.summary.paidCount / Math.max(analytics.summary.totalOrders, 1)) * 100} 100`} strokeLinecap="round" />
                                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray={`${(analytics.summary.unpaidCount / Math.max(analytics.summary.totalOrders, 1)) * 100} 100`} strokeDashoffset={`${-(analytics.summary.paidCount / Math.max(analytics.summary.totalOrders, 1)) * 100}`} strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-xl sm:text-2xl font-bold text-gray-800">{analytics.summary.totalOrders}</span>
                                                <span className="text-[10px] sm:text-xs text-gray-400">Total</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 bg-green-500 rounded-full"></span>Paid</span>
                                            <span className="font-semibold text-gray-800 text-sm">{analytics.summary.paidCount} <span className="text-xs text-gray-400">(₹{fmt(analytics.summary.paidTotal)})</span></span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 bg-red-500 rounded-full"></span>Unpaid</span>
                                            <span className="font-semibold text-gray-800 text-sm">{analytics.summary.unpaidCount} <span className="text-xs text-gray-400">(₹{fmt(analytics.summary.unpaidTotal)})</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Selling Items */}
                            <div className="bg-white p-4 sm:p-6 border border-gray-200">
                                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-5">🏆 Top Selling Items</h3>
                                <div className="space-y-3">
                                    {analytics.topSellingItems.length === 0 ? (
                                        <p className="text-gray-400 text-center py-6 text-sm">No data yet</p>
                                    ) : (
                                        analytics.topSellingItems.map((item, i) => {
                                            const maxQty = analytics.topSellingItems[0].totalQty;
                                            const pct = (item.totalQty / maxQty) * 100;
                                            return (
                                                <div key={i} className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between mb-1 text-sm">
                                                            <span className="font-medium text-gray-800 truncate mr-2">{item._id}</span>
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">{item.totalQty} sold · ₹{fmt(item.totalRevenue)}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 h-1.5">
                                                            <div className="bg-gray-900 h-1.5" style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ──── ALL ORDERS TAB ──── */}
                    {activeTab === 'all-orders' && (
                        <>
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                                    {['ALL', 'UNPAID', 'PAID'].map(s => (
                                        <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-4 py-2 text-sm font-medium border whitespace-nowrap transition cursor-pointer ${statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                            {s === 'ALL' ? 'All' : s}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500">{allOrdersCount} orders</span>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-20"><i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i></div>
                            ) : orders.length === 0 ? (
                                <div className="bg-white border p-12 text-center">
                                    <i className="fas fa-receipt text-4xl text-gray-300 mb-4 block"></i>
                                    <p className="text-gray-400">No orders found</p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block bg-white border border-gray-200 overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="text-left p-4 font-medium text-gray-500 text-sm">Order</th>
                                                    <th className="text-left p-4 font-medium text-gray-500 text-sm">Table</th>
                                                    <th className="text-left p-4 font-medium text-gray-500 text-sm">Items</th>
                                                    <th className="text-left p-4 font-medium text-gray-500 text-sm">Total</th>
                                                    <th className="text-left p-4 font-medium text-gray-500 text-sm">Status</th>
                                                    <th className="text-left p-4 font-medium text-gray-500 text-sm">Date</th>
                                                    <th className="text-right p-4 font-medium text-gray-500 text-sm">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.map(order => (
                                                    <tr key={order._id} className="border-b last:border-0 hover:bg-gray-50 transition">
                                                        <td className="p-4"><button onClick={() => viewOrder(order)} className="font-bold text-indigo-600 hover:underline cursor-pointer">#{order.orderId}</button></td>
                                                        <td className="p-4">{order.tableId?.tableNumber ? <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1">T{order.tableId.tableNumber}</span> : <span className="text-gray-400 text-xs">Deleted</span>}</td>
                                                        <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</td>
                                                        <td className="p-4 font-bold text-gray-800">₹{fmt(order.totalAmount)}</td>
                                                        <td className="p-4"><span className={`text-xs font-bold px-2.5 py-1 ${order.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{order.status}</span></td>
                                                        <td className="p-4 text-sm text-gray-500">{fmtDate(order.createdAt)}</td>
                                                        <td className="p-4 text-right whitespace-nowrap">
                                                            {order.status === 'UNPAID' && (
                                                                <button onClick={() => markPaid(order)} className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition cursor-pointer mr-2"><i className="fas fa-check mr-1"></i>Paid</button>
                                                            )}
                                                            <button onClick={() => viewOrder(order)} className="px-3 py-1.5 text-indigo-600 text-xs font-medium hover:bg-indigo-50 transition cursor-pointer"><i className="fas fa-eye"></i></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden space-y-3">
                                        {orders.map(order => (
                                            <div key={order._id} onClick={() => viewOrder(order)} className="bg-white border border-gray-200 p-4 cursor-pointer">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-800 text-sm">#{order.orderId}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 ${order.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{order.status}</span>
                                                    </div>
                                                    <span className="font-bold text-gray-900 text-sm">₹{fmt(order.totalAmount)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                                    <span>{order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : 'Deleted Table'}</span>
                                                    <span>{fmtDate(order.createdAt)}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-1 mb-3">{order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                                                {order.status === 'UNPAID' && (
                                                    <button onClick={(e) => { e.stopPropagation(); markPaid(order); }} className="w-full py-2 bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition cursor-pointer">
                                                        <i className="fas fa-check mr-1"></i>Mark as Paid
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {allOrdersCount > 10 && (
                                        <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-3 p-4 mt-4 bg-white border border-gray-200">
                                            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(allOrdersCount / 10)}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer">Previous</button>
                                                <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(allOrdersCount / 10)} className="px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer">Next</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* ──── ORDER DETAIL MODAL ──── */}
                    {showDetail && selectedOrder && (
                        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setShowDetail(false)}>
                            <div className="bg-white w-full sm:max-w-lg sm:rounded-xl overflow-hidden max-h-[90vh] flex flex-col sm:block" onClick={e => e.stopPropagation()}>
                                <div className={`p-4 sm:p-6 text-white ${selectedOrder.status === 'PAID' ? 'bg-green-600' : 'bg-gray-900'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold">#{selectedOrder.orderId}</h2>
                                            <p className="opacity-80 text-sm mt-1">{fmtDate(selectedOrder.createdAt)}</p>
                                        </div>
                                        <span className="text-xl sm:text-2xl font-bold">₹{fmt(selectedOrder.totalAmount)}</span>
                                    </div>
                                </div>
                                <div className="p-4 sm:p-6 overflow-y-auto">
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        <div className="bg-gray-50 p-3 text-center">
                                            <p className="text-[10px] sm:text-xs text-gray-400">Table</p>
                                            <p className="font-bold text-gray-800 text-sm">T{selectedOrder.tableId?.tableNumber || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 text-center">
                                            <p className="text-[10px] sm:text-xs text-gray-400">Status</p>
                                            <p className={`font-bold text-sm ${selectedOrder.status === 'PAID' ? 'text-green-600' : 'text-red-500'}`}>{selectedOrder.status}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 text-center">
                                            <p className="text-[10px] sm:text-xs text-gray-400">Items</p>
                                            <p className="font-bold text-gray-800 text-sm">{selectedOrder.items.reduce((a, i) => a + i.quantity, 0)}</p>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-semibold text-gray-700 text-sm mb-3">Order Items</h3>
                                    <div className="space-y-2 mb-6">
                                        {selectedOrder.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center bg-gray-50 p-3 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-800">{item.name}</span>
                                                    <span className="text-gray-400 ml-2">x{item.quantity}</span>
                                                </div>
                                                <span className="font-semibold text-gray-700">₹{fmt(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="border-t pt-4 flex gap-3">
                                        {selectedOrder.status === 'UNPAID' && (
                                            <button onClick={() => { markPaid(selectedOrder); setShowDetail(false); }} className="flex-1 py-3 bg-green-500 text-white font-bold hover:bg-green-600 transition cursor-pointer text-sm">
                                                <i className="fas fa-check mr-2"></i>Mark Paid
                                            </button>
                                        )}
                                        <button onClick={() => setShowDetail(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition cursor-pointer text-sm">
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── KPI CARD COMPONENT ───
const KPICard = ({ icon, iconBg, iconColor, label, value, sub }) => (
    <div className="bg-white border border-gray-200 p-4 sm:p-5 transition">
        <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <i className={`fas ${icon} ${iconColor} text-base sm:text-lg`}></i>
            </div>
            <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 font-medium">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{value}</p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">{sub}</p>
            </div>
        </div>
    </div>
);

export default OrdersPage;