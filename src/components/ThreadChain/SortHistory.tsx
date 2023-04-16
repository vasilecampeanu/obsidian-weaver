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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-sort-desc"><path d="M11 5h10"></path><path d="M11 9h7"></path><path d="M11 13h4"></path><path d="m3 17 3 3 3-3"></path><path d="M6 18V4"></path></svg>
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
