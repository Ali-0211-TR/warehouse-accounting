import { lazy } from 'react';

const TankMonitoringPage = lazy(() =>
  import('../ui/TankMonitoringPage').then((m) => ({ default: m.TankMonitoringPage }))
);

export const tankMonitoringPageRoute = {
    path: "/tank-monitoring/",
    element: <TankMonitoringPage />,
};
