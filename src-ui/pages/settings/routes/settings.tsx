import { lazy } from 'react';
import { pathKeys } from '../../../shared/lib/react-router';

const SettingsPage = lazy(() =>
  import('../ui/Settings').then((m) => ({ default: m.SettingsPage }))
);

export const settingsPageRoute = {
    path: pathKeys.settings(),
    element: <SettingsPage />,
};
