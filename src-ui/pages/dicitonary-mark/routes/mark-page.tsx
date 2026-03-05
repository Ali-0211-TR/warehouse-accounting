import { lazy } from 'react';
import { pathKeys } from '../../../shared/lib/react-router';

const MarkPage = lazy(() =>
  import('@/pages/dictionary-mark').then((m) => ({ default: m.MarkPage }))
);

export const markPageRoute = {
    path: pathKeys.marks(),
    element: <MarkPage />,
};
