import React from "react";
import { titleCase, commas } from "../functions/stringUtils";

const ItemCard = ({ item, startDate, endDate }) => {
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

    const getColorClass = (val) => {
        if (val === "N/A" || !val) return "text-[#a4bbb0]";
        const num = parseFloat(val);
        return num > 0 ? "text-[#6bff7a]" : num < 0 ? "text-[#ff6b6b]" : "text-[#a4bbb0]";
    }

    return (
        <div key={item.name} className="bg-[#111816] border border-transparent rounded-xl p-4 shadow-lg font-mono flex flex-col w-full sm:w-[235px] sm:shrink-0">
            <div className="flex items-center space-x-3 mb-5 pb-4 border-b-2 border-[#1e2a27]">
                <div className="bg-transparent p-2 rounded-lg shrink-0">
                    <img src={item.url} className="w-10 h-10 object-contain" draggable={false} />
                </div>
                <div className="text-white font-bold text-sm leading-snug line-clamp-2 w-full break-words">{titleCase(item.name)}</div>
            </div>

            <div className="text-[12px] text-[#a4bbb0] space-y-4 w-full flex-grow">
                <div className="bg-[#0a0f0d] p-3 rounded-lg border border-transparent">
                    <div className="text-[#6bff7a] font-bold text-[12px] uppercase tracking-wider mb-2">Historical Value</div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between"><span>Oldest:</span> <span className="text-white">⏣ {commas(oldestAll)}</span></div>
                        <div className="flex justify-between"><span>Latest:</span> <span className="text-white">⏣ {commas(latestAll)}</span></div>
                        <div className="flex justify-between"><span>Minimum:</span> <span className="text-white">⏣ {commas(lowestAll)}</span></div>
                        <div className="flex justify-between"><span>Maximum:</span> <span className="text-white">⏣ {commas(highestAll)}</span></div>
                        <div className="flex justify-between"><span>Δ Time:</span> <span className={`${getColorClass(totalTimePercentChange)}`}>{totalTimePercentChange}%</span></div>
                        <div className="flex justify-between"><span>Δ Value:</span> <span className={`${getColorClass(totalValuePercentChange)}`}>{totalValuePercentChange}%</span></div>
                    </div>
                </div>

                <div className="bg-[#0a0f0d] p-3 rounded-lg border border-transparent">
                    <div className="text-[#6bff7a] font-bold text-[12px] uppercase tracking-wider mb-2">Value Over Range</div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between"><span>Oldest:</span> <span className="text-white">{oldestRange !== "N/A" ? `⏣ ${commas(oldestRange)}` : "N/A"}</span></div>
                        <div className="flex justify-between"><span>Latest:</span> <span className="text-white">{latestRange !== "N/A" ? `⏣ ${commas(latestRange)}` : "N/A"}</span></div>
                        <div className="flex justify-between"><span>Minimum:</span> <span className="text-white">{lowestRange !== "N/A" ? `⏣ ${commas(lowestRange)}` : "N/A"}</span></div>
                        <div className="flex justify-between"><span>Maximum:</span> <span className="text-white">{highestRange !== "N/A" ? `⏣ ${commas(highestRange)}` : "N/A"}</span></div>
                        <div className="flex justify-between"><span>Δ Time:</span> <span className={`${getColorClass(rangeTimePercentChange)}`}>{rangeTimePercentChange}%</span></div>
                        <div className="flex justify-between"><span>Δ Value:</span> <span className={`${getColorClass(rangeValuePercentChange)}`}>{rangeValuePercentChange}%</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemCard;