import { lazy } from 'react';
import { pathKeys } from '../../../shared/lib/react-router';

const UnitPage = lazy(() =>
  import('../ui/UnitPage').then((m) => ({ default: m.UnitPage }))
);

export const unitPageRoute = {
    path: pathKeys.units(),
    element: <UnitPage />,
};
