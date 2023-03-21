import React from 'react';
import {PanelDisplay, useModelData} from "./lib/index.js"
import {PanelSectionHeaderContainer, PanelAbstract} from "./Styles.js";

export const Panels = () => {

  const {modelData} = useModelData();
  if (!modelData) {
    /* not loaded, or an error etc */
    return null;
  }
  
  return (
    <div id="mainPanelsContainer" >

      <PanelSectionHeaderContainer>
        {`Variant Frequencies`}
      </PanelSectionHeaderContainer>
      <PanelAbstract>
        {`Data comes from MLR model objects matching 'freq' + 'median'`}
      </PanelAbstract>

      <PanelDisplay graphType="frequency"/>

      <PanelSectionHeaderContainer>
        {`Growth Advantage`}
      </PanelSectionHeaderContainer>
      <PanelAbstract>
        {`Data comes from MLR model objects matching 'ga' + {'median', 'HDI_80_lower', 'HDI_80_upper'}`}
      </PanelAbstract>
      <PanelDisplay graphType="growthAdvantage"/>

      <PanelSectionHeaderContainer>
        {`Estimated Cases over time`}
      </PanelSectionHeaderContainer>
      <PanelAbstract>
        {`Data comes from Renewal model objects matching 'I_smooth' + 'median'`}
      </PanelAbstract>
      <PanelDisplay graphType="stackedIncidence"/>


      <PanelSectionHeaderContainer>
        {`Estimated effective reproduction number over time`}
      </PanelSectionHeaderContainer>
      <PanelAbstract>
        {`Data comes from renewal model objects matching 'R' + 'median'`}
      </PanelAbstract>
      <PanelDisplay graphType="r_t"/>

    </div>
  )
}
