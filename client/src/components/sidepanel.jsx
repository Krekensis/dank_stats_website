import React from 'react';
import SidePanelDesktop from './sidepanel-desktop';
import SidePanelMobile from './sidepanel-mobile';
import useIsMobile from '../hooks/useIsMobile';

const SidePanel = ({ item, prefetchItemIds = [] }) => {
    const isMobile = useIsMobile();
    return isMobile ? (
        <SidePanelMobile item={item} prefetchItemIds={prefetchItemIds} />
    ) : (
        <SidePanelDesktop item={item} prefetchItemIds={prefetchItemIds} />
    );
};

export default SidePanel;
