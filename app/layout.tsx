import { Metadata } from 'next';
import './globals.css';
// Note: Header is intentionally not imported here. Previously the global
// layout rendered a shared header (navigation bar) across all pages, which
// caused the navbar and logout button to appear on every route including
// dynamic redirect pages like `/[id]`. To restrict the navbar to only
// certain pages (home, login and register), individual pages now import
// and render the `Header` component themselves. Removing the import here
// prevents the header from being rendered automatically on every page.

export const metadata: Metadata = {
 
  title: "",
  description:
    "",
  openGraph: {
    title: "",
    description:
      "",
    url: "/",
    siteName: "",
    type: "website",
    images: [
      {
        url: "", // file in /public
      
      },
    ],
    locale: "en_US",
  },
 
};

/**
 * Root layout component. This wraps every page in a minimal
 * container and includes the global styles imported above. You
 * can further customise the layout by adding headers, footers or
 * navigation elements here.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
       className="min-h-screen relative bg-[#f2f8fc]">
        {/*
          The container centres the content and constrains its maximum width
          for a comfortable reading experience. Adjust the padding to suit.
        */}
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          {/*
            The root layout now only wraps the page content in a container.
            Any headers or navigation elements should be included directly
            within the pages that need them. This ensures that redirect
            pages and other minimal pages remain uncluttered.
          */}
          {children}
        </div>
      </body>
    </html>
  );
}