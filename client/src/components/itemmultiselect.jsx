import React, { useState, useRef, useEffect, useMemo } from "react";
import { titleCase } from "../functions/stringUtils";

const ItemMultiSelect = ({ items, selectedItems, setSelectedItems, maxSelected }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortedItems, setSortedItems] = useState(items);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Preload emoji images
  useEffect(() => {
    items.forEach(item => {
      if (item.url) {
        const img = new Image();
        img.src = item.url;
      }
    });
  }, [items]);

  // Sort on dropdown open
  useEffect(() => {
    if (dropdownOpen) {
      const selected = [];
      const unselected = [];

      items.forEach(item => {
        if (selectedItems.some(sel => sel.name === item.name)) {
          selected.push(item);
        } else {
          unselected.push(item);
        }
      });

      selected.sort((a, b) => {
        const indexA = selectedItems.findIndex(sel => sel.name === a.name);
        const indexB = selectedItems.findIndex(sel => sel.name === b.name);
        return indexA - indexB;
      });

      setSortedItems([...selected, ...unselected]);
    }
  }, [dropdownOpen, items]);

  // Filtered visible items
  const filteredItems = useMemo(() => {
    return sortedItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedItems, searchTerm]);

  const toggleSelectItem = (item) => {
    const isSelected = selectedItems.some(sel => sel.name === item.name);

    if (isSelected) {
      setSelectedItems(selectedItems.filter(sel => sel.name !== item.name));
    } else if (selectedItems.length < maxSelected) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-125">
      <button
        onClick={() => {
          setDropdownOpen(!dropdownOpen);
          setSearchTerm("");
        }}
        className={`w-full bg-[#111816] rounded-md px-4 py-2 font-mono text-left cursor-pointer leading-none border-2 ${dropdownOpen ? "border-[#6bff7a]" : "border-transparent"
          } text-[#a4bbb0] truncate`}
        style={{ height: "40px" }}
        type="button"
      >
        {selectedItems.length === 0
          ? `Select up to ${maxSelected} items...`
          : selectedItems.map((item) => titleCase(item.name)).join(", ")}
      </button>

      {dropdownOpen && (
        <div className="absolute z-1 mt-1 w-full max-h-64 overflow-y-auto bg-[#111816] border-transparent rounded-md shadow-custom custom-scrollbar">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #0d1311; border-radius: 6px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #2b473e; border-radius: 6px; border: 2px solid #0d1311; }
          `}</style>
          <div className="p-2">
            <input
              type="text"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md px-3 py-1 bg-[#0d1311] font-mono text-[#a4bbb0] border-2 border-transparent focus:outline-none placeholder-[#a4bbb0] placeholder-opacity-100"
            />
          </div>
          <div>
            {filteredItems.length === 0 ? (
              <div className="px-4 py-2 font-mono text-[#a4bbb0]">No such item found.</div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItems.some(sel => sel.name === item.name);
                const disabled = !isSelected && selectedItems.length >= maxSelected;

                return (
                  <label
                    key={item.name}
                    className={`flex items-center space-x-2 px-4 py-2 hover:bg-[#1e2a27] cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item)}
                      disabled={disabled}
                      className="hidden"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-50 ${isSelected ? "border-[#6bff7a]" : "border-[#2b473e]"
                        } ${disabled ? "opacity-50" : ""}`}
                      style={{ backgroundColor: "#0d1311" }}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-[#6bff7a]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-6 h-6"
                      draggable={false}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <span className="font-mono">{titleCase(item.name)}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemMultiSelect;