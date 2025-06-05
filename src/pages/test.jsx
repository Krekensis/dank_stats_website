import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/navbar";
import itemData from "../assets/parsed_items3.json";

const MAX_SELECTED_ITEMS = 3;

const titleCase = (str) =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const ItemValueHistory = () => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const dropdownRef = useRef();

  useEffect(() => {
    const filtered = itemData
      .filter((item) => item.emoji?.url)
      .sort((a, b) => a.name.localeCompare(b.name));
    setItems(filtered);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelectItem = (itemName) => {
    if (selectedItems.includes(itemName)) {
      setSelectedItems(selectedItems.filter((i) => i !== itemName));
    } else {
      if (selectedItems.length < MAX_SELECTED_ITEMS) {
        setSelectedItems([...selectedItems, itemName]);
      } else {
        alert(`You can select up to ${MAX_SELECTED_ITEMS} items only.`);
      }
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070e0c] text-white p-6">
      <Navbar />

      <div className="max-w-6xl mx-auto mt-24 flex justify-center items-center space-x-6">
        {/* Multi-select dropdown */}
        <div className="relative w-100">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDropdownOpen(true);
            }}
            placeholder="Type to search..."
            onFocus={() => setDropdownOpen(true)}
            className="w-full bg-[#111816] rounded-md px-4 py-2 font-mono text-white border-0 border-transparent placeholder-[#a4bbb0] placeholder-opacity-100 focus:outline-none focus:ring-2 focus:ring-[#6bff7a] focus:border-[#6bff7a]"
            style={{ height: "40px" }}
          />

          {dropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-[#111816] border-transparent rounded-md shadow-lg custom-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#2b473e #0d1311",
              }}
            >
              {/* Custom scrollbar styles */}
              <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #0d1311;
                  border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: #2b473e;
                  border-radius: 6px;
                  border: 2px solid #0d1311;
                }
              `}</style>

              {filteredItems.length === 0 ? (
                <div className="px-4 py-2 font-mono text-[#a4bbb0]">No such item found</div>
              ) : (
                filteredItems.map((item) => {
                  const checked = selectedItems.includes(item.name);
                  const disabled = !checked && selectedItems.length >= MAX_SELECTED_ITEMS;

                  return (
                    <label
                      key={item.name}
                      className={`flex items-center space-x-2 px-4 py-2 hover:bg-[#1e2a27] cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""
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
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-50
                          ${checked ? "border-[#6bff7a]" : "border-[#2b473e]"}
                          ${disabled ? "opacity-50" : ""}
                        `}
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
                      />
                      <span className="font-mono">{titleCase(item.name)}</span>
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Date inputs */}
        <div className="flex space-x-4">
          <div className="flex flex-col">
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md px-3 py-2 bg-[#111816] border-transparent font-mono text-white"
              max={endDate || undefined}
              style={{ height: "40px" }}
            />
          </div>

          <div className="flex flex-col">
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md px-3 py-2 bg-[#111816] border-transparent font-mono text-white"
              min={startDate || undefined}
              style={{ height: "40px" }}
            />
          </div>
        </div>

        {/* Display button */}
        <button
          onClick={() => {
            alert(
              `Items: ${selectedItems
                .map(titleCase)
                .join(", ")}\nStart: ${startDate}\nEnd: ${endDate}`
            );
          }}
          className="bg-[#6bff7a] hover:bg-[#58e36b] font-mono text-[#070e0c] font-bold py-2 px-6 rounded-md transition"
          style={{ height: "40px" }}
        >
          Display
        </button>
      </div>
    </div>
  );
};

export default ItemValueHistory;
