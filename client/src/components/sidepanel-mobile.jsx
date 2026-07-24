import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { commas, titleCase, formatLargeNumber } from '../functions/stringUtils';
import { neonizeHex, getAverageColor } from '../functions/colorUtils';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Filler,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

// ── Persistent market cache (survives item switching) ─────────────────────────
// Structure: { [itemId]: { data: [...], fetchedAt: timestamp } }
const sidePanelMarketCache = {};

const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid(itemId) {
    const entry = sidePanelMarketCache[itemId];
    if (!entry) return false;
    return Date.now() - entry.fetchedAt < CACHE_MAX_AGE_MS;
}

function getCached(itemId) {
    return sidePanelMarketCache[itemId]?.data ?? null;
}

function setCache(itemId, data) {
    sidePanelMarketCache[itemId] = { data, fetchedAt: Date.now() };
}

// ── Outlier removal ───────────────────────────────────────────────────────────
function removeOutliers(data, threshold = 3) {
    if (data.length === 0) return data;

    const baselineTrades = data.filter(p => p.value !== 1 && (!p.tradeId || !p.tradeId.startsWith('PV')));
    const baseData = baselineTrades.length > 0 ? baselineTrades : data;

    const values = baseData.map(point => point.value).sort((a, b) => a - b);
    
    const getMedian = (arr) => {
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    const median = getMedian(values);
    const deviations = values.map(v => Math.abs(v - median)).sort((a, b) => a - b);
    const mad = getMedian(deviations);
    
    let madStdDev = 1.4826 * mad;
    
    if (madStdDev === 0) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
        madStdDev = stdDev > 0 ? stdDev : Math.max(1, median * 0.01);
    }

    return data.filter(point => Math.abs(point.value - median) <= threshold * madStdDev);
}

// ── Moving average ────────────────────────────────────────────────────────────
function calcMA(trades, window = 20) {
    if (trades.length === 0) return [];
    return trades.map((_, i) => {
        const start = Math.max(0, i - window + 1);
        const slice = trades.slice(start, i + 1);
        return Math.round(slice.reduce((s, t) => s + t.value, 0) / slice.length);
    });
}

// ── Build chart data from pre-filtered trades ─────────────────────────────────
function buildMarketChartData(filtered) {
    const sorted = [...filtered].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const sellTrades = sorted.filter(d => d.isSell === true);
    const buyTrades = sorted.filter(d => d.isSell === false);

    const sellMA = calcMA(sellTrades, Math.max(10, Math.floor(sellTrades.length / 10)));
    const buyMA = calcMA(buyTrades, Math.max(10, Math.floor(buyTrades.length / 10)));

    // Keep timestamps aligned to each trade for tooltip
    const sellTimestamps = sellTrades.map(d => d.timestamp);
    const buyTimestamps = buyTrades.map(d => d.timestamp);

    const maxLen = Math.max(sellMA.length, buyMA.length);
    const labels = Array.from({ length: maxLen }, (_, i) => i);

    const padded = (arr, targetLen) =>
        arr.length >= targetLen ? arr : [...new Array(targetLen - arr.length).fill(null), ...arr];

    const paddedSellTS = sellTimestamps.length >= maxLen
        ? sellTimestamps
        : [...new Array(maxLen - sellTimestamps.length).fill(null), ...sellTimestamps];
    const paddedBuyTS = buyTimestamps.length >= maxLen
        ? buyTimestamps
        : [...new Array(maxLen - buyTimestamps.length).fill(null), ...buyTimestamps];

    return {
        labels,
        datasets: [
            {
                label: 'Sell Avg',
                data: padded(sellMA, maxLen),
                timestamps: paddedSellTS,
                borderColor: '#6bff7a',
                pointRadius: 0,
                tension: 0.3,
                borderWidth: 3,
                spanGaps: true,
            },
            {
                label: 'Buy Avg',
                data: padded(buyMA, maxLen),
                timestamps: paddedBuyTS,
                borderColor: '#ff6b6b',
                pointRadius: 0,
                tension: 0.3,
                borderWidth: 3,
                spanGaps: true,
            },
        ],
        // For stats tiles
        _sellTrades: sellTrades,
        _buyTrades: buyTrades,
        _total: sorted.length,
    };
}

