import React from 'react';
import Login from '../pages/login';

export const ACCESS_DENY_ON_SIGNED_IN = ['/login', , '/register'];
export const ACCESS_DENY_ON_SIGNED_OUT = ['/articles/create', '/users/me'];

export interface Navigation {
  path: string;
  element: JSX.Element;
}

const navigation: Navigation[] = [
  {
    path: '/login',
    element: <Login />,
  },
];

export default navigation;
