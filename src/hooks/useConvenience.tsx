import React from 'react';
import { toast } from 'react-hot-toast';
import { getErrorMessage, ResponseUsable } from '../utils';

const useConvenience = () => {
  const showToastError = (response: ResponseUsable, onSuccess?: () => void) => {
    if (response.status > 400) {
      toast.error(getErrorMessage(response));
    } else if (Math.floor(response.status / 100) === 2) {
      if (onSuccess) onSuccess();
    }
  };

  return { showToastError };
};

export default useConvenience;
