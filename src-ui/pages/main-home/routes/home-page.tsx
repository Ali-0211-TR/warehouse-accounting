import { lazy } from 'react';
import { redirect, RouteObject } from 'react-router-dom';
import { pathKeys } from '../../../shared/lib/react-router';
import { useUserStore } from '../../../entities/user';

const HomePage = lazy(() =>
  import('../ui/HomePage').then((m) => ({ default: m.HomePage }))
);

export const homePageRoute: RouteObject = {
    path: pathKeys.home(),
    element: <HomePage />,
    loader: async (args) => {
        if (useUserStore.getState().currentUser == null) {
            return redirect(pathKeys.login())
        }
        return args;
    },
};
