import React from 'react';
import PetSidePanelDesktop from './pet-sidepanel-desktop';
import PetSidePanelMobile from './pet-sidepanel-mobile';
import useIsMobile from '../hooks/useIsMobile';

const PetSidePanel = ({ item, prefetchItemIds = [] }) => {
    const isMobile = useIsMobile();
    return isMobile ? (
        <PetSidePanelMobile item={item} prefetchItemIds={prefetchItemIds} />
    ) : (
        <PetSidePanelDesktop item={item} prefetchItemIds={prefetchItemIds} />
    );
};

export default PetSidePanel;
