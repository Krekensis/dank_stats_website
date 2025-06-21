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

    useEffect(() => {
        const loadChart = async () => {
            if (!item?.history || item.history.length === 0) return setChartData(null);

            let history = [...item.history];

            // Filter by range
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

    const currentHistory = item?.history ?? [];
    let visibleHistory = [...currentHistory];
    if (range === '7d') {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        visibleHistory = visibleHistory.filter(h => new Date(h.t) >= weekAgo);
    } else if (range === '30d') {
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        visibleHistory = visibleHistory.filter(h => new Date(h.t) >= monthAgo);
    }
    const oldest = item?.history?.[0]?.v ?? null;
    const current = item?.history?.[item.history.length - 1]?.v ?? null;
    const latest = visibleHistory?.[visibleHistory.length - 1]?.v ?? null;
    const first = visibleHistory?.[0]?.v ?? null;
    const percentChange = first && latest ? (((latest - first) / first) * 100).toFixed(2) : null;

    const min = Math.min(...(item?.history?.map(h => h.v) || []));
    const max = Math.max(...(item?.history?.map(h => h.v) || []));

    return (
        <div className="w-[400px] bg-[#111816] border-0 rounded-md p-5 h-full overflow-y-auto">
            {item ? (
                <>
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <img src={item.url} alt={item.name} className="w-12 h-12 object-contain drop-shadow-md" />
                        <div>
                            <h2 className="text-xl font-extrabold font-mono">{titleCase(item.name)}</h2>
                            <p className="text-sm text-[#a4bbb0] font-mono">Item details & stats</p>
                        </div>
                    </div>

                    {/* Value Trend Header + Buttons + Chart */}
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
                            <p className="text-base font-mono text-white">⏣ {commas(current ?? '–')}</p>
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


                    {/* Placeholder for more */}
                    <div className="bg-[#0d1311] font-mono rounded-md p-4 text-sm text-[#a4bbb0]">
                        {`🧪 More stats (market stats) coming soon.`}
                    </div>
                </>
            ) : (
                <p className="text-gray-500">Select an item to see details.</p>
            )}
        </div>
    );
};

export default SidePanel;
