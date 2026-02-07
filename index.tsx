import React, { useState, useEffect, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api'; // ⚠️ adapte le chemin si nécessaire

// =======================================================
// Types
// =======================================================
interface User {
  id: string;
  username: string;
  roles: string[];
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// =======================================================
// Auth Context
// =======================================================
const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------------------------------------
  // Hydratation de session AU DÉMARRAGE
  // -------------------------------------------------------
  useEffect(() => {
    const hydrateSession = async () => {
      try {
        // 🔥 IMPORTANT : passe par api.ts (refresh auto si besoin)
        const me = await api.me();
        setUser(me);
      } catch {
        // ❌ Seulement si refresh IMPOSSIBLE
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    hydrateSession();
  }, []);

  // -------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------
  const login = async (username: string, password: string) => {
    const user = await api.login(username, password);
    setUser(user);
  };

  // -------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------
  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// =======================================================
// Hook
// =======================================================
const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

// =======================================================
// Login Component
// =======================================================
const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Log in</button>
      </form>
    </div>
  );
};

// =======================================================
// Dashboard (protégé)
// =======================================================
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 🔥 PAS de fetch direct — passe par api.ts
        const incidents = await api.getIncidents();
        setData(incidents);
      } catch (err) {
        console.error(err);
        // logout UNIQUEMENT si api.ts n’a pas pu refresh
        logout();
      }
    };

    loadData();
  }, [logout]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username}</p>
      <button onClick={logout}>Logout</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

// =======================================================
// App Router
// =======================================================
const App = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading session...</div>;
  }

  return user ? <Dashboard /> : <Login />;
};

// =======================================================
// Bootstrap
// =======================================================
const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
