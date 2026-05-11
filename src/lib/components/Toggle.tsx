import React from 'react';
import Switch from 'rc-switch';
import "../styles/rc-switch.css";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle = ({label, checked, onChange}: ToggleProps) => (
  <div className='toggle'>
    <span>{label}</span>
    <Switch
      onChange={onChange}
      checked={checked}
    />
  </div>
);