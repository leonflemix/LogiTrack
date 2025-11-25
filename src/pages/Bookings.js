// File: src/pages/Bookings.js
import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import {
  Plus, Trash2, Search, FileText, Calendar, Hash
} from 'lucide-react';
import { db, appId } from '../firebase';

const Bookings = ({ user, userRole }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form State - strictly matching your requirements
  const [newBooking, setNewBooking] = useState({
    bookingNumber: '',
    qty: '',
    type: ''
  });

  // Fetch Data
  useEffect(() => {
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'bookings'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handlers
  const handleAddBooking = async (e) => {
    e.preventDefault();
    if (!newBooking.bookingNumber) return;

    try {
        // Check duplicates
        const duplicateQuery = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'bookings'),
            where('bookingNumber', '==', newBooking.bookingNumber)
        );
        const querySnapshot = await getDocs(duplicateQuery);
        if (!querySnapshot.empty) {
            alert(`Error: Booking ${newBooking.bookingNumber} already exists.`);
            return;
        }

        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), {
            ...newBooking,
            createdBy: user.email?.split('@')[0] || 'User',
            createdAt: serverTimestamp() // "timestamp it was created"
        });

        setNewBooking({
            bookingNumber: '',
            qty: '',
            type: ''
        });
        setIsAdding(false);
    } catch (err) {
        console.error("Error adding booking:", err);
        alert("Failed to save booking.");
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bookings', id));
  };

  const filteredBookings = bookings.filter(b =>
    b.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading bookings...</div>;

  return (
    <div className="space-y-6">
       {/* Header */}
       <div className="bg-white shadow sm:rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center">
            <FileText className="mr-2" size={20} /> Booking Management
          </h3>
          <p className="mt-1 text-sm text-slate-500">Manage shipment bookings.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md border p-2"
                    placeholder="Search Booking #..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {['Admin', 'Logistics'].includes(userRole) && (
                <button
                onClick={() => setIsAdding(!isAdding)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                >
                {isAdding ? 'Cancel' : <><Plus size={16} className="mr-2" /> New Booking</>}
                </button>
            )}
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-sm font-bold text-blue-900 uppercase mb-4">Create New Booking</h4>
            <form onSubmit={handleAddBooking} className="grid grid-cols-1 gap-6 sm:grid-cols-4 items-end">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-blue-800 mb-1">Booking Number</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Hash size={14} className="text-blue-400" />
                        </div>
                        <input required type="text" placeholder="BK-2024-001" 
                            className="block w-full pl-10 rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            value={newBooking.bookingNumber} onChange={e => setNewBooking({...newBooking, bookingNumber: e.target.value.toUpperCase()})} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-blue-800 mb-1">Qty</label>
                    <input required type="number" min="1" placeholder="1" 
                        className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        value={newBooking.qty} onChange={e => setNewBooking({...newBooking, qty: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-blue-800 mb-1">Type</label>
                    <input required type="text" placeholder="20GP / 40HC" 
                        className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        value={newBooking.type} onChange={e => setNewBooking({...newBooking, type: e.target.value.toUpperCase()})} />
                </div>
                <div className="sm:col-span-4 flex justify-end mt-2">
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center shadow-sm">
                        Save Booking
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Booking Number</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <FileText size={16} className="text-blue-500 mr-2" />
                                <span className="text-sm font-bold text-slate-700">{booking.bookingNumber}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">
                                <span className="font-medium">{booking.qty}</span> x <span className="font-mono bg-slate-100 px-1 rounded">{booking.type}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                                <div className="text-sm text-slate-500 flex items-center">
                                    <Calendar size={14} className="mr-1" />
                                    {booking.createdAt?.seconds ? new Date(booking.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                    by {booking.createdBy}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {userRole === 'Admin' && (
                                <button onClick={() => deleteBooking(booking.id)} className="text-red-600 hover:text-red-900 p-1" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
                {filteredBookings.length === 0 && (
                    <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No bookings found.</td></tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;