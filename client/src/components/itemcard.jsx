import React from "react";
import { titleCase, commas } from "../functions/stringUtils";

const ItemCard = ({ item, startDate, endDate }) => {
    if (!item) return null;

    const allValues = item.history.map((entry) => entry.v);
    const rangeValues = item.history.filter((entry) => {
        const ts = new Date(entry.t);
        return ts >= startDate && ts <= endDate;
    }).map((entry) => entry.v);

    const [lowestAll, highestAll, oldestAll, latestAll] = [Math.min(...allValues), Math.max(...allValues), allValues[0], allValues[allValues.length - 1]];
    const totalTimePercentChange = allValues.length > 1 && oldestAll !== 0 ? (((latestAll - oldestAll) / oldestAll) * 100).toFixed(2) : "N/A";
    const totalValuePercentChange = lowestAll !== 0 ? (((highestAll - lowestAll) / lowestAll) * 100).toFixed(2) : "N/A";

    const [lowestRange, highestRange, oldestRange, latestRange] = rangeValues.length > 0 ? [Math.min(...rangeValues), Math.max(...rangeValues), rangeValues[0], rangeValues[rangeValues.length - 1]] : ["N/A", "N/A", "N/A", "N/A"];
    const rangeTimePercentChange = rangeValues.length > 1 && oldestRange !== 0 && oldestRange !== "N/A" ? (((latestRange - oldestRange) / oldestRange) * 100).toFixed(2) : "N/A";
    const rangeValuePercentChange = rangeValues.length > 1 && lowestRange !== "N/A" && lowestRange !== 0 ? (((highestRange - lowestRange) / lowestRange) * 100).toFixed(2) : "N/A";

    return (
        <div key={item.name} className="bg-[#111816] rounded-xl p-4 shadow-lg font-mono text-[#a4bbb0] flex flex-col items-center" style={{ flex: "0 0 235px", width: "235px", height: "auto" }}>
            <div className="flex flex-col items-center justify-center mb-4">
                <img src={item.url} className="w-10 h-10 mb-1" draggable={false} />
                <div className="text-white font-semibold text-center text-base">{titleCase(item.name)}</div>
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

export default ItemCard;