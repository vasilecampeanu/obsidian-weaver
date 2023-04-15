import React from 'react';

interface SortHistoryProps {
    onSort: (sortOrder: 'asc' | 'desc') => void;
}

export const SortHistory: React.FC<SortHistoryProps> = ({ onSort }) => {
    const handleSort = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newSortOrder = event.target.value as 'asc' | 'desc';
        onSort(newSortOrder);
    };

    return (
        <div className="sort-history">
            <label htmlFor="sort-history-select">Sort by: </label>
            <select
                id="sort-history-select"
                onChange={handleSort}
                defaultValue="asc"
            >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
            </select>
        </div>
    );
};
