import React from 'react';

const StatCard = ({ title, value, icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  const iconClass = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-start justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-3xl font-semibold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClass}`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
