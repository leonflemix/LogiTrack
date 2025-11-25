// File: src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Settings, Plus, Trash2, MapPin, Box, Save
} from 'lucide-react';
import { db, appId } from '../firebase';

const AdminPage = () => {
  // State for different data types
  const [locations, setLocations] = useState([]);
  const [containerTypes, setContainerTypes] = useState([]);
  
  // Input States
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState('');

  // --- Fetch Data ---
  useEffect(() => {
    // 1. Fetch Locations
    const qLoc = query(collection(db, 'artifacts', appId, 'public', 'data', 'settings_locations'), orderBy('createdAt', 'desc'));
    const unsubLoc = onSnapshot(qLoc, (snapshot) => {
      setLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Fetch Container Types
    const qType = query(collection(db, 'artifacts', appId, 'public', 'data', 'settings_types'), orderBy('createdAt', 'desc'));
    const unsubType = onSnapshot(qType, (snapshot) => {
      setContainerTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubLoc();
      unsubType();
    };
  }, []);

  // --- Handlers ---

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'settings_locations'), {
        name: newLocation.trim(),
        createdAt: serverTimestamp()
      });
      setNewLocation('');
    } catch (err) {
      console.error("Error adding location:", err);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm("Remove this location?")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_locations', id));
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!newType.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'settings_types'), {
        name: newType.trim(),
        createdAt: serverTimestamp()
      });
      setNewType('');
    } catch (err) {
      console.error("Error adding type:", err);
    }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm("Remove this container type?")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_types', id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg border border-slate-200 p-4">
        <div>
          <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center">
            <Settings className="mr-2" size={20} /> System Configuration
          </h3>
          <p className="mt-1 text-sm text-slate-500">Manage master data and system drop-down lists.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* --- Locations Manager --- */}
        <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-700 flex items-center">
              <MapPin size={16} className="mr-2 text-blue-500" /> Approved Locations
            </h4>
          </div>
          
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <form onSubmit={handleAddLocation} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Add new port/city..." 
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md">
                <Plus size={16} />
              </button>
            </form>
          </div>

          <ul className="divide-y divide-slate-200 max-h-64 overflow-y-auto">
            {locations.map((loc) => (
              <li key={loc.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
                <span className="text-sm text-slate-700">{loc.name}</span>
                <button onClick={() => handleDeleteLocation(loc.id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
            {locations.length === 0 && <li className="px-4 py-4 text-center text-xs text-gray-400">No locations defined.</li>}
          </ul>
        </div>

        {/* --- Container Types Manager --- */}
        <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-700 flex items-center">
              <Box size={16} className="mr-2 text-blue-500" /> Container Types
            </h4>
          </div>
          
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <form onSubmit={handleAddType} className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. 40HC, 20GP..." 
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                value={newType}
                onChange={e => setNewType(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md">
                <Plus size={16} />
              </button>
            </form>
          </div>

          <ul className="divide-y divide-slate-200 max-h-64 overflow-y-auto">
            {containerTypes.map((type) => (
              <li key={type.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
                <span className="text-sm text-slate-700 font-mono">{type.name}</span>
                <button onClick={() => handleDeleteType(type.id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
            {containerTypes.length === 0 && <li className="px-4 py-4 text-center text-xs text-gray-400">No types defined.</li>}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default AdminPage;