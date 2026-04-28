import React from 'react';
import AllItemsOverviewDesktop from './AllItemsOverviewDesktop';
import AllItemsOverviewMobile from './AllItemsOverviewMobile';
import useIsMobile from '../hooks/useIsMobile';

const AllItemsOverview = () => {
    const isMobile = useIsMobile();
    return isMobile ? <AllItemsOverviewMobile /> : <AllItemsOverviewDesktop />;
};

export default AllItemsOverview;
