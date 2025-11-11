"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * A simple header component that displays the current username (if
 * available) and provides a logout button. When the logout button is
 * clicked the component calls the `/api/logout` endpoint and then
 * redirects the user to the login page.
 */
export default function Header({ initialUsername }: { initialUsername?: string }) {
  const router = useRouter();
  // Initialise the username from a prop if provided. This allows
  // server components (like the home page) to pass the username
  // directly, avoiding a flash of unauthenticated state before
  // client-side cookie parsing completes. If no prop is provided
  // the username state starts empty and will be filled by parsing
  // document.cookie.
  const [username, setUsername] = useState<string>(initialUsername ?? '');

  // Parse the username from document.cookie on the client if it was
  // not already provided. The cookie string looks like
  // "username=usera; other=value".
  useEffect(() => {
    // Only parse cookies if we don't already have a username. This
    // avoids overwriting the initialUsername passed from the server.
    if (!username && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)username=([^;]+)/);
      if (match) {
        setUsername(decodeURIComponent(match[1]));
      }
    }
  }, [username]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    } finally {
      router.push('/login');
    }
  };

  return (
    <header
      className="mb-8 flex items-center justify-between rounded-lg shadow-md p-4 bg-gradient-to-l from-blue-600 via-purple-600 to-pink-600 text-white animate-fade-in"
    >
      <div className="flex flex-col lg:flex-row items-center space-x-2 text-xl md:text-2xl tracking-tight font-bold ">
        {/* App logo icon (simple link icon) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 015.657 0l1.414 1.415a4 4 0 010 5.657l-3.182 3.182a4 4 0 01-5.657 0l-.708-.708"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.172 13.828a4 4 0 01-5.657 0l-1.415-1.415a4 4 0 010-5.657l3.182-3.182a4 4 0 015.657 0l.708.708"
          />
        </svg>
        <span>Nobita Shortener</span>
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center items-end gap-4">
        {username && (
          <span className="flex items-center text-sm md:text-base font-medium">
            {/* User icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A9 9 0 0112 15a9 9 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {username}
          </span>
        )}
        {username && (
          <button
            onClick={handleLogout}
            className="flex items-center bg-white/20 hover:bg-red-600 text-white px-3 py-1 md:px-4 md:py-2 rounded transition-colors duration-300"
          >
            {/* Sign-out icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0V7a3 3 0 016 0v1"
              />
            </svg>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}