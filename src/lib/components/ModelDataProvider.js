import React, {createContext, useContext} from 'react';
import {useDataFetch} from '../utils/dataFetch.js';

const Context = createContext()

/**
 * A React component which fetches and parses forecast-model JSONs
 * and exposes them via React context. This data can be accessed by
 * using the `useModelData` hook. All display content which wants to
 * use this data (e.g. panels) should be children of this component.
 * @kind React Component
 * @category Components
 * @memberof module:@nextstrain/forecasts-viz
 * @example
 * <ModelDataProvider ...>
 *   <PanelDisplay.../>
 * </ModelDataProvider
 */
export const ModelDataProvider = ({
  children
}) => {
  const value = useDataFetch()
  return <Context.Provider value={value}>{children}</Context.Provider>
}


/**
 * Accesses data provided by `<ModelDataProvider>`
 * @returns {ContextData} The data provided by `<ModelDataProvider>`
 * @kind React Hook
 * @category Hooks
 * @memberof module:@nextstrain/forecasts-viz
 * @throws Error
 * @example
 * const MyReactComponent = ({}) => {
 *   const {modelData, status, error} = useModelData();
 *   ...
 * }
 */
export const useModelData = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useModelData must be used within a ModelDataProvider')
  }
  return context
}
