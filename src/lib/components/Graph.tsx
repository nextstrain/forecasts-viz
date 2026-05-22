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
  console.log("<Graph> rerunning", location, params.key)
  const d3Container = useRef(null);
  const controls = useControlsContext();

  const paramsWithLocation: GraphParamsWithLocation = useMemo(
    () => ({...params, location}),
    [location]
  );
  
  useGraph(d3Container, sizes, modelData, paramsWithLocation, controls);  
  
  return (
    <div ref={d3Container}/>
  )
}

