import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import EventList from './pages/admin/EventList';
import CreateEvent from './pages/admin/CreateEvent';
import EventDetail from './pages/admin/EventDetail';
import KitchenView from './pages/admin/KitchenView';
import DjView from './pages/admin/DjView';
import FloorView from './pages/admin/FloorView';
import UserManagement from './pages/admin/UserManagement';
import JobPositions from './pages/admin/JobPositions';
import CalendarView from './pages/admin/CalendarView';
import AutomationSettings from './pages/admin/AutomationSettings';
import ClientPortal from './pages/client/ClientPortal';

function HomeRedirect() {
  const { user, hasAnyPermission } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'CLIENT')  return <Navigate to="/mi-evento" replace />;
  if (user.role === 'OFFICE')  return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'KITCHEN') return <Navigate to="/admin/cocina" replace />;
  if (user.role === 'DJ')      return <Navigate to="/admin/dj" replace />;
  if (user.role === 'FLOOR')   return <Navigate to="/admin/sala" replace />;
  // Roles personalizados: redirigir según permisos
  if (hasAnyPermission('DASHBOARD_VIEW')) return <Navigate to="/admin/dashboard" replace />;
  if (hasAnyPermission('PROTOCOL_VIEW'))  return <Navigate to="/admin/dj" replace />;
  if (hasAnyPermission('TABLES_VIEW'))    return <Navigate to="/admin/sala" replace />;
  if (hasAnyPermission('ALLERGENS_VIEW', 'MENUS_VIEW')) return <Navigate to="/admin/cocina" replace />;
  return <Navigate to="/no-autorizado" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontSize: '14px', fontWeight: 500 }
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Rutas de administración — solo OFFICE */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute roles={['OFFICE']}><Dashboard /></PrivateRoute>
          } />
          <Route path="/admin/eventos" element={
            <PrivateRoute roles={['OFFICE']}><EventList /></PrivateRoute>
          } />
          <Route path="/admin/eventos/nuevo" element={
            <PrivateRoute roles={['OFFICE']}><CreateEvent /></PrivateRoute>
          } />
          <Route path="/admin/eventos/:id" element={
            <PrivateRoute roles={['OFFICE']}><EventDetail /></PrivateRoute>
          } />
          <Route path="/admin/usuarios" element={
            <PrivateRoute roles={['OFFICE']}><UserManagement /></PrivateRoute>
          } />
          <Route path="/admin/puestos" element={
            <PrivateRoute roles={['OFFICE']}><JobPositions /></PrivateRoute>
          } />
          <Route path="/admin/calendario" element={
            <PrivateRoute roles={['OFFICE']}><CalendarView /></PrivateRoute>
          } />
          <Route path="/admin/automatizaciones" element={
            <PrivateRoute roles={['OFFICE']}><AutomationSettings /></PrivateRoute>
          } />

          {/* Vistas de staff — rol fijo O permiso equivalente */}
          <Route path="/admin/cocina" element={
            <PrivateRoute roles={['OFFICE','KITCHEN']} anyPermission={['ALLERGENS_VIEW','MENUS_VIEW']}>
              <KitchenView />
            </PrivateRoute>
          } />
          <Route path="/admin/dj" element={
            <PrivateRoute roles={['OFFICE','DJ']} anyPermission={['PROTOCOL_VIEW']}>
              <DjView />
            </PrivateRoute>
          } />
          <Route path="/admin/sala" element={
            <PrivateRoute roles={['OFFICE','FLOOR']} anyPermission={['TABLES_VIEW','GUESTS_VIEW']}>
              <FloorView />
            </PrivateRoute>
          } />

          {/* Portal del cliente */}
          <Route path="/mi-evento" element={
            <PrivateRoute roles={['CLIENT']}><ClientPortal /></PrivateRoute>
          } />

          <Route path="/no-autorizado" element={
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
              <div className="text-center card p-12">
                <p className="text-5xl mb-4">🚫</p>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">Acceso no autorizado</h1>
                <p className="text-stone-500 mb-6">No tienes permiso para ver esta página.</p>
                <a href="/login" className="btn-primary">Volver al inicio</a>
              </div>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
