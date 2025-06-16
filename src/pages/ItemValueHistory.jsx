import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/navbar";
import DatePicker from "../components/datepicker";
import ItemMultiSelect from "../components/itemmultiselect";
import itemData from "../assets/parsed_items4.json";
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

ChartJS.register(zoomPlugin, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, CategoryScale);

const MAX_SELECTED_ITEMS = 15;
const titleCase = (str) => str.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

const ItemValueHistory = () => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateError, setDateError] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [chartType, setChartType] = useState("linechart"); // placeholder for chart type
  const [datasetSpan, setDatasetSpan] = useState({ oldest: null, latest: null });
  const [dateFormatDropdownOpen, setDateFormatDropdownOpen] = useState(false);
  const [chartTypeDropdownOpen, setChartTypeDropdownOpen] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const chartRef = useRef(null);
  const dropdownRef = useRef(null);
  const dateFormatDropdownRef = useRef(null);
  const chartTypeDropdownRef = useRef(null);

  const canDisplay = selectedItems.length > 0 && startDate && endDate && !dateError;

  useEffect(() => {
    const filtered = itemData.filter((item) => item.emoji?.url).sort((a, b) => a.name.localeCompare(b.name));
    setItems(filtered);

    // Calculate dataset span
    if (filtered.length > 0) {
      let allDates = [];
      filtered.forEach(item => {
        if (item.history && item.history.length > 0) {
          item.history.forEach(entry => {
            allDates.push(new Date(entry.timestamp));
          });
        }
      });

      if (allDates.length > 0) {
        const oldest = new Date(Math.min(...allDates));
        const latest = new Date(Math.max(...allDates));
        setDatasetSpan({ oldest, latest });
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (dateFormatDropdownRef.current && !dateFormatDropdownRef.current.contains(event.target)) {
        setDateFormatDropdownOpen(false);
      }
      if (chartTypeDropdownRef.current && !chartTypeDropdownRef.current.contains(event.target)) {
        setChartTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (startDate && endDate) setDateError(startDate > endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const formatDate = (date, withWeekday = false) => {
      if (!date) return "";
      const locale = dateFormat === "dd/mm/yyyy" ? "en-GB" : "en-US";
      const options = withWeekday
        ? { weekday: "short", year: "numeric", month: "short", day: "numeric" }
        : { year: "numeric", month: "2-digit", day: "2-digit" };
      return date.toLocaleDateString(locale, options);
    };

    if (!chartData) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = document.getElementById("myChart").getContext("2d");

    // Determine display formats based on current dateFormat
    const displayFormat = dateFormat === "dd/mm/yyyy" ? "dd/MM/yy" : "MM/dd/yy";

    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        animation: { duration: 0 },
        animations: {
          x: { type: 'number', easing: 'linear', duration: 0 },
          y: { type: 'number', easing: 'easeOutQuart', duration: 2000, from: (ctx) => ctx.chart.scales.y.getPixelForValue(0), delay: (ctx) => ctx.index * 30 },
          elements: {
            line: { type: 'number', duration: 1200, easing: 'easeInOutSine', from: NaN },
            point: { type: 'number', duration: 400, easing: 'easeOutQuart', delay: (ctx) => ctx.index * 30 }
          }
        },
        scales: {
          x: {
            type: "time",
            time: {
              tooltipFormat: displayFormat,
              displayFormats: {
                day: displayFormat,
                week: displayFormat,
                month: displayFormat,
                quarter: displayFormat,
                year: displayFormat
              },
              unit: "day"
            },
            title: { display: false },
            ticks: { color: "#a4bbb0", maxTicksLimit: 10 },
            grid: { display: false },
          },
          y: {
            title: { display: false },
            ticks: { color: "#a4bbb0", callback: (value) => `⏣ ${commas(value)}` },
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: function (context) {
              const tooltipEl = document.getElementById('chartjs-tooltip') || (() => {
                const div = document.createElement('div');
                div.id = 'chartjs-tooltip';
                div.style.cssText = `position: absolute; background-color: #111816; opacity: 0.9; color: #a4bbb0; border: 2px solid #6bff7a; border-radius: 6px; padding: 10px; pointer-events: none; transform: translate(-50%, -120%); font-family: Monaco, monospace; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: opacity 0.2s ease, transform 0.2s ease; line-height: 1.3; min-width: 200px;`;

                // Create triangle pointer
                const triangle = document.createElement('div');
                triangle.className = 'tooltip-triangle';
                triangle.style.cssText = `position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #6bff7a;`;
                div.appendChild(triangle);

                document.body.appendChild(div);
                return div;
              })();

              const tooltip = context.tooltip;
              if (tooltip.opacity === 0) {
                tooltipEl.style.opacity = 0;
                tooltipEl.style.transform = 'translate(-50%, -120%) scale(0.9)';
                return;
              }

              if (tooltip.body) {
                const point = tooltip.dataPoints[0];
                const dataset = context.chart.data.datasets[point.datasetIndex];
                const date = new Date(point.parsed.x);
                const value = point.parsed.y;

                tooltipEl.style.borderColor = dataset.borderColor;

                // Update triangle color to match dataset
                const triangle = tooltipEl.querySelector('.tooltip-triangle');
                if (triangle) {
                  triangle.style.borderTopColor = dataset.borderColor;
                }

                let changeText = '';
                if (point.dataIndex > 0) {
                  const prevValue = dataset.data[point.dataIndex - 1].y;
                  const change = ((value - prevValue) / prevValue * 100).toFixed(2);
                  changeText = `<div style="color: #a4bbb0; font-size: 12px;">${change > 0 ? '+' : ''}${change}%</div>`;
                }

                tooltipEl.innerHTML = `
                  <div style="display: flex; gap: 0; align-items: center;">
                    <div style="flex: 1;">
                      <div style="color: #ffffff; font-size: 12px; font-weight: bold; margin-bottom: 2px;">
                        ${formatDate(date, true)}
                      </div>
                      <div style="color: #a4bbb0; font-size: 12px; margin-bottom: 1px;">${dataset.label}</div>
                      <div style="color: #a4bbb0; font-size: 12px; margin-bottom: 1px;">⏣ ${commas(value)}</div>
                      ${changeText}
                    </div>
                    <div style="display: flex; align-items: center;">
                      <img src="${dataset.emoji}" alt="" style="width: 40px; height: 40px;">
                    </div>
                  </div>
                `;
              }

              tooltipEl.style.opacity = 0.9;
              tooltipEl.style.transform = 'translate(-50%, -120%) scale(1)';
              tooltipEl.style.left = context.chart.canvas.offsetLeft + tooltip.caretX + 'px';
              tooltipEl.style.top = context.chart.canvas.offsetTop + tooltip.caretY + 'px';
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: "x",
              modifierKey: "ctrl",
              onPanStart: ({ chart }) => { chart.options.animation = false; },
              onPanComplete: ({ chart }) => {
                chart.options.animation = false;
                setIsZoomedIn(true);
              }
            },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
              onZoomStart: ({ chart }) => { chart.options.animation = false; },
              onZoomComplete: ({ chart }) => {
                chart.options.animation = false;
                setIsZoomedIn(true);
              }
            },
            limits: { x: { min: "original", max: "original" }, y: { min: "original", max: "original" } }
          },
        },
        onHover: (event, activeElements) => {
          if (activeElements.length > 0) {
            const hoveredIndex = activeElements[0].datasetIndex;
            chartRef.current.data.datasets.forEach((dataset, index) => {
              if (index === hoveredIndex) {
                dataset.borderColor = dataset.originalColor;
                dataset.borderDash = [];
      
              } else {
                const color = dataset.originalColor;
                const dimmedColor = color + '80'; // Add 40% opacity (hex)
                dataset.borderColor = dimmedColor;
                dataset.borderDash = [15,10];
              }
            });
            chartRef.current.update('none');
          } else {
            // Reset all to full opacity
            chartRef.current.data.datasets.forEach(dataset => {
              dataset.borderColor = dataset.originalColor;
              dataset.borderDash = [];

            });
            chartRef.current.update('none');
          }
        },
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData, dateFormat]);

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

  const handleDisplay = async () => {
    setDisplayedItems([...selectedItems]);
    setIsZoomedIn(false); // Reset zoom state when displaying new data

    const datasets = await Promise.all(
      selectedItems.map(async (itemName) => {
        const item = items.find((i) => i.name === itemName);
        const baseColor = await getAverageColor(item.emoji.url);
        const color = neonizeHex(baseColor);
        const dataPoints = item.history.map((entry) => ({ x: new Date(entry.timestamp), y: entry.value })).filter((entry) => entry.x >= startDate && entry.x <= endDate);
        return { label: titleCase(itemName), data: dataPoints, borderColor: color, backgroundColor: color, pointRadius: 4, pointHoverRadius: 5, tension: 0.4, emoji: item.emoji.url, originalColor: color };
      })
    );
    setChartData({ datasets });
  };

  const handleDateFormatChange = (newFormat) => {
    setDateFormat(newFormat);
    setDateFormatDropdownOpen(false);
  };

  const handleChartTypeChange = (newType) => {
    setChartType(newType);
    setChartTypeDropdownOpen(false);
    // Placeholder - chart type change logic would go here
  };

  const handleZoomReset = () => {
    if (chartRef.current && isZoomedIn) {
      chartRef.current.resetZoom();
      setIsZoomedIn(false);
    }
  };

  const formatDate = (date, withWeekday = false) => {
    if (!date) return "";
    const locale = dateFormat === "dd/mm/yyyy" ? "en-GB" : "en-US";
    const options = withWeekday
      ? { weekday: "short", year: "numeric", month: "short", day: "numeric" }
      : { year: "numeric", month: "2-digit", day: "2-digit" };
    return date.toLocaleDateString(locale, options);
  };

  const renderStatsCard = (itemName) => {
    const item = items.find((i) => i.name === itemName);
    if (!item) return null;

    const allValues = item.history.map((entry) => entry.value);
    const rangeValues = item.history.filter((entry) => {
      const ts = new Date(entry.timestamp);
      return ts >= startDate && ts <= endDate;
    }).map((entry) => entry.value);

    const [lowestAll, highestAll, oldestAll, latestAll] = [Math.min(...allValues), Math.max(...allValues), allValues[0], allValues[allValues.length - 1]];
    const totalTimePercentChange = allValues.length > 1 && oldestAll !== 0 ? (((latestAll - oldestAll) / oldestAll) * 100).toFixed(2) : "N/A";
    const totalValuePercentChange = lowestAll !== 0 ? (((highestAll - lowestAll) / lowestAll) * 100).toFixed(2) : "N/A";

    const [lowestRange, highestRange, oldestRange, latestRange] = rangeValues.length > 0 ? [Math.min(...rangeValues), Math.max(...rangeValues), rangeValues[0], rangeValues[rangeValues.length - 1]] : ["N/A", "N/A", "N/A", "N/A"];
    const rangeTimePercentChange = rangeValues.length > 1 && oldestRange !== 0 && oldestRange !== "N/A" ? (((latestRange - oldestRange) / oldestRange) * 100).toFixed(2) : "N/A";
    const rangeValuePercentChange = rangeValues.length > 1 && lowestRange !== "N/A" && lowestRange !== 0 ? (((highestRange - lowestRange) / lowestRange) * 100).toFixed(2) : "N/A";

    return (
      <div key={itemName} className="bg-[#111816] rounded-xl p-4 shadow-lg font-mono text-[#a4bbb0] flex flex-col items-center" style={{ flex: "0 0 235px", width: "235px", height: "auto" }}>
        <div className="flex flex-col items-center justify-center mb-4">
          <img src={item.emoji.url} alt={itemName} className="w-10 h-10 mb-1" draggable={false} />
          <div className="text-white font-semibold text-center text-base">{titleCase(itemName)}</div>
        </div>
        <div className="text-[15px] w-full space-y-3">
          <div>
            <div className="text-[#c3e0d2] font-semibold text-base mb-[5px]">Historical value</div>
            <div>Oldest: ⏣ {commas(oldestAll)}</div>
            <div>Latest: ⏣ {commas(latestAll)}</div>
            <div>Minimum: ⏣ {commas(lowestAll)}</div>
            <div>Maximum: ⏣ {commas(highestAll)}</div>
            <div>% change time: {totalTimePercentChange}%</div>
            <div>% change value: {totalValuePercentChange}%</div>
          </div>
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
  };

  return (
    <div className="min-h-screen bg-[#070e0c] text-white p-6">
      <Navbar />
      <div className="max-w-6xl mx-auto mt-20 mb-[19px] flex justify-center items-center space-x-4">
        <ItemMultiSelect items={items} selectedItems={selectedItems} setSelectedItems={setSelectedItems} maxSelected={MAX_SELECTED_ITEMS} />
        <div className="relative">
          <div className="flex space-x-4 items-end">
            <DatePicker value={startDate} onChange={setStartDate} />
            <DatePicker value={endDate} onChange={setEndDate} />
          </div>
          {dateError && <div className="absolute left-0 top-full mt-1 text-red-500 font-mono text-sm">Start date cannot be after end date.</div>}
        </div>
        <button onClick={handleDisplay} disabled={!canDisplay} className={`font-mono font-extrabold py-[6px] px-6 rounded-md transition ${canDisplay ? "bg-[#6bff7a] hover:bg-[#58e36b] text-[#070e0c] cursor-pointer" : "bg-[#6bff7a63] text-[#070e0c] cursor-not-allowed"}`} style={{ height: "40px" }}>
          Display
        </button>
      </div>

      {chartData && (
        <>
          <div className="flex justify-between m-[19px]" id="chart-legend-container" style={{ width: "1251px", margin: "0 auto", gap: "19px" }}>
            <div className="bg-[#111816] rounded-xl p-3 shadow-lg" id="chart-container" style={{ flex: "0 0 997px", maxWidth: "997px" }}>
              {/* Updated Notes Section */}
              <div className="flex justify-end items-center font-mono text-[12px] text-[#a4bbb0] space-x-1">
                <div className="px-2 py-1 rounded-md bg-[#070e0c] space-x-1">Dataset: {formatDate(datasetSpan.oldest)} - {formatDate(datasetSpan.latest)}</div>

                <div className="text-[#6bff7a] text-[16px]">|</div>

                {/* Date Format Dropdown */}
                <div className="relative" ref={dateFormatDropdownRef}>
                  <button
                    onClick={() => setDateFormatDropdownOpen(!dateFormatDropdownOpen)}
                    className="flex items-center px-2 py-1 rounded-md bg-[#070e0c] space-x-1 hover:text-[#6bff7a] transition-colors"
                  >
                    <span>Date format: {dateFormat}</span>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {dateFormatDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-[#070e0c] rounded-md shadow-custom z-1 min-w-full">
                      <button
                        onClick={() => handleDateFormatChange(dateFormat === "dd/mm/yyyy" ? "mm/dd/yyyy" : "dd/mm/yyyy")}
                        className="w-full text-left rounded-md px-2 py-1 hover:bg-[#1d2a24] hover:text-[#6bff7a] transition-colors text-[12px]"
                      >
                        Date format: {dateFormat === "dd/mm/yyyy" ? "mm/dd/yyyy" : "dd/mm/yyyy"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-[#6bff7a] text-[16px]">|</div>

                {/* Chart Type Dropdown */}
                <div className="relative" ref={chartTypeDropdownRef}>
                  <button
                    onClick={() => setChartTypeDropdownOpen(!chartTypeDropdownOpen)}
                    className="flex items-center px-2 py-1 rounded-md bg-[#070e0c] space-x-1 hover:text-[#6bff7a] transition-colors"
                  >
                    <span>Chart type: {chartType}</span>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {chartTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-[#070e0c] rounded-md shadow-custom z-1 min-w-full">
                      {/*<button
                        onClick={() => handleChartTypeChange("bar")}
                        className="w-full text-left rounded-md px-2 py-1 hover:bg-[#1d2a24] hover:text-[#6bff7a] transition-colors text-[12px]"
                      >
                        Chart type: bar
                      </button>
                      <button
                        onClick={() => handleChartTypeChange("area")}
                        className="w-full text-left rounded-md px-2 py-1 hover:bg-[#1d2a24] hover:text-[#6bff7a] transition-colors text-[12px]"
                      >
                        Chart type: area
                      </button>*/}
                    </div>
                  )}
                </div>

                <div className="text-[#6bff7a] text-[16px]">|</div>

                {/* Zoom Reset Button */}
                <button
                  onClick={handleZoomReset}
                  className={`flex items-center pl-1 pr-2 py-1 rounded-md bg-[#070e0c] space-x-1 transition-colors ${isZoomedIn ? 'hover:text-[#6bff7a] cursor-pointer' : 'cursor-default'
                    }`}
                  disabled={!isZoomedIn}
                >
                  <svg xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor" viewBox="0 0 24 24"
                    className="w-4 h-4">
                    <rect x="7" y="3" width="12" height="18" rx="5" ry="5" />
                    <rect x="12" y="7" width="2" height="7" rx="1" ry="1" fill="#000" />
                  </svg>
                  <span>{isZoomedIn ? "Reset the zoom" : "Scroll to zoom"}</span>
                </button>
              </div>

              <canvas id="myChart" className="w-full" />
            </div>

            {/* Simplified Legend Container */}
            <div className="bg-[#111816] p-4 justify-between rounded-xl shadow-lg flex flex-col font-mono space-y-1 text-[#a4bbb0]" id="legend-container" style={{ flex: "0 0 235px", minWidth: "235px" }}>
              <div className="flex flex-col space-y-1">
                <h2 className="text-base font-semibold text-[#ffffff] mb-2">Items — {displayedItems.length}</h2>
                {chartData?.datasets.map((ds) => (
                  <div key={ds.label} className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-md" style={{ backgroundColor: ds.borderColor }} />
                    <img src={ds.emoji} alt={ds.label} className="w-5 h-5" />
                    <span className="truncate">{ds.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap mx-auto mt-6" style={{ width: "1251px", gap: "19px" }} id="cards-container">
            {displayedItems.map(renderStatsCard)}
            {Array.from({ length: 5 - displayedItems.length }).map((_, i) => (
              <div key={"empty-" + i} style={{ flex: "0 0 235px", width: "235px" }} className="bg-transparent" />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ItemValueHistory;