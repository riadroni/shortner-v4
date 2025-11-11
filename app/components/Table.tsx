"use client";

import { useEffect, useState } from 'react';
import AddUrlButton from './AddUrlButton';

interface LinkEntry {
  id: string;
  image: string;
  urlMobile: string;
  urlDesktop?: string;
}

interface TableProps {
  initialLinks: LinkEntry[];
}

/**
 * Client component that displays a list of existing shortened URLs in a
 * table. It also renders an AddUrlButton to open the modal for
 * creating new entries. When a new entry is created the table is
 * refreshed by fetching the data from the API again.
 */
export default function Table({ initialLinks }: TableProps) {
  const [links, setLinks] = useState<LinkEntry[]>(initialLinks);
  const [search, setSearch] = useState('');
  // Save the current origin so we can construct full short URLs. This is
  // initialised on mount only on the client side since `window` is not
  // available during SSR.
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Utility function to fetch all links from the API
  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/links');
      if (res.ok) {
        const data = await res.json();
        // data is an object keyed by id; convert to array
        const arr: LinkEntry[] = Object.values(data);
        setLinks(arr);
      } else if (res.status === 401) {
        // If the request is unauthorized, redirect to login. This
        // avoids silently failing when the session has expired.
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler passed down to AddUrlButton; when called, it refreshes the list
  const handleCreated = () => {
    fetchLinks();
  };

  // Filter the list based on the search term
  const filtered = links.filter((link) =>
    link.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-lg shadow-2xl border border-gray-200">
        {/* Header with Add URL button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tighter  text-gray-800 border-l-4 border-blue-600 pl-3">Your Links</h1>
          <AddUrlButton onCreated={handleCreated} />
        </div>
        {/* Search input */}
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search Image"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm"
          />
        </div>
        {/* Table */}
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Image Name</th>
               
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Mobile Url</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Desktop Url</th>
                 <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Short Url</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                    No entries found.
                  </td>
                </tr>
              ) : (
                filtered.map((link, idx) => (
                  <tr key={link.id} className="hover:bg-gray-50 odd:bg-gray-50 even:bg-white transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{idx + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{link.id}</td>
                    {/* Short URL column */}
                   
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700">
                      {/* The mobile URL may be long; wrap in an anchor for convenience */}
                      <a href={link.urlMobile} className="underline" target="_blank" rel="noreferrer">
                        {link.urlMobile}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700">
                      {link.urlDesktop ? (
                        <a href={link.urlDesktop} className="underline" target="_blank" rel="noreferrer">
                          {link.urlDesktop}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
 <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700">
                      <a
                        href={`/${link.id}`}
                        className="underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {origin ? `${origin}/${link.id}` : `/${link.id}`}
                      </a>
                    </td>

                    {/* Actions column */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">
                      <button
                        onClick={async () => {
                          const confirmed = window.confirm(`Delete entry ${link.id}?`);
                          if (!confirmed) return;
                          try {
                            const res = await fetch(`/api/delete/${link.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              // Optimistically update local state
                              setLinks((prev) => prev.filter((item) => item.id !== link.id));
                              // Then re-fetch to ensure consistency
                              await fetchLinks();
                            } else {
                              console.error('Failed to delete');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="underline hover:text-red-700 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}