import React from 'react';
import Switch from 'rc-switch';
import "../styles/rc-switch.css";

export const Toggle = ({label, checked, onChange, sizes}) => (
  <div className='toggle'>
    <span>{label}</span>
    <Switch
      onChange={onChange}
      checked={checked}
    />
  </div>
);