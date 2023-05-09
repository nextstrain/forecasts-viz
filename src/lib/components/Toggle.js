import React from 'react';
import Switch from 'rc-switch';
import styled from 'styled-components';
import "../styles/rc-switch.css";

/**
 * Intention is for the Toggle to sit above the graphs
 * @private
 */
const Container = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-right: ${(props) => props.sizes.legendRHS ?
    `${props.sizes.legendMinWidthRHS+30}px` :
    '0px'
  };

  & > span {
    color: #aaa;
    padding-right: 5px;
  }
`;



export const Toggle = ({label, checked, onChange, sizes}) => (
  <Container sizes={sizes}>
    <span>{label}</span>
    <Switch
      className="switch"
      onChange={onChange}
      checked={checked}
    />
  </Container>
);