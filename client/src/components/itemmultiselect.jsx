import React from 'react';
import ItemMultiSelectDesktop from './itemmultiselect-desktop';
import ItemMultiSelectMobile from './itemmultiselect-mobile';
import useIsMobile from '../hooks/useIsMobile';

const ItemMultiSelect = ({ items, selectedItems, setSelectedItems, maxSelected }) => {
    const isMobile = useIsMobile();
    return isMobile ? (
        <ItemMultiSelectMobile items={items} selectedItems={selectedItems} setSelectedItems={setSelectedItems} maxSelected={maxSelected} />
    ) : (
        <ItemMultiSelectDesktop items={items} selectedItems={selectedItems} setSelectedItems={setSelectedItems} maxSelected={maxSelected} />
    );
};

export default ItemMultiSelect;