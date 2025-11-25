// File: src/pages/UserManagement.js
import React, { useState, useEffect } from 'react';
import { initializeApp, getApp } from 'firebase/app'; 
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'; 
import { 
  collection, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Users, Shield, UserCog, Plus, X, Save, KeyRound, Trash2, Mail
} from 'lucide-react';
import { db, appId, auth, firebaseConfig } from '../firebase';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add User Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'Staff'
  });

  // Fetch all users
  useEffect(() => {
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'users'),
      orderBy('lastLogin', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Logic: Create User without logging out Admin ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if(!newUser.email || !newUser.password) return;

    try {
      const secondaryAppName = 'secondaryApp';
      let secondaryApp;
      try {
        secondaryApp = getApp(secondaryAppName);
      } catch (e) {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), {
        email: newUser.email,
        role: newUser.role,
        createdAt: serverTimestamp(),
        lastLogin: null 
      });

      await signOut(secondaryAuth);
      
      setNewUser({ email: '', password: '', role: 'Staff' });
      setIsAdding(false);
      alert(`User ${newUser.email} created successfully!`);

    } catch (error) {
      console.error("Error creating user:", error);
      alert(`Failed to create user: ${error.message}`);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userId);
      await updateDoc(userRef, { role: newRole });
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role.");
    }
  };

  // --- NEW: Send Password Reset Email ---
  const handleResetPassword = async (email) => {
    if (!window.confirm(`Send a password reset email to ${email}?`)) return;
    
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Password reset email sent to ${email}.`);
    } catch (error) {
      console.error("Error sending reset:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // --- NEW: Delete User (Database Only) ---
  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email}? \n\nThis removes their access to the Dashboard immediately.`)) return;

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user record.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading users...</div>;

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="bg-white shadow sm:rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center">
            <Users className="mr-2" size={20} /> User Management
          </h3>
          <p className="mt-1 text-sm text-slate-500">Control access levels and manage staff accounts.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          {isAdding ? <><X size={16} className="mr-2" /> Cancel</> : <><Plus size={16} className="mr-2" /> Add User</>}
        </button>
      </div>

      {/* Add User Form */}
      {isAdding && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 animate-in fade-in slide-in-from-top-2">
          <h4 className="text-sm font-bold text-blue-900 uppercase mb-4">Create New Account</h4>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-6 sm:grid-cols-4 items-end">
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Email Address</label>
              <input 
                required 
                type="email" 
                placeholder="driver@logitrack.com"
                className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Password</label>
              <input 
                required 
                type="text" 
                placeholder="Temporary Password"
                className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Role</label>
              <select
                className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="Staff">Staff</option>
                <option value="Driver">Driver</option>
                <option value="Logistics">Logistics</option>
                <option value="Operator">Operator</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center shadow-sm">
                <Save size={16} className="mr-2" /> Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
        <ul className="divide-y divide-slate-200">
          {users.map((user) => (
            <li key={user.id} className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                
                {/* User Info */}
                <div className="flex items-center mb-4 sm:mb-0">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                    <UserCog size={20} />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-slate-900 flex items-center">
                      {user.email}
                      {user.role === 'Admin' && (
                        <Shield size={12} className="ml-2 text-green-500" />
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center">
                      <Mail size={10} className="mr-1" />
                      {user.id.slice(0, 8)}... 
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-3">
                  {/* Role Dropdown */}
                  <div>
                    <label className="sr-only">Role</label>
                    <select
                        value={user.role || 'Staff'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={user.email === 'admin@logitrack.com'} // Protect main admin
                        className={`block w-32 pl-3 pr-8 py-1 text-xs font-semibold border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm border cursor-pointer
                        ${user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                            user.role === 'Driver' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-white text-gray-700'}
                        `}
                    >
                        <option value="Admin">Admin</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Driver">Driver</option>
                        <option value="Operator">Operator</option>
                        <option value="Staff">Staff</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center border-l border-slate-300 pl-3 space-x-2">
                    <button 
                        onClick={() => handleResetPassword(user.email)}
                        title="Send Password Reset Email"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                        <KeyRound size={16} />
                    </button>
                    
                    {user.email !== 'admin@logitrack.com' && (
                        <button 
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            title="Remove User Access"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                  </div>
                </div>

              </div>
            </li>
          ))}
          {users.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">No users found in the database.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;