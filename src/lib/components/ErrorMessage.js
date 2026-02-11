import React from 'react';

/**
 * A component to display an error (if set).
 * If no error is provided this component returns null;
 * @property {(Error|undefined)} error
 * @kind React Component
 * @private 
 */
export const ErrorMessage = ({error}) => {
  if (!error) return null;
  return (
    <div className='errorMessage'>
      {String(error)}
    </div>
  )
}
