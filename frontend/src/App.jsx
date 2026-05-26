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
import PersonaManagement from './pages/admin/PersonaManagement';
import AltasView from './pages/admin/AltasView';
import ClientPortal from './pages/client/ClientPortal';

/**
 * Redirige al usuario a la primera sección que tiene permitida.
 * Orden de prioridad: Dashboard → Sala → Protocolo → Cocina → no-autorizado
 */
function HomeRedirect() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  // Roles con destino fijo
  if (user.role === 'CLIENT')  return <Navigate to="/mi-evento"        replace />;
  if (user.role === 'OFFICE')  return <Navigate to="/admin/dashboard"  replace />;

  // Todos los demás: navegar a la primera sección habilitada por permisos
  if (hasPermission('DASHBOARD_VIEW'))                              return <Navigate to="/admin/dashboard" replace />;
  if (hasPermission('TABLES_VIEW'))                                 return <Navigate to="/admin/sala"      replace />;
  if (hasPermission('PROTOCOL_VIEW'))                               return <Navigate to="/admin/dj"        replace />;
  if (hasAnyPermission('ALLERGENS_VIEW', 'MENUS_VIEW'))            return <Navigate to="/admin/cocina"    replace />;

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

          {/* ── Dashboard
              Accesible para OFFICE (siempre) O cualquier usuario con DASHBOARD_VIEW */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute roles={['OFFICE']} anyPermission={['DASHBOARD_VIEW']}>
              <Dashboard />
            </PrivateRoute>
          } />

          {/* ── Rutas exclusivas de OFFICE ─────────────────────────────────── */}
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
          <Route path="/admin/personas" element={
            <PrivateRoute roles={['OFFICE']}><PersonaManagement /></PrivateRoute>
          } />
          <Route path="/admin/altas" element={
            <PrivateRoute roles={['OFFICE']}><AltasView /></PrivateRoute>
          } />

          {/* ── Vistas de staff — acceso por ROL o por PERMISO ─────────────────
              anyPermission permite que cualquier usuario con el permiso adecuado
              acceda aunque su rol no sea el "nativo" de la vista.
              Los roles legacy (KITCHEN, DJ, FLOOR) siguen funcionando como antes. */}

          {/* Vista Cocina: requiere ver menús O ver alérgenos */}
          <Route path="/admin/cocina" element={
            <PrivateRoute roles={['OFFICE', 'KITCHEN']} anyPermission={['ALLERGENS_VIEW', 'MENUS_VIEW']}>
              <KitchenView />
            </PrivateRoute>
          } />

          {/* Vista DJ / Protocolo: requiere ver protocolo */}
          <Route path="/admin/dj" element={
            <PrivateRoute roles={['OFFICE', 'DJ']} anyPermission={['PROTOCOL_VIEW']}>
              <DjView />
            </PrivateRoute>
          } />

          {/* Vista Sala / Mesas: requiere ver mesas
              (TABLES_VIEW incluye acceso a la vista completa; FloorView
               gestiona internamente qué pestañas mostrar por permiso) */}
          <Route path="/admin/sala" element={
            <PrivateRoute roles={['OFFICE', 'FLOOR']} anyPermission={['TABLES_VIEW']}>
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
                <p className="text-5xl mb-4"></p>
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