import React, { useEffect, useState } from 'react';
import Navbar from '../../components/navbar';
import ItemCardAll from '../../components/itemcard-all';
import SidePanel from '../../components/sidepanel';
import Loader from '../../components/loader';
import { useMongoData } from '../../hooks/useMongoData';

const AllItemsOverviewMobile = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState('contains'); // 'contains', 'exact', 'startsWith'
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [datasetSpan, setDatasetSpan] = useState({ oldest: null, latest: null });
    const { data: itemData, loading } = useMongoData();

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [touchStartY, setTouchStartY] = useState(null);
    const [touchEndY, setTouchEndY] = useState(null);

    const handleTouchStart = (e) => {
        setTouchEndY(null);
        setTouchStartY(e.targetTouches[0].clientY);
    };

    const handleTouchMove = (e) => {
        setTouchEndY(e.targetTouches[0].clientY);
    };

    const handleTouchEnd = () => {
        if (!touchStartY || !touchEndY) return;
        const distance = touchStartY - touchEndY;
        const minSwipeDistance = 30;

        if (distance > minSwipeDistance && !isPanelOpen) {
            setIsPanelOpen(true);
        }
        if (distance < -minSwipeDistance && isPanelOpen) {
            setIsPanelOpen(false);
        }
    };

    useEffect(() => {
        if (loading || !itemData) return;

        const filtered = itemData
            .filter((item) => item.url)
            .map((item) => ({
                ...item,
                history: item.history
                    ?.slice() // shallow copy
                    .sort((a, b) => new Date(a.t) - new Date(b.t)) || [],
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        setItems(filtered);

        const allDates = filtered.flatMap((item) =>
            item.history?.map((entry) => new Date(entry.t)) || []
        );

        if (allDates.length > 0) {
            const oldest = new Date(Math.min(...allDates));
            const latest = new Date(Math.max(...allDates));
            setDatasetSpan({ oldest, latest });
        }
    }, [itemData, loading]);

    const filteredItems = items.filter((item) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        const name = item.name.toLowerCase();
        if (searchMode === 'exact') return name === query;
        if (searchMode === 'startsWith') return name.startsWith(query);
        return name.includes(query);
    });

    useEffect(() => {
        if (!selectedItem && filteredItems.length > 0) {
            setSelectedItem(filteredItems[0]);
        }
    }, [filteredItems]);

    return (
        <div className="min-h-screen bg-[#070e0c] text-white flex">
            <div className="flex-1 p-4">
                <Navbar />

                {loading ? (
                    <div className="items-center justify-center flex h-[calc(100vh-80px)]">
                        <Loader size={200} />
                    </div>
                ) : (
                    <div className="mt-20">
                        {/* Search Bar */}
                        <div className="max-w-7xl mx-auto mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search for an item..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-11 p-3 pr-20 bg-[#111816] text-[#a4bbb0] placeholder-[#a4bbb0] placeholder-opacity-100 rounded-md font-mono text-left cursor-pointer outline-0 border-2 border-transparent hover:border-[#6bff7a] focus:border-[#6bff7a] transition duration-300"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                    {/* Starts With toggle */}
                                    <button
                                        onClick={() => setSearchMode(searchMode === 'startsWith' ? 'contains' : 'startsWith')}
                                        className={`w-8 h-8 p-0 flex items-center justify-center rounded transition-colors duration-150 ${searchMode === 'startsWith' ? 'bg-[#6bff7a20] text-[#6bff7a]' : 'text-[#4a5e56] hover:text-[#a4bbb0]'}`}
                                        title="Starts with"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 10H9M7 7L10 10L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <text x="15.5" y="14.5" textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="monospace" fontWeight="bold">A</text>
                                        </svg>
                                    </button>
                                    {/* Exact Match toggle */}
                                    <button
                                        onClick={() => setSearchMode(searchMode === 'exact' ? 'contains' : 'exact')}
                                        className={`w-8 h-8 p-0 flex items-center justify-center rounded transition-colors duration-150 ${searchMode === 'exact' ? 'bg-[#6bff7a20] text-[#6bff7a]' : 'text-[#4a5e56] hover:text-[#a4bbb0]'}`}
                                        title="Exact match"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2 16H18M2 16V12.5M18 16V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <text x="10" y="14.5" textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="monospace" fontWeight="bold">ab</text>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content: Items Grid */}
                        <div className="max-w-7xl mx-auto flex flex-col gap-4">
                            <div className="flex-1 overflow-y-visible">
                                <div className="grid grid-cols-3 gap-3 pb-10">
                                    {filteredItems.map((item) => (
                                        <ItemCardAll
                                            key={item.name}
                                            item={item}
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setIsPanelOpen(true);
                                            }}
                                            selected={selectedItem?.name === item.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Docked Pull Tab (SidePanel) */}
                        {isPanelOpen && (
                            <div
                                className="fixed inset-0 bg-black/60 z-40 transition-opacity"
                                onClick={() => setIsPanelOpen(false)}
                                onTouchStart={() => setIsPanelOpen(false)}
                                onTouchMove={() => setIsPanelOpen(false)}
                            />
                        )}
                        <div
                            className={`fixed bottom-0 left-0 right-0 bg-[#0c1411] rounded-t-[32px] z-50 transition-transform duration-300 ease-out shadow-[0_-15px_40px_rgba(0,0,0,0.7)] ${isPanelOpen ? 'translate-y-0' : 'translate-y-[calc(100%-44px)]'}`}
                        >
                            {/* Pull Handle Area */}
                            <div
                                className="w-full h-11 flex items-center justify-center cursor-pointer"
                                onClick={() => setIsPanelOpen(!isPanelOpen)}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <svg
                                    className={`w-10 h-7 text-[#6bff7a] transition-transform duration-300 ${isPanelOpen ? 'rotate-180 translate-y-1' : '-translate-y-1'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                            </div>

                            {/* SidePanel Content */}
                            <div className="w-full h-[600px] px-2 pb-3 overflow-y-auto">
                                <SidePanel
                                    item={selectedItem}
                                    prefetchItemIds={filteredItems
                                        .filter(i => i.id !== selectedItem?.id)
                                        .slice(0, 6)
                                        .map(i => i.id)}
                                />
                            </div>
                        </div>
                    </div>


                )}
            </div>


        </div>
    );
};

export default AllItemsOverviewMobile;
