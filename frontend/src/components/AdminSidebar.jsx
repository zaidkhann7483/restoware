import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
    const location = useLocation();
    
    const linkClass = (path) => 
        `block py-2.5 px-4 rounded transition duration-200 ${
            location.pathname === path ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-400'
        }`;

    return (
        <div className="w-64 bg-gray-900 min-h-screen p-4 fixed left-0 top-0 shadow-xl">
            <div className="flex items-center mb-10 mt-4">
                <span className="text-white text-2xl font-bold uppercase tracking-wider">RestoWare Admin</span>
            </div>
            <nav className="space-y-2">

                <Link to="/admin/orders" className={linkClass('/admin/orders')}>
                    <i className="fas fa-receipt mr-3"></i> Dashboard
                </Link>

                <Link to="/admin" className={linkClass('/admin')}>
                    <i className="fas fa-th-large mr-3"></i> Orders
                </Link>
                
                <Link to="/admin/menu" className={linkClass('/admin/menu')}>
                    <i className="fas fa-utensils mr-3"></i> Manage Menu
                </Link>
                <Link to="/admin/tables" className={linkClass('/admin/tables')}>
                    <i className="fas fa-chair mr-3"></i> Manage Tables
                </Link>
                <div className="border-t border-gray-700 my-4"></div>
                <Link to="/" className="block py-2.5 px-4 rounded text-gray-500 hover:text-white text-sm transition">
                    ← Back to Customer View
                </Link>

                 <div className="w-full py-6 flex flex-col items-center justify-center gap-2 border-t border-gray-100 mt-4">
                        <p className="text-[11px] text-gray-400 tracking-wide">
                            Developed by <a 
                                href="" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-200 hover:text-gray-100 font-semibold transition-colors"
                            >
                                Xyron
                            </a>
                        </p>
                        {/* <a 
                            href="https://mohammedzaidprotfolio.netlify.app" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-gray-300 hover:text-gray-500 uppercase tracking-[0.15em] transition-colors"
                        >
                            mohammedzaidprotfolio.netlify.app
                        </a> */}
                    </div>
            </nav>
        </div>
    );
};

export default AdminSidebar;