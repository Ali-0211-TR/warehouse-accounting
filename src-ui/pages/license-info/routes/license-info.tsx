import { lazy } from 'react';

const LicenseInfoPage = lazy(() =>
  import('../ui/LicenseInfo').then((m) => ({ default: m.LicenseInfoPage }))
);

export const licenseInfoPageRoute = {
  path: "/license-info/",
  element: <LicenseInfoPage />,
};
