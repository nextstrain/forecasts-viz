/**
 * Copied, with modifications, from Auspice
 * https://github.com/nextstrain/auspice/blob/adc6df36c5c36e37fb504274657249a7a1fea0ac/src/components/framework/spinner.js
 */

import React from "react";
import nextstrainLogo from '../assets/nextstrain-logo-small.png';

/**
 * @private 
 */
const Spinner = () => {
  const style = {
    marginTop: "20px"
  };
  return (<img className={"spinner"} src={nextstrainLogo} alt="loading" style={style}/>);
};

export default Spinner;
