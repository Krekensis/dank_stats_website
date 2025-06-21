import React, { useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import ItemCard from '../components/itemcard2';
import SidePanel from '../components/sidepanel';
import Loader from '../components/loader';
import { useMongoData } from '../hooks/useMongoData';

const AllItemsOverview = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [datasetSpan, setDatasetSpan] = useState({ oldest: null, latest: null });
    const { data: itemData, loading } = useMongoData();

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

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!selectedItem && filteredItems.length > 0) {
            setSelectedItem(filteredItems[0]);
        }
    }, [filteredItems]);

    return (
        <div className="min-h-screen bg-[#070e0c] text-white flex">
            <div className="flex-1 p-6">
                <Navbar />

                {loading ? (
                    <div className="items-center justify-center flex h-screen">
                        <Loader size={200} />
                    </div>
                ) : (
                    <div className="mt-20">
                        {/* Search Bar */}
                        <div className="max-w-7xl mx-auto mb-6">
                            <input
                                type="text"
                                placeholder="Search for an item..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-3 bg-[#111816] text-[#a4bbb0] placeholder-[#a4bbb0] placeholder-opacity-100 rounded-md font-mono text-left cursor-pointer outline-0 border-2 border-transparent hover:border-[#6bff7a] focus:border-[#6bff7a] transition duration-300"
                            />
                        </div>

                        {/* Main Content: Grid + Side Panel */}
                        <div className="max-w-7xl mx-auto flex gap-[6px]">
                            {/* Left Column: Scrollable Items Grid */}
                            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-160px)] pr-[6px]">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                                    {filteredItems.map((item) => (
                                        <ItemCard
                                            key={item.name}
                                            item={item}
                                            onClick={() => setSelectedItem(item)}
                                            selected={selectedItem?.name === item.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Always-visible Side Panel */}
                            <SidePanel item={selectedItem} />
                        </div>
                    </div>


                )}
            </div>


        </div>
    );
};

export default AllItemsOverview;
