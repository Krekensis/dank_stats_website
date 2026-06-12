import React, { useState, useRef, useEffect } from 'react';
import NavbarDesktop from '../../components/navbar-desktop';
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
    <div className="absolute top-4 right-6 z-10" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-1.5 rounded-md bg-[#111816] space-x-2 hover:text-[#6bff7a] transition-colors text-sm text-[#a4bbb0]"
      >
        <span>Theme: {jsonTheme}</span>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-[#070e0c] rounded-md shadow-lg min-w-full max-h-64 overflow-y-auto w-48">
          {Object.keys(jsonThemes).map((themeName) => (
            <button
              key={themeName}
              onClick={() => {
                setJsonTheme(themeName);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-[#1d2a24] hover:text-[#6bff7a] transition-colors text-sm ${jsonTheme === themeName ? 'text-[#6bff7a] bg-[#111816]' : 'text-[#a4bbb0]'}`}
            >
              {themeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ApiPageDesktop = () => {
  const [activeTab, setActiveTab] = useState(endpoints[0].id);
  const [jsonTheme, setJsonTheme] = useState("One Dark Pro");
  const apiBase = import.meta.env.PROD ? import.meta.env.VITE_API_BASE : "http://localhost:3001";

  return (
    <div className="min-h-screen bg-[#070e0c] text-white font-mono selection:bg-[#6bff7a] selection:text-black">
      <NavbarDesktop />
      <div className="mt-[100px] pb-20 px-8 max-w-7xl mx-auto flex gap-12">

        {/* Sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-2 sticky top-28 h-fit">
          <h2 className="text-[#a4bbb0] text-sm uppercase tracking-widest mb-4 pb-2 border-b-2 border-[#a4bbb0]/10 ">Endpoints</h2>
          {endpoints.map(ep => (
            <button
              key={ep.id}
              onClick={() => setActiveTab(ep.id)}
              className={`text-left px-4 py-3 rounded-lg text-sm transition-all duration-300 ${activeTab === ep.id
                ? 'bg-[#6bff7a]/10 text-[#6bff7a]'
                : 'bg-[#070e0c]/50 text-[#a4bbb0] hover:bg-[#6bff7a]/4'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#111816] ${ep.method === 'GET' ? 'text-[#6bff7a]' : 'text-[#ffcabf]'}`}>
                  {ep.method}
                </span>
                {ep.path}
              </div>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {endpoints.map(ep => (
            <div key={ep.id} className={`${activeTab === ep.id ? 'block' : 'hidden'} animate-fade-in`}>

              <div className="mb-8 pb-8">
                <h1 className="text-3xl text-[#c6ffcc] font-bold tracking-wide mb-4">{ep.title}</h1>
                <p className="text-[#a4bbb0] text-lg leading-relaxed">{ep.description}</p>
              </div>

              <div className="bg-[#111816] shadow-lg rounded-xl p-6 mb-8 flex items-center justify-between">
                <code className="text-xl text-[#6bff7a]">{ep.method} <span className="text-white">{ep.path}</span></code>
                <div className="text-xs text-[#a4bbb0] tracking-widest bg-[#070e0c]/50 px-3 py-2 rounded-md">BASE URL: https://dankstats.onrender.com</div>
              </div>

              {/* Errors Section Moved Up & Full Width */}
              <h3 className="text-xl text-[#c6ffcc] tracking-wide mb-4 flex items-center gap-2">
                Error Responses
              </h3>
              <div className="bg-[#111816] shadow-lg rounded-xl overflow-hidden mb-8">
                <table className="w-full text-left">
                  <tbody className="bg-[#070e0c]/50 divide-y divide-[#a4bbb0]/10">
                    {ep.errors.map((err, i) => (
                      <tr key={i}>
                        <td className="py-4 px-6 w-[120px]">
                          <span className="text-[#ff4736] font-bold bg-[#ff3636]/10 px-2 py-1 rounded">{err.code}</span>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#a4bbb0]">{err.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl text-[#c6ffcc] tracking-wide mb-4 flex items-center gap-2">
                Query Parameters
              </h3>
              <div className="bg-[#111816] shadow-lg rounded-xl overflow-hidden mb-8">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-4 px-6 text-[#a4bbb0] font-normal text-sm uppercase tracking-widest w-[20%]">Parameter name</th>
                      <th className="py-4 px-6 text-[#a4bbb0] font-normal text-sm uppercase tracking-widest w-[15%]">Type</th>
                      <th className="py-4 px-6 text-[#a4bbb0] font-normal text-sm uppercase tracking-widest w-[10%]">Required</th>
                      <th className="py-4 px-6 text-[#a4bbb0] font-normal text-sm uppercase tracking-widest w-[20%]">Parameter value</th>
                      <th className="py-4 px-6 text-[#a4bbb0] font-normal text-sm uppercase tracking-widest w-[35%]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#070e0c]/50 divide-y divide-[#a4bbb0]/10">
                    {ep.params.map((p, i) => (
                      <tr key={i} className="hover:bg-[#070e0c] transition-colors">
                        <td className="py-4 px-6 text-[#c6ffcc] font-bold">{p.name}</td>
                        <td className="py-4 px-6 text-[#a4bbb0] text-sm">{p.type}</td>
                        <td className="py-4 px-6">
                          {p.required
                            ? <span className="text-[#a4bbb0] text-xs uppercase tracking-widest">Yes</span>
                            : <span className="text-[#a4bbb0] text-xs uppercase tracking-widest">No</span>}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#a4bbb0]">{p.values || 'Any'}</td>
                        <td className="py-4 px-6 text-sm text-[#a4bbb0] leading-relaxed">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mb-4">
                <h3 className="text-xl text-[#c6ffcc] tracking-wide flex items-center gap-2">
                  Examples
                </h3>
              </div>
              <div className="flex flex-col gap-6 mb-8">
                {ep.examples.map((ex, i) => (
                  <div key={i} className="bg-[#111816] shadow-lg rounded-xl overflow-hidden">
                    <div className="p-6">
                      <h4 className="text-lg text-[#6bff7a] mb-2">{ex.title}</h4>
                      <p className="text-[#a4bbb0] text-sm mb-4">{ex.description}</p>
                      <div className="bg-[#070e0c] px-4 py-3 rounded-lg flex items-center overflow-x-auto">
                        <span className="text-[#a4bbb0] mr-2 text-xs uppercase tracking-widest">GET</span>
                        <code className="text-[#c6ffcc] text-sm whitespace-nowrap">{ex.url}</code>
                      </div>
                    </div>
                    <div className="p-6 relative bg-[#070e0c]/50">
                      {!ex.isImage && <ThemeDropdown jsonTheme={jsonTheme} setJsonTheme={setJsonTheme} />}
                      <div className="text-xs text-[#a4bbb0] uppercase tracking-widest mb-3 mt-1">Response</div>
                      {ex.isImage ? (
                        <div className="mt-4 p-4 rounded-lg flex items-center justify-center">
                          <img src={`${apiBase}${ex.url}`} alt={ex.title} className="max-w-full rounded-md shadow-md" />
                        </div>
                      ) : (
                        <pre className="text-sm overflow-x-auto whitespace-pre pt-2">
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
    </div>
  );
};

export default ApiPageDesktop;
