import React from 'react';
import styled from 'styled-components';
import {useModelData} from "./ModelDataProvider.js";

const Container = styled.div`
  margin-top: 100px;
  margin-bottom: 100px;
  font-size: 20px;
`;

const ErrorMessage = styled.div`
  color: red;
`;

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

export const ModelDataStatus = () => {
  const {modelData, status, error} = useModelData();
  if (modelData) {
    return null;
  }
  return (
    <Status err={error}>{status}</Status>
  )
}