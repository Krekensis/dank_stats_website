import React, { useState, useRef, useEffect, useMemo } from "react";

const titleCase = (str) =>
  str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

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

  // Preload emoji images for better performance
  useEffect(() => {
    items.forEach(item => {
      if (item.emoji?.url) {
        const img = new Image();
        img.src = item.emoji.url;
      }
    });
  }, [items]);

  // Sort items only when dropdown opens (not when selections change)
  useEffect(() => {
    if (dropdownOpen) {
      const selected = [];
      const unselected = [];
      
      items.forEach(item => {
        if (selectedItems.includes(item.name)) {
          selected.push(item);
        } else {
          unselected.push(item);
        }
      });

      // Sort selected items by their selection order
      selected.sort((a, b) => {
        const indexA = selectedItems.indexOf(a.name);
        const indexB = selectedItems.indexOf(b.name);
        return indexA - indexB;
      });

      setSortedItems([...selected, ...unselected]);
    }
  }, [dropdownOpen, items]); // Removed selectedItems dependency

  // Memoized filtered items (only filters, doesn't sort during selection)
  const filteredItems = useMemo(() => {
    return sortedItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedItems, searchTerm]);

  const toggleSelectItem = (name) => {
    if (selectedItems.includes(name)) {
      setSelectedItems(selectedItems.filter((n) => n !== name));
    } else {
      if (selectedItems.length < maxSelected) {
        setSelectedItems([...selectedItems, name]);
      }
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-125">
      <button
        onClick={() => {
          setDropdownOpen(!dropdownOpen);
          setSearchTerm("");
        }}
        className={`w-full bg-[#111816] rounded-md px-4 py-2 font-mono text-left cursor-pointer leading-none border-2 ${
          dropdownOpen ? "border-[#6bff7a]" : "border-transparent"
        } text-[#a4bbb0] truncate`}
        style={{ height: "40px" }}
        type="button"
      >
        {selectedItems.length === 0
          ? `Select upto ${maxSelected} items...`
          : selectedItems.map(titleCase).join(", ")}
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
                const checked = selectedItems.includes(item.name);
                const disabled = !checked && selectedItems.length >= maxSelected;
                return (
                  <label
                    key={item.name}
                    className={`flex items-center space-x-2 px-4 py-2 hover:bg-[#1e2a27] cursor-pointer select-none ${
                      disabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelectItem(item.name)}
                      disabled={disabled}
                      className="hidden"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-50 ${
                        checked ? "border-[#6bff7a]" : "border-[#2b473e]"
                      } ${disabled ? "opacity-50" : ""}`}
                      style={{ backgroundColor: "#0d1311" }}
                      aria-hidden="true"
                    >
                      {checked && (
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
                      src={item.emoji.url} 
                      alt={item.name} 
                      className="w-6 h-6" 
                      draggable={false}
                      loading="lazy"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.target.style.display = 'none';
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