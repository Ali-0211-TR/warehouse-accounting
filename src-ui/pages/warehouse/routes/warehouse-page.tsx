import { lazy } from 'react';
import { redirect, RouteObject } from 'react-router-dom';
import { pathKeys } from '../../../shared/lib/react-router';
import { useUserStore } from '../../../entities/user';

const WarehousePage = lazy(() =>
  import('../ui/WarehousePage').then((m) => ({ default: m.WarehousePage }))
);

export const warehousePageRoute: RouteObject = {
    path: pathKeys.warehouse(),
    element: <WarehousePage />,
    loader: async (args) => {
        if (useUserStore.getState().currentUser == null) {
            return redirect(pathKeys.login())
        }
        return args;
    },
};