// ── Custom Plugin for Vertical Crosshair ──────────────────────────────────────
const crosshairPlugin = {
    id: 'crosshair',
    afterDraw: (chart) => {
        if (chart.tooltip?._active && chart.tooltip._active.length) {
            const activePoint = chart.tooltip._active[0];
            const ctx = chart.ctx;
            const x = activePoint.element.x;
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#4a5e56';
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────

const SidePanelMobile = ({ item, prefetchItemIds = [] }) => {

    const [range, setRange] = useState('Full');
    const [chartData, setChartData] = useState(null);
    const [sortedHistory, setSortedHistory] = useState([]);

    // Market stats state
    const [marketRange, setMarketRange] = useState(1000);
    const [marketChartData, setMarketChartData] = useState(null);
    const [marketStats, setMarketStats] = useState(null);
    const [marketLoading, setMarketLoading] = useState(false);

    // Track last fetched item to avoid redundant fetches
    const lastFetchedItemId = useRef(null);

    // ── Value trend chart ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!item?.history || item.history.length === 0) {
            setChartData(null);
            setSortedHistory([]);
            return;
        }

        const sorted = [...item.history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setSortedHistory(sorted);

        let history = [...sorted];
        if (range === '7d') {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            history = history.filter(h => new Date(h.timestamp) >= weekAgo);
        } else if (range === '30d') {
            const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            history = history.filter(h => new Date(h.timestamp) >= monthAgo);
        }

        if (history.length === 0) { setChartData(null); return; }

        const loadChart = async () => {
            const avgColor = await getAverageColor(item.url);
            const color = neonizeHex(avgColor);
            const values = history.map(h => h.value);
            const labels = history.map((_, i) => i);
            setChartData({
                labels,
                datasets: [{
                    data: values,
                    borderColor: color,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 128); // 128px is roughly h-32
                        gradient.addColorStop(0, `${color}80`); // 50% opacity neon color
                        gradient.addColorStop(1, `${color}00`); // transparent
                        return gradient;
                    },
                    fill: true,
                    pointRadius: 0,
                    tension: 0.3,
                }],
            });
        };

        loadChart();
    }, [item, range]);

    // ── Market data fetch + cache ──────────────────────────────────────────────
    const fetchAndCacheMarket = async (itemId) => {
        if (!itemId) return;
        if (isCacheValid(itemId)) return; // already cached

        const apiBase = import.meta.env.PROD ? import.meta.env.VITE_API_BASE : 'http://localhost:3001';
        try {
            const res = await fetch(`${apiBase}/api/marketlogs?${new URLSearchParams({
                item: itemId.toString(),
                skip: '0',
                limit: '2500',
                private: 'false',
                excludeOneCoin: 'true',
            })}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setCache(itemId, []);
                    return;
                }
                throw new Error('API fetch failed');
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                // Client-side outlier removal (threshold 3σ)
                const cleaned = removeOutliers(data);
                setCache(itemId, cleaned);
            }
        } catch (err) {
            console.error('SidePanel prefetch error:', err);
        }
    };

    // ── Prefetch adjacent items ───────────────────────────────────────────────
    useEffect(() => {
        if (!prefetchItemIds || prefetchItemIds.length === 0) return;
        // Fire-and-forget; low priority
        const ids = prefetchItemIds.filter(id => id && !isCacheValid(id));
        for (const id of ids) {
            fetchAndCacheMarket(id);
        }
    }, [prefetchItemIds]);

    // ── Derive chart data from cache when item or marketRange changes ──────────
    useEffect(() => {
        if (!item?.id) {
            setMarketChartData(null);
            setMarketStats(null);
            return;
        }

        const buildFromCache = (rawData) => {
            // Take the latest `marketRange` records (API returns newest first)
            const sliced = rawData.slice(0, marketRange);
            const built = buildMarketChartData(sliced);
            setMarketChartData(built);
            const avgPrice = (arr) => arr.length > 0 ? Math.round(arr.reduce((s, t) => s + t.value, 0) / arr.length) : 0;
            setMarketStats({
                totalTrades: built._total,
                sellCount: built._sellTrades.length,
                buyCount: built._buyTrades.length,
                avgSellPrice: avgPrice(built._sellTrades),
                avgBuyPrice: avgPrice(built._buyTrades),
            });
        };

        // If data is already cached → instant render
        if (isCacheValid(item.id)) {
            buildFromCache(getCached(item.id));
            return;
        }

        // Otherwise fetch then build
        setMarketLoading(true);
        fetchAndCacheMarket(item.id).then(() => {
            const cached = getCached(item.id);
            if (cached) buildFromCache(cached);
            else {
                setMarketChartData(null);
                setMarketStats(null);
            }
        }).finally(() => setMarketLoading(false));

    }, [item?.id, marketRange]);


    // ── Value chart options ───────────────────────────────────────────────────
    const currentHistory = sortedHistory ?? [];
    let visibleHistory = [...currentHistory];
    if (range === '7d') {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        visibleHistory = visibleHistory.filter(h => new Date(h.timestamp) >= weekAgo);
    } else if (range === '30d') {
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        visibleHistory = visibleHistory.filter(h => new Date(h.timestamp) >= monthAgo);
    }

    const oldest = sortedHistory?.[0]?.value ?? null;
    const current = sortedHistory?.[sortedHistory.length - 1]?.value ?? null;
    const latest = visibleHistory?.[visibleHistory.length - 1]?.value ?? null;
    const first = visibleHistory?.[0]?.value ?? null;
    const percentChange = first && latest ? (((latest - first) / first) * 100).toFixed(2) : null;
    const min = Math.min(...(sortedHistory?.map(h => h.value) || []));
    const max = Math.max(...(sortedHistory?.map(h => h.value) || []));

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(13, 19, 17, 0.8)',
                titleColor: '#6bff7a',
                bodyColor: '#e0f4eb',
                titleFont: { family: 'monospace', weight: 'bold', size: 12 },
                bodyFont: { family: 'monospace', size: 12 },
                displayColors: false,
                callbacks: {
                    title: (tooltipItems) => {
                        const itemIndex = tooltipItems[0].dataIndex;
                        const timestamp = visibleHistory[itemIndex]?.timestamp;
                        if (!timestamp) return '';
                        const date = new Date(timestamp);
                        return date.toLocaleString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                        });
                    },
                    label: (tooltipItem) => `Value: ⏣ ${tooltipItem.formattedValue}`,
                },
            },
        },
        scales: {
            x: { display: false },
            y: { display: false },
        },
    };

    // ── Market chart options ──────────────────────────────────────────────────
    // We build a custom plugin to color labels without showing color boxes.
    const marketChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(13, 19, 17, 0.92)',
                titleColor: '#6bff7a',
                bodyColor: '#e0f4eb',
                titleFont: { family: 'monospace', weight: 'bold', size: 12 },
                bodyFont: { family: 'monospace', size: 12 },
                displayColors: false,
                callbacks: {
                    // Title: timestamp of the hovered data point (neon green via titleColor above)
                    title: (tooltipItems) => {
                        const item = tooltipItems[0];
                        const dataset = item.chart.data.datasets[item.datasetIndex];
                        const ts = dataset.timestamps?.[item.dataIndex];
                        if (!ts) return '';
                        const d = new Date(ts);
                        return d.toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                        });
                    },
                    // Labels: colored text, integer only, no color box 
                    label: (tooltipItem) => {
                        const label = tooltipItem.dataset.label;
                        const raw = tooltipItem.raw;
                        if (raw === null || raw === undefined) return null;
                        const val = Math.round(raw);
                        return `${label}: ⏣ ${commas(val)}`;
                    },
                    // Color each label line by dataset color
                    labelTextColor: (tooltipItem) => {
                        return '#e0f4eb';
                    },
                },
            },
        },
        scales: {
            x: { display: false },
            y: { display: false },
        },
    };

    return (
        <div className="w-full bg-[#111816] border-0 rounded-md p-4 h-full overflow-y-auto flex-shrink-0">
            {item ? (
                <>
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b-2 border-[#1e2a27]">
                        <img src={item.url} alt={item.name} className="w-12 h-12 object-contain drop-shadow-md" />
                        <div>
                            <h2 className="text-xl font-extrabold font-mono">{titleCase(item.name)}</h2>
                            <p className="text-sm text-[#a4bbb0] font-mono">Item details &amp; stats</p>
                        </div>
                    </div>

                    {/* Lifetime Statistics */}
                    {item.stats && (
                        <div className="mb-4 pb-4 border-b-2 border-[#1e2a27]">
                            <p className="text-base text-[#a4bbb0] font-mono mb-4">Lifetime Statistics</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Total Volume</p>
                                    <p className="text-base font-mono text-white">⏣ {formatLargeNumber(item.stats.total.vol)}</p>
                                </div>
                                <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Buy Volume</p>
                                    <p className="text-base font-mono text-white">⏣ {formatLargeNumber(item.stats.public.buy.vol + item.stats.private.buy.vol)}</p>
                                </div>
                                
                                <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Total Trades</p>
                                    <p className="text-base font-mono text-white">{commas(item.stats.total.trades)}</p>
                                </div>
                                <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Sell Volume</p>
                                    <p className="text-base font-mono text-white">⏣ {formatLargeNumber(item.stats.public.sell.vol + item.stats.private.sell.vol)}</p>
                                </div>

                                <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Buy Trades</p>
                                    <p className="text-base font-mono text-white">{commas(item.stats.public.buy.trades + item.stats.private.buy.trades)}</p>
                                </div>
                                <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Sell Trades</p>
                                    <p className="text-base font-mono text-white">{commas(item.stats.public.sell.trades + item.stats.private.sell.trades)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Value Trend */}
                    <div className='mb-4 border-b-2 border-[#1e2a27]'>
                        <div className="mb-6">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-base text-[#a4bbb0] font-mono">Value Trend</p>
                                <div className="flex rounded-md bg-[#0d1311] p-1">
                                    {['7d', '30d', 'Full'].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRange(r)}
                                            className={`w-12 py-1 px-1 rounded-[4px] text-xs font-mono border transition ${range === r
                                                ? 'bg-[#17211d] border-0 text-[#6bff7a]'
                                                : 'bg-transparent border-0 text-[#a4bbb0]'
                                                }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-32 mb-2 flex items-center justify-center">
                                {chartData ? (
                                    <Line data={chartData} options={chartOptions} plugins={[crosshairPlugin]} />
                                ) : (
                                    <p className="text-red-400 font-mono text-sm italic">No data available in this range.</p>
                                )}
                            </div>

                            {percentChange && (
                                <p className={`text-sm font-mono ${percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {percentChange >= 0 ? '▲' : '▼'} {percentChange}% over time
                                </p>
                            )}
                        </div>

                        {/* Stat Highlights */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                <p className="text-xs font-mono text-[#a4bbb0] mb-1">Current Value</p>
                                <p className="text-base font-mono">⏣ {commas(current ?? '–')}</p>
                            </div>
                            <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                <p className="text-xs font-mono text-[#a4bbb0] mb-1">Oldest Value</p>
                                <p className="text-base font-mono">⏣ {commas(oldest ?? '–')}</p>
                            </div>
                            <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                <p className="text-xs font-mono text-[#a4bbb0] mb-1">Minimum</p>
                                <p className="text-base font-mono">⏣ {commas(min)}</p>
                            </div>
                            <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                <p className="text-xs font-mono text-[#a4bbb0] mb-1">Maximum</p>
                                <p className="text-base font-mono">⏣ {commas(max)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Market Trend */}
                    <div className="">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-base text-[#a4bbb0] font-mono">Market Trend</p>
                            <div className="flex rounded-md bg-[#0d1311] p-1">
                                {[100, 500, 1000].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setMarketRange(n)}
                                        className={`w-12 py-1 px-1 rounded-[4px] text-xs font-mono border transition ${marketRange === n
                                            ? 'bg-[#17211d] border-0 text-[#6bff7a]'
                                            : 'bg-transparent border-0 text-[#a4bbb0]'
                                            }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-32 mb-2 flex items-center justify-center">
                            {marketLoading ? (
                                <p className="text-[#a4bbb0] font-mono text-sm animate-pulse">Loading trades...</p>
                            ) : marketChartData ? (
                                <Line data={marketChartData} options={marketChartOptions} plugins={[crosshairPlugin]} />
                            ) : (
                                <p className="text-[#4a5e56] font-mono text-sm italic">No market data available.</p>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs font-mono mb-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-0.5 bg-[#6bff7a] rounded-full" />
                                <span className="text-[#a4bbb0]">Sell Avg</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-0.5 bg-[#ff6b6b] rounded-full" />
                                <span className="text-[#a4bbb0]">Buy Avg</span>
                            </div>
                        </div>

                        {/* Market stat tiles */}
                        {marketStats && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Sell Trades</p>
                                    <p className="text-base font-mono">{commas(marketStats.sellCount)}</p>
                                </div>
                                <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Buy Trades</p>
                                    <p className="text-base font-mono">{commas(marketStats.buyCount)}</p>
                                </div>
                                <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Avg Sell Price</p>
                                    <p className="text-base font-mono">⏣ {commas(marketStats.avgSellPrice)}</p>
                                </div>
                                <div className="bg-[#0d1311] rounded-md py-3 px-2">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Avg Buy Price</p>
                                    <p className="text-base font-mono">⏣ {commas(marketStats.avgBuyPrice)}</p>
                                </div>
                            </div>
                        )}

                    </div>
                </>
            ) : (
                <p className="text-gray-500">Select an item to see details.</p>
            )}
        </div>
    );
};

export default SidePanelMobile;
