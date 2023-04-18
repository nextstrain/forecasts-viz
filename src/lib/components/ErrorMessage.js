import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin-top: 100px;
  margin-bottom: 100px;
  font-size: 20px;
  color: red;
`;

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
    <Container>
      {String(error)}
    </Container>
  )
}
