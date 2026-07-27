import React, { useEffect, useState } from 'react';
import Navbar from '../../components/navbar';
import PetCardAll from '../../components/petcard-all';
import PetSidePanel from '../../components/pet-sidepanel';
import Loader from '../../components/loader';
import { useMongoPetData } from '../../hooks/useMongoPetData';

const AllPetsOverviewDesktop = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState('contains');
    const [pets, setPets] = useState([]);
    const [selectedPet, setSelectedPet] = useState(null);
    const { data: petData, loading } = useMongoPetData();

    useEffect(() => {
        if (loading || !petData) return;

        const filtered = petData
            .filter((pet) => pet.url)
            .sort((a, b) => a.name.localeCompare(b.name));

        setPets(filtered);
    }, [petData, loading]);

    const filteredPets = pets.filter((pet) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        const name = pet.name.toLowerCase();
        if (searchMode === 'exact') return name === query;
        if (searchMode === 'startsWith') return name.startsWith(query);
        return name.includes(query);
    });

    useEffect(() => {
        if (!selectedPet && filteredPets.length > 0) {
            setSelectedPet(filteredPets[0]);
        }
    }, [filteredPets]);

    return (
        <div className="min-h-screen bg-bg0 text-white flex">
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
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search for a pet..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full p-3 pr-20 bg-bg4 text-textMuted placeholder-textMuted placeholder-opacity-100 rounded-md font-mono text-left cursor-pointer outline-0 border-2 border-transparent hover:border-primary focus:border-primary transition duration-300"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                    <button
                                        onClick={() => setSearchMode(searchMode === 'startsWith' ? 'contains' : 'startsWith')}
                                        className={`w-8 h-8 p-0 flex items-center justify-center rounded transition-colors duration-150 ${searchMode === 'startsWith' ? 'bg-primary/20 text-primary' : 'text-border2 hover:text-textMuted'}`}
                                        title="Starts with"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 10H9M7 7L10 10L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <text x="15.5" y="14.5" textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="monospace" fontWeight="bold">A</text>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setSearchMode(searchMode === 'exact' ? 'contains' : 'exact')}
                                        className={`w-8 h-8 p-0 flex items-center justify-center rounded transition-colors duration-150 ${searchMode === 'exact' ? 'bg-primary/20 text-primary' : 'text-border2 hover:text-textMuted'}`}
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

                        {/* Main Content: Grid + Side Panel */}
                        <div className="max-w-7xl mx-auto flex gap-[6px]" style={{ height: 'calc(100vh - 160px - 50px)' }}>
                            <div className="flex-1 overflow-y-auto h-full pr-[6px]">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                                    {filteredPets.map((pet) => (
                                        <PetCardAll
                                            key={pet.name}
                                            item={pet}
                                            onClick={() => setSelectedPet(pet)}
                                            selected={selectedPet?.name === pet.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <PetSidePanel
                                item={selectedPet}
                                prefetchItemIds={filteredPets
                                    .filter(i => i.id !== selectedPet?.id)
                                    .slice(0, 6)
                                    .map(i => i.id)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllPetsOverviewDesktop;
