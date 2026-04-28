import React from 'react';
import ItemMarketVisualizerDesktop from './desktop/ItemMarketVisualizerDesktop';
import ItemMarketVisualizerMobile from './mobile/ItemMarketVisualizerMobile';
import useIsMobile from '../hooks/useIsMobile';

const ItemMarketVisualizer = () => {
    const isMobile = useIsMobile();
    return isMobile ? <ItemMarketVisualizerMobile /> : <ItemMarketVisualizerDesktop />;
};

export default ItemMarketVisualizer;