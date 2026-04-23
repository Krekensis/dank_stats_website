import React, { useState, useEffect, } from 'react';
import { Line } from 'react-chartjs-2';
import { commas, titleCase } from '../functions/stringUtils';
import { neonizeHex, getAverageColor } from '../functions/colorUtils';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip);

const SidePanel = ({ item }) => {


    const [range, setRange] = useState('Full');
    const [chartData, setChartData] = useState(null);
    const [sortedHistory, setSortedHistory] = useState([]);

    // Market stats state
    const [marketRange, setMarketRange] = useState(500);
    const [marketChartData, setMarketChartData] = useState(null);
    const [marketStats, setMarketStats] = useState(null);
    const [marketLoading, setMarketLoading] = useState(false);

    useEffect(() => {
        if (!item?.history || item.history.length === 0) {
            setChartData(null);
            setSortedHistory([]);
            return;
        }

        const sorted = [...item.history].sort((a, b) => new Date(a.t) - new Date(b.t));
        setSortedHistory(sorted);

        let history = [...sorted];

        if (range === '7d') {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            history = history.filter(h => new Date(h.t) >= weekAgo);
        } else if (range === '30d') {
            const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            history = history.filter(h => new Date(h.t) >= monthAgo);
        }

        if (history.length === 0) {
            setChartData(null);
            return;
        }

        const loadChart = async () => {
            const avgColor = await getAverageColor(item.url);
            const color = neonizeHex(avgColor);
            const values = history.map(h => h.v);
            const labels = history.map((_, i) => i);

            setChartData({
                labels,
                datasets: [
                    {
                        data: values,
                        borderColor: color,
                        pointRadius: 0,
                        tension: 0.3,
                    },
                ],
            });
        };

        loadChart();
    }, [item, range]);

    // Fetch market data when item or marketRange changes
    useEffect(() => {
        if (!item?.id) {
            setMarketChartData(null);
            setMarketStats(null);
            return;
        }

        const fetchMarketData = async () => {
            setMarketLoading(true);
            try {
                const apiBase = import.meta.env.PROD ? import.meta.env.VITE_API_BASE : "http://localhost:3001";
                const res = await fetch(`${apiBase}/api/marketlogs?${new URLSearchParams({
                    item: item.id,
                    skip: "0",
                    limit: marketRange.toString()
                })}`);
                const data = await res.json();

                if (!data || data.length === 0) {
                    setMarketChartData(null);
                    setMarketStats(null);
                    setMarketLoading(false);
                    return;
                }

                // Sort by time
                const sorted = data.sort((a, b) => new Date(a.x) - new Date(b.x));

                // Split buy/sell
                const sellTrades = sorted.filter(d => d.s === true);
                const buyTrades = sorted.filter(d => d.s === false);

                // Calculate moving averages
                const calcMA = (trades, window = 20) => {
                    if (trades.length === 0) return [];
                    const result = [];
                    for (let i = 0; i < trades.length; i++) {
                        const start = Math.max(0, i - window + 1);
                        const slice = trades.slice(start, i + 1);
                        const avg = slice.reduce((sum, t) => sum + t.y, 0) / slice.length;
                        result.push(avg);
                    }
                    return result;
                };

                const sellMA = calcMA(sellTrades, Math.max(10, Math.floor(sellTrades.length / 10)));
                const buyMA = calcMA(buyTrades, Math.max(10, Math.floor(buyTrades.length / 10)));

                // Create labels (indices)
                const maxLen = Math.max(sellMA.length, buyMA.length);
                const labels = Array.from({ length: maxLen }, (_, i) => i);

                // Pad shorter array with nulls at the start
                const padded = (arr, targetLen) => {
                    if (arr.length >= targetLen) return arr;
                    return [...new Array(targetLen - arr.length).fill(null), ...arr];
                };

                setMarketChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Sell Avg',
                            data: padded(sellMA, maxLen),
                            borderColor: '#6bff7a',
                            pointRadius: 0,
                            tension: 0.3,
                            borderWidth: 3,
                            spanGaps: true,
                        },
                        {
                            label: 'Buy Avg',
                            data: padded(buyMA, maxLen),
                            borderColor: '#ff6b6b',
                            pointRadius: 0,
                            tension: 0.3,
                            borderWidth: 3,
                            spanGaps: true,
                        },
                    ],
                });

                // Stats
                const avgPrice = (arr) => arr.length > 0 ? Math.round(arr.reduce((s, t) => s + t.y, 0) / arr.length) : 0;
                setMarketStats({
                    totalTrades: sorted.length,
                    sellCount: sellTrades.length,
                    buyCount: buyTrades.length,
                    avgSellPrice: avgPrice(sellTrades),
                    avgBuyPrice: avgPrice(buyTrades),
                });
            } catch (err) {
                console.error('Error fetching market data for sidepanel:', err);
                setMarketChartData(null);
                setMarketStats(null);
            } finally {
                setMarketLoading(false);
            }
        };

        fetchMarketData();
    }, [item?.id, marketRange]);


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
                        const timestamp = visibleHistory[itemIndex]?.t;
                        if (!timestamp) return '';
                        const date = new Date(timestamp);
                        return date.toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        });
                    },
                    label: (tooltipItem) => {
                        const val = tooltipItem.formattedValue;
                        return `Value: ⏣ ${val}`;
                    },
                },
            },
        },
        scales: {
            x: { display: false },
            y: { display: false },
        },
    };

    const marketChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(13, 19, 17, 0.8)',
                titleColor: '#a4bbb0',
                bodyColor: '#e0f4eb',
                titleFont: { family: 'monospace', weight: 'bold', size: 12 },
                bodyFont: { family: 'monospace', size: 12 },
                displayColors: false,
                callbacks: {
                    title: () => 'Moving Average',
                    label: (tooltipItem) => {
                        const label = tooltipItem.dataset.label;
                        const val = tooltipItem.formattedValue;
                        return `${label}: ⏣ ${val}`;
                    },
                },
            },
        },
        scales: {
            x: { display: false },
            y: { display: false },
        },
    };

    const currentHistory = sortedHistory ?? [];
    let visibleHistory = [...currentHistory];
    if (range === '7d') {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        visibleHistory = visibleHistory.filter(h => new Date(h.t) >= weekAgo);
    } else if (range === '30d') {
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        visibleHistory = visibleHistory.filter(h => new Date(h.t) >= monthAgo);
    }
    const oldest = sortedHistory?.[0]?.v ?? null;
    const current = sortedHistory?.[sortedHistory.length - 1]?.v ?? null;
    const latest = visibleHistory?.[visibleHistory.length - 1]?.v ?? null;
    const first = visibleHistory?.[0]?.v ?? null;
    const percentChange = first && latest ? (((latest - first) / first) * 100).toFixed(2) : null;

    const min = Math.min(...(sortedHistory?.map(h => h.v) || []));
    const max = Math.max(...(sortedHistory?.map(h => h.v) || []));

    return (
        <div className="w-[400px] bg-[#111816] border-0 rounded-md p-5 h-full overflow-y-auto">
            {item ? (
                <>
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b-2 border-[#1e2a27]">
                        <img src={item.url} alt={item.name} className="w-12 h-12 object-contain drop-shadow-md" />
                        <div>
                            <h2 className="text-xl font-extrabold font-mono">{titleCase(item.name)}</h2>
                            <p className="text-sm text-[#a4bbb0] font-mono">Item details & stats</p>
                        </div>
                    </div>

                    {/* Value Trend Header + Buttons + Chart */}
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
                                    <Line data={chartData} options={chartOptions} />
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
                            <div className="bg-[#0d1311] rounded-md p-3">
                                <p className="text-xs font-mono text-[#a4bbb0] mb-1">Current Value</p>
                                <p className="text-base font-mono">⏣ {commas(current ?? '–')}</p>
                            </div>
                            <div className="bg-[#0d1311] rounded-md p-3">
                                <p className="text-xs font-mono text-[#a4bbb0] mb-1">Oldest Value</p>
                                <p className="text-base font-mono">⏣ {commas(oldest ?? '–')}</p>
                            </div>
                            <div className="bg-[#0d1311] rounded-md p-3">
                                <p className="text-xs font-mono text-[#a4bbb0] mb-1">Minimum</p>
                                <p className="text-base font-mono">⏣ {commas(min)}</p>
                            </div>
                            <div className="bg-[#0d1311] rounded-md p-3">
                                <p className="text-xs font-mono text-[#a4bbb0] mb-1">Maximum</p>
                                <p className="text-base font-mono">⏣ {commas(max)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Market Stats Chart */}
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
                                <Line data={marketChartData} options={marketChartOptions} />
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
                                <div className="bg-[#0d1311] rounded-md p-3">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Sell Trades</p>
                                    <p className="text-base font-mono">{commas(marketStats.sellCount)}</p>
                                </div>
                                <div className="bg-[#0d1311] rounded-md p-3">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Buy Trades</p>
                                    <p className="text-base font-mono">{commas(marketStats.buyCount)}</p>
                                </div>
                                <div className="bg-[#0d1311] rounded-md p-3">
                                    <p className="text-xs font-mono text-[#a4bbb0] mb-1">Avg Sell Price</p>
                                    <p className="text-base font-mono">⏣ {commas(marketStats.avgSellPrice)}</p>
                                </div>
                                <div className="bg-[#0d1311] rounded-md p-3">
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

export default SidePanel;
