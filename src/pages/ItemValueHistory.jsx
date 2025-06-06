import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/navbar";
import DatePicker from "../components/datepicker";
import ItemMultiSelect from "../components/itemmultiselect";
import itemData from "../assets/parsed_items3.json";
import { neonizeHex, getAverageColor } from "../functions/colorUtils";
import { commas } from "../functions/stringUtils";
import zoomPlugin from "chartjs-plugin-zoom";

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
  zoomPlugin,
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
          zoom: {
            pan: {
              enabled: true,
              mode: "x",
              modifierKey: "ctrl",
              onPanStart: ({ chart }) => {
                chart.options.animation = false;
              },
              onPanComplete: ({ chart }) => {
                chart.options.animation = false;
              },
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: "x",
              onZoomStart: ({ chart }) => {
                chart.options.animation = false;
              },
              onZoomComplete: ({ chart }) => {
                chart.options.animation = false;
              },
            },
            limits: {
              x: { min: "original", max: "original" },
              y: { min: "original", max: "original" },
            }
          }
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

      <div className="max-w-6xl mx-auto mt-20 mb-[19px] flex justify-center items-center space-x-4">
        {/* Multi-select dropdown */}
        <ItemMultiSelect
          items={items}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          maxSelected={MAX_SELECTED_ITEMS}
        />

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
        <>
          {/* Chart + Legend container */}
          <div
            className="flex justify-between m-[19px]"
            id="chart-legend-container"
            style={{ width: "1251px", margin: "0 auto", gap: "19px" }}
          >
            {/* Chart container */}
            <div
              className="bg-[#111816] rounded-xl p-4 shadow-lg"
              id="chart-container"
              style={{
                flex: "0 0 997px",
                maxWidth: "997px",
              }}
            >
              <canvas id="myChart" className="w-full h-[400px]" />
            </div>

            {/* Legend container */}
            <div
              className="bg-[#111816] p-4 rounded-xl shadow-lg flex flex-col space-y-2 font-mono text-[#a4bbb0]"
              id="legend-container"
              style={{ flex: "0 0 235px", minWidth: "235px" }}
            >
              <h2 className="text-base font-semibold text-[#ffffff] mb-2">Items</h2>
              {chartData?.datasets.map((ds) => (
                <div key={ds.label} className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-md"
                    style={{ backgroundColor: ds.borderColor }}
                  />
                  <img src={ds.emoji} alt={ds.label} className="w-5 h-5" />
                  <span className="truncate">{ds.label}</span>
                </div>
              ))}
              <button
                onClick={() => chartRef.current?.resetZoom()}
                className="mt-4 px-3 py-1 rounded bg-[#6bff7a] hover:bg-[#58e36b] text-[#070e0c] text-sm font-semibold transition"
              >
                Reset Zoom
              </button>
            </div>
          </div>

          {/* Cards Row*/}
          <div
            className="flex flex-wrap mx-auto mt-6"
            style={{ width: "1251px", gap: "19px" }}
            id="cards-container"
          >
            {selectedItems.map((itemName) => {
              const item = items.find((i) => i.name === itemName);
              if (!item) return null;

              const allValues = item.history.map((entry) => entry.value);
              const rangeValues = item.history
                .filter((entry) => {
                  const ts = new Date(entry.timestamp);
                  return ts >= startDate && ts <= endDate;
                })
                .map((entry) => entry.value);

              const lowestAll = Math.min(...allValues);
              const highestAll = Math.max(...allValues);
              const oldestAll = allValues[0];
              const latestAll = allValues[allValues.length - 1];

              const totalTimePercentChange =
                allValues.length > 1 && oldestAll !== 0
                  ? (((latestAll - oldestAll) / oldestAll) * 100).toFixed(2)
                  : "N/A";

              const totalValuePercentChange =
                lowestAll !== 0
                  ? (((highestAll - lowestAll) / lowestAll) * 100).toFixed(2)
                  : "N/A";

              const lowestRange = rangeValues.length > 0 ? Math.min(...rangeValues) : "N/A";
              const highestRange = rangeValues.length > 0 ? Math.max(...rangeValues) : "N/A";
              const oldestRange = rangeValues.length > 0 ? rangeValues[0] : "N/A";
              const latestRange = rangeValues.length > 0 ? rangeValues[rangeValues.length - 1] : "N/A";

              const rangeTimePercentChange =
                rangeValues.length > 1 && oldestRange !== 0 && oldestRange !== "N/A"
                  ? (((latestRange - oldestRange) / oldestRange) * 100).toFixed(2)
                  : "N/A";

              const rangeValuePercentChange =
                rangeValues.length > 1 && lowestRange !== "N/A" && lowestRange !== 0
                  ? (((highestRange - lowestRange) / lowestRange) * 100).toFixed(2)
                  : "N/A";

              return (
                <div
                  key={itemName}
                  className="bg-[#111816] rounded-xl p-4 shadow-lg font-mono text-[#a4bbb0] flex flex-col items-center"
                  style={{
                    flex: "0 0 235px",
                    width: "235px",
                    height: "auto",
                  }}
                >
                  {/* Top Section: Image and Title */}
                  <div className="flex flex-col items-center justify-center mb-4">
                    <img src={item.emoji.url} alt={itemName} className="w-10 h-10 mb-1" draggable={false} />
                    <div className="text-white font-semibold text-center text-base">
                      {titleCase(itemName)}
                    </div>
                  </div>

                  {/* Bottom Section: Stats */}
                  <div className="text-[15px] w-full space-y-3">
                    {/* Historical Stats */}
                    <div>
                      <div className="text-[#c3e0d2] font-semibold text-base mb-[5px]">Historical value</div>
                      <div>Oldest: ⏣ {commas(oldestAll)}</div>
                      <div>Latest: ⏣ {commas(latestAll)}</div>
                      <div>Minimum: ⏣ {commas(lowestAll)}</div>
                      <div>Maximum: ⏣ {commas(highestAll)}</div>
                      <div>% change time: {totalTimePercentChange}%</div>
                      <div>% change value: {totalValuePercentChange}%</div>
                    </div>

                    {/* Range Stats */}
                    <div>
                      <div className="text-[#c3e0d2] font-semibold text-base mb-[5px]">Value over range</div>
                      <div>Oldest: {oldestRange !== "N/A" ? `⏣ ${commas(oldestRange)}` : "N/A"}</div>
                      <div>Latest: {latestRange !== "N/A" ? `⏣ ${commas(latestRange)}` : "N/A"}</div>
                      <div>Minimum: {lowestRange !== "N/A" ? `⏣ ${commas(lowestRange)}` : "N/A"}</div>
                      <div>Maximum: {highestRange !== "N/A" ? `⏣ ${commas(highestRange)}` : "N/A"}</div>
                      <div>% change time: {rangeTimePercentChange}%</div>
                      <div>% change value: {rangeValuePercentChange}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Empty placeholders if less than 5 selected */}
            {Array.from({ length: 5 - selectedItems.length }).map((_, i) => (
              <div
                key={"empty-" + i}
                style={{ flex: "0 0 235px", width: "235px" }}
                className="bg-transparent"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ItemValueHistory;