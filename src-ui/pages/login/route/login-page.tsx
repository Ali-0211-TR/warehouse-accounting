import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { pathKeys } from "../../../shared/lib/react-router";

const LoginPage = lazy(() => import('../ui/LoginPage'));

export const loginPageRoute: RouteObject = {
    path: pathKeys.login(),
    element: <LoginPage />,
};
