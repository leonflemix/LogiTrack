// File: src/components/StatusBadge.js
import React from 'react';
import { 
  Box, Truck, CheckCircle, AlertCircle, Ship, Clock
} from 'lucide-react';

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

export default StatusBadge;