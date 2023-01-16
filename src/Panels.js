import React from 'react';
import styled from 'styled-components';
import {PanelDisplay} from "./lib/index.js"

/**
 * styles chosen to match nextstrain.org
 */
const MainTitle = styled.div`
  text-align: center;
  font-size: 38px;
  line-height: 32px;
  min-width: 240px;
  margin-top: 4px;
  margin-bottom: 20px;
`

/**
 * font weight + size chosen to match nextstrain.org
 */
const PanelSectionHeaderContainer = styled.div`
  margin-bottom: 15px;
  margin-top: 50px;
  margin-left: 10%;
  margin-right: 10%;
  font-size: 20px;
  font-weight: 500;
`;

const PanelAbstract = styled.div`
  margin-top: 0px;
  margin-bottom: 30px;
  margin-left: 10%;
  margin-right: 10%;
`;


export const Panels = ({modelData, sidebar}) => {

  return (
    <div id="mainPanelsContainer" >

      <MainTitle>
        Nextstrain SARS-CoV-2 Forecasts
      </MainTitle>

      <PanelAbstract>
        <>This page visualises the evolution and dynamics of SARS-CoV-2 evolution and dynamics using two models:</>
        <ul>
          <li>Multinomial Logistic Regression (MLR) estimates variant frequencies and growth advantages for variants against some baseline using sequence count data</li>
          <li>The variant renewal model estimates variant frequencies, variant-specific incidence, and growth advantages using a combination of case and sequence count data.</li>
        </ul>
        <>Each model uses sequence counts via GISAID and case counts from various sources, collated in our <a href="https://github.com/nextstrain/forecasts-ncov/tree/main/ingest">forecasts-ncov GitHub repo</a>.</>
        <>{` For more information on the models please see the `}<a href="https://www.github.com/blab/evofr">evofr GitHub repo</a> or the preprint <a href="https://bedford.io/papers/figgins-rt-from-frequency-dynamics/">"SARS-CoV-2 variant dynamics across US states show consistent differences in effective reproduction numbers"</a>.</>
        <br/><br/>
        <>Currently we use <a href='https://nextstrain.org/blog/2022-04-29-SARS-CoV-2-clade-naming-2022'>Nextstrain clades</a> to partition the sequences into variants.</>
      </PanelAbstract>

      <PanelSectionHeaderContainer>
        {`Estimated Variant Frequencies over time`}
      </PanelSectionHeaderContainer>
      <PanelAbstract>
        {`These estimates are derived from sequence count data using a multinomial logistic regression model.`}
      </PanelAbstract>

      <PanelDisplay modelData={modelData} graphType="freq"/>

      <PanelSectionHeaderContainer>
        {`Growth Advantage`}
      </PanelSectionHeaderContainer>
      <PanelAbstract>
        {`
          These plots show the estimated growth advantage for given variants relative to ${modelData.get("variantDisplayNames").get(modelData.get("pivot")) || "baseline"}.
          This is an estimate of how many more secondary infections this variant causes on average compared the baseline variant as estimated but the multinomial logistic regression model.
          Vertical bars show the 95% HPD.
        `}
      </PanelAbstract>
      <PanelDisplay modelData={modelData} graphType="ga"/>

      <PanelSectionHeaderContainer>
        {`Estimated Cases over time`}
      </PanelSectionHeaderContainer>
      <PanelAbstract>
        {`As estimated by the variant renewal model.
        These estimates are smoothed to deal with daily reporting noise and weekend effects present in case data.`}
      </PanelAbstract>
      <PanelDisplay modelData={modelData} graphType="stackedIncidence"/>


      <PanelSectionHeaderContainer>
        {`Estimated effective reproduction number over time`}
      </PanelSectionHeaderContainer>
      <PanelAbstract>
        {`This is an estimate of the average number of secondary infections expected to be caused by an individual infected with a given variant as estimated by the variant renewal model.
        In general, we expect the variant to be growing if this number is greater than 1.`}
      </PanelAbstract>
      <PanelDisplay modelData={modelData} graphType="r_t"/>


    </div>
  )
}
