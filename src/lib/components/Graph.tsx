import React, { useRef, useMemo } from 'react';
import { useGraph } from "../utils/useGraph";
import { useControlsContext } from "../hooks/ControlsContext";
import { ModelData } from "../utils/modelData.types.ts";
import type { GraphParams, GraphParamsWithLocation } from "../utils/graphParams.ts";

interface GraphProps {
  modelData: ModelData;
  sizes: any; // todo
  location: string;
  params: GraphParams
}

export const Graph = ({ modelData, sizes, location, params }: GraphProps) => {
  const d3Container = useRef(null);
  const controls = useControlsContext();

  const paramsWithLocation: GraphParamsWithLocation = useMemo(
    () => ({...params, location}),
    [location]
  );
  
  const emptyGraph = useGraph(d3Container, sizes, modelData, paramsWithLocation, controls);  
  
  if (emptyGraph) return null;

  return (
    <div ref={d3Container}/>
  )
}

