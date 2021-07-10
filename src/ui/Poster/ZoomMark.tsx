import * as React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  border: 0.3mm solid rgba(255, 255, 255, 1);
  border-top: none;
  text-align: center;
  height: 4mm;
  position: relative;
  box-sizing: border-box;
  opacity: 0.8;
`;

const Text = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  line-height: 1.4em;
  font-size: ${5 * 0.8}mm;
  text-align: center;
`;

export interface ZoomMarkProps extends React.HTMLAttributes<HTMLDivElement> {
  zoomInMillimetersPerKilometer: number;
}

export const ZoomMark: React.VoidFunctionComponent<ZoomMarkProps> = ({
  zoomInMillimetersPerKilometer,
  style = {},
  ...rest
}) => {
  return (
    <Wrapper
      {...rest}
      style={{ ...style, width: `${zoomInMillimetersPerKilometer}mm` }}
    >
      <Text>1 километр</Text>
    </Wrapper>
  );
};
