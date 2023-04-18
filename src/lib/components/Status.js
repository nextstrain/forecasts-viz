import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin-top: 100px;
  margin-bottom: 100px;
  font-size: 20px;
`;

const ErrorMessage = styled.div`
  color: red;
`;

/**
 * A component to display the status of the model data fetching
 * @kind React Component
 * @private 
 */
export const Status = ({children, err}) => {
  if (err) console.error(err);
  return (
    <Container>
      {children}
      {err && <>
        <p>The following error message was reported:</p>
        <ErrorMessage>{String(err)}</ErrorMessage>
      </>}
    </Container>
  )
}
