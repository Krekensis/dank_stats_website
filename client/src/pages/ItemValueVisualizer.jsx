import React from 'react';
import ItemValueVisualizerDesktop from './desktop/ItemValueVisualizerDesktop';
import ItemValueVisualizerMobile from './mobile/ItemValueVisualizerMobile';
import useIsMobile from '../hooks/useIsMobile';

const ItemValueVisualizer = () => {
    const isMobile = useIsMobile();
    return isMobile ? <ItemValueVisualizerMobile /> : <ItemValueVisualizerDesktop />;
};

export default ItemValueVisualizer;