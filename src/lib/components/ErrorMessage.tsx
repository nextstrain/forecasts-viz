import React from 'react';

interface ErrorMessageProps {
  error?: Error;
}

export const ErrorMessage = ({error}: ErrorMessageProps) => {
  if (!error) return null;
  return (
    <div className='errorMessage'>
      {String(error)}
    </div>
  )
}
