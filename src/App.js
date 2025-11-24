import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithCustomToken, 
  signInAnonymously,
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  Box, Truck, MapPin, CheckCircle, AlertCircle, 
  Plus, Trash2, Edit3, Ship, Clock, Search, 
  User, LogOut, Shield, Key
} from 'lucide-react';

/**
 * =================================================================
 * File: src/firebase.js
 * Description: Firebase configuration and initialization
 * =================================================================
 */

// Helper to safely access process.env (prevents crashes in non-Node/Build envs)
const getEnv = (key, fallback) => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // process is not defined
  }
  return fallback;
};

// Configuration prioritizes Environment Variables (Vercel/CRA),
// falls back to the hardcoded values provided.
const clientConfig = {
  apiKey: getEnv("REACT_APP_FIREBASE_API_KEY", "AIzaSyAmtishEOmSpuxzogrNYxlsQlHYkbz0opo"),
  authDomain: getEnv("REACT_APP_FIREBASE_AUTH_DOMAIN", "logitrack-f8334.firebaseapp.com"),
  projectId: getEnv("REACT_APP_FIREBASE_PROJECT_ID", "logitrack-f8334"),
  storageBucket: getEnv("REACT_APP_FIREBASE_STORAGE_BUCKET", "logitrack-f8334.firebasestorage.app"),
  messagingSenderId: getEnv("REACT_APP_FIREBASE_MESSAGING_SENDER_ID", "118498014046"),
  appId: getEnv("REACT_APP_FIREBASE_APP_ID", "1:118498014046:web:a4455c2b5f419941cb15cf"),
  measurementId: getEnv("REACT_APP_FIREBASE_MEASUREMENT_ID", "G-0B37P3XPR5")
};

// Logic to select the correct config:
// 1. If running in the preview environment (here), use the internal __firebase_config.
// 2. If running locally or on Vercel, use clientConfig (Env Vars or Fallbacks).
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : clientConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Use default app ID if not in environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

/**
 * =================================================================
 * File: src/components/StatusBadge.js
 * Description: Reusable component for displaying shipment status
 * =================================================================
 */
const StatusBadge = ({ status }) => {
  const styles = {
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'In Transit': 'bg-blue-100 text-blue-800 border-blue-200',
    'Docked': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Delivered': 'bg-green-100 text-green-800 border-green-200',
    'Delayed': 'bg-red-100 text-red-800 border-red-200',
  };
  
  const icons = {
    'Pending': Clock,
    'In Transit': Truck,
    'Docked': Ship,
    'Delivered': CheckCircle,
    'Delayed': AlertCircle,
  };

  const Icon = icons[status] || Box;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      <Icon size={12} className="mr-1" />
      {status}
    </span>
  );
};

/**
 * =================================================================
 * File: src/pages/LoginPage.js
 * Description: Admin authentication screen
 * =================================================================
 */
const LoginPage = ({ onLogin, loading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600">
          <Ship className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          LogiTrack Admin
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in to manage container logistics
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email / Username
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="admin@logitrack.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in as Admin'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">System Status: Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * =================================================================
 * File: src/pages/Dashboard.js
 * Description: Main view with container list and management tools
 * =================================================================
 */
const Dashboard = ({ user, onLogout }) => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newContainer, setNewContainer] = useState({
    containerId: '',
    origin: '',
    destination: '',
    status: 'Pending',
    contents: ''
  });

  // Data Fetching
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'containers');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setContainers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Handlers
  const handleAddContainer = async (e) => {
    e.preventDefault();
    if (!newContainer.containerId) return;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'containers'), {
        ...newContainer,
        lastUpdatedBy: user.displayName || 'Admin',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setNewContainer({ containerId: '', origin: '', destination: '', status: 'Pending', contents: '' });
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding:", err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'containers', id);
    await updateDoc(docRef, { status: newStatus, lastUpdatedBy: user.displayName || 'Admin', updatedAt: serverTimestamp() });
  };

  const deleteContainer = async (id) => {
    if (!confirm("Delete this container record?")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'containers', id));
  };

  const filteredContainers = containers.filter(c => 
    c.containerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Ship className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <span className="font-bold text-xl tracking-tight block">LogiTrack</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Admin Console</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center text-sm bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <Shield size={14} className="mr-2 text-green-400" />
                <span className="font-medium text-slate-200">{user.displayName || 'Administrator'}</span>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8 md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
              Live Shipment Overview
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              {isAdding ? 'Cancel' : <><Plus className="-ml-1 mr-2 h-5 w-5" /> Register Container</>}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search containers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Add Form */}
        {isAdding && (
          <div className="mb-8 bg-white shadow rounded-lg border border-blue-100 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Register New Shipment</h3>
            <form onSubmit={handleAddContainer} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <input required placeholder="Container ID" className="border p-2 rounded" value={newContainer.containerId} onChange={e => setNewContainer({...newContainer, containerId: e.target.value.toUpperCase()})} />
              <input required placeholder="Origin" className="border p-2 rounded" value={newContainer.origin} onChange={e => setNewContainer({...newContainer, origin: e.target.value})} />
              <input required placeholder="Destination" className="border p-2 rounded" value={newContainer.destination} onChange={e => setNewContainer({...newContainer, destination: e.target.value})} />
              <input placeholder="Contents" className="border p-2 rounded" value={newContainer.contents} onChange={e => setNewContainer({...newContainer, contents: e.target.value})} />
              <div className="lg:col-span-4 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Record</button>
              </div>
            </form>
          </div>
        )}

        {/* Table View */}
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-slate-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Container</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Route</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Update</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {loading ? (
                      <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
                    ) : filteredContainers.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-4 text-slate-500">No records found</td></tr>
                    ) : (
                      filteredContainers.map((container) => (
                        <tr key={container.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-100 rounded-lg">
                                <Box className="h-6 w-6 text-slate-500" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">{container.containerId}</div>
                                <div className="text-sm text-slate-500">{container.contents}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">{container.destination}</div>
                            <div className="text-sm text-slate-500">From: {container.origin}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={container.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <div className="flex flex-col">
                              <span>{container.currentLocation || 'Origin'}</span>
                              <span className="text-xs">by {container.lastUpdatedBy}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <select 
                                value={container.status}
                                onChange={(e) => updateStatus(container.id, e.target.value)}
                                className="text-xs border-slate-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option>Pending</option>
                                <option>In Transit</option>
                                <option>Docked</option>
                                <option>Delivered</option>
                                <option>Delayed</option>
                              </select>
                              <button onClick={() => deleteContainer(container.id)} className="text-red-600 hover:text-red-900 p-1"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/**
 * =================================================================
 * File: src/App.js
 * Description: Main entry point and router logic
 * =================================================================
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // 1. Check for existing session on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle Login Action
  const handleLogin = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    
    // SIMULATED AUTH for Demo Purposes
    try {
      let currentUser;
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        // Preview mode: Use internal token
        const userCred = await signInWithCustomToken(auth, __initial_auth_token);
        currentUser = userCred.user;
      } else {
        // Local mode: Anonymous login or implement your own email/pass logic
        // Note: For real email/pass, enable it in Firebase Console and use signInWithEmailAndPassword
        const userCred = await signInAnonymously(auth);
        currentUser = userCred.user;
      }

      await updateProfile(currentUser, {
        displayName: email.split('@')[0]
      });
      
    } catch (err) {
      console.error("Login Error:", err);
      setAuthError("Login failed. Check console for details.");
      setLoading(false);
    }
  };

  // 3. Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  // 4. Routing Logic
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} loading={loading} error={authError} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}