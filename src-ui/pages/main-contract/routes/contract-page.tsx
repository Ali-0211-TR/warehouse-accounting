import { lazy } from 'react';
import { pathKeys } from '../../../shared/lib/react-router';

const ContractPage = lazy(() =>
  import('../ui/ContractPage').then((m) => ({ default: m.ContractPage }))
);

export const contractPageRoute = {
    path: pathKeys.contracts(),
    element: <ContractPage />,
};
