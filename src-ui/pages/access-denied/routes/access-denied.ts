import { createElement } from 'react';
import { RouteObject } from 'react-router-dom';
import { pathKeys } from '../../../shared/lib/react-router';
import { AccessDenied } from '../ui/AccessDenied';

export const accessDeniedRoute: RouteObject = {
    path: pathKeys.accessDenied(),
    element: createElement(AccessDenied),
};