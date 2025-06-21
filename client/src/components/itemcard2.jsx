import React from 'react';
import { titleCase } from '../functions/stringUtils';

const ItemCard2 = ({ item, onClick, selected }) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-3 rounded-md shadow-custom border-2 transition 
        ${selected ? 'bg-[#17211d] border-transparent' : 'bg-[#111816] border-transparent'} 
        hover:border-[#6bff7a] transition duration-300`}
    >
      <img
        src={item.url}
        alt={item.name}
        className="w-15 h-15 object-contain mx-auto mb-3"
      />
      <h3 className="text-center text-[16px] font-mono font-medium">
        {titleCase(item.name)}
      </h3>
    </div>
  );
};

export default ItemCard2;
