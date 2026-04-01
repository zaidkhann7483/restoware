import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('admin@restaurant.com');
    const [password, setPassword] = useState('admin123');
    const navigate = useNavigate();
    
const BASE_URL = import.meta.env.VITE_API_URL;
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
            localStorage.setItem('token', res.data.token);
            navigate('/admin');
        } catch (err) {
            alert('Login Failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-xl w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
                <input 
                    className="w-full p-3 mb-4 border rounded" 
                    placeholder="Email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                />
                <input 
                    className="w-full p-3 mb-4 border rounded" 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                />
                <button className="w-full bg-indigo-600 text-white py-3 rounded hover:bg-indigo-700">
                    Sign In
                </button>
            </form>
        </div>
    );
};

export default Login;