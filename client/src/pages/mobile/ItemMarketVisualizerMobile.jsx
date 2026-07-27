import React, { useState, useEffect, useRef, useCallback } from "react";

import Navbar from "../../components/navbar";
import DatePicker from "../../components/datepicker";
import Loader from "../../components/loader";
import MarketItemCard from "../../components/itemcard-market"
import ItemMultiSelect from "../../components/itemmultiselect-mobile";
import MarketTrends from "../../components/market-trends";

import { useMongoData } from "../../hooks/useMongoData";
import marketCache from "../../hooks/marketCache";

import { neonizeHex, getAverageColor, lightenHex } from "../../functions/colorUtils";
import { commas, titleCase, formatLargeNumber } from "../../functions/stringUtils";

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

const ItemMarketVisualizerMobile = () => {
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
  const [rawMarketData, setRawMarketData] = useState({}); // Unfiltered data per item name
  const [itemColors, setItemColors] = useState({}); // Cached neonized colors per item name
  const chartRef = useRef(null);
  const dropdownRef = useRef(null);
  const dateFormatDropdownRef = useRef(null);
  const tradeTypeDropdownRef = useRef(null);
  const [debugInfo, setDebugInfo] = useState('');

  const [datasetRangeDropdownOpen, setDatasetRangeDropdownOpen] = useState(false);
  const datasetRangeDropdownRef = useRef(null);

  const canDisplay = selectedItems.length > 0 && startDate && endDate && !dateError;
  const { data: itemData, loading: itemsLoading } = useMongoData();

  const [dataOptionsDropdownOpen, setDataOptionsDropdownOpen] = useState(false);
  const [excludeOutliers, setExcludeOutliers] = useState(true);
  const [excludeOneCoinTrades, setExcludeOneCoinTrades] = useState(true);
  const [outlierThresholds, setOutlierThresholds] = useState({}); // { itemName: threshold }
  const [dualMode, setDualMode] = useState(false);
  const dataOptionsDropdownRef = useRef(null);
  const shouldAnimate = useRef(true);

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
      if (datasetRangeDropdownRef.current && !datasetRangeDropdownRef.current.contains(event.target)) {
        setDatasetRangeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // filter change, rebuild using cache
  useEffect(() => {
    if (Object.keys(rawMarketData).length > 0 && displayedItems.length > 0) {
      rebuildChartNoAnimate(rawMarketData, displayedItems, itemColors);
    }
  }, [tradeType, showPrivate, excludeOutliers, excludeOneCoinTrades, dualMode, outlierThresholds]);

  useEffect(() => {
    if (itemsLoading || !itemData) return;

    const filtered = itemData
      .filter((item) => item.url)
      .map((item) => ({
        ...item,
        history: item.history
          ?.slice()
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
  }, [itemData, itemsLoading]);

  const removeOutliers = (data, threshold = 3) => {
    if (data.length === 0) return data;

    // Use only public, non-1-coin trades to compute the baseline median & MAD
    const baselineTrades = data.filter(p => p.y !== 1 && (!p.tradeId || !p.tradeId.startsWith('PV')));
    const baseData = baselineTrades.length > 0 ? baselineTrades : data;

    const values = baseData.map(point => point.y).sort((a, b) => a - b);

    const getMedian = (arr) => {
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    const median = getMedian(values);
    const deviations = values.map(v => Math.abs(v - median)).sort((a, b) => a - b);
    const mad = getMedian(deviations);

    // Scale MAD to approximate standard deviation
    let madStdDev = 1.4826 * mad;

    // Fallback if MAD is 0 (majority of trades are exactly the same price)
    if (madStdDev === 0) {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
      madStdDev = stdDev > 0 ? stdDev : Math.max(1, median * 0.01);
    }

    return data.filter(point => Math.abs(point.y - median) <= threshold * madStdDev);
  };

  // Fetch raw market data — no filters applied, uses segment cache
  const fetchMarketData = useCallback(async (itemID, itemName, start, end, onProgress) => {
    const apiBase = import.meta.env.PROD ? import.meta.env.VITE_API_BASE : "http://localhost:3001";
    const limit = 10000;

    // Check cache for missing segments
    const missing = marketCache.getMissingSegments(itemID, start, end);

    if (missing.type === 'none') {
      console.log(`Cache hit for ${itemName} — no fetch needed`);
      if (onProgress) onProgress(100, 100);
      return marketCache.getData(itemID, start, end);
    }

    console.log(`Cache ${missing.type} for ${itemName} — fetching ${missing.segments.length} segment(s)`);

    for (const segment of missing.segments) {
      const baseParams = {
        item: itemID,
        start: segment.start.toISOString(),
        end: segment.end.toISOString(),
      };

      try {
        // Count
        const countRes = await fetch(`${apiBase}/api/marketlogs?${new URLSearchParams({
          item: itemID,
          start: start.toISOString(),
          end: end.toISOString(),
          countOnly: 'true'
        })}`);
        if (!countRes.ok) {
          if (countRes.status === 404) return [];
          throw new Error("API count fetch failed");
        }
        const { count } = await countRes.json();
        setDebugInfo(`Fetching ${itemName}: ${count} records`);

        if (count <= limit) {
          setDebugInfo(`${itemName}: Fetching ${count} records...`);
          if (onProgress) onProgress(0, 100);

          const res = await fetch(`${apiBase}/api/marketlogs?${new URLSearchParams({
            ...baseParams,
            skip: 0,
            limit: 10000,
          })}`);
          if (!res.ok) {
            if (res.status === 404) return [];
            throw new Error("API fetch failed");
          }
          const data = await res.json();
          marketCache.mergeData(itemID, data, segment.start, segment.end);
          if (onProgress) onProgress(100, 100);
        } else {
          // Batched fetching
          const pages = Math.ceil(count / limit);
          for (let i = 0; i < pages; i++) {
            setDebugInfo(`${itemName}: Batch ${i + 1}/${pages}`);
            const params = new URLSearchParams({
              ...baseParams,
              skip: (i * limit).toString(),
              limit: limit.toString()
            });
            const res = await fetch(`${apiBase}/api/marketlogs?${params}`);
            if (!res.ok) {
              if (res.status === 404) return [];
              throw new Error("API fetch failed");
            }
            const batch = await res.json();
            marketCache.mergeData(itemID, batch, segment.start, segment.end);
            if (onProgress) onProgress(i + 1, pages);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (err) {
        setDebugInfo(`Error: ${err.message}`);
        throw err;
      }
    }

    return marketCache.getData(itemID, start, end);
  }, []);

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
        maintainAspectRatio: false,
        animations: shouldAnimate.current ? {
          tension: {
            duration: 1000,
            easing: 'linear',
            from: 1,
            to: 0,
            loop: true
          }
        } : false,
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
            ticks: { color: typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--theme-textMuted').trim() || '#a4bbb0' : '#a4bbb0', maxTicksLimit: 5 },
            grid: { display: false },
          },
          y: {
            title: { display: false },
            ticks: { color: typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--theme-textMuted').trim() || '#a4bbb0' : '#a4bbb0', callback: (value) => `⏣ ${formatLargeNumber(value)}` },
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
                div.style.cssText = `position: absolute; background-color: ${typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--theme-bg4').trim() || '#111816' : '#111816'}; opacity: 0.9; color: ${typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--theme-textMuted').trim() || '#a4bbb0' : '#a4bbb0'}; border: 2px solid ${typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#6bff7a' : '#6bff7a'}; border-radius: 6px; padding: 10px; pointer-events: none; transform: translate(-50%, -120%); font-family: Monaco, monospace; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: opacity 0.2s ease, transform 0.2s ease; line-height: 1.3; min-width: 200px; width: max-content; white-space: nowrap;`;

                const triangle = document.createElement('div');
                triangle.className = 'tooltip-triangle';
                triangle.style.cssText = `position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#6bff7a' : '#6bff7a'};`;
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
                const quantity = originalData.amount || 1;
                const tradeId = originalData.tradeId || 'Unknown';
                const isSell = originalData.isSell !== undefined ? originalData.isSell : true;

                tooltipEl.innerHTML = `
                  <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="flex: 1;">
                      <div style="color: #ffffff; font-size: 12px; font-weight: bold; margin-bottom: 2px;">
                        ${dateString} ${timeString}
                      </div>
                      <div style="color: #a4bbb0; font-size: 12px; margin-bottom: 1px;">${dataset.label}</div>
                      <div style="color: #a4bbb0; font-size: 12px; margin-bottom: 1px;">⏣ ${commas(value)}</div>
                      <div style="color: #a4bbb0; font-size: 11px; margin-bottom: 1px;">Qty: ${quantity}</div>
                      <div style="color: ${isSell ? 'var(--theme-primary)' : '#ff6b6b'}; font-size: 11px;">${isSell ? 'SELL' : 'BUY'}</div>
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

  // Suppress animation when rebuilding chart from filter/slider changes
  const rebuildChartNoAnimate = (rawDataMap, items, colors) => {
    if (chartRef.current) {
      chartRef.current.options.animation = false;
    }
    shouldAnimate.current = false;
    rebuildChart(rawDataMap, items, colors);
  };

  const applyFilters = (rawData, itemName) => {
    let filtered = [...rawData];

    // filter trade type (skipped in dual mode — dual mode always uses all trades)
    if (!dualMode) {
      if (tradeType === 'sell') {
        filtered = filtered.filter(p => p.isSell === true);
      } else if (tradeType === 'buy') {
        filtered = filtered.filter(p => p.isSell === false);
      }
    }

    // Filter: hide private offers
    if (!showPrivate) {
      filtered = filtered.filter(p => !p.tradeId || !p.tradeId.startsWith('PV'));
    }

    // Filter: exclude outliers (per-item threshold)
    if (excludeOutliers) {
      const threshold = outlierThresholds[itemName] ?? 3;
      filtered = removeOutliers(filtered, threshold);
    }

    // Filter: exclude ⏣ 1 trades (#5)
    if (excludeOneCoinTrades) {
      filtered = filtered.filter(p => p.y !== 1);
    }

    return filtered;
  };

  /**
   * Rebuild chart datasets from raw cached data + current filter state.
   * No API calls — purely client-side transformation.
   */
  const rebuildChart = (rawDataMap, items, colors) => {
    const datasets = [];
    const newMarketData = {};

    for (const item of items) {
      const rawPoints = rawDataMap[item.name] || [];
      const color = colors[item.name];
      if (!color) continue;

      // Apply all filters
      let scatterData = applyFilters(rawPoints, item.name);
      newMarketData[item.name] = scatterData;

      // Dual Mode: split buy/sell into separate colored datasets
      if (dualMode && items.length === 1) {
        const sellPoints = scatterData.filter(p => p.isSell === true);
        const buyPoints = scatterData.filter(p => p.isSell === false);

        const sellTrend = calculateMovingAverage(sellPoints, 100);
        const buyTrend = calculateMovingAverage(buyPoints, 100);

        datasets.push(
          {
            label: `${titleCase(item.name)} Sell Trend`,
            data: sellTrend,
            borderColor: '#a3ffacff',
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
            label: `${titleCase(item.name)} Buy Trend`,
            data: buyTrend,
            borderColor: '#ff8585ff',
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
            label: `${titleCase(item.name)} (Sell)`,
            data: sellPoints,
            backgroundColor: (typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#6bff7a' : '#6bff7a') + '80',
            borderColor: typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#6bff7a' : '#6bff7a',
            pointRadius: 3,
            pointHoverRadius: 5,
            showLine: false,
            url: item.url,
            type: 'scatter',
            order: 2
          },
          {
            label: `${titleCase(item.name)} (Buy)`,
            data: buyPoints,
            backgroundColor: '#ff6b6b80',
            borderColor: '#ff6b6b',
            pointRadius: 3,
            pointHoverRadius: 5,
            showLine: false,
            url: item.url,
            type: 'scatter',
            order: 2
          }
        );
      } else {
        // Normal mode: single color per item
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
    }

    setMarketData(newMarketData);
    setChartData({ datasets });
  };

  const handleDisplay = async () => {
    setLoading(true);
    setProgress(0);
    const currentItems = [...selectedItems];
    setDisplayedItems(currentItems);
    setIsZoomedIn(false);

    try {
      const newRawData = {};
      const newColors = {};

      for (let i = 0; i < currentItems.length; i++) {
        const item = currentItems[i];

        // Compute color (uses color cache from Phase 1)
        const baseColor = await getAverageColor(item.url);
        const color = neonizeHex(baseColor);
        newColors[item.name] = color;

        // Fetch raw data (uses segment cache from Phase 4)
        const rawData = await fetchMarketData(
          item.id,
          item.name,
          new Date(startDate),
          new Date(endDate),
          (currentBatch, totalBatches) => {
            const itemProgress = currentBatch / totalBatches;
            const overallProgress = ((i + itemProgress) / currentItems.length) * 100;
            setProgress(Math.round(overallProgress));
          }
        );

        // Store raw unfiltered data
        newRawData[item.name] = rawData.map((entry) => ({
          x: new Date(entry.timestamp),
          y: entry.value,
          amount: entry.amount,
          tradeId: entry.tradeId,
          isSell: entry.isSell
        }));
      }

      setRawMarketData(newRawData);
      setItemColors(newColors);

      // Build chart with animation (initial load)
      shouldAnimate.current = true;
      rebuildChart(newRawData, currentItems, newColors);
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
    <div className="min-h-screen bg-bg0 text-white p-4">
      <Navbar />

      {itemsLoading ? (
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
                disabled={!canDisplay || loading}
                className={`flex-none font-mono font-extrabold py-[6px] px-4 rounded-md transition ${canDisplay && !loading
                  ? "bg-primary hover:bg-primaryHover text-bg0 cursor-pointer"
                  : "bg-primary text-bg0 cursor-not-allowed"
                  }`}
              //style={{ height: "40px" }}
              >
                {loading ? "Loading..." : "Display"}
              </button>
            </div>
            {dateError && <div className="absolute left-0 top-full mt-1 text-red-500 font-mono text-sm">Start date cannot be after end date.</div>}
          </div>
        </div>
      )}

      {chartData && (
        <>
          <div className="flex flex-col justify-between mt-4 mb-4 space-y-4 w-full mx-auto" id="chart-legend-container">
            <div className="bg-bg4 rounded-xl p-2 sm:p-3 shadow-lg relative w-full" id="chart-container">

              {loading && (
                <div className="absolute inset-0 bg-bg4 bg-opacity-80 flex flex-col items-center justify-center rounded-xl z-10">
                  {/* Main Loader */}
                  <Loader size={200} />

                  {/* Progress Bar */}
                  <div className="w-[250px] h-2 mt-6 bg-bg7 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-linear rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="text-sm text-gray-300 mt-2">{progress}%</p>
                  <p className="text-xs text-gray-400 mt-1">{debugInfo}</p>
                </div>
              )}

              <div className="flex flex-wrap justify-end items-center font-mono text-textMuted gap-1 mb-4">

                {/* Dataset Range Dropdown */}
                <div className="relative" ref={datasetRangeDropdownRef}>
                  <button
                    onClick={() => setDatasetRangeDropdownOpen(!datasetRangeDropdownOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-bg0 hover:text-primary transition-colors"
                    title="Dataset range"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </button>
                  {datasetRangeDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-bg0 rounded-md shadow-custom z-10 w-max p-2 text-[12px] ">
                      Dataset: {formatDate(datasetSpan.oldest)} - {formatDate(datasetSpan.latest)}
                    </div>
                  )}
                </div>

                {/* Data Options Dropdown */}
                <div className="relative" ref={dataOptionsDropdownRef}>
                  <button
                    onClick={() => setDataOptionsDropdownOpen(!dataOptionsDropdownOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-bg0 hover:text-primary transition-colors"
                    title="Data options"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                  </button>
                  {dataOptionsDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-bg0 rounded-md shadow-custom z-10 w-max p-3 ">
                      <label className="flex items-center space-x-2 text-[12px] mb-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showPrivate}
                          onChange={(e) => setShowPrivate(e.target.checked)}
                          className="hidden"
                        />
                        <div
                          className={`w-[14px] h-[14px] rounded-[3px] border-[1.5px] flex items-center justify-center transition-all duration-50 ${showPrivate ? "border-primary" : "border-border1"}`}
                          style={{ backgroundColor: "var(--theme-bg3)" }}
                          aria-hidden="true"
                        >
                          {showPrivate && (
                            <svg className="w-[10px] h-[10px] text-primary" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span>Private offers</span>
                      </label>
                      <label className="flex items-center space-x-2 text-[12px] mb-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={excludeOutliers}
                          onChange={(e) => setExcludeOutliers(e.target.checked)}
                          className="hidden"
                        />
                        <div
                          className={`w-[14px] h-[14px] rounded-[3px] border-[1.5px] flex items-center justify-center transition-all duration-50 ${excludeOutliers ? "border-primary" : "border-border1"}`}
                          style={{ backgroundColor: "var(--theme-bg3)" }}
                          aria-hidden="true"
                        >
                          {excludeOutliers && (
                            <svg className="w-[10px] h-[10px] text-primary" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span>Exclude outliers</span>
                      </label>
                      <label className="flex items-center space-x-2 text-[12px] mb-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={excludeOneCoinTrades}
                          onChange={(e) => setExcludeOneCoinTrades(e.target.checked)}
                          className="hidden"
                        />
                        <div
                          className={`w-[14px] h-[14px] rounded-[3px] border-[1.5px] flex items-center justify-center transition-all duration-50 ${excludeOneCoinTrades ? "border-primary" : "border-border1"}`}
                          style={{ backgroundColor: "var(--theme-bg3)" }}
                          aria-hidden="true"
                        >
                          {excludeOneCoinTrades && (
                            <svg className="w-[10px] h-[10px] text-primary" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span>Exclude ⏣ 1 trades</span>
                      </label>
                      {displayedItems.length === 1 && (
                        <label className="flex items-center space-x-2 text-[12px] cursor-pointer select-none border-t border-bg10 pt-2 mt-1">
                          <input
                            type="checkbox"
                            checked={dualMode}
                            onChange={(e) => setDualMode(e.target.checked)}
                            className="hidden"
                          />
                          <div
                            className={`w-[14px] h-[14px] rounded-[3px] border-[1.5px] flex items-center justify-center transition-all duration-50 ${dualMode ? "border-primary" : "border-border1"}`}
                            style={{ backgroundColor: "var(--theme-bg3)" }}
                            aria-hidden="true"
                          >
                            {dualMode && (
                              <svg className="w-[10px] h-[10px] text-primary" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span>Dual Mode</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Date Format Dropdown */}
                <div className="relative" ref={dateFormatDropdownRef}>
                  <button
                    onClick={() => setDateFormatDropdownOpen(!dateFormatDropdownOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-bg0 hover:text-primary transition-colors"
                    title="Date format"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </button>
                  {dateFormatDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-bg0 rounded-md shadow-custom z-10 w-max ">
                      <button
                        onClick={() => handleDateFormatChange(dateFormat === "dd/mm/yyyy" ? "mm/dd/yyyy" : "dd/mm/yyyy")}
                        className="w-full text-left rounded-md px-3 py-2 hover:bg-bg9 hover:text-primary transition-colors text-[12px]"
                      >
                        Format: {dateFormat === "dd/mm/yyyy" ? "mm/dd/yyyy" : "dd/mm/yyyy"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Trade Type Dropdown */}
                <div className="relative" ref={tradeTypeDropdownRef} title={dualMode ? "This option is disabled as 'Dual Mode' is enabled." : "Trade Type"}>
                  <button
                    onClick={() => !dualMode && setTradeTypeDropdownOpen(!tradeTypeDropdownOpen)}
                    className={`flex items-center justify-center w-8 h-8 rounded-md bg-bg0 transition-colors ${dualMode ? 'opacity-40 cursor-not-allowed' : 'hover:text-primary cursor-pointer'}`}
                    disabled={dualMode}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  </button>
                  {tradeTypeDropdownOpen && !dualMode && (
                    <div className="absolute top-full right-0 mt-1 bg-bg0 rounded-md shadow-custom z-10 min-w-25 ">
                      {["all", "buy", "sell"].map((type) => (
                        <button
                          key={type}
                          onClick={() => handleTradeTypeChange(type)}
                          className={`w-full text-left rounded-md px-3 py-2 transition-colors text-[12px] ${tradeType === type
                              ? "bg-bg9 text-primary"
                              : "hover:bg-bg9 hover:text-primary"
                            }`}
                        >
                          {getTradeTypeLabel(type)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Zoom Reset Button */}
                <button
                  onClick={handleZoomReset}
                  className={`flex items-center justify-center w-8 h-8 rounded-md bg-bg0 transition-colors ${isZoomedIn ? 'hover:text-primary cursor-pointer' : 'cursor-default'
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

            {/* Legend Container */}
            <div className="bg-bg4 mx-auto p-4 justify-between rounded-xl shadow-lg flex flex-col font-mono space-y-1 text-textMuted w-full" id="legend-container">
              <div className="flex flex-col space-y-1">
                <h2 className="text-base font-semibold text-[#ffffff] mb-2">Market Data — {displayedItems.length}</h2>
                {displayedItems.map((item) => {
                  const itemName = item.name;
                  const filteredData = marketData[itemName] || [];
                  const totalTrades = filteredData.length;
                  const color = itemColors[itemName] || (typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#6bff7a' : '#6bff7a');
                  const threshold = outlierThresholds[itemName] ?? 3;
                  return (
                    <div key={itemName} className="mb-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-4 h-4 rounded-md shrink-0" style={{ backgroundColor: color }} />
                        <img src={item.url} alt={titleCase(itemName)} className="w-5 h-5 shrink-0" />
                        <div className="flex flex-col">
                          <span className="truncate text-xs">{titleCase(itemName)}</span>
                          <span className="text-xs text-primary">{totalTrades} trades</span>
                        </div>
                      </div>
                      {excludeOutliers && (
                        <div className="ml-1 mt-2">
                          <div className="flex items-center justify-between text-[10px] text-textMuted mb-1">
                            <span>Outlier σ</span>
                            <span className="text-primary font-bold">{threshold.toFixed(1)}</span>
                          </div>
                          <div className="relative w-full h-4 flex items-center">
                            <div
                              className="absolute w-full h-[3px] rounded-full"
                              style={{ background: 'var(--theme-bg10)' }}
                            />
                            <div
                              className="absolute h-[3px] rounded-full pointer-events-none"
                              style={{
                                background: 'var(--theme-primary)',
                                width: `${((threshold - 1) / (10 - 1)) * 100}%`,
                              }}
                            />
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.5"
                              value={threshold}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                shouldAnimate.current = false;
                                setOutlierThresholds(prev => ({ ...prev, [itemName]: val }));
                              }}
                              className="outlier-slider relative w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col mx-auto px-0 space-y-4 w-full" id="cards-container">
            {displayedItems.map((item) => (
              <MarketItemCard key={item.name} item={item} tradeData={marketData[item.name]} />
            ))}
          </div>
        </>
      )}

      {!chartData && !loading && !itemsLoading && (
        <MarketTrends items={items} />
        /*
        <div className="flex flex-col items-center justify-center mt-32 text-textMuted opacity-50 font-mono text-center">
          <svg className="w-24 h-24 mb-4 text-border1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Item Market Visualizer</h2>
          <p className="max-w-md">
            Select up to 10 items, choose your date range, and click "Display" to visualize their market trades, trends, and pricing history.
          </p>
        </div>
        */
      )}
    </div>
  );
};

export default ItemMarketVisualizerMobile;