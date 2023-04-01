import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import server from '../configs/server';
import API from '../configs/API';
import { ValidationError } from 'yup';

interface REST {
  [key: string]: 'get' | 'post' | 'put' | 'delete';
}

export const REST: REST = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
};

export interface ResponseUsable {
  status: number;
  data: any;
}

export const getResponseUsable = (response: AxiosResponse): ResponseUsable => {
  return {
    status: response.status ? response.status : 500,
    data: response.data ? response.data : null,
  };
};

// interface YupErrorMessage {
//   path: string;
//   message: string;
//   inner: any[];
// }

type YupErrorMessage = Record<string, string>;

export const getYupErrorMessages = ({ path, message, inner }: ValidationError): YupErrorMessage => {
  if (inner && inner.length) {
    return inner.reduce((acc: YupErrorMessage, { path, message }) => {
      if (path) acc[path] = message;
      return acc;
    }, {});
  }
  if (path) {
    return { [path]: message };
  }
  return {};
};

export const getErrorMessage = (responseData: any) => {
  return responseData.message && responseData.message !== 'INTERNAL_ERROR'
    ? responseData.message
    : 'An unknwon Error occured. Please try it later.';
};

export const refresh = (
  method: 'get' | 'post' | 'put' | 'delete',
  address: string,
  config: { data?: any; header?: AxiosRequestConfig['headers'] }
) => {
  const fetchData = async (bypass: boolean = false): Promise<any> => {
    const storedToken = window.localStorage.getItem('accessToken');
    const refreshToken = window.localStorage.getItem('refreshToken');
    let res: AxiosResponse<any, any>;

    if (storedToken) {
      try {
        if (method === REST.GET || method === REST.DELETE) {
          res = await server[method](address, {
            ...config,
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
        } else if (method === REST.POST || method === REST.PUT) {
          const { data, header } = config;
          res = await server[method](
            address,
            { ...data },
            { headers: { Authorization: `Bearer ${storedToken}`, ...header } }
          );
        }

        return getResponseUsable(res!);
      } catch (err) {
        if (bypass) return { status: 400, data: { message: 'UNKNWON_ERROR' } };

        if (err instanceof AxiosError) {
          if (err.response?.data) {
            const { error_code, message } = err.response.data;
            if (err.response.status === 401 /* && message === '토큰이 만료되었습니다.'*/) {
              if (!refreshToken) return { status: 400, data: { message: 'TOKEN_NOT_FOUND' } };

              try {
                const refreshResult = await server.post(API.AUTH.refresh, { refresh_token: refreshToken });
                const newToken: string = refreshResult.data.access_token;
                window.localStorage.setItem('accessToken', newToken);
                return fetchData(true);
              } catch (finalError) {
                if (finalError instanceof AxiosError) {
                  return getResponseUsable(finalError.response!);
                }
              }
            } else {
              return getResponseUsable(err.response);
            }
          }
        }
      }
      // }
    } else if (refreshToken) {
      try {
        const refreshResult = await server.post(API.AUTH.refresh, { refresh_token: refreshToken });
        const newToken: string = refreshResult.data.access_token;
        window.localStorage.setItem('accessToken', newToken);
        return fetchData(true);
      } catch (finalError) {
        if (finalError instanceof AxiosError) {
          return getResponseUsable(finalError.response!);
        }
      }
    }

    return { status: 500, data: { message: 'INTERNAL_ERROR' } };
  };

  const result = fetchData();

  return result;
};

export const tryCatchResponse = (func: () => Promise<ResponseUsable>): Promise<ResponseUsable> => {
  try {
    return new Promise((resolve) => {
      resolve(func());
    });
  } catch (err) {
    if (err instanceof AxiosError) {
      const res = err.response!;
      return new Promise((resolve) => resolve(getResponseUsable(res)));
    }
  }
  return new Promise((resolve) => resolve({ status: 500, data: null }));
};

export const unescapeHTML = (escapedHTML: string) => {
  return String(escapedHTML)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
};

export const convertDateStringToOurs = (dateString: string) => {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const date = d.getDate();

  return { year, month, date };
};

interface CustomDate {
  month: number;
  date: number;
  year: number;
}

export const getDateStringFromOurs = (dateObject: CustomDate) => {
  const raw = dateObject;
  return `${raw.month} ${raw.date}, ${raw.year}`;
};

export const getRandomHexColor = () => {
  return `#${Math.round(Math.random() * 255).toString(16)}${Math.round(Math.random() * 255).toString(16)}${Math.round(
    Math.random() * 255
  ).toString(16)}`;
};
