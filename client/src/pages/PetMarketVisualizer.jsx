import React from 'react';
import PetMarketVisualizerDesktop from './desktop/PetMarketVisualizerDesktop';
import PetMarketVisualizerMobile from './mobile/PetMarketVisualizerMobile';
import useIsMobile from '../hooks/useIsMobile';

const PetMarketVisualizer = () => {
    const isMobile = useIsMobile();
    return isMobile ? <PetMarketVisualizerMobile /> : <PetMarketVisualizerDesktop />;
};

export default PetMarketVisualizer;
