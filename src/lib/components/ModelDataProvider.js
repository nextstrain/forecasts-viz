import React, {createContext, useContext} from 'react';
import {useDataFetch} from '../utils/dataFetch.js';

const Context = createContext()

export const ModelDataProvider = ({
  children
}) => {
  const value = useDataFetch()
  console.log("value", value)
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useModelData = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useModelData must be used within a ModelDataProvider')
  }
  return context
}
