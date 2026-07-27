import React, { useState, useEffect, useMemo } from 'react';
import { titleCase, commas, formatLargeNumber } from '../functions/stringUtils';
import Loader from './loader';

const TrendCard = ({ item, type, timeframe }) => {
  // item is the trend data from market_trends
  const stats = item[timeframe]; // daily or weekly

  let valueText = "";
  let subText = "";
  let isPositive = true;

  if (type === 'traded') {
    valueText = `${formatLargeNumber(stats.trades)} trades`;
    subText = `Vol: ⏣ ${formatLargeNumber(stats.vol || 0)}`;
    isPositive = true;
  } else {
    isPositive = stats.change >= 0;
    valueText = `⏣ ${commas(Math.round(stats.avg || 0))}`;
    subText = `${isPositive ? '+' : ''}${stats.changePct.toFixed(1)}% (⏣ ${commas(Math.round(stats.change || 0))})`;
  }

  return (
    <div className="bg-bg4 hover:bg-bg8 transition-colors rounded-lg p-4 flex items-center justify-between shadow-lg cursor-pointer h-[72px] min-w-[280px] gap-5">
      <div className="flex items-center space-x-4">
        <img src={item.url} alt={item.name} className="w-10 h-10 object-contain" />
        <div className="flex flex-col">
          <span className="text-[#ffffff] font-bold font-mono text-sm">{titleCase(item.name)}</span>
          <span className="text-textMuted font-mono text-xs text-left">{subText}</span>
        </div>
      </div>
      <div className={`font-mono font-bold text-sm text-right ${type === 'traded' ? 'text-primary' : isPositive ? 'text-primary' : 'text-[#ff6b6b]'}`}>
        {valueText}
      </div>
    </div>
  );
};

let cachedTrends = null;
let trendsPromise = null;

const fetchTrendsData = () => {
  if (cachedTrends) return Promise.resolve(cachedTrends);
  if (!trendsPromise) {
    const apiBase = import.meta.env.PROD ? import.meta.env.VITE_API_BASE : "http://localhost:3001";
    trendsPromise = fetch(`${apiBase}/api/scraped?id=market_trends`)
      .then(res => res.json())
      .then(data => {
        cachedTrends = data.data || [];
        return cachedTrends;
      })
      .catch(err => {
        console.error("Failed to fetch market trends:", err);
        return [];
      });
  }
  return trendsPromise;
};

// Start fetching as soon as the module loads!
fetchTrendsData();

const MarketTrends = () => {
  const [trendsData, setTrendsData] = useState(cachedTrends || []);
  const [loading, setLoading] = useState(!cachedTrends);
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' (24h) or 'weekly' (7d)

  useEffect(() => {
    let isMounted = true;
    if (!cachedTrends) {
      fetchTrendsData().then(data => {
        if (isMounted) {
          setTrendsData(data);
          setLoading(false);
        }
      });
    }
    return () => { isMounted = false; };
  }, []);

  const trends = useMemo(() => {
    if (!trendsData || trendsData.length === 0) return { gainers: [], losers: [], traded: [] };

    const validItems = trendsData.filter(item => item[timeframe] && item[timeframe].trades > 0);

    // Top Gainers (highest positive % change)
    const gainers = [...validItems]
      .filter(i => i[timeframe].changePct > 0)
      .sort((a, b) => b[timeframe].changePct - a[timeframe].changePct)
      .slice(0, 10);

    // Top Losers (lowest negative % change)
    const losers = [...validItems]
      .filter(i => i[timeframe].changePct < 0)
      .sort((a, b) => a[timeframe].changePct - b[timeframe].changePct) // sort ascending (most negative first)
      .slice(0, 10);

    // Most Traded
    const traded = [...validItems]
      .sort((a, b) => b[timeframe].trades - a[timeframe].trades)
      .slice(0, 10);

    return { gainers, losers, traded };
  }, [trendsData, timeframe]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 w-full mt-12">
        <Loader size={200} />
      </div>
    );
  }

  if (trendsData.length === 0) return null;

  return (
    <div className="w-full max-w-[1300px] mx-auto mt-12 flex flex-col items-center px-6">

      {/* 24h / 7d Toggle (Styled like Sidepanel) */}
      <div className="flex bg-bg4 rounded-full p-1 mb-8 shadow-inner">
        <button
          onClick={() => setTimeframe("daily")}
          className={`flex-1 py-1.5 px-6 rounded-full text-xs font-mono font-bold transition-all duration-300 ${timeframe === "daily"
            ? "bg-primary text-bg0 shadow-md"
            : "text-textMuted hover:text-white"
            }`}
        >
          24h
        </button>
        <button
          onClick={() => setTimeframe("weekly")}
          className={`flex-1 py-1.5 px-6 rounded-full text-xs font-mono font-bold transition-all duration-300 ${timeframe === "weekly"
            ? "bg-primary text-bg0 shadow-md"
            : "text-textMuted hover:text-white"
            }`}
        >
          7d
        </button>
      </div>

      <div className="w-full flex flex-col space-y-10 overflow-hidden relative">
        {/* Top Gainers */}
        <div className="flex flex-col space-y-2 relative w-full">
          <div className="flex items-center justify-center w-full px-6 mb-2">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-textMuted/40 mr-4"></div>
            <h3 className="text-xl font-audiowide text-textMuted">Top Gainers</h3>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-textMuted/40 ml-4"></div>
          </div>
          <div className="w-full overflow-hidden relative group" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
            {trends.gainers.length > 0 ? (
              <div className="flex w-max animate-scroll-left space-x-6 px-6">
                {[...trends.gainers, ...trends.gainers].map((item, idx) => (
                  <div key={`gainer-${item.name}-${idx}`} className="min-w-max shrink-0">
                    <TrendCard item={item} type="gainer" timeframe={timeframe} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-textMuted font-mono text-sm opacity-70 italic text-center py-4">No gainers found</div>
            )}
          </div>
        </div>

        {/* Top Losers */}
        <div className="flex flex-col space-y-2 relative w-full">
          <div className="flex items-center justify-center w-full px-6 mb-2">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-textMuted/40 mr-4"></div>
            <h3 className="text-xl font-audiowide text-textMuted">Top Losers</h3>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-textMuted/40 ml-4"></div>
          </div>
          <div className="w-full overflow-hidden relative group" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
            {trends.losers.length > 0 ? (
              <div className="flex w-max animate-scroll-left space-x-6 px-6" style={{ animationDirection: 'reverse' }}>
                {[...trends.losers, ...trends.losers].map((item, idx) => (
                  <div key={`loser-${item.name}-${idx}`} className="min-w-max shrink-0">
                    <TrendCard item={item} type="loser" timeframe={timeframe} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-textMuted font-mono text-sm opacity-70 italic text-center py-4">No losers found</div>
            )}
          </div>
        </div>

        {/* Most Traded */}
        <div className="flex flex-col space-y-2 relative w-full">
          <div className="flex items-center justify-center w-full px-6 mb-2">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-textMuted/40 mr-4"></div>
            <h3 className="text-xl font-audiowide text-textMuted">Most Traded</h3>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-textMuted/40 ml-4"></div>
          </div>
          <div className="w-full overflow-hidden relative group" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
            {trends.traded.length > 0 ? (
              <div className="flex w-max animate-scroll-left space-x-6 px-6">
                {[...trends.traded, ...trends.traded].map((item, idx) => (
                  <div key={`traded-${item.name}-${idx}`} className="min-w-max shrink-0">
                    <TrendCard item={item} type="traded" timeframe={timeframe} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-textMuted font-mono text-sm opacity-70 italic text-center py-4">No trade data found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTrends;
