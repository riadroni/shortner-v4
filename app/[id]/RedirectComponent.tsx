"use client";

import { useEffect } from "react";

interface Props {
  image: string;
  urlMobile: string;
  urlDesktop?: string;
}

/**
 * Client component that shows a loading image and redirects the visitor
 * after a short delay. The destination is determined by inspecting the
 * browser's user agent to differentiate between mobile and desktop devices.
 */
export default function RedirectComponent({ image, urlMobile, urlDesktop }: Props) {
  useEffect(() => {
    // Basic mobile detection using user agent strings. You may refine this as needed.
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    // Use desktop URL if available and the device is not mobile; otherwise fallback to mobile
    const target = isMobile ? urlMobile : urlDesktop || urlMobile;
    const timer = setTimeout(() => {
      window.location.href = target;
    }, 2000); // redirect after 2 seconds
    return () => clearTimeout(timer);
  }, [urlMobile, urlDesktop]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen lg:p-8 space-y-4">
      <img
        src={image}
        alt="Loading"
        className="lg:max-w-[800px] lg:aspect-[4:3] w-full mx-auto"
      />
    
    </div>
  );
}