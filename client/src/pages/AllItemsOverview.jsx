import React from 'react';
import AllItemsOverviewDesktop from './desktop/AllItemsOverviewDesktop';
import AllItemsOverviewMobile from './mobile/AllItemsOverviewMobile';
import useIsMobile from '../hooks/useIsMobile';

const AllItemsOverview = () => {
    const isMobile = useIsMobile();
    return isMobile ? <AllItemsOverviewMobile /> : <AllItemsOverviewDesktop />;
};

export default AllItemsOverview;
