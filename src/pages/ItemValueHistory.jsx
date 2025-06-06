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

ChartJS.register(zoomPlugin, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, CategoryScale);

const MAX_SELECTED_ITEMS = 5;
const titleCase = (str) => str.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

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
  const dropdownRef = useRef(null);

  const canDisplay = selectedItems.length > 0 && startDate && endDate && !dateError;

  useEffect(() => {
    const filtered = itemData.filter((item) => item.emoji?.url).sort((a, b) => a.name.localeCompare(b.name));
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
    if (startDate && endDate) setDateError(startDate > endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (!chartData) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = document.getElementById("myChart").getContext("2d");
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
            time: { tooltipFormat: "dd/MM/yyyy", unit: "day" },
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
            external: function(context) {
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
                        ${date.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
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
            pan: { enabled: true, mode: "x", modifierKey: "ctrl", onPanStart: ({ chart }) => { chart.options.animation = false; }, onPanComplete: ({ chart }) => { chart.options.animation = false; } },
            zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x", onZoomStart: ({ chart }) => { chart.options.animation = false; }, onZoomComplete: ({ chart }) => { chart.options.animation = false; } },
            limits: { x: { min: "original", max: "original" }, y: { min: "original", max: "original" } }
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

  const filteredItems = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDisplay = async () => {
    const datasets = await Promise.all(
      selectedItems.map(async (itemName) => {
        const item = items.find((i) => i.name === itemName);
        const baseColor = await getAverageColor(item.emoji.url);
        const color = neonizeHex(baseColor);
        const dataPoints = item.history.map((entry) => ({ x: new Date(entry.timestamp), y: entry.value })).filter((entry) => entry.x >= startDate && entry.x <= endDate);
        return { label: titleCase(itemName), data: dataPoints, borderColor: color, backgroundColor: color, pointRadius: 4, pointHoverRadius: 5, tension: 0.4, emoji: item.emoji.url };
      })
    );
    setChartData({ datasets });
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
            <div className="bg-[#111816] rounded-xl p-4 shadow-lg" id="chart-container" style={{ flex: "0 0 997px", maxWidth: "997px" }}>
              <canvas id="myChart" className="w-full h-[400px]" />
            </div>
            <div className="bg-[#111816] p-4 rounded-xl shadow-lg flex flex-col space-y-2 font-mono text-[#a4bbb0]" id="legend-container" style={{ flex: "0 0 235px", minWidth: "235px" }}>
              <h2 className="text-base font-semibold text-[#ffffff] mb-2">Items</h2>
              {chartData?.datasets.map((ds) => (
                <div key={ds.label} className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-md" style={{ backgroundColor: ds.borderColor }} />
                  <img src={ds.emoji} alt={ds.label} className="w-5 h-5" />
                  <span className="truncate">{ds.label}</span>
                </div>
              ))}
              <button onClick={() => chartRef.current?.resetZoom()} className="mt-4 px-3 py-1 rounded bg-[#6bff7a] hover:bg-[#58e36b] text-[#070e0c] text-sm font-semibold transition">
                Reset Zoom
              </button>
            </div>
          </div>
          <div className="flex flex-wrap mx-auto mt-6" style={{ width: "1251px", gap: "19px" }} id="cards-container">
            {selectedItems.map(renderStatsCard)}
            {Array.from({ length: 5 - selectedItems.length }).map((_, i) => (
              <div key={"empty-" + i} style={{ flex: "0 0 235px", width: "235px" }} className="bg-transparent" />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ItemValueHistory;