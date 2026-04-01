import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import AdminSidebar from '../components/AdminSidebar';

const ManageMenu = () => {
    const [menu, setMenu] = useState([]);
    const [formData, setFormData] = useState({ name: '', price: '', image: '', category: 'General' });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await api.get('/menu');
            setMenu(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Extract unique categories dynamically from the current menu for the datalist
    const existingCategories = [...new Set(menu.map(item => item.category).filter(Boolean))];

    const clearMessages = () => { setError(''); setSuccess(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearMessages();
        try {
            let res;
            if (editingId) {
                res = await api.put(`/menu/${editingId}`, formData);
                setSuccess(`"${res.data.name}" updated successfully!`);
            } else {
                res = await api.post('/menu', formData);
                setSuccess(`"${res.data.name}" added to menu!`);
            }
            setEditingId(null);
            setFormData({ name: '', price: '', image: '', category: 'General' });
            fetchMenu();
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.error || 'Failed to save menu item');
        }
    };

    const handleEdit = (item) => {
        setFormData({ name: item.name, price: item.price.toString(), image: item.image || '', category: item.category || 'General' });
        setEditingId(item._id);
        clearMessages();
        setSidebarOpen(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this menu item?')) return;
        clearMessages();
        try {
            await api.delete(`/menu/${id}`);
            setSuccess('Menu item deleted!');
            fetchMenu();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', image: '', category: 'General' });
        clearMessages();
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
                    <h1 className="font-bold text-gray-800 text-sm">Manage Menu</h1>
                </div>

                <div className="flex-1 p-4 sm:p-6 lg:p-10">
                    {/* Desktop Title */}
                    <div className="hidden lg:block mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
                        <p className="text-gray-500 text-sm mt-1">Create, modify, or remove items from your menu.</p>
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
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                    {editingId ? 'Edit Item' : 'Create New Item'}
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Name</label>
                                        <input 
                                            className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-gray-900 outline-none text-sm transition" 
                                            placeholder="e.g. Margherita Pizza" 
                                            value={formData.name} 
                                            onChange={e => setFormData({...formData, name: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹)</label>
                                        <input 
                                            className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-gray-900 outline-none text-sm transition" 
                                            placeholder="e.g. 299" 
                                            type="number" 
                                            step="0.01" 
                                            min="0" 
                                            value={formData.price} 
                                            onChange={e => setFormData({...formData, price: e.target.value})} 
                                            required 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                                        {/* Modern combobox: allows typing new categories or selecting existing ones */}
                                        <input 
                                            list="category-suggestions"
                                            className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-gray-900 outline-none text-sm transition" 
                                            placeholder="Type or select category..."
                                            value={formData.category} 
                                            onChange={e => setFormData({...formData, category: e.target.value})} 
                                        />
                                        <datalist id="category-suggestions">
                                            {existingCategories.map(cat => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>
                                        <p className="text-xs text-gray-400 mt-1">Type to create a new category</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
                                        <input 
                                            className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-gray-900 outline-none text-sm transition" 
                                            placeholder="https://example.com/image.jpg" 
                                            value={formData.image} 
                                            onChange={e => setFormData({...formData, image: e.target.value})} 
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button type="submit" className="flex-1 py-2.5 bg-gray-900 text-white hover:bg-gray-800 transition font-medium text-sm cursor-pointer rounded-lg">
                                            {editingId ? 'Update Item' : 'Add to Menu'}
                                        </button>
                                        {editingId && (
                                            <button type="button" onClick={handleCancel} className="flex-1 py-2.5 bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium text-sm cursor-pointer rounded-lg">
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* ──── RIGHT: Menu List Panel ──── */}
                        <div className="lg:col-span-3">
                            <div className="bg-white border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 text-sm">
                                        All Items 
                                        <span className="ml-2 text-xs font-normal text-gray-400">({menu.length})</span>
                                    </h3>
                                </div>
                                
                                {menu.length === 0 ? (
                                    <div className="text-center py-20 text-gray-400">
                                        <i className="fas fa-utensils text-3xl mb-3 block text-gray-200"></i>
                                        <p className="text-sm font-medium">No items yet</p>
                                        <p className="text-xs mt-1">Add your first item using the form.</p>
                                    </div>
                                ) : (
                                    <ul>
                                        {menu.map(item => (
                                            <li key={item._id} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition group">
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <img 
                                                        src={item.image || 'https://via.placeholder.com/150'} 
                                                        className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" 
                                                        alt={item.name} 
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{item.category || 'General'}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-6 ml-4 flex-shrink-0">
                                                    <span className="font-semibold text-gray-900 text-sm w-16 text-right">
                                                        ₹{Number(item.price).toFixed(2)}
                                                    </span>
                                                    
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleEdit(item)} 
                                                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition"
                                                            title="Edit item"
                                                        >
                                                            <i className="fas fa-pen-to-square text-xs"></i>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item._id)} 
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition"
                                                            title="Delete item"
                                                        >
                                                            <i className="fas fa-trash-can text-xs"></i>
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Always visible actions on mobile */}
                                                    <div className="flex items-center gap-1 lg:hidden">
                                                        <button onClick={() => handleEdit(item)} className="p-2 text-gray-500 cursor-pointer"><i className="fas fa-pen-to-square text-xs"></i></button>
                                                        <button onClick={() => handleDelete(item._id)} className="p-2 text-red-500 cursor-pointer"><i className="fas fa-trash-can text-xs"></i></button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageMenu;