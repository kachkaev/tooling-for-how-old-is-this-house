import * as React from "react";
import styled from "styled-components";

export interface CropMarkProps {
  corner: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  printerBleedInMillimeters: number;
}

const lineThicknessInMm = 0.1;
const lineLengthInMm = 3;
const lineOffsetInMm = 3;
const lineColor = "rgba(255,255,255, 0.3)";

const Wrapper = styled.div`
  position: absolute;
  overflow: visible;
`;

const MarkLeft = styled.div`
  position: absolute;
  background: ${lineColor};
  height: ${lineThicknessInMm}mm;
  top: ${-lineThicknessInMm / 2}mm;
  right: ${lineOffsetInMm}mm;
  width: ${lineLengthInMm}mm;
`;

const MarkRight = styled(MarkLeft)`
  right: auto;
  left: ${lineOffsetInMm}mm;
`;

const MarkTop = styled.div`
  position: absolute;
  background: ${lineColor};
  width: ${lineThicknessInMm}mm;
  left: ${-lineThicknessInMm / 2}mm;
  bottom: ${lineOffsetInMm}mm;
  height: ${lineLengthInMm}mm;
`;

const MarkBottom = styled(MarkTop)`
  bottom: auto;
  top: ${lineOffsetInMm}mm;
`;

export const CropMark: React.VoidFunctionComponent<CropMarkProps> = ({
  corner,
  printerBleedInMillimeters,
}) => {
  const offset = `${printerBleedInMillimeters}mm`;

  return (
    <Wrapper
      id={`CropMark--${corner}`}
      style={{
        left:
          corner === "topLeft" || corner === "bottomLeft" ? offset : undefined,
        right:
          corner === "topRight" || corner === "bottomRight"
            ? offset
            : undefined,
        top: corner === "topLeft" || corner === "topRight" ? offset : undefined,
        bottom:
          corner === "bottomLeft" || corner === "bottomRight"
            ? offset
            : undefined,
      }}
    >
      {corner === "topLeft" || corner === "bottomLeft" ? (
        <MarkLeft />
      ) : (
        <MarkRight />
      )}
      {corner === "topLeft" || corner === "topRight" ? (
        <MarkTop />
      ) : (
        <MarkBottom />
      )}
    </Wrapper>
  );
};
