import React, { useState, useEffect, useRef, useCallback } from "react";

import Navbar from "../components/navbar";
import DatePicker from "../components/datepicker";
import Loader from "../components/loader";
import ItemCard from "../components/itemcard"
import ItemMultiSelect from "../components/itemmultiselect";

import { useMongoData } from "../hooks/useMongoData";

import { neonizeHex, getAverageColor, lightenHex } from "../functions/colorUtils";
import { commas, titleCase } from "../functions/stringUtils";

import zoomPlugin from "chartjs-plugin-zoom";
import {
  Chart as ChartJS,
  ScatterController,
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

ChartJS.register(zoomPlugin, ScatterController, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, CategoryScale);

const MAX_SELECTED_ITEMS = 10;

const ItemMarketVisualizer = () => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateError, setDateError] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [tradeType, setTradeType] = useState("all"); // all, buy, sell
  const [showPrivate, setShowPrivate] = useState(false);
  const [datasetSpan, setDatasetSpan] = useState({ oldest: null, latest: null });
  const [dateFormatDropdownOpen, setDateFormatDropdownOpen] = useState(false);
  const [tradeTypeDropdownOpen, setTradeTypeDropdownOpen] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [marketData, setMarketData] = useState({});
  const chartRef = useRef(null);
  const dropdownRef = useRef(null);
  const dateFormatDropdownRef = useRef(null);
  const tradeTypeDropdownRef = useRef(null);
  const [debugInfo, setDebugInfo] = useState('');

  const canDisplay = selectedItems.length > 0 && startDate && endDate && !dateError;
  const { data: itemData, loading: itemsLoading } = useMongoData();

  const [dataOptionsDropdownOpen, setDataOptionsDropdownOpen] = useState(false);
  const [excludeOutliers, setExcludeOutliers] = useState(false);
  const [outlierThreshold, setOutlierThreshold] = useState(3);
  const dataOptionsDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (dateFormatDropdownRef.current && !dateFormatDropdownRef.current.contains(event.target)) {
        setDateFormatDropdownOpen(false);
      }
      if (tradeTypeDropdownRef.current && !tradeTypeDropdownRef.current.contains(event.target)) {
        setTradeTypeDropdownOpen(false);
      }
      if (dataOptionsDropdownRef.current && !dataOptionsDropdownRef.current.contains(event.target)) {
        setDataOptionsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    if (canDisplay && chartData) {
      handleDisplay();
    }
  }, [tradeType, showPrivate, excludeOutliers]);

  useEffect(() => {
    if (itemsLoading || !itemData) return;

    const filtered = itemData
      .filter((item) => item.url)
      .map((item) => ({
        ...item,
        history: item.history
          ?.slice()
          .sort((a, b) => new Date(a.t) - new Date(b.t)) || [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setItems(filtered);

    const allDates = filtered.flatMap((item) =>
      item.history?.map((entry) => new Date(entry.t)) || []
    );

    if (allDates.length > 0) {
      const oldest = new Date(Math.min(...allDates));
      const latest = new Date(Math.max(...allDates));
      setDatasetSpan({ oldest, latest });
    }
  }, [itemData, itemsLoading]);

  const removeOutliers = (data, threshold = 3) => {
    if (data.length === 0) return data;

    const values = data.map(point => point.y);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    return data.filter(point => Math.abs(point.y - mean) <= threshold * stdDev);
  };

  const fetchMarketData = useCallback(async (itemID, itemName, startDate, endDate, onProgress) => {
    const limit = 10000;
    const baseParams = {
      item: itemID,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      private: showPrivate.toString(),
    };

    console.log("Fetching data for", itemName, "with id:", itemID);
    if (tradeType !== "all") baseParams.type = tradeType;

    try {
      // 1. Count
      const countRes = await fetch(`${import.meta.env.PROD ? import.meta.env.VITE_API_BASE : "http://localhost:3001"}/api/marketlogs?${new URLSearchParams({
        ...baseParams,
        countOnly: "true"
      })}`);
      const { count } = await countRes.json();

      setDebugInfo(`Fetching ${itemName}: ${count} records`);

      if (count <= limit) {
        setDebugInfo(`${itemName}: Fetching ${count} records...`);
        if (onProgress) onProgress(0, 100); // Show 0% first

        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        if (onProgress) onProgress(50, 100); // Show 50%
        const res = await fetch(`${import.meta.env.PROD ? import.meta.env.VITE_API_BASE : "http://localhost:3001"}/api/marketlogs?${new URLSearchParams({
          ...baseParams,
          skip: "0",
          limit: count.toString()
        })}`);
        const data = await res.json();

        if (onProgress) onProgress(100, 100);
        return data;
      }

      // 2. Batched fetching with progress
      const pages = Math.ceil(count / limit);
      const results = [];

      for (let i = 0; i < pages; i++) {
        setDebugInfo(`${itemName}: Batch ${i + 1}/${pages}`);

        const params = new URLSearchParams({
          ...baseParams,
          skip: (i * limit).toString(),
          limit: limit.toString()
        });

        const url = `${import.meta.env.PROD ? import.meta.env.VITE_API_BASE : "http://localhost:3001"}/api/marketlogs?${params}`;
        const res = await fetch(url);
        const batch = await res.json();
        results.push(...batch);

        if (onProgress) onProgress(i + 1, pages);

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return results;
    } catch (err) {
      setDebugInfo(`Error: ${err.message}`);
      throw err;
    }
  }, [tradeType, showPrivate]);

  const calculateMovingAverage = (data, windowSize = 50) => {
    const sortedData = [...data].sort((a, b) => new Date(a.x) - new Date(b.x));
    const avgData = [];

    for (let i = 0; i < sortedData.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(sortedData.length, i + Math.floor(windowSize / 2) + 1);
      const window = sortedData.slice(start, end);

      const avgValue = window.reduce((sum, point) => sum + point.y, 0) / window.length;
      avgData.push({
        x: sortedData[i].x,
        y: Math.round(avgValue)
      });
    }

    return avgData;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (dateFormatDropdownRef.current && !dateFormatDropdownRef.current.contains(event.target)) {
        setDateFormatDropdownOpen(false);
      }
      if (tradeTypeDropdownRef.current && !tradeTypeDropdownRef.current.contains(event.target)) {
        setTradeTypeDropdownOpen(false);
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

    const displayFormat = dateFormat === "dd/mm/yyyy" ? "dd/MM/yy" : "MM/dd/yy";

    chartRef.current = new ChartJS(ctx, {
      type: "scatter",
      data: chartData,
      options: {
        responsive: true,
        animations: {
          tension: {
            duration: 1000,
            easing: 'linear',
            from: 1,
            to: 0,
            loop: true
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
            ticks: {
              color: "#a4bbb0",
              callback: (value) => `⏣ ${commas(Number(value).toFixed(2))}`
            },
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
                const timeString = date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
                const dateString = formatDate(date);

                const value = point.parsed.y;

                tooltipEl.style.borderColor = dataset.borderColor || dataset.backgroundColor;

                const triangle = tooltipEl.querySelector('.tooltip-triangle');
                if (triangle) {
                  triangle.style.borderTopColor = dataset.borderColor || dataset.backgroundColor;
                }

                const originalData = dataset.data[point.dataIndex];
                const quantity = originalData.n || 1;
                const tradeId = originalData.id || 'Unknown';
                const isSell = originalData.s !== undefined ? originalData.s : true;

                tooltipEl.innerHTML = `
                  <div style="display: flex; gap: 0; align-items: center;">
                    <div style="flex: 1;">
                      <div style="color: #ffffff; font-size: 12px; font-weight: bold; margin-bottom: 2px;">
                        ${dateString} ${timeString}
                      </div>
                      <div style="color: #a4bbb0; font-size: 12px; margin-bottom: 1px;">${dataset.label}</div>
                      <div style="color: #a4bbb0; font-size: 12px; margin-bottom: 1px;">⏣ ${commas(value)}</div>
                      <div style="color: #a4bbb0; font-size: 11px; margin-bottom: 1px;">Qty: ${quantity}</div>
                      <div style="color: ${isSell ? '#ff6b6b' : '#6bff7a'}; font-size: 11px;">${isSell ? 'SELL' : 'BUY'}</div>
                    </div>
                    <div style="display: flex; align-items: center;">
                      <img src="${dataset.url}" alt="" style="width: 40px; height: 40px;">
                    </div>
                  </div>
                `;
              }

              tooltipEl.style.opacity = 0.9;
              tooltipEl.style.transform = 'translate(-50%, -120%) scale(1)';
              const canvasRect = context.chart.canvas.getBoundingClientRect();
              tooltipEl.style.left = window.scrollX + canvasRect.left + tooltip.caretX + 'px';
              tooltipEl.style.top = window.scrollY + canvasRect.top + tooltip.caretY + 'px';
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: "xy",
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
              mode: "xy",
              onZoomStart: ({ chart }) => { chart.options.animation = false; },
              onZoomComplete: ({ chart }) => {
                chart.options.animation = false;
                setIsZoomedIn(true);
              }
            },
            limits: { x: { min: "original", max: "original" }, y: { min: "original", max: "original" } }
          },
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
    setLoading(true);
    setProgress(0);
    setDisplayedItems([...selectedItems]);
    setIsZoomedIn(false);

    try {
      const datasets = [];

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const baseColor = await getAverageColor(item.url);
        const color = neonizeHex(baseColor);


        const rawData = await fetchMarketData(
          item.id,
          item.name,
          new Date(startDate),
          new Date(endDate),
          (currentBatch, totalBatches) => {

            const itemProgress = currentBatch / totalBatches;
            const overallProgress = ((i + itemProgress) / selectedItems.length) * 100;
            setProgress(Math.round(overallProgress));
          }
        );

        let scatterData = rawData
          .map((entry) => ({
            x: new Date(entry.x),
            y: entry.y,
            n: entry.n,
            id: entry.id,
            s: entry.s
          }))
          .filter((entry) => entry.x >= startDate && entry.x <= endDate);

        if (excludeOutliers) {
          scatterData = removeOutliers(scatterData, outlierThreshold);
        }

        setMarketData(prev => ({
          ...prev,
          [item.name]: scatterData
        }));

        const trendData = calculateMovingAverage(scatterData, 100);
        const trendColor = lightenHex(color, 0.4);

        datasets.push(

          {
            label: `${titleCase(item.name)} Trend`,
            data: trendData,
            borderColor: trendColor,
            backgroundColor: 'transparent',
            pointRadius: 0,
            pointHoverRadius: 0,
            borderWidth: 4,
            tension: 0.3,
            showLine: true,
            url: item.url,
            type: 'line',
            order: 1
          },
          {
            label: titleCase(item.name),
            data: scatterData,
            backgroundColor: color + '80',
            borderColor: color,
            pointRadius: 3,
            pointHoverRadius: 5,
            showLine: false,
            url: item.url,
            type: 'scatter',
            order: 2
          }
        );
      }

      setChartData({ datasets });
    } catch (error) {
      console.error('Error displaying market data:', error);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleDateFormatChange = (newFormat) => {
    setDateFormat(newFormat);
    setDateFormatDropdownOpen(false);
  };

  const handleTradeTypeChange = (newType) => {
    setTradeType(newType);
    setTradeTypeDropdownOpen(false);
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

  const getTradeTypeLabel = (type) => {
    switch (type) {
      case "buy": return "Buy orders";
      case "sell": return "Sell orders";
      default: return "All trades";
    }
  };

  return (
    <div className="min-h-screen bg-[#070e0c] text-white">
      <Navbar />

      {itemsLoading ? (
        <div className="items-center justify-center flex h-screen">
          <Loader size={200} />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto mt-20 mb-[19px] flex flex-row justify-center items-center space-x-4">
          <ItemMultiSelect items={items} selectedItems={selectedItems} setSelectedItems={setSelectedItems} maxSelected={MAX_SELECTED_ITEMS} />
          <div className="relative">
            <div className="flex space-x-4 items-end">
              <DatePicker value={startDate} onChange={setStartDate} />
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>
            {dateError && <div className="absolute left-0 top-full mt-1 text-red-500 font-mono text-sm">Start date cannot be after end date.</div>}
          </div>

          <button
            onClick={handleDisplay}
            disabled={!canDisplay || loading}
            className={`font-mono font-extrabold py-[6px] px-6 rounded-md transition ${canDisplay && !loading
              ? "bg-[#6bff7a] hover:bg-[#58e36b] text-[#070e0c] cursor-pointer"
              : "bg-[#6bff7a63] text-[#070e0c] cursor-not-allowed"
              }`}
            style={{ height: "40px" }}
          >
            {loading ? "Loading..." : "Display"}
          </button>
        </div>
      )}

      {chartData && (
        <>
          <div className="flex justify-between m-[19px]" id="chart-legend-container" style={{ width: "1251px", margin: "0 auto", gap: "19px" }}>
            <div className="bg-[#111816] rounded-xl p-3 shadow-lg relative" id="chart-container" style={{ flex: "0 0 997px", maxWidth: "997px" }}>

              {loading && (
                <div className="absolute inset-0 bg-[#111816] bg-opacity-80 flex flex-col items-center justify-center rounded-xl z-10">
                  {/* Main Loader */}
                  <Loader size={200} />

                  {/* Progress Bar */}
                  <div className="w-[250px] h-2 mt-6 bg-[#182521] rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-[#6bff7a] transition-all duration-300 ease-linear rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="text-sm text-gray-300 mt-2">{progress}%</p>
                  <p className="text-xs text-gray-400 mt-1">{debugInfo}</p>
                </div>
              )}

              <div className="flex justify-end items-center font-mono text-[12px] text-[#a4bbb0] space-x-1">
                <div className="px-2 py-1 rounded-md bg-[#070e0c] space-x-1">Dataset: {formatDate(datasetSpan.oldest)} - {formatDate(datasetSpan.latest)}</div>

                <div className="text-[#6bff7a] text-[16px]">|</div>

                {/* Data Options Dropdown */}
                <div className="relative" ref={dataOptionsDropdownRef}>
                  <button
                    onClick={() => setDataOptionsDropdownOpen(!dataOptionsDropdownOpen)}
                    className="flex items-center px-2 py-1 rounded-md bg-[#070e0c] space-x-1 hover:text-[#6bff7a] transition-colors"
                  >
                    <span>Data options</span>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {dataOptionsDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-[#070e0c] rounded-md shadow-custom z-5 min-w-[200px] p-2">
                      <label className="flex items-center space-x-2 text-[12px] mb-2">
                        <input
                          type="checkbox"
                          checked={showPrivate}
                          onChange={(e) => setShowPrivate(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span>Private offers</span>
                      </label>
                      <label className="flex items-center space-x-2 text-[12px]">
                        <input
                          type="checkbox"
                          checked={excludeOutliers}
                          onChange={(e) => setExcludeOutliers(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span>Exclude outliers</span>
                      </label>
                    </div>
                  )}
                </div>

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

                {/* Trade Type Dropdown */}
                <div className="relative" ref={tradeTypeDropdownRef}>
                  <button
                    onClick={() => setTradeTypeDropdownOpen(!tradeTypeDropdownOpen)}
                    className="flex items-center px-2 py-1 rounded-md bg-[#070e0c] space-x-1 hover:text-[#6bff7a] transition-colors"
                  >
                    <span>{getTradeTypeLabel(tradeType)}</span>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {tradeTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-[#070e0c] rounded-md shadow-custom z-1 min-w-full">
                      {["all", "buy", "sell"].map((type) => (
                        <button
                          key={type}
                          onClick={() => handleTradeTypeChange(type)}
                          className="w-full text-left rounded-md px-2 py-1 hover:bg-[#1d2a24] hover:text-[#6bff7a] transition-colors text-[12px]"
                        >
                          {getTradeTypeLabel(type)}
                        </button>
                      ))}
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

            {/* Legend Container */}
            <div className="bg-[#111816] p-4 justify-between rounded-xl shadow-lg flex flex-col font-mono space-y-1 text-[#a4bbb0]" id="legend-container" style={{ flex: "0 0 235px", minWidth: "235px" }}>
              <div className="flex flex-col space-y-1">
                <h2 className="text-base font-semibold text-[#ffffff] mb-2">Market Data — {displayedItems.length}</h2>
                {chartData?.datasets.filter(ds => ds.type === 'scatter').map((ds) => {
                  const itemData = marketData[ds.label.toLowerCase()] || [];
                  const totalTrades = itemData.length;
                  return (
                    <div key={ds.label} className="flex items-center space-x-2 mb-2">
                      <div className="w-4 h-4 rounded-md" style={{ backgroundColor: ds.borderColor }} />
                      <img src={ds.url} alt={ds.label} className="w-5 h-5" />
                      <div className="flex flex-col">
                        <span className="truncate text-xs">{ds.label}</span>
                        <span className="text-xs text-[#6bff7a]">{totalTrades} trades</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap mx-auto mt-6" style={{ width: "1251px", gap: "19px" }} id="cards-container">
            {displayedItems.map((item) => (
              <ItemCard key={item.name} item={item} startDate={startDate} endDate={endDate} />
            ))}
            {Array.from({ length: 5 - displayedItems.length }).map((_, i) => (
              <div key={"empty-" + i} style={{ flex: "0 0 235px", width: "235px" }} className="bg-transparent" />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ItemMarketVisualizer;