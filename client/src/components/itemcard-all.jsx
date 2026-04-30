import React from 'react';
import { titleCase } from '../functions/stringUtils';

const ItemCardAll = ({ item, onClick, selected }) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-2 md:p-3 rounded-md shadow-custom border-2 transition 
        ${selected ? 'bg-[#17211d] border-transparent' : 'bg-[#111816] border-transparent'} 
        hover:border-[#6bff7a] transition duration-300 aspect-square flex flex-col items-center justify-center overflow-hidden`}
    >
      <img
        src={item.url}
        alt={item.name}
        className="w-13 h-13 md:w-16 md:h-16 object-contain mb-2 md:mb-3 shrink-0"
      />
      <h3 className="text-center text-[12px] md:text-[14px] leading-tight md:leading-snug font-mono font-medium line-clamp-2 w-full overflow-hidden text-ellipsis break-words">
        {titleCase(item.name)}
      </h3>
    </div>
  );
};

export default ItemCardAll;
