import { lazy } from 'react';
import { pathKeys } from '../../../shared/lib/react-router';

const ProfilePage = lazy(() =>
  import('../ui/Profile').then((m) => ({ default: m.ProfilePage }))
);

export const profilePageRoute = {
    path: pathKeys.profile(),
    element: <ProfilePage />,
};
