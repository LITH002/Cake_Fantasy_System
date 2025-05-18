import React, { useContext } from 'react';
import Sidebar from './Components/Sidebar/Sidebar';
import Navbar from './Components/Navbar/Navbar';
import { Route, Routes, Navigate } from 'react-router-dom';
import Add from './Pages/Add/Add';
import Orders from './Pages/Orders/Orders';
import List from './Pages/List/List';
import Login from './Pages/Login/Login';
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute';
import { AdminAuthProvider, AdminAuthContext } from './context/AdminAuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EditItem from './Pages/EditItem/EditItem';
import GRNList from './Pages/GRN/GRNList';
import CreateGRN from './Pages/GRN/CreateGRN';
import GRNDetails from './Pages/GRN/GRNDetails';
import SupplierList from './Pages/Supplier/SupplierList';
import AddSupplier from './Pages/Supplier/AddSupplier';
import EditSupplier from './Pages/Supplier/EditSupplier';

// Layout component to wrap authenticated routes
const AdminLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        {children}
      </div>
    </>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useContext(AdminAuthContext);
  const url = "http://localhost:4000";

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/list" replace /> : <Login url={url} />
      } />
      
      {/* Default route */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/list" replace /> : <Navigate to="/login" replace />
      } />
      
      {/* Protected routes */}
      <Route path="/list" element={
        <ProtectedRoute requiredRole="employee">
          <AdminLayout>
            <List url={url} />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/add" element={
        <ProtectedRoute requiredRole="employee">
          <AdminLayout>
            <Add url={url} />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders" element={
        <ProtectedRoute requiredRole="employee">
          <AdminLayout>
            <Orders url={url} />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/edit-item/:itemId" element={
        <AdminLayout>
          <EditItem url={url} />
        </AdminLayout>
      } />

      <Route path="/suppliers" element={
        <ProtectedRoute requiredRole="employee">
          <AdminLayout>
            <SupplierList url={url} />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/add-supplier" element={
        <ProtectedRoute requiredRole="employee">
          <AdminLayout>
            <AddSupplier url={url} />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/edit-supplier/:supplierId" element={
        <ProtectedRoute requiredRole="employee">
          <AdminLayout>
            <EditSupplier url={url} />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/grn" element={
        <ProtectedRoute requiredRole="employee">
          <AdminLayout>
            <GRNList url={url} />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/create-grn" element={
        <ProtectedRoute requiredRole="employee">
          <AdminLayout>
            <CreateGRN url={url} />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/grn/:grnId" element={
        <ProtectedRoute requiredRole="employee">
          <AdminLayout>
            <GRNDetails url={url} />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AdminAuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <AppRoutes />
    </AdminAuthProvider>
  );
};

export default App;