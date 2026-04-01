import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TableSelection = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:5000/api/tables')
            .then(res => { setTables(res.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
            
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full max-w-6xl mx-auto">
                
                {/* Header Section */}
                <div className="text-center mb-12 sm:mb-16">
                    <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-indigo-400 mb-4">Dine In</p>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Select Your Table
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                        Choose an available table to view the menu and place your order
                    </p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <i className="fas fa-spinner fa-spin text-2xl text-slate-600"></i>
                    </div>
                ) : (
                    /* Table Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
                        
                        {tables.map(table => (
                            <div 
                                key={table._id}
                                onClick={() => navigate(`/order/${table._id}`)}
                                className={`
                                    relative group cursor-pointer rounded-2xl p-6 sm:p-8 
                                    flex flex-col items-center justify-center aspect-square
                                    transition-all duration-300 ease-out border
                                    bg-slate-800/40 border-slate-700/50 
                                    hover:bg-slate-800/80 hover:border-slate-600 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1
                                    ${table.status === 'Occupied' ? 'opacity-60 hover:opacity-80' : ''}
                                `}
                            >

                                {/* Status Badge */}
                                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                    table.status === 'Occupied' 
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                    {table.status === 'Occupied' ? 'Busy' : 'Open'}
                                </div>

                                {/* Table Number */}
                                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-1 group-hover:text-indigo-400 transition-colors duration-300">
                                    {table.tableNumber}
                                </h2>
                                
                                <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition-colors duration-300">
                                    Table
                                </span>

                                {/* Hover Action Indicator for Available Tables */}
                                {table.status !== 'Occupied' && (
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-indigo-300 font-medium bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 backdrop-blur-sm">
                                            <i className="fas fa-arrow-right text-[8px]"></i> Tap to order
                                        </span>
                                    </div>
                                )}

                                {/* Hover Action Indicator for Occupied Tables */}
                                {table.status === 'Occupied' && (
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-red-300 font-medium bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 backdrop-blur-sm">
                                            <i className="fas fa-eye text-[8px]"></i> View Order
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}

                    </div>
                )}
            </div>

            {/* Footer / Credits */}
            <div className="w-full py-6 flex flex-col items-center justify-center gap-2 border-t border-slate-800/50">
                <p className="text-[11px] text-slate-500 tracking-wide">
                    Developed by <a 
                        href="https://mohammedzaidprotfolio.netlify.app" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-slate-200 hover:text-indigo-400 font-semibold transition-colors"
                    >
                        Zaid
                    </a>
                </p>
                {/* <a 
                    href="https://mohammedzaidprotfolio.netlify.app" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] text-slate-700 hover:text-slate-500 uppercase tracking-[0.15em] transition-colors"
                >
                    mohammedzaidprotfolio.netlify.app
                </a> */}
            </div>
        </div>
    );
};

export default TableSelection;