import React from 'react';
import { Hammer } from 'lucide-react';

const UnderConstructionView = ({ title = "Próximamente" }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4 animate-fade-in">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-gray-400">
        <Hammer size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-sm">
        Esta sección se encuentra en desarrollo como parte de la nueva actualización del panel operativo.
      </p>
    </div>
  );
};

export default UnderConstructionView;
