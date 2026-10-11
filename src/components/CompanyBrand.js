import React from 'react';
import useCompanyName from '../hooks/useCompanyName';
import useCompanyLogo from '../hooks/useCompanyLogo';

// Company logo + name shown at the left of the dashboard headers. Falls back to the company's
// first letter when no logo has been uploaded, and to `fallbackTitle` when the company is unknown.
export default function CompanyBrand({ fallbackTitle }) {
  const companyName = useCompanyName();
  const logoUrl = useCompanyLogo();
  const label = companyName || fallbackTitle;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-8 w-auto max-w-[96px] shrink-0 object-contain" />
      ) : (
        companyName && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
            {companyName.charAt(0).toUpperCase()}
          </span>
        )
      )}
      <h1
        className="truncate bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text pb-0.5 text-base font-bold tracking-tight text-transparent sm:text-lg dark:from-blue-400 dark:to-violet-400"
        title={label}
      >
        {label}
      </h1>
    </div>
  );
}
