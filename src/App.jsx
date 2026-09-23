import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Dashboard  from "./pages/Dashboard";
import Products   from "./pages/Products";
import Categories from "./pages/Categories";
import Suppliers  from "./pages/Suppliers";
import Orders     from "./pages/Orders";
import Customers  from "./pages/Customers";
import Purchases from "./pages/Purchases";
import AdminLayout from "./layouts/AdminLayout";
import ReturnToSupplier from "./pages/ReturnToSupplier";
import Sales from "./pages/Sales";
import Payments from "./pages/Payments";
import Repports from "./pages/Reports";
import Stockentries from "./pages/Stockentries";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerReturns from "./pages/CustomerReturns";
import AuditLog from "./pages/AuditLog";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/products"   element={<ProtectedRoute><AdminLayout><Products /></AdminLayout></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><AdminLayout><Categories /></AdminLayout></ProtectedRoute>} />
          <Route path="/suppliers"  element={<ProtectedRoute><AdminLayout><Suppliers /></AdminLayout></ProtectedRoute>} />
          <Route path="/orders"     element={<ProtectedRoute><AdminLayout><Orders /></AdminLayout></ProtectedRoute>} />
          <Route path="/customers"  element={<ProtectedRoute><AdminLayout><Customers /></AdminLayout></ProtectedRoute>} />
          <Route path="/purchases"  element={<ProtectedRoute><AdminLayout><Purchases /></AdminLayout></ProtectedRoute>} />
          <Route path="/returns"    element={<ProtectedRoute><AdminLayout><ReturnToSupplier /></AdminLayout></ProtectedRoute>} />
          <Route path="/sales"      element={<ProtectedRoute><AdminLayout><Sales /></AdminLayout></ProtectedRoute>} />
          <Route path="/payments"    element={<ProtectedRoute><AdminLayout><Payments /></AdminLayout></ProtectedRoute>} />
          <Route path="/reports"     element={<ProtectedRoute><AdminLayout><Repports /></AdminLayout></ProtectedRoute>} />
          <Route path="/stock-entries" element={<ProtectedRoute><AdminLayout><Stockentries /></AdminLayout></ProtectedRoute>} />
          <Route path="/users"       element={<ProtectedRoute><AdminLayout><Users /></AdminLayout></ProtectedRoute>} />
          <Route path="/roles"       element={<ProtectedRoute><AdminLayout><Roles /></AdminLayout></ProtectedRoute>} />
          <Route path="/permissions" element={<ProtectedRoute><AdminLayout><Permissions /></AdminLayout></ProtectedRoute>} />
          <Route path="/customer-returns" element={<ProtectedRoute><AdminLayout><CustomerReturns /></AdminLayout></ProtectedRoute>} />
          <Route path="/audit-log" element={<ProtectedRoute><AdminLayout><AuditLog /></AdminLayout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;