import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManageMenu from './pages/ManageMenu';
import ManageTables from './pages/ManageTables';
import OrdersPage from './pages/OrdersPage';
import TableSelection from './pages/TableSelection';
import OrderPage from './pages/OrderPage';
import CheckoutPage from './pages/CheckoutPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<TableSelection />} />
        <Route path="/order/:tableId" element={<OrderPage />} />
        <Route path="/checkout/:tableId" element={<CheckoutPage />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<OrdersPage />} />
            <Route path="/admin/menu" element={<ManageMenu />} />
            <Route path="/admin/tables" element={<ManageTables />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;