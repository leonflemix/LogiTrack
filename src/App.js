// File: src/App.js
import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, appId } from './firebase';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // Store the specific role (Admin, Driver, etc)
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // 1. Check for existing session on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // If logged in, fetch their role from the database
        await fetchUserRole(currentUser);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper: Fetch Role from Firestore
  const fetchUserRole = async (currentUser) => {
    try {
      const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        setUser(currentUser);
      } else {
        // CRITICAL: If user auth exists but no DB record, create default record
        // If it's the specific admin email, give Admin rights immediately
        const initialRole = currentUser.email === 'admin@logitrack.com' ? 'Admin' : 'Staff';
        
        await setDoc(userDocRef, {
          email: currentUser.email,
          role: initialRole,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
        
        setUserRole(initialRole);
        setUser(currentUser);
      }
    } catch (err) {
      console.error("Error fetching role:", err);
      setAuthError("Database connection failed.");
    }
  };

  // 2. Handle Login Action
  const handleLogin = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Try to Sign In
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (err) {
      // If User Not Found (code: auth/user-not-found or auth/invalid-credential), try to REGISTER them automatically for this demo
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        try {
          // Auto-registration for demo smoothness
          await createUserWithEmailAndPassword(auth, email, password);
          // onAuthStateChanged will handle the rest
        } catch (regErr) {
          console.error("Registration Error:", regErr);
          setAuthError(`Login/Register Failed: ${regErr.message}`);
          setLoading(false);
        }
      } else {
        console.error("Login Error:", err);
        setAuthError(`Login Failed: ${err.message}`);
        setLoading(false);
      }
    }
  };

  // 3. Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

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

  // Pass the role down to the dashboard so it knows what to show
  return <Dashboard user={user} userRole={userRole} onLogout={handleLogout} />;
}