import React from 'react';
import styled from 'styled-components';
import {useModelData} from "./ModelDataProvider";

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

/**
 * A React component which displays the status of the model data being
 * fetched and parsed by `ModelDataProvider`. Once the data has been
 * (successfully) parsed this component will return `null` and thus
 * not render any elements to screen. If you wish to have custom display
 * of progress then it's easy to write your own component which considers
 * the `status` and `error` properties of `useModelData()`
 * @kind React Component
 * @category Components
 * @memberof module:@nextstrain/evofr-viz
 * @example
 * <ModelDataProvider ...>
 *   <ModelDataStatus/>
 * </ModelDataProvider
 */
export const ModelDataStatus = () => {
  const {modelData, status, error} = useModelData();
  if (modelData) {
    return null;
  }
  return (
    <Status err={error}>{status}</Status>
  )
}