import React from 'react';
import ItemMarketVisualizerDesktop from './ItemMarketVisualizerDesktop';
import ItemMarketVisualizerMobile from './ItemMarketVisualizerMobile';
import useIsMobile from '../hooks/useIsMobile';

const ItemMarketVisualizer = () => {
    const isMobile = useIsMobile();
    return isMobile ? <ItemMarketVisualizerMobile /> : <ItemMarketVisualizerDesktop />;
};

export default ItemMarketVisualizer;