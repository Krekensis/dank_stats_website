import React from 'react';
import ItemValueVisualizerDesktop from './ItemValueVisualizerDesktop';
import ItemValueVisualizerMobile from './ItemValueVisualizerMobile';
import useIsMobile from '../hooks/useIsMobile';

const ItemValueVisualizer = () => {
    const isMobile = useIsMobile();
    return isMobile ? <ItemValueVisualizerMobile /> : <ItemValueVisualizerDesktop />;
};

export default ItemValueVisualizer;