import React, { useEffect, useState } from 'react';
import Navbar from '../../components/navbar';
import PetCardAll from '../../components/petcard-all';
import PetSidePanel from '../../components/pet-sidepanel';
import Loader from '../../components/loader';
import { useMongoPetData } from '../../hooks/useMongoPetData';

const AllPetsOverviewMobile = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState('contains');
    const [pets, setPets] = useState([]);
    const [selectedPet, setSelectedPet] = useState(null);
    const { data: petData, loading } = useMongoPetData();

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
                                    placeholder="Search for a pet..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-11 p-3 pr-20 bg-bg4 text-textMuted placeholder-textMuted placeholder-opacity-100 rounded-md font-mono text-left cursor-pointer outline-0 border-2 border-transparent hover:border-primary focus:border-primary transition duration-300"
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

                        {/* Main Content: Pets Grid */}
                        <div className="max-w-7xl mx-auto flex flex-col gap-4">
                            <div className="flex-1 overflow-y-visible">
                                <div className="grid grid-cols-3 gap-3 pb-10">
                                    {filteredPets.map((pet) => (
                                        <PetCardAll
                                            key={pet.name}
                                            item={pet}
                                            onClick={() => {
                                                setSelectedPet(pet);
                                                setIsPanelOpen(true);
                                            }}
                                            selected={selectedPet?.name === pet.name}
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
                            className={`fixed bottom-0 left-0 right-0 bg-bg2 rounded-t-[32px] z-50 transition-transform duration-300 ease-out shadow-[0_-15px_40px_rgba(0,0,0,0.7)] ${isPanelOpen ? 'translate-y-0' : 'translate-y-[calc(100%-44px)]'}`}
                        >
                            <div
                                className="w-full h-11 flex items-center justify-center cursor-pointer"
                                onClick={() => setIsPanelOpen(!isPanelOpen)}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <svg
                                    className={`w-10 h-7 text-primary transition-transform duration-300 ${isPanelOpen ? 'rotate-180 translate-y-1' : '-translate-y-1'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                            </div>

                            <div className="w-full h-[600px] px-2 pb-3 overflow-y-auto">
                                <PetSidePanel
                                    item={selectedPet}
                                    prefetchItemIds={filteredPets
                                        .filter(i => i.id !== selectedPet?.id)
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

export default AllPetsOverviewMobile;
