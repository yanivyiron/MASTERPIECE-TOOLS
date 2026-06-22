import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check, Search, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import { ALL_COUNTRIES } from '../data/countries';

// Searchable country selector — picks from admin-allowed list only.
const CountryCombobox = ({ value, onChange, placeholder, error }) => {
  const { t } = useLang();
  const { config } = useSiteConfig();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const allowed = useMemo(() => {
    if (!config.allowedCountries || config.allowedCountries.length === 0) return ALL_COUNTRIES;
    const set = new Set(config.allowedCountries);
    return ALL_COUNTRIES.filter((c) => set.has(c.code));
  }, [config.allowedCountries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allowed;
    return allowed.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [allowed, query]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const display = value || '';
  const phText = placeholder || t('rfq.countryPlaceholder');

  return (
    <div ref={wrapperRef} className="relative" data-testid="country-combobox">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full bg-neutral-950 border ${error ? 'border-red-500/60' : 'border-neutral-800'} text-white h-11 px-3 pr-10 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors`}
        data-testid="country-combobox-trigger"
      >
        <span className={display ? 'text-white' : 'text-neutral-500'}>{display || phText}</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {display && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="text-neutral-500 hover:text-orange-500"
              data-testid="country-combobox-clear"
              aria-label="Clear country"
            >
              <X className="w-4 h-4" />
            </span>
          )}
          <ChevronsUpDown className="w-4 h-4 text-neutral-500" />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-neutral-950 border border-neutral-800 shadow-2xl" data-testid="country-combobox-popup">
          <div className="relative border-b border-neutral-800">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={phText}
              className="w-full bg-transparent text-white placeholder:text-neutral-500 pl-9 pr-3 h-10 outline-none text-sm"
              data-testid="country-combobox-search"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-neutral-500" data-testid="country-combobox-empty">{t('rfq.countryNoResults')}</li>
            ) : (
              filtered.map((c) => {
                const selected = c.name === value;
                return (
                  <li
                    key={c.code}
                    role="option"
                    aria-selected={selected}
                    onClick={() => { onChange(c.name); setOpen(false); setQuery(''); }}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-neutral-900 ${selected ? 'text-orange-500' : 'text-neutral-200'}`}
                    data-testid={`country-option-${c.code}`}
                  >
                    <span>{c.name}</span>
                    <span className="text-neutral-600 text-xs">{c.code}{selected && <Check className="inline-block w-3.5 h-3.5 ml-2 text-orange-500" />}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountryCombobox;
