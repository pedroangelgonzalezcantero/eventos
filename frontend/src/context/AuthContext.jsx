import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const _applyData = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    _applyData(res.data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  /**
   * Refresca el token y los permisos desde la BD sin necesidad de re-login.
   * Útil después de que un admin cambie los permisos de un puesto.
   * Devuelve los datos actualizados o null si falla silenciosamente.
   */
  const refreshPermissions = useCallback(async () => {
    try {
      const res = await api.get('/auth/refresh');
      _applyData(res.data);
      return res.data;
    } catch {
      // Si falla (token expirado, etc.) no hacemos nada
      return null;
    }
  }, []);

  // Al arrancar la app, si hay sesión activa, refrescamos permisos en segundo plano
  // para asegurar que los cambios de rol/permisos hechos por el admin se aplican.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshPermissions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escucha notificaciones BroadcastChannel de cambios de permisos desde otra pestaña.
  // Así, si el admin guarda permisos en una pestaña, las demás pestañas abiertas
  // (incluyendo sesiones de otros roles en el mismo navegador) refrescan automáticamente.
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('perms_updated');
      bc.onmessage = () => {
        const token = localStorage.getItem('token');
        if (token) refreshPermissions();
      };
    } catch { /* BroadcastChannel no disponible */ }
    return () => { try { bc?.close(); } catch {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRole = useCallback((...roles) => {
    return user && roles.includes(user.role);
  }, [user]);

  /** Comprueba si el usuario tiene un permiso específico */
  const hasPermission = useCallback((code) => {
    if (!user) return false;
    // OFFICE siempre tiene todo (failsafe)
    if (user.role === 'OFFICE') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(code);
  }, [user]);

  /** Comprueba varios permisos (AND: todos deben cumplirse) */
  const hasAllPermissions = useCallback((...codes) => {
    return codes.every(c => hasPermission(c));
  }, [hasPermission]);

  /** Comprueba varios permisos (OR: al menos uno) */
  const hasAnyPermission = useCallback((...codes) => {
    return codes.some(c => hasPermission(c));
  }, [hasPermission]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isRole, hasPermission, hasAllPermissions, hasAnyPermission, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
