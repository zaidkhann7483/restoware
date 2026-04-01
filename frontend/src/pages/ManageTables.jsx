import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import AdminSidebar from '../components/AdminSidebar';

const ManageTables = () => {
    const [tables, setTables] = useState([]);
    const [tableNumber, setTableNumber] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const res = await api.get('/tables');
            setTables(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const clearMessages = () => { setError(''); setSuccess(''); };

    const handleCreate = async (e) => {
        e.preventDefault();
        clearMessages();

        if (!tableNumber || isNaN(tableNumber) || Number(tableNumber) <= 0) {
            setError('Please enter a valid table number (positive number).');
            return;
        }

        try {
            await api.post('/tables', { tableNumber: Number(tableNumber) });
            setSuccess(`Table ${tableNumber} created successfully!`);
            setTableNumber('');
            fetchTables();
        } catch (err) {
            const msg = err.response?.data?.msg || err.response?.data?.error;
            if (msg && msg.includes('already exists')) {
                setError(`Table #${tableNumber} already exists. Choose a different number.`);
            } else {
                setError(msg || 'Failed to create table.');
            }
        }
    };

    const handleDelete = async (table) => {
        if (!window.confirm(`Delete Table #${table.tableNumber}?`)) return;
        clearMessages();
        try {
            await api.delete(`/tables/${table._id}`);
            setSuccess(`Table #${table.tableNumber} deleted.`);
            fetchTables();
        } catch (err) {
            const msg = err.response?.data?.msg || err.response?.data?.error;
            if (msg && msg.includes('active unpaid')) {
                setError(`Cannot delete Table #${table.tableNumber}: it has active unpaid orders.`);
            } else {
                setError(msg || 'Failed to delete table.');
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">

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
                <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer rounded-lg">
                        <i className="fas fa-bars text-sm"></i>
                    </button>
                    <h1 className="font-bold text-gray-800 text-sm">Manage Tables</h1>
                </div>

                <div className="flex-1 p-4 sm:p-6 lg:p-10">
                    {/* Desktop Title */}
                    <div className="hidden lg:block mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Floor Plan</h1>
                        <p className="text-gray-500 text-sm mt-1">Add new tables or remove existing ones.</p>
                    </div>

                    {/* Toast Messages */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 flex justify-between items-center rounded-lg">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-circle-exclamation text-red-500 text-sm"></i>
                                <span className="text-red-700 text-sm font-medium">{error}</span>
                            </div>
                            <button onClick={clearMessages} className="text-red-400 hover:text-red-600 cursor-pointer ml-4">&times;</button>
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-100 flex justify-between items-center rounded-lg">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-circle-check text-green-500 text-sm"></i>
                                <span className="text-green-700 text-sm font-medium">{success}</span>
                            </div>
                            <button onClick={clearMessages} className="text-green-400 hover:text-green-600 cursor-pointer ml-4">&times;</button>
                        </div>
                    )}

                    {/* Modern 2-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        
                        {/* ──── LEFT: Form Panel ──── */}
                        <div className="lg:col-span-2">
                            <div className="bg-white p-6 border border-gray-100 lg:sticky lg:top-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Add New Table</h2>
                                <form onSubmit={handleCreate} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Table Number</label>
                                        <input 
                                            className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-gray-900 outline-none text-sm transition" 
                                            placeholder="e.g. 5" 
                                            type="number" 
                                            min="1" 
                                            value={tableNumber} 
                                            onChange={e => setTableNumber(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <button type="submit" className="w-full py-2.5 bg-gray-900 text-white hover:bg-gray-800 transition font-medium text-sm cursor-pointer rounded-lg">
                                        <i className="fas fa-plus mr-2"></i>Add to Floor
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* ──── RIGHT: Tables Grid Panel ──── */}
                        <div className="lg:col-span-3">
                            <div className="bg-white border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 text-sm">
                                        All Tables 
                                        <span className="ml-2 text-xs font-normal text-gray-400">({tables.length})</span>
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="hidden sm:flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>Available
                                        </span>
                                        <span className="hidden sm:flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>Occupied
                                        </span>
                                    </div>
                                </div>
                                
                                {tables.length === 0 ? (
                                    <div className="text-center py-20 text-gray-400">
                                        <i className="fas fa-chair text-3xl mb-3 block text-gray-200"></i>
                                        <p className="text-sm font-medium">No tables yet</p>
                                        <p className="text-xs mt-1">Add your first table using the form.</p>
                                    </div>
                                ) : (
                                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {tables.map(table => (
                                            <div key={table._id} className={`relative bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl p-5 transition group text-center ${table.status === 'Occupied' ? 'bg-red-50/50 hover:bg-red-50' : ''}`}>
                                                
                                                {/* Desktop Hover Actions */}
                                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
                                                    <button 
                                                        onClick={() => handleDelete(table)} 
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition"
                                                        title="Delete table"
                                                    >
                                                        <i className="fas fa-trash-can text-xs"></i>
                                                    </button>
                                                </div>

                                                {/* Mobile Always-Visible Actions */}
                                                <div className="absolute top-3 right-3 lg:hidden">
                                                    <button 
                                                        onClick={() => handleDelete(table)} 
                                                        className="p-1.5 text-gray-300 hover:text-red-600 cursor-pointer transition"
                                                    >
                                                        <i className="fas fa-trash-can text-xs"></i>
                                                    </button>
                                                </div>

                                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Table</p>
                                                <h3 className="text-3xl font-bold text-gray-900">{table.tableNumber}</h3>
                                                
                                                <span className={`inline-block mt-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                                    table.status === 'Occupied' 
                                                        ? 'bg-red-100 text-red-600' 
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {table.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageTables;