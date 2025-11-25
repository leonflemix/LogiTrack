// File: src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  Box, Plus, Trash2, Ship, Search, 
  LogOut, Shield, FileText, Scale, Container,
  Users, LayoutDashboard, Anchor, Settings
} from 'lucide-react';
import { db, appId } from '../firebase';
import StatusBadge from '../components/StatusBadge';
import UserManagement from './UserManagement'; 
import Bookings from './Bookings'; 
import AdminPage from './AdminPage'; // IMPORT NEW ADMIN PAGE

const Dashboard = ({ user, userRole, onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'bookings', 'users', 'admin'
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State Structure
  const [newContainer, setNewContainer] = useState({
    containerNumber: '',
    tareWeight: '',
    type: '',
    bookingNumber: '',
    status: 'Pending'
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
    if (!newContainer.containerNumber) return;

    try {
      const duplicateQuery = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'containers'),
        where('containerNumber', '==', newContainer.containerNumber)
      );
      
      const querySnapshot = await getDocs(duplicateQuery);

      if (!querySnapshot.empty) {
        alert(`Error: Container ${newContainer.containerNumber} already exists in the system.`);
        return; 
      }

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'containers'), {
        ...newContainer,
        lastUpdatedBy: user.email?.split('@')[0] || 'User', 
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      setNewContainer({ 
        containerNumber: '', 
        tareWeight: '', 
        type: '', 
        bookingNumber: '', 
        status: 'Pending' 
      });
      
      setIsAdding(false);

    } catch (err) {
      console.error("Error adding:", err);
      alert("Failed to add container. Please try again.");
    }
  };

  const updateStatus = async (id, newStatus) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'containers', id);
    await updateDoc(docRef, { 
        status: newStatus, 
        lastUpdatedBy: user.email?.split('@')[0] || 'User', 
        updatedAt: serverTimestamp() 
    });
  };

  const deleteContainer = async (id) => {
    if (!window.confirm("Delete this container record?")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'containers', id));
  };

  const filteredContainers = containers.filter(c => 
    (c.containerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Ship className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <span className="font-bold text-xl tracking-tight block">LogiTrack</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Logistics Console</span>
              </div>
              
              {/* Navigation Links */}
              <div className="hidden md:flex ml-10 space-x-2">
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  <LayoutDashboard size={16} className="mr-2" /> Dashboard
                </button>

                <button 
                  onClick={() => setCurrentView('bookings')}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'bookings' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  <Anchor size={16} className="mr-2" /> Bookings
                </button>
                
                {userRole === 'Admin' && (
                  <>
                    <button 
                      onClick={() => setCurrentView('users')}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'users' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                    >
                      <Users size={16} className="mr-2" /> Users
                    </button>
                    <button 
                      onClick={() => setCurrentView('admin')}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                    >
                      <Settings size={16} className="mr-2" /> Admin
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center text-sm bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <Shield size={14} className={`mr-2 ${userRole === 'Admin' ? 'text-green-400' : 'text-blue-400'}`} />
                <div className="flex flex-col items-start">
                    <span className="font-medium text-slate-200 leading-none">{user.email?.split('@')[0]}</span>
                    <span className="text-[10px] text-slate-400 uppercase mt-0.5">{userRole || 'Staff'}</span>
                </div>
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
        
        {/* View Logic */}
        {currentView === 'users' && userRole === 'Admin' ? (
          <UserManagement />
        ) : currentView === 'admin' && userRole === 'Admin' ? (
          <AdminPage />
        ) : currentView === 'bookings' ? (
          <Bookings user={user} userRole={userRole} />
        ) : (
          <>
            {/* Standard Dashboard View */}
            <div className="mb-8 md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                  Live Shipment Overview
                </h2>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                {/* Allow adding only for Admin or Logistics */}
                {['Admin', 'Logistics'].includes(userRole) && (
                    <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                    {isAdding ? 'Cancel' : <><Plus className="-ml-1 mr-2 h-5 w-5" /> Register Container</>}
                    </button>
                )}
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
                placeholder="Search Container # or Booking #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Add Form */}
            {isAdding && (
              <div className="mb-8 bg-white shadow rounded-lg border border-blue-100 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Register New Shipment</h3>
                <form onSubmit={handleAddContainer} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Container Number</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Container size={16} className="text-gray-400" />
                        </div>
                        <input required type="text" placeholder="MSCU1234567" 
                            className="block w-full pl-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                            value={newContainer.containerNumber} 
                            onChange={e => setNewContainer({...newContainer, containerNumber: e.target.value.toUpperCase()})} />
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Booking Number</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FileText size={16} className="text-gray-400" />
                        </div>
                        <input required type="text" placeholder="BK-987654" 
                            className="block w-full pl-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                            value={newContainer.bookingNumber} 
                            onChange={e => setNewContainer({...newContainer, bookingNumber: e.target.value.toUpperCase()})} />
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Tare Weight (kg)</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Scale size={16} className="text-gray-400" />
                        </div>
                        <input required type="text" placeholder="2200" 
                            className="block w-full pl-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                            value={newContainer.tareWeight} 
                            onChange={e => setNewContainer({...newContainer, tareWeight: e.target.value})} />
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Type</label>
                    <input required type="text" placeholder="20GP / 40HC" 
                      className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                      value={newContainer.type} 
                      onChange={e => setNewContainer({...newContainer, type: e.target.value.toUpperCase()})} />
                  </div>

                  <div className="lg:col-span-4 flex justify-end">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium text-sm flex items-center">
                      <Plus size={16} className="mr-2" />
                      Save Container
                    </button>
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
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Container / Type</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Booking Info</th>
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
                                    <div className="text-sm font-bold text-blue-600">{container.containerNumber || container.containerId}</div>
                                    <div className="text-xs text-slate-500 font-mono bg-slate-100 px-1 rounded inline-block mt-1">
                                      {container.type || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-900 font-medium">{container.bookingNumber || 'No Booking #'}</div>
                                <div className="text-sm text-slate-500">Tare: {container.tareWeight ? `${container.tareWeight}kg` : 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={container.status} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                <div className="flex flex-col">
                                  <span>{container.lastUpdatedBy}</span>
                                  <span className="text-xs text-slate-400">
                                    {container.updatedAt?.seconds ? new Date(container.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  {/* Only Admin, Logistics, Driver can update status */}
                                  {['Admin', 'Logistics', 'Driver'].includes(userRole) ? (
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
                                  ) : (
                                      <span className="text-xs text-gray-400">Read Only</span>
                                  )}
                                  
                                  {/* Only Admin can delete */}
                                  {userRole === 'Admin' && (
                                      <button onClick={() => deleteContainer(container.id)} className="text-red-600 hover:text-red-900 p-1"><Trash2 size={16} /></button>
                                  )}
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
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;