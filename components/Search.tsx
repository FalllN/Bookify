'use client';

import React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SearchIcon } from 'lucide-react'

const Search = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const query = searchParams.get('query') || '';

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        const params = new URLSearchParams(searchParams);
        if (text) {
            params.set('query', text);
        } else {
            params.delete('query');
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="library-search-wrapper">
            <SearchIcon className="ml-4 size-5 text-[#3d485e]" />
            <input 
                type="text"
                defaultValue={query}
                onChange={handleSearch}
                placeholder="Search by title or author"
                className="library-search-input"
            />
        </div>
    )
}

export default Search
