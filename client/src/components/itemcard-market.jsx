import React from "react";
import { titleCase, commas } from "../functions/stringUtils";

const MarketItemCard = ({ item, tradeData }) => {
    if (!item) return null;

    const data = tradeData || [];
    const totalTrades = data.length;

    const sellTrades = data.filter(t => t.s === true);
    const buyTrades = data.filter(t => t.s === false);

    const totalVolume = data.reduce((sum, t) => sum + (t.n || 1), 0);
    const sellVolume = sellTrades.reduce((sum, t) => sum + (t.n || 1), 0);
    const buyVolume = buyTrades.reduce((sum, t) => sum + (t.n || 1), 0);

    const getMinMaxAvg = (trades) => {
        if (trades.length === 0) return { min: "N/A", max: "N/A", avg: "N/A" };
        const prices = trades.map(t => t.y);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        return { min, max, avg: Math.round(avg) };
    };

    const sellStats = getMinMaxAvg(sellTrades);
    const buyStats = getMinMaxAvg(buyTrades);

    return (
        <div key={item.name} className="bg-[#111816] border border-transparent rounded-xl p-4 shadow-lg font-mono flex flex-col w-full sm:w-[235px] sm:shrink-0">
            <div className="flex items-center space-x-3 mb-5 pb-4 border-b-2 border-[#1e2a27]">
                <div className="p-2 rounded-lg shrink-0">
                    <img src={item.url} className="w-10 h-10 object-contain" draggable={false} />
                </div>
                <div className="text-white font-bold text-sm leading-snug line-clamp-2 w-full break-words">{titleCase(item.name)}</div>
            </div>

            <div className="text-[12px] text-[#a4bbb0] space-y-4 w-full flex-grow">
                <div className="bg-[#0a0f0d] p-3 rounded-lg border border-transparent">
                    <div className="text-[#6bff7a] font-bold text-[12px] uppercase tracking-wider mb-2 flex justify-between">
                        <span>Sell Orders</span>
                        <span>{sellTrades.length} trades</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between"><span>Volume:</span> <span className="text-white">{commas(sellVolume)}</span></div>
                        <div className="flex justify-between"><span>Minimum:</span> <span className="text-white">{sellStats.min !== "N/A" ? `⏣ ${commas(sellStats.min)}` : "N/A"}</span></div>
                        <div className="flex justify-between"><span>Maximum:</span> <span className="text-white">{sellStats.max !== "N/A" ? `⏣ ${commas(sellStats.max)}` : "N/A"}</span></div>
                        <div className="flex justify-between"><span>Average:</span> <span className="text-[#6bff7a]">{sellStats.avg !== "N/A" ? `⏣ ${commas(sellStats.avg)}` : "N/A"}</span></div>
                    </div>
                </div>

                <div className="bg-[#0a0f0d] p-3 rounded-lg border border-transparent">
                    <div className="text-[#ff6b6b] font-bold text-[12px] uppercase tracking-wider mb-2 flex justify-between">
                        <span>Buy Orders</span>
                        <span>{buyTrades.length} trades</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between"><span>Volume:</span> <span className="text-white">{commas(buyVolume)}</span></div>
                        <div className="flex justify-between"><span>Minimum:</span> <span className="text-white">{buyStats.min !== "N/A" ? `⏣ ${commas(buyStats.min)}` : "N/A"}</span></div>
                        <div className="flex justify-between"><span>Maximum:</span> <span className="text-white">{buyStats.max !== "N/A" ? `⏣ ${commas(buyStats.max)}` : "N/A"}</span></div>
                        <div className="flex justify-between"><span>Average:</span> <span className="text-[#ff6b6b]">{buyStats.avg !== "N/A" ? `⏣ ${commas(buyStats.avg)}` : "N/A"}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketItemCard;
