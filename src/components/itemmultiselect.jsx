// src/components/ItemMultiSelect.js
import React, { useState, useRef, useEffect } from "react";

const ItemMultiSelect = ({ items, selectedItems, setSelectedItems, maxSelected }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter items by search term (case-insensitive)
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle select/deselect item
  const toggleSelectItem = (itemName) => {
    if (selectedItems.includes(itemName)) {
      setSelectedItems(selectedItems.filter((name) => name !== itemName));
    } else if (selectedItems.length < maxSelected) {
      setSelectedItems([...selectedItems, itemName]);
    }
  };

  return (
    <div
      className="relative font-mono"
      ref={wrapperRef}
      style={{ width: "235px" }}
    >
      {/* Dropdown toggle button */}
      <button
        type="button"
        onClick={() => setDropdownOpen((open) => !open)}
        className="w-full bg-[#111816] text-[#a4bbb0] rounded-md p-2 flex justify-between items-center shadow-md focus:outline-none"
      >
        <span>
          {selectedItems.length === 0
            ? "Select items..."
            : selectedItems.join(", ")}
        </span>
        <svg
          className={`w-4 h-4 ml-2 transform transition-transform ${
            dropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {dropdownOpen && (
        <div
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#111816] shadow-lg ring-1 ring-black ring-opacity-5"
          style={{ maxHeight: "240px" }}
        >
          {/* Search input */}
          <input
            type="text"
            className="w-full px-3 py-2 bg-[#222926] text-[#a4bbb0] rounded-t-md focus:outline-none"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />

          {/* Items list */}
          <ul className="max-h-52 overflow-auto">
            {filteredItems.length === 0 && (
              <li className="px-3 py-2 text-[#777] italic">No items found</li>
            )}
            {filteredItems.map((item) => {
              const isSelected = selectedItems.includes(item.name);
              const isDisabled =
                !isSelected && selectedItems.length >= maxSelected;
              return (
                <li
                  key={item.name}
                  className={`flex items-center px-3 py-2 cursor-pointer select-none ${
                    isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e2a22]"
                  }`}
                  onClick={() => {
                    if (!isDisabled) toggleSelectItem(item.name);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="mr-2 cursor-pointer"
                  />
                  <img
                    src={item.emoji.url}
                    alt={item.name}
                    className="w-5 h-5 mr-2 select-none pointer-events-none"
                    draggable={false}
                  />
                  <span>{item.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ItemMultiSelect;
