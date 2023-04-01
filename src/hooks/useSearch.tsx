import React from 'react';
import API from '../configs/API';
import server from '../configs/server';
import { getResponseUsable, refresh, REST, tryCatchResponse } from '../utils';

const useScan = () => {
  const search = async (url: string) => {
    return await tryCatchResponse(async () => {
      const res = await refresh(REST.POST, API.scan, { data: { href: url } });
      return getResponseUsable(res);
    });
  };

  return { search };
};

export default useScan;
