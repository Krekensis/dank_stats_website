import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/navbar";
import DatePicker from "../components/datepicker";
import itemData from "../assets/parsed_items3.json";
import { neonizeHex, getAverageColor } from "../functions/colorUtils";
import { commas } from "../functions/stringUtils";

import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  CategoryScale
);

const MAX_SELECTED_ITEMS = 5;

const titleCase = (str) =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const ItemValueHistory = () => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateError, setDateError] = useState(false);
  const [chartData, setChartData] = useState(null);
  const chartRef = useRef(null);

  const canDisplay = selectedItems.length > 0 && startDate && endDate && !dateError;

  const dropdownRef = useRef(null);

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

  useEffect(() => {
    if (startDate && endDate) {
      setDateError(startDate > endDate);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (!chartData) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = document.getElementById("myChart").getContext("2d");
    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        animation: {
          duration: 0 // Disable global animation so custom per-point works better
        },
        animations: {
          x: {
            type: 'number',
            easing: 'linear',
            duration: 0 // No x movement animation
          },
          y: {
            type: 'number',
            easing: 'easeOutQuart', // Smooth vertical ease
            duration: 2000,
            from: (ctx) => ctx.chart.scales.y.getPixelForValue(0), // From y = 0
            delay: (ctx) => ctx.index * 30 // Delay based on point index (left to right)
          },
          elements: {
            line: {
              type: 'number',
              duration: 1200,
              easing: 'easeInOutSine',
              from: NaN
            },
            point: {
              type: 'number',
              duration: 400,
              easing: 'easeOutQuart',
              delay: (ctx) => ctx.index * 30
            }
          }
        },
        scales: {
          x: {
            type: "time",
            time: { tooltipFormat: "dd/MM/yyyy", unit: "day" },
            title: { display: false },
            ticks: { color: "#a4bbb0", maxTicksLimit: 10 },
            grid: { display: false },
          },
          y: {
            title: { display: false },
            ticks: {
              color: "#a4bbb0",
              callback: (value) => `⏣ ${commas(value)}`,
            },
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.formattedValue}`,
            },
          },
        },
      }

    });

    // Cleanup on unmount or next effect run
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData]);

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

  const handleDisplay = async () => {
    const datasets = await Promise.all(
      selectedItems.map(async (itemName) => {
        const item = items.find((i) => i.name === itemName);
        const baseColor = await getAverageColor(item.emoji.url);
        const color = neonizeHex(baseColor);

        const dataPoints = item.history
          .map((entry) => ({ x: new Date(entry.timestamp), y: entry.value }))
          .filter((entry) => entry.x >= startDate && entry.x <= endDate);

        return {
          label: titleCase(itemName),
          data: dataPoints,
          borderColor: color,
          backgroundColor: color,
          pointRadius: 4,
          pointHoverRadius: 5,
          tension: 0.4,
          emoji: item.emoji.url,
        };
      })
    );

    setChartData({ datasets });
  };


  return (
    <div className="min-h-screen bg-[#070e0c] text-white p-6">
      <Navbar />

      <div className="max-w-6xl mx-auto mt-24 flex justify-center items-center space-x-4">
        {/* Multi-select dropdown */}
        <div ref={dropdownRef} className="relative w-125">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setSearchTerm("");
            }}
            className={`w-full bg-[#111816] rounded-md px-4 py-2 font-mono text-left cursor-pointer leading-none border-2 ${dropdownOpen ? "border-[#6bff7a]" : "border-transparent"} text-[#a4bbb0] truncate`}
            style={{ height: "40px" }}
            type="button"
          >
            {selectedItems.length === 0
              ? `Select upto ${MAX_SELECTED_ITEMS} items...`
              : selectedItems.map(titleCase).join(", ")}
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-[#111816] border-transparent rounded-md shadow-custom custom-scrollbar">
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
                    const disabled = !checked && selectedItems.length >= MAX_SELECTED_ITEMS;
                    return (
                      <label
                        key={item.name}
                        className={`flex items-center space-x-2 px-4 py-2 hover:bg-[#1e2a27] cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelectItem(item.name)}
                          disabled={disabled}
                          className="hidden"
                        />
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-50 ${checked ? "border-[#6bff7a]" : "border-[#2b473e]"} ${disabled ? "opacity-50" : ""}`}
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
            </div>
          )}
        </div>

        {/* Date inputs */}
        <div className="relative">
          <div className="flex space-x-4 items-end">
            <DatePicker value={startDate} onChange={setStartDate} />
            <DatePicker value={endDate} onChange={setEndDate} />
          </div>
          {dateError && (
            <div className="absolute left-0 top-full mt-1 text-red-500 font-mono text-sm">
              Start date cannot be after end date.
            </div>
          )}
        </div>

        {/* Display button */}
        <button
          onClick={handleDisplay}
          disabled={!canDisplay}
          className={`font-mono font-extrabold py-[6px] px-6 rounded-md transition ${canDisplay
            ? "bg-[#6bff7a] hover:bg-[#58e36b] text-[#070e0c] cursor-pointer"
            : "bg-[#6bff7a63] text-[#070e0c] cursor-not-allowed"}`}
          style={{ height: "40px" }}
        >
          Display
        </button>
      </div>

      {/* Chart Section */}
      {chartData && (
        <div className="flex justify-center w-full mt-10 space-x-6">
          <div className="w-full max-w-4xl bg-[#111816] rounded-xl p-4 shadow-lg">
            <canvas id="myChart" className="w-full h-[400px]" />
          </div>

          <div className="bg-[#111816] p-4 rounded-xl shadow-lg flex flex-col space-y-2 font-mono text-[#a4bbb0] min-w-[180px]">
            <h2 className="text-base font-semibold text-[#ffffff] mb-2">Items</h2>
            {chartData?.datasets.map((ds) => (
              <div key={ds.label} className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-md" style={{ backgroundColor: ds.borderColor }} />
                <img src={ds.emoji} alt={ds.label} className="w-5 h-5" />
                <span className="truncate">{ds.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemValueHistory;