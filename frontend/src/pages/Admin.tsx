import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import Clients from './admin/Clients';
import Dashboard from './admin/Dashboard';
import InvoiceCreate from './admin/InvoiceCreate';
import Invoices from './admin/Invoices';
import Payments from './admin/Payments';
import Settings from './admin/Settings';

const Admin = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fcff,_#eef7f4,_#e6f1ef)]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 space-y-6 px-6 py-6">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/new" element={<InvoiceCreate />} />
              <Route path="clients" element={<Clients />} />
              <Route path="payments" element={<Payments />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Admin;
