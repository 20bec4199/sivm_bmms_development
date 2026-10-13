import * as React from 'react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4 mt-auto">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-lg font-medium">
          Building Management and Maintenance System (SIVM)
        </p>
        <p className="mt-2 text-sm text-gray-400">
          © {new Date().getFullYear()} SIVM Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
