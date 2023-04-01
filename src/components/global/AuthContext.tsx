import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import useAuth from '../../hooks/useAuth';
import { ACCESS_DENY_ON_SIGNED_IN, ACCESS_DENY_ON_SIGNED_OUT } from '../../router/navigation';
import { authState } from '../../stores/auth/atom';

const AuthContext = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { me, logout } = useAuth();

  const [auth, setAuth] = useRecoilState(authState);

  useEffect(() => {
    // const onBeforeUnload = (e) => {
    //   e.preventDefault();
    //   e.returnValue = '';
    // };

    const storedToken = window.localStorage.getItem('accessToken');
    const hasLocationLastSlash = location.pathname[location.pathname.length - 1] === '/' && location.pathname !== '/';
    // console.log(location.pathname);
    // console.log(hasLocationLastSlash);

    if (hasLocationLastSlash) {
      navigate(location.pathname.slice(0, location.pathname.length - 1));
    } else {
      if (storedToken) {
        if (ACCESS_DENY_ON_SIGNED_IN.includes(location.pathname)) {
          navigate('/');
          // setExplored((state) => state + 1);
        }
      } else {
        if (ACCESS_DENY_ON_SIGNED_OUT.includes(location.pathname)) {
          navigate('/');
          // setExplored((state) => state + 1);
        }
      }
    }

    // if (location.pathname.indexOf('/articles/create') > -1) {
    //   window.addEventListener('beforeunload', onBeforeUnload);
    // }

    // return () => {
    //   window.removeEventListener('beforeunload', onBeforeUnload);
    // };
  }, [location]);

  useEffect(() => {
    const init = async () => {
      const res = await me(true);

      // console.log(res);
      if (!res || res.status >= 400) {
        logout();
      }
    };

    init();
  }, [auth.isSignedIn]);

  return null;
};

export default AuthContext;
