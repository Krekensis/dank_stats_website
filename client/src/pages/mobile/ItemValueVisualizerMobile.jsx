import React, { useState, useEffect, useRef } from "react";

import Navbar from "../../components/navbar";
import DatePicker from "../../components/datepicker";
import Loader from "../../components/loader";
import ItemCard from "../../components/itemcard-value"
import ItemMultiSelect from "../../components/itemmultiselect";

import { useMongoData } from "../../hooks/useMongoData";

import { neonizeHex, getAverageColor } from "../../functions/colorUtils";
import { commas, titleCase, formatLargeNumber } from "../../functions/stringUtils";

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

const ItemValueVisualizerMobile = () => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
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

  const [datasetRangeDropdownOpen, setDatasetRangeDropdownOpen] = useState(false);
  const datasetRangeDropdownRef = useRef(null);

  const canDisplay = selectedItems.length > 0 && startDate && endDate && !dateError;
  const { data: itemData, loading } = useMongoData();

  useEffect(() => {
    if (loading || !itemData) return;

    const filtered = itemData
      .filter((item) => item.url)
      .map((item) => ({
        ...item,
        history: item.history
          ?.slice() // shallow copy
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) || [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setItems(filtered);

    const allDates = filtered.flatMap((item) =>
      item.history?.map((entry) => new Date(entry.timestamp)) || []
    );

    if (allDates.length > 0) {
      const oldest = new Date(Math.min(...allDates));
      const latest = new Date(Math.max(...allDates));
      setDatasetSpan({ oldest, latest });
    }
  }, [itemData, loading]);

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
      if (datasetRangeDropdownRef.current && !datasetRangeDropdownRef.current.contains(event.target)) {
        setDatasetRangeDropdownOpen(false);
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

    const maxPoints = Math.max(...chartData.datasets.map(ds => ds.data.length), 1);
    const pointDelay = Math.min(2000 / maxPoints, 50);

    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          onComplete: () => {
            if (chartRef.current) {
              chartRef.current.options.animations = false;
              chartRef.current.options.animation = false;
            }
          }
        },
        animations: {
          x: { type: 'number', easing: 'linear', duration: 0 },
          y: { type: 'number', easing: 'easeOutQuart', duration: 2000, from: (ctx) => ctx.chart.scales.y.getPixelForValue(0), delay: (ctx) => ctx.index * pointDelay },
          elements: {
            line: { type: 'number', duration: 1200, easing: 'easeInOutSine', from: NaN },
            point: { type: 'number', duration: 400, easing: 'easeOutQuart', delay: (ctx) => ctx.index * pointDelay }
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
            ticks: { color: "#a4bbb0", callback: (value) => `⏣ ${formatLargeNumber(value)}` },
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
                div.style.cssText = `position: absolute; background-color: #111816; opacity: 0.9; color: #a4bbb0; border: 2px solid #6bff7a; border-radius: 6px; padding: 10px; pointer-events: none; transform: translate(-50%, -120%); font-family: Monaco, monospace; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: opacity 0.2s ease, transform 0.2s ease; line-height: 1.3; min-width: 200px; width: max-content; white-space: nowrap;`;

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
                  <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="flex: 1;">
                      <div style="color: #ffffff; font-size: 12px; font-weight: bold; margin-bottom: 2px;">
                        ${formatDate(date, true)}
                      </div>
                      <div style="color: #a4bbb0; font-size: 12px; margin-bottom: 1px;">${dataset.label}</div>
                      <div style="color: #a4bbb0; font-size: 12px; margin-bottom: 1px;">⏣ ${commas(value)}</div>
                      ${changeText}
                    </div>
                    <div style="display: flex; align-items: center;">
                      <img src="${dataset.url}" alt="" style="width: 40px; height: 40px;">
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
              modifierKey: null,
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
        onHover: (event, activeElements, chart) => {
          const hoveredIndex = activeElements.length > 0 ? activeElements[0].datasetIndex : null;

          if (chart._hoveredDatasetIndex !== hoveredIndex) {
            chart._hoveredDatasetIndex = hoveredIndex;

            chart.data.datasets.forEach((dataset, index) => {
              if (hoveredIndex === null || index === hoveredIndex) {
                dataset.borderColor = dataset.originalColor;
                dataset.backgroundColor = dataset.originalColor;
                dataset.pointBackgroundColor = dataset.originalColor;
                dataset.pointBorderColor = dataset.originalColor;
                dataset.borderDash = [];
              } else {
                const color = dataset.originalColor;
                const dimmedColor = color + '20'; // Add high transparency
                dataset.borderColor = dimmedColor;
                dataset.backgroundColor = dimmedColor;
                dataset.pointBackgroundColor = dimmedColor;
                dataset.pointBorderColor = dimmedColor;
                dataset.borderDash = [15, 10];
              }
            });
            chart.update(); // Use full update to ensure zoom plugin caches are busted and points redraw properly
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

  const handleDisplay = async () => {
    setDisplayedItems([...selectedItems]);
    setIsZoomedIn(false);

    const datasets = await Promise.all(
      selectedItems.map(async (item) => {
        const baseColor = await getAverageColor(item.url);
        const color = neonizeHex(baseColor);
        const dataPoints = item.history
          .map((entry) => ({
            x: new Date(entry.timestamp),
            y: entry.value
          }))
          .filter((entry) => entry.x >= startDate && entry.x <= endDate);

        return { label: titleCase(item.name), data: dataPoints, borderColor: color, backgroundColor: color, pointBackgroundColor: color, pointBorderColor: color, pointRadius: 4, pointHoverRadius: 5, tension: 0.4, url: item.url, originalColor: color };
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

  return (
    <div className="min-h-screen bg-[#070e0c] text-white p-4">
      <Navbar />

      {loading ? (
        <div className="items-center justify-center flex h-[calc(100vh-80px)]">
          <Loader size={200} />
        </div>
      ) : (
        <div className="w-full mx-auto mt-20 mb-[19px] flex flex-col justify-center items-center space-y-4">
          <ItemMultiSelect items={items} selectedItems={selectedItems} setSelectedItems={setSelectedItems} maxSelected={MAX_SELECTED_ITEMS} />
          <div className="relative w-full">
            <div className="flex space-x-3 items-center w-full">
              <div className="flex-1 min-w-0"><DatePicker value={startDate} onChange={setStartDate} /></div>
              <div className="flex-1 min-w-0"><DatePicker value={endDate} onChange={setEndDate} /></div>
              <button
                onClick={handleDisplay}
                disabled={!canDisplay}
                className={`flex-none font-mono font-extrabold py-[6px] px-4 rounded-md transition ${canDisplay
                  ? "bg-[#6bff7a] hover:bg-[#58e36b] text-[#070e0c] cursor-pointer"
                  : "bg-[#6bff7a63] text-[#070e0c] cursor-not-allowed"
                  }`}
              //style={{ height: "40px" }}
              >
                Display
              </button>
            </div>
            {dateError && <div className="absolute left-0 top-full mt-1 text-red-500 font-mono text-sm">Start date cannot be after end date.</div>}
          </div>
        </div>
      )}

      {chartData && (
        <>
          <div className="flex flex-col justify-between mt-4 mb-4 space-y-4 w-full mx-auto" id="chart-legend-container">
            <div className="bg-[#111816] rounded-xl p-2 shadow-lg w-full" id="chart-container">
              {/* Updated Notes Section */}
              <div className="flex flex-wrap justify-end items-center font-mono text-[#a4bbb0] gap-1 mb-4">

                {/* Dataset Range Dropdown */}
                <div className="relative" ref={datasetRangeDropdownRef}>
                  <button
                    onClick={() => setDatasetRangeDropdownOpen(!datasetRangeDropdownOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-[#070e0c] hover:text-[#6bff7a] transition-colors"
                    title="Dataset range"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </button>
                  {datasetRangeDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-[#070e0c] rounded-md shadow-custom z-10 w-max p-2 text-[12px] ">
                      Dataset: {formatDate(datasetSpan.oldest)} - {formatDate(datasetSpan.latest)}
                    </div>
                  )}
                </div>

                {/* Date Format Dropdown */}
                <div className="relative" ref={dateFormatDropdownRef}>
                  <button
                    onClick={() => setDateFormatDropdownOpen(!dateFormatDropdownOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-[#070e0c] hover:text-[#6bff7a] transition-colors"
                    title="Date format"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </button>
                  {dateFormatDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-[#070e0c] rounded-md shadow-custom z-10 w-max ">
                      <button
                        onClick={() => handleDateFormatChange(dateFormat === "dd/mm/yyyy" ? "mm/dd/yyyy" : "dd/mm/yyyy")}
                        className="w-full text-left rounded-md px-3 py-2 hover:bg-[#1d2a24] hover:text-[#6bff7a] transition-colors text-[12px]"
                      >
                        Format: {dateFormat === "dd/mm/yyyy" ? "mm/dd/yyyy" : "dd/mm/yyyy"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Chart Type Dropdown */}
                <div className="relative" ref={chartTypeDropdownRef} title="Chart Type">
                  <button
                    onClick={() => setChartTypeDropdownOpen(!chartTypeDropdownOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-[#070e0c] hover:text-[#6bff7a] transition-colors cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                  </button>
                  {chartTypeDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-[#070e0c] rounded-md shadow-custom z-10 min-w-max ">
                      {/* Placeholder for chart type options */}
                    </div>
                  )}
                </div>

                {/* Zoom Reset Button */}
                <button
                  onClick={handleZoomReset}
                  className={`flex items-center justify-center w-8 h-8 rounded-md bg-[#070e0c] transition-colors ${isZoomedIn ? 'hover:text-[#6bff7a] cursor-pointer' : 'cursor-default'
                    }`}
                  disabled={!isZoomedIn}
                  title={isZoomedIn ? "Reset the zoom" : "Scroll to zoom"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor" viewBox="0 0 24 24"
                    className="w-4 h-4">
                    <rect x="7" y="3" width="12" height="18" rx="5" ry="5" />
                    <rect x="12" y="7" width="2" height="7" rx="1" ry="1" fill="#000" />
                  </svg>
                </button>
              </div>

              <div className="relative w-full h-[450px]">
                <canvas id="myChart" className="w-full h-full" />
              </div>
            </div>

            {/* Simplified Legend Container */}
            <div className="bg-[#111816] p-4 justify-between rounded-xl shadow-lg flex flex-col font-mono space-y-1 text-[#a4bbb0] w-full" id="legend-container">
              <div className="flex flex-col space-y-1">
                <h2 className="text-base font-semibold text-[#ffffff] mb-2">Items — {displayedItems.length}</h2>
                {chartData?.datasets.map((ds) => (
                  <div key={ds.label} className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-md shrink-0" style={{ backgroundColor: ds.borderColor }} />
                    <img src={ds.url} alt={ds.label} className="w-5 h-5 shrink-0" />
                    <span className="truncate">{ds.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col mx-auto space-y-4 w-full" id="cards-container">
            {displayedItems.map((item) => (
              <ItemCard key={item.id || item.name} item={item} startDate={startDate} endDate={endDate} />
            ))}
          </div>
        </>
      )}

      {!chartData && !loading && (
        <div className="flex flex-col items-center justify-center mt-32 text-[#a4bbb0] opacity-50 font-mono text-center">
          <svg className="w-24 h-24 mb-4 text-[#2b473e]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Item Value Visualizer</h2>
          <p className="max-w-md">
            Select up to 15 items, choose your date range, and click "Display" to visualize their historical value trends.
          </p>
        </div>
      )}
    </div>
  );
};

export default ItemValueVisualizerMobile;