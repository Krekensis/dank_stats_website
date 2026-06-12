import React, { useState, useRef, useEffect } from 'react';
import NavbarMobile from '../../components/navbar-mobile';
import { jsonThemes, highlightJSON } from '../../utils/jsonThemes';

const endpoints = [
  {
    id: 'items',
    method: 'GET',
    path: '/api/items',
    title: 'Get all items',
    description: 'Returns a complete list of all tradable items, including their current statistics and full historical price mapping. ID is same as Dank Memer\'s item IDs.',
    params: [
      { name: 'id', type: 'integer', required: false, desc: 'Filter by ID.', values: 'Any INT' },
      { name: 'excludeHistory', type: 'boolean', required: false, desc: 'True to exclude history array.', values: 'true, false' },
      { name: 'sortBy', type: 'string', required: false, desc: 'Sort the items.', values: 'volume, trades, name, id' },
      { name: 'order', type: 'string', required: false, desc: 'Sort direction.', values: 'asc, desc' }
    ],
    errors: [
      { code: 400, desc: 'Invalid id format. Expected integer.' },
      { code: 404, desc: 'Item ID not found.' }
    ],
    examples: [
      {
        title: 'Fetch All Items',
        description: 'Fetches all items from the database.',
        url: '/api/items',
        response: `[
  {
    "name": "trash",
    "id": 1,
    "url": "https://cdn.discordapp.com/emojis/986723862190383165.webp",
    "history": [
      {
        "timestamp": "2026-06-05T18:34:35.306Z",
        "value": 3713000
      },
      ... (truncated)
    ],
    "stats": {
      "private": {
        "buy": {
          "num": 16369,
          "trades": 336,
          "vol": 178838873631
        },
        "sell": {
          "num": 10357,
          "trades": 293,
          "vol": 142170200675
        }
      },
      "public": {
        "buy": {
          "num": 41219,
          "trades": 3509,
          "vol": 301814871708
        },
        "sell": {
          "num": 29250,
          "trades": 2037,
          "vol": 253328895864
        }
      },
      "total": {
        "num": 97195,
        "trades": 6175,
        "vol": 876152841878
      }
    }
  },
  ... (truncated)
]`
      },
      {
        title: 'Fetch Specific Item by ID',
        description: 'Fetches only the item that matches the provided ID.',
        url: '/api/items?id=1',
        response: `[
  {
    "name": "trash",
    "id": 1,
    "url": "https://cdn.discordapp.com/emojis/986723862190383165.webp",
    "history": [
      {
        "timestamp": "2026-06-05T18:34:35.306Z",
        "value": 3713000
      },
      ... (truncated)
    ],
    "stats": {
      "private": {
        "buy": {
          "num": 16369,
          "trades": 336,
          "vol": 178838873631
        },
        "sell": {
          "num": 10357,
          "trades": 293,
          "vol": 142170200675
        }
      },
      "public": {
        "buy": {
          "num": 41219,
          "trades": 3509,
          "vol": 301814871708
        },
        "sell": {
          "num": 29250,
          "trades": 2037,
          "vol": 253328895864
        }
      },
      "total": {
        "num": 97195,
        "trades": 6175,
        "vol": 876152841878
      }
    }
  },
  ... (truncated)
]`,
      },
      {
        title: 'Sort and Exclude History',
        description: 'Fetches items sorted by volume in descending order, excluding the history to reduce payload size.',
        url: '/api/items?excludeHistory=true&sortBy=volume&order=desc',
        response: `[
  {
    "name": "life saver",
    "id": 158,
    "url": "https://cdn.discordapp.com/emojis/935147848977219635.webp?animated=true",
    "stats": {
      "private": {
        "buy": {
          "num": 4291628,
          "trades": 11993,
          "vol": 74315192430448
        },
        "sell": {
          "num": 2164205,
          "trades": 24406,
          "vol": 84836741805284
        }
      },
      "public": {
        "buy": {
          "num": 3946875,
          "trades": 16509,
          "vol": 760191730157
        },
        "sell": {
          "num": 10346833,
          "trades": 37799,
          "vol": 4025286191364
        }
      },
      "total": {
        "num": 20749541,
        "trades": 90707,
        "vol": 163937412157253
      }
    }
  },
  ... (truncated)
]`
      }
    ]
  },
  {
    id: 'pets',
    method: 'GET',
    path: '/api/pets',
    title: 'Get all pets',
    description: 'Returns a complete list of all pets, including their statistics and historical price mapping. ID is same as Dank Memer\'s pet IDs.',
    params: [
      { name: 'id', type: 'integer', required: false, desc: 'Filter by ID.', values: 'Any INT' },
      { name: 'excludeHistory', type: 'boolean', required: false, desc: 'True to exclude history array.', values: 'true, false' },
      { name: 'sortBy', type: 'string', required: false, desc: 'Sort the pets.', values: 'volume, trades, name, id' },
      { name: 'order', type: 'string', required: false, desc: 'Sort direction.', values: 'asc, desc' }
    ],
    errors: [
      { code: 400, desc: 'Invalid id format. Expected integer.' },
      { code: 404, desc: 'Pet ID not found.' }
    ],
    examples: [
      {
        title: 'Fetch all pets',
        description: 'Fetches all pets from the database.',
        url: '/api/pets',
        response: `[
  {
    "name": "snake",
    "id": 1,
    "url": "https://cdn.discordapp.com/emojis/860670284751437838.webp?animated=true",
    "history": [
      {
        "timestamp": "2026-04-30T08:29:44.559Z",
        "value": 0
      },
      ... (truncated)
    ],
    "stats": {
      "private": {
        "buy": {
          "num": 0,
          "trades": 0,
          "vol": 0
        },
        "sell": {
          "num": 323,
          "trades": 323,
          "vol": 17028649437
        }
      },
      "public": {
        "buy": {
          "num": 0,
          "trades": 0,
          "vol": 0
        },
        "sell": {
          "num": 2014,
          "trades": 2014,
          "vol": 8673812621
        }
      },
      "total": {
        "num": 2337,
        "trades": 2337,
        "vol": 25702462058
      }
    }
  },
  ... (truncated)
]`
      },
      {
        title: 'Fetch specific pet by ID',
        description: 'Fetches only the pet that matches the provided ID.',
        url: '/api/pets?id=1',
        response: `[
  {
    "name": "snake",
    "id": 1,
    "url": "https://cdn.discordapp.com/emojis/860670284751437838.webp?animated=true",
    "history": [
      {
        "timestamp": "2026-04-30T08:29:44.559Z",
        "value": 0
      },
      ... (truncated)
    ],
    "stats": {
      "private": {
        "buy": {
          "num": 0,
          "trades": 0,
          "vol": 0
        },
        "sell": {
          "num": 323,
          "trades": 323,
          "vol": 17028649437
        }
      },
      "public": {
        "buy": {
          "num": 0,
          "trades": 0,
          "vol": 0
        },
        "sell": {
          "num": 2014,
          "trades": 2014,
          "vol": 8673812621
        }
      },
      "total": {
        "num": 2337,
        "trades": 2337,
        "vol": 25702462058
      }
    }
  },
  ... (truncated)
]`
      },
      {
        title: 'Sort and exclude history',
        description: 'Fetches pets sorted by trades in descending order, excluding the history to reduce payload size.',
        url: '/api/pets?excludeHistory=true&sortBy=trades&order=desc',
        response: `[
  {
    "name": "gecko",
    "id": 3,
    "url": "https://cdn.discordapp.com/emojis/1307538534558728292.webp",
    "stats": {
      "private": {
        "buy": {
          "num": 0,
          "trades": 0,
          "vol": 0
        },
        "sell": {
          "num": 1835,
          "trades": 1835,
          "vol": 2072579644743
        }
      },
      "public": {
        "buy": {
          "num": 0,
          "trades": 0,
          "vol": 0
        },
        "sell": {
          "num": 822,
          "trades": 822,
          "vol": 985035175185
        }
      },
      "total": {
        "num": 2657,
        "trades": 2657,
        "vol": 3057614819928
      }
    }
  },
  ... (truncated)
]`
      }
    ]
  },
  {
    id: 'marketlogs',
    method: 'GET',
    path: '/api/marketlogs',
    title: 'Get item marketlogs',
    description: 'Fetch market trade logs for an item. Use query parameters to filter by time, trade type, and pagination limit. ItemID is same as Dank Memer\'s item IDs.',
    params: [
      { name: 'item', type: 'integer', required: true, desc: 'Filter by itemID.', values: 'Any INT' },
      { name: 'type', type: 'string', required: false, desc: 'Filter by trade type.', values: 'sell, buy' },
      { name: 'private', type: 'boolean', required: false, desc: '"False" to exclude private trades.', values: 'true, false' },
      { name: 'excludeOneCoin', type: 'boolean', required: false, desc: '"True" to exclude 1 dmc trades.', values: 'true, false' },
      { name: 'start', type: 'date string', required: false, desc: 'Filter trades starting from this ISO date.', values: 'ISO 8601 Date' },
      { name: 'end', type: 'date string', required: false, desc: 'Filter trades occurring before this ISO date.', values: 'ISO 8601 Date' },
      { name: 'limit', type: 'integer', required: false, desc: 'Limit the number of records returned (default 10,000).', values: '1-10000' },
      { name: 'skip', type: 'integer', required: false, desc: 'Offset the records returned for pagination.', values: '0+' },
      { name: 'countOnly', type: 'boolean', required: false, desc: '"True" returns only a count of the matched trades instead of an array.', values: 'true, false' },
      { name: 'sortBy', type: 'string', required: false, desc: 'Sort the logs. Default is "time".', values: 'time, value, amount' },
      { name: 'order', type: 'string', required: false, desc: 'Sort direction. Default is "desc".', values: 'asc, desc' }
    ],
    errors: [
      { code: 400, desc: 'Invalid parameter formats (e.g., limit is not an integer).' },
      { code: 404, desc: 'No market data found for these parameters.' }
    ],
    examples: [
      {
        title: 'Fetch by item ID',
        description: 'The minimum required parameter is the item ID. This returns the most recent 10,000 trades.',
        url: '/api/marketlogs?item=125',
        response: `[
  {
    "timestamp": "2022-08-24T03:57:01.580Z",
    "value": 2000000,
    "amount": 1,
    "tradeId": "Z973EX",
    "isSell": false,
    "itemId": 125
  },
  ... (truncated)
]`
      },
      {
        title: 'Filter by trade type',
        description: 'Use the `type` parameter to isolate only buy orders or only sell orders.',
        url: '/api/marketlogs?item=125&type=sell',
        response: `[
  {
    "timestamp": "2022-08-24T08:27:32.444Z",
    "value": 4000000,
    "amount": 1,
    "tradeId": "LNKKG8",
    "isSell": true,
    "itemId": 125
  },
  ... (truncated)
]`
      },
      {
        title: 'Filter by date range',
        description: 'Use ISO 8601 Date strings to fetch trades that occurred between a specific timeframe.',
        url: '/api/marketlogs?item=125&start=2023-10-01T00:00:00.000Z&end=2023-10-31T23:59:59.000Z',
        response: `[
  {
    "timestamp": "2023-10-01T10:19:44.484Z",
    "value": 7000000,
    "amount": 1,
    "tradeId": "W8EAAJ",
    "isSell": false,
    "itemId": 125
  },
  ... (truncated)
]`
      },
      {
        title: 'Count trades',
        description: 'Pass `countOnly=true` to simply return the total number of trades matching your filters.',
        url: '/api/marketlogs?item=125&countOnly=true',
        response: `{
  "count": 8581
}`
      },
      {
        title: 'Pagination & clean data',
        description: 'Filter out private/1 dmc trades and paginate through results using `skip` and `limit`.',
        url: '/api/marketlogs?item=125&private=false&excludeOneCoin=true&skip=100&limit=50',
        response: `[
  {
    "timestamp": "2026-04-09T15:02:47.573Z",
    "value": 10500000,
    "amount": 27,
    "tradeId": "0ERW8L",
    "isSell": true,
    "itemId": 125
  },
  ... (truncated)
]`
      },
      {
        title: 'Sort market logs',
        description: 'Sort the trades by the amount traded in descending order. Very useful for finding huge bulk trades.',
        url: '/api/marketlogs?item=125&sortBy=amount&order=desc&limit=10',
        response: `[
  {
    "timestamp": "2026-05-25T08:51:48.497Z",
    "value": 9300000,
    "amount": 1100,
    "tradeId": "PVIQWGP1",
    "isSell": true,
    "itemId": 125
  }
  ... (truncated)
]`
      }
    ]
  },
  {
    id: 'petmarketlogs',
    method: 'GET',
    path: '/api/petmarketlogs',
    title: 'Get pet marketlogs',
    description: 'Fetch the raw, granular market trade logs for a pet. Accepts the exact same parameters as /api/marketlogs. ItemID is same as Dank Memer\'s pet IDs.',
    params: [
      { name: 'item', type: 'integer', required: true, desc: 'Filter by itemID.', values: 'Any INT' },
      { name: '...', type: 'mixed', required: false, desc: 'Supports the exact same parameters as /api/marketlogs.', values: 'See /api/marketlogs' }
    ],
    errors: [
      { code: 400, desc: 'Invalid parameter formats.' },
      { code: 404, desc: 'No market data found for these parameters.' }
    ],
    examples: [
      {
        title: 'Fetch by Pet ID',
        description: 'The minimum required parameter is the pet ID. This returns the most recent 10,000 trades.',
        url: '/api/petmarketlogs?item=1',
        response: `[
  {
    "timestamp": "2025-06-01T01:42:46.260Z",
    "value": 500000,
    "amount": 1,
    "tradeId": "IMFI82",
    "isSell": true,
    "itemId": 1
  },
  ... (truncated)
]`
      },
    ]
  },
  {
    id: 'chart',
    method: 'GET',
    path: '/api/chart',
    title: 'Generate chart image',
    description: 'Generates a (700x400) scatter plot PNG image of the item or pet market history using Chart.js on the backend. ItemID is same as Dank Memer\'s item/pet IDs.',
    params: [
      { name: 'item', type: 'integer', required: true, desc: 'The ID of the item or pet.', values: 'Any INT' },
      { name: 'isPet', type: 'boolean', required: false, desc: 'Set to "true" if querying a pet ID.', values: 'true, false' },
      { name: 'last', type: 'integer', required: false, desc: 'Number of recent trades to include in the chart.', values: '1+' },
      { name: 'private', type: 'boolean', required: false, desc: 'Pass "false" to exclude private trades.', values: 'true, false' },
      { name: 'routlier', type: 'boolean', required: false, desc: 'Pass "true" to run a backend 3-sigma outlier removal algorithm on the plot.', values: 'true, false' },
      { name: 'ronecoin', type: 'boolean', required: false, desc: 'Pass "true" to exclude 1-coin trades.', values: 'true, false' }
    ],
    errors: [
      { code: 400, desc: 'Missing ?item parameter or invalid integer.' },
      { code: 404, desc: 'No trades found.' },
      { code: 500, desc: 'Internal server error generating image.' }
    ],
    examples: [
      {
        title: 'Trades chart',
        description: 'Generates a PNG chart for an item.',
        url: '/api/chart?item=125',
        isImage: true,
        response: `(Returns image/png binary data)`
      },
      {
        title: 'Trades chart with outlier and last params',
        description: 'Generates a PNG chart for an item with outliers removed and the last 1000 trades.',
        url: '/api/chart?item=125&routlier=true&last=1000',
        isImage: true,
        response: `(Returns image/png binary data)`
      },
      {
        title: 'Pet trades chart with outlier removal and 1 dmc exclusion',
        description: 'Generates a PNG chart for a pet, removing 1 dmc trades and statistical outliers.',
        url: '/api/chart?item=1&isPet=true&ronecoin=true&routlier=true',
        isImage: true,
        response: `(Returns image/png binary data)`
      }
    ]
  }
];

const ThemeDropdown = ({ jsonTheme, setJsonTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="absolute top-3 right-4 z-10" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-2 py-1 rounded-md bg-[#111816] space-x-2 transition-colors text-[11px] text-[#a4bbb0]"
      >
        <span>Theme: {jsonTheme}</span>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-[#070e0c] rounded-md shadow-lg z-50 min-w-[150px] max-h-48 overflow-y-auto">
          {Object.keys(jsonThemes).map((themeName) => (
            <button
              key={themeName}
              onClick={() => {
                setJsonTheme(themeName);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[11px] hover:bg-[#1d2a24] hover:text-[#6bff7a] transition-colors ${jsonTheme === themeName ? 'text-[#6bff7a] bg-[#111816]' : 'text-[#a4bbb0]'}`}
            >
              {themeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ApiPageMobile = () => {
  const [jsonTheme, setJsonTheme] = useState("One Dark Pro");
  const [activeTab, setActiveTab] = useState(endpoints[0].id);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const apiBase = import.meta.env.PROD ? import.meta.env.VITE_API_BASE : "http://localhost:3001";
  const activeEndpoint = endpoints.find(ep => ep.id === activeTab);

  return (
    <div className="min-h-screen bg-[#070e0c] text-white font-mono selection:bg-[#6bff7a] selection:text-black">
      <NavbarMobile />

      <div className="mt-[100px] pb-20 px-4 w-full">
        <div className="mb-8 text-center pb-6">
          <h1 className="text-3xl text-[#c6ffcc] tracking-wide mb-3">API Documentation</h1>
          <p className="text-[#a4bbb0] text-sm leading-relaxed">Complete reference for all Dank Stats public API endpoints.</p>
        </div>

        <div className="flex flex-col gap-10">
          {endpoints.map(ep => (
            <div key={ep.id} className={`${activeTab === ep.id ? 'block' : 'hidden'} animate-fade-in`}>
              <div className="mb-4">
                <h2 className="text-2xl text-[#c6ffcc] font-bold tracking-wide mb-2">{ep.title}</h2>
                <p className="text-[#a4bbb0] text-sm">{ep.description}</p>
              </div>

              <div className="bg-[#111816] shadow-lg rounded-xl p-4 mb-4 flex flex-col gap-2">
                <code className="text-lg text-[#6bff7a]">{ep.method} <span className="text-white break-all">{ep.path}</span></code>
                <div className="text-[10px] text-[#a4bbb0] tracking-widest bg-[#070e0c]/50 px-2 py-1.5 rounded-md mt-1 w-fit">BASE URL: https://dankstats.onrender.com</div>
              </div>

              {/* Errors Section Moved Up */}
              <h3 className="text-lg text-[#c6ffcc] tracking-wide mb-3 flex items-center gap-2">
                Error Responses
              </h3>
              <div className="flex flex-col gap-2 mb-6">
                {ep.errors.map((err, i) => (
                  <div key={i} className="bg-[#111816] shadow-md rounded-lg p-3 flex gap-3 items-center">
                    <span className="text-[#ff4736] font-bold text-sm bg-[#ff3636]/10 px-2 py-1 rounded shrink-0">{err.code}</span>
                    <p className="text-xs text-[#a4bbb0] leading-relaxed">{err.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-lg text-[#c6ffcc] tracking-wide mb-3 flex items-center gap-2">
                Query Parameters
              </h3>
              <div className="flex flex-col gap-2 mb-6">
                {ep.params.map((p, i) => (
                  <div key={i} className="bg-[#111816] shadow-md rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                    {/* Top Row: Name and Required Badge */}
                    <div className="flex justify-between items-center pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#6bff7a] font-mono font-bold text-[13px] bg-[#6bff7a]/10 px-2 py-0.5 rounded-md">{p.name}</span>
                        <span className="text-[#a4bbb0] text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#070e0c]">{p.type}</span>
                      </div>
                      {p.required
                        ? <span className="text-[#a4bbb0] text-[9px] uppercase tracking-widest bg-[#a4bbb0]/10 px-2 py-1 rounded">Required</span>
                        : <span className="text-[#a4bbb0] text-[9px] uppercase tracking-widest bg-[#a4bbb0]/10 px-2 py-1 rounded">Optional</span>}
                    </div>
                    {/* Middle: Description */}
                    <p className="text-xs text-[#a4bbb0] leading-relaxed mt-1">{p.desc}</p>
                    {/* Bottom: Values */}
                    <div className="mt-1 bg-[#070e0c]/80 p-2.5 rounded-lg flex items-center gap-2">
                      <span className="text-[9px] text-[#a4bbb0]/70 uppercase tracking-widest font-bold shrink-0">Accepts:</span>
                      <code className="text-xs text-[#c6ffcc] font-mono break-words">{p.values || 'Any'}</code>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <h3 className="text-lg text-[#c6ffcc] tracking-wide flex items-center gap-2">
                  Examples
                </h3>
              </div>
              <div className="flex flex-col gap-4 mb-6">
                {ep.examples.map((ex, i) => (
                  <div key={i} className="bg-[#111816] shadow-lg rounded-xl overflow-hidden">
                    <div className="p-4">
                      <h4 className="text-[15px] font-bold text-[#6bff7a] mb-1">{ex.title}</h4>
                      <p className="text-[#a4bbb0] text-[11px] mb-3 leading-relaxed">{ex.description}</p>
                      <div className="bg-[#070e0c] px-3 py-2 rounded-lg flex items-center overflow-x-auto">
                        <span className="text-[#a4bbb0] mr-2 text-[10px] font-bold uppercase tracking-widest">GET</span>
                        <code className="text-[#c6ffcc] text-xs whitespace-nowrap">{ex.url}</code>
                      </div>
                    </div>
                    <div className="p-4 bg-[#070e0c]/50 relative">
                      {!ex.isImage && <ThemeDropdown jsonTheme={jsonTheme} setJsonTheme={setJsonTheme} />}
                      <div className="text-[10px] text-[#a4bbb0] uppercase tracking-widest mb-2 mt-1 font-bold">Response</div>
                      {ex.isImage ? (
                        <div className="mt-2 p-3 rounded-lg flex items-center justify-center">
                          <img src={`${apiBase}${ex.url}`} alt={ex.title} className="max-w-full rounded-md shadow-sm" />
                        </div>
                      ) : (
                        <pre className="text-xs overflow-x-auto whitespace-pre pt-1">
                          <code>{highlightJSON(ex.response, jsonTheme)}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Bottom Floating Dropdown Navigation */}
      <div className="fixed bottom-6 left-4 right-4 z-50">
        {isNavOpen && (
          <div className="mb-2 bg-[#111816] backdrop-blur-xl rounded-xl shadow-[0_0_40px_rgba(0,0,0,1)] border border-[#6bff7a]/30 overflow-hidden flex flex-col animate-fade-in">
            {endpoints.map(ep => (
              <button
                key={`nav-${ep.id}`}
                onClick={() => {
                  setActiveTab(ep.id);
                  setIsNavOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`text-left px-4 py-4 text-sm transition-colors border-b border-[#a4bbb0]/10 last:border-0 ${activeTab === ep.id ? 'bg-[#6bff7a]/10' : 'hover:bg-[#070e0c]/50'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#070e0c] ${ep.method === 'GET' ? 'text-[#6bff7a]' : 'text-[#ffcabf]'}`}>
                    {ep.method}
                  </span>
                  <span className={activeTab === ep.id ? 'text-[#c6ffcc]' : 'text-[#a4bbb0]'}>{ep.path}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="w-full bg-[#0b120f]/95 backdrop-blur-xl border border-[#6bff7a]/40 shadow-[0_0_40px_rgba(0,0,0,1),_0_0_20px_rgba(107,255,122,0.1)] rounded-xl p-4 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-1 rounded bg-[#070e0c] ${activeEndpoint.method === 'GET' ? 'text-[#6bff7a]' : 'text-[#ffcabf]'}`}>
              {activeEndpoint.method}
            </span>
            <span className="text-white text-sm font-mono tracking-wide">{activeEndpoint.path}</span>
          </div>
          <svg className={`w-5 h-5 text-[#6bff7a] transition-transform duration-300 ${isNavOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </button>
      </div>
    </div>
  );
};

export default ApiPageMobile;
