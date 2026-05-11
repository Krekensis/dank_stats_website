import React from 'react';
import AllPetsOverviewDesktop from './desktop/AllPetsOverviewDesktop';
import AllPetsOverviewMobile from './mobile/AllPetsOverviewMobile';
import useIsMobile from '../hooks/useIsMobile';

const AllPetsOverview = () => {
    const isMobile = useIsMobile();
    return isMobile ? <AllPetsOverviewMobile /> : <AllPetsOverviewDesktop />;
};

export default AllPetsOverview;
