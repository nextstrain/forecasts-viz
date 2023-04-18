import Switch from 'rc-switch';
import styled from 'styled-components';
import { WINDOW_WIDTH_FOR_SIDEBAR_LEGEND, LEGEND_MIN_WIDTH} from "./Legend";
import "../styles/rc-switch.css";

const Container = styled.div`
  display: flex;
  justify-content: flex-end;
  @media screen and (min-width: ${WINDOW_WIDTH_FOR_SIDEBAR_LEGEND}px) {
    /* enough padding so that the toggle isn't over the legend */
    padding-right: ${LEGEND_MIN_WIDTH+20}px;
  }
  & > span {
    color: #aaa;
    padding-right: 5px;
  }
`;


export const Toggle = ({label, checked, onChange}) => (
  <Container>
    <span>{label}</span>
    <Switch
      className="switch"
      onChange={onChange}
      checked={checked}
    />
  </Container>
);