import { scaleLinear } from "@visx/scale";
import { ScaleLinear } from "d3-scale";
import _ from "lodash";
import * as React from "react";
import { useMeasure } from "react-use";
import styled from "styled-components";

import {
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureCollection,
} from "../../shared/output";
import { mapBuildingCompletionYearToColor } from "../shared/helpersForYears";
import { pointsInMm } from "../shared/printing";

const Wrapper = styled.div`
  height: 100mm;
  overflow: hidden;
`;

const barLabelOffset = 5 * pointsInMm;
const barWidth = 3 * pointsInMm;
const barMinHeight = 1 * pointsInMm;

const barTick = 200;
const barTickGap = 0.5 * pointsInMm;

const yAxisThickness = 1 * pointsInMm;
const yAxisOffsetLeft = 7 * pointsInMm;
const yAxisOpacity = 0.3;

const tickify = (value: number, tickSize: number): number[] => {
  const result: number[] = [];

  for (let n = 0; n < value; n += tickSize) {
    result.push(n);
  }
  result.push(value);

  return result;
};

const Bar: React.VoidFunctionComponent<{
  year: number;
  showLabel: boolean;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  buildings: MixedPropertyVariantsFeature[];
  labelPrefix?: string;
}> = ({ year, showLabel, xScale, yScale, buildings, labelPrefix }) => {
  const color = mapBuildingCompletionYearToColor(year);

  const total = buildings.length;
  const tickifiedValues = tickify(total, barTick);

  return (
    <g key={year} transform={`translate(${xScale(year)},0)`}>
      {tickifiedValues.map((tickifiedValue, index) => {
        if (index === 0 && total !== 0) {
          return null;
        }

        const prevTickifiedValue = tickifiedValues[index - 1] ?? 0;

        const rawHeight = yScale(prevTickifiedValue) - yScale(tickifiedValue);
        const height = Math.max(
          rawHeight - (index > 0 ? barTickGap : 0),
          barMinHeight,
        );

        if (height < barMinHeight) {
          return null;
        }

        return (
          <rect
            key={index}
            x={-barWidth / 2}
            width={barWidth}
            y={yScale(prevTickifiedValue) - height}
            height={height}
            opacity={buildings.length === 0 ? 0.2 : 1}
            fill={color}
            rx=".3mm"
          />
        );
      })}
      {showLabel ? (
        <g x={0} transform={`translate(0,${yScale(0) + barLabelOffset})`}>
          <text
            fontSize="5mm"
            fill={color}
            transform="rotate(-90,0,0)"
            textAnchor="end"
            alignmentBaseline="central"
          >
            {labelPrefix ?? ""}
            {year}
          </text>
        </g>
      ) : null}
    </g>
  );
};

export interface AgeHistogramProps extends React.DOMAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  buildingCollection: MixedPropertyVariantsFeatureCollection;
}

export const AgeHistogram: React.VoidFunctionComponent<AgeHistogramProps> = ({
  buildingCollection,
  ...rest
}) => {
  const [ref, { width, height }] = useMeasure<HTMLDivElement>();

  const paddingLeft = 5 * pointsInMm;
  const paddingRight = 30 * pointsInMm;
  const paddingTop = 2 * pointsInMm;
  const paddingBottom = 30 * pointsInMm;

  const minYear = 1850;
  const maxYear = 2020;

  const buildingsByYear: Record<
    string,
    MixedPropertyVariantsFeature[] | undefined
  > = React.useMemo(
    () =>
      _.groupBy(buildingCollection.features, (buildingFeature) => {
        const { completionYear } = buildingFeature.properties;
        if (!completionYear) {
          return "";
        }
        if (completionYear < minYear) {
          return minYear;
        }
        if (completionYear > maxYear) {
          return maxYear;
        }

        return completionYear;
      }),
    [buildingCollection.features],
  );

  const maxBuildingsPerYear =
    _.max(
      Object.entries(buildingsByYear).map(([year, buildings]) =>
        year && buildings?.length ? buildings.length : 0,
      ),
    ) ?? 0;

  const maxY = Math.ceil(maxBuildingsPerYear / barTick) * barTick;

  const xScale = scaleLinear({
    domain: [minYear, maxYear],
    range: [paddingLeft, width - paddingRight],
  });

  const yScale = scaleLinear({
    domain: [0, maxY],
    range: [height - paddingBottom, paddingTop],
  });

  const yAxisTicks = tickify(maxY, barTick);

  return (
    <Wrapper {...rest} ref={ref}>
      {!height || !width ? null : (
        <svg width={width} height={height}>
          {_.range(minYear, maxYear + 1).map((year, index) => (
            <Bar
              key={year}
              year={year}
              showLabel={index === 0 || Math.round(year / 10) === year / 10}
              labelPrefix={index === 0 ? "..." : undefined}
              buildings={buildingsByYear[year] ?? []}
              xScale={xScale}
              yScale={yScale}
            />
          ))}
          <g
            opacity={yAxisOpacity}
            transform={`translate(${width - paddingRight + yAxisOffsetLeft},0)`}
          >
            {yAxisTicks.map((value, index) => {
              if (index === 0) {
                return null;
              }

              return (
                <g key={index}>
                  <rect
                    fill="#fff"
                    y={yScale(value) + barTickGap}
                    width={yAxisThickness}
                    height={
                      yScale(value - barTick) - yScale(value) - barTickGap
                    }
                    rx=".3mm"
                  />
                  <text
                    fill="#fff"
                    fontSize="5mm"
                    y={yScale(value) + barTickGap}
                    width={yAxisThickness}
                    textAnchor="end"
                    alignmentBaseline="text-before-edge"
                    transform={`translate(${14 * pointsInMm},${
                      -1.5 * pointsInMm
                    })`}
                    rx=".3mm"
                  >
                    {value}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </Wrapper>
  );
};
