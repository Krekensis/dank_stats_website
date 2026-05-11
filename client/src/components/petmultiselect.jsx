import React from 'react';
import PetMultiSelectDesktop from './petmultiselect-desktop';
import PetMultiSelectMobile from './petmultiselect-mobile';
import useIsMobile from '../hooks/useIsMobile';

const PetMultiSelect = ({ items, selectedItems, setSelectedItems, maxSelected }) => {
    const isMobile = useIsMobile();
    return isMobile ? (
        <PetMultiSelectMobile items={items} selectedItems={selectedItems} setSelectedItems={setSelectedItems} maxSelected={maxSelected} />
    ) : (
        <PetMultiSelectDesktop items={items} selectedItems={selectedItems} setSelectedItems={setSelectedItems} maxSelected={maxSelected} />
    );
};

export default PetMultiSelect;