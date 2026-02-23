import React from 'react';

interface FooterProps {
  developerLink?: string;
}

const Footer: React.FC<FooterProps> = ({ developerLink = "#" }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-6 py-4 text-center">
      {/* Buy Me A Coffee Button (Ko-fi) */}
      <div className="mb-4">
        <a
          href="https://ko-fi.com/geralt_of_rivia"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
            bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md
            hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          style={{ boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)' }}
        >
          <span>☕</span>
          <span>Buy me a coffee</span>
        </a>
      </div>

      {/* Classic Phrase */}
      <p className="text-sm text-[var(--text-secondary)] mb-2">
        From the love of{' '}
        <a
          href={developerLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--text-accent)] hover:underline"
        >
          Developer
        </a>
        {' '}and Technology
      </p>

      {/* Copyright */}
      <p className="text-xs text-[var(--text-secondary)] opacity-70">
        © {currentYear} Todo App. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;

