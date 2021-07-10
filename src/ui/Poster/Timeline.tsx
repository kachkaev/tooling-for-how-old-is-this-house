import { scaleLinear } from "@visx/scale";
import { ScaleLinear } from "d3-scale";
import _ from "lodash";
import * as React from "react";
import { useMeasure } from "react-use";
import styled from "styled-components";

import { mapCompletionYearToColor } from "../../shared/completionDates";
import {
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureCollection,
} from "../../shared/outputMixing";
import { pointsInMm } from "../shared/printing";

const Wrapper = styled.div`
  height: 100mm;
  overflow: hidden;
`;

const barLabelOffset = 5 * pointsInMm;
const barWidth = 1 * pointsInMm;
const barMinHeight = 1 * pointsInMm;

const barTick = 100;
const barTickLabelFrequency = 2;
const barTickGap = 0.5 * pointsInMm;

const yAxisThickness = 0.3 * pointsInMm;
const yAxisOffsetLeft = 10 * pointsInMm;
const yAxisOpacity = 1;

const paddingLeft = 3 * pointsInMm;
const paddingRight = 25 * pointsInMm;
const paddingTop = 1 * pointsInMm;
const paddingBottom = 28 * pointsInMm;

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
  label: string;
  labelOffsetX?: number;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  buildings: MixedPropertyVariantsFeature[];
}> = ({ year, label, labelOffsetX = 0, xScale, yScale, buildings }) => {
  const labelColor = mapCompletionYearToColor(year);
  const barColor = mapCompletionYearToColor(
    buildings.length > 0 ? year : undefined,
  );

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
            fill={barColor}
            rx=".5mm"
          />
        );
      })}
      {label ? (
        <g x={0} transform={`translate(0,${yScale(0) + barLabelOffset})`}>
          <text
            fill={labelColor}
            transform={`rotate(-90),translate(0,${
              barWidth / 2 + labelOffsetX
            })`}
            textAnchor="end"
            alignmentBaseline="middle"
          >
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  buildingCollection: MixedPropertyVariantsFeatureCollection;

  minYear: number;
  minYearLabelOffsetXInMillimeters: number;
  minYearLabel?: string;

  maxYear: number;
}

const Timeline: React.VoidFunctionComponent<TimelineProps> = ({
  buildingCollection,
  minYear,
  minYearLabelOffsetXInMillimeters,
  minYearLabel,
  maxYear,
  ...rest
}) => {
  const [ref, { width, height }] = useMeasure<HTMLDivElement>();

  const buildingsByYear: Record<
    string,
    MixedPropertyVariantsFeature[] | undefined
  > = React.useMemo(
    () =>
      _.groupBy(buildingCollection.features, (buildingFeature) => {
        const { derivedCompletionYear } = buildingFeature.properties;
        if (!derivedCompletionYear) {
          return "";
        }
        if (derivedCompletionYear < minYear) {
          return minYear;
        }
        if (derivedCompletionYear > maxYear) {
          return maxYear;
        }

        return derivedCompletionYear;
      }),
    [buildingCollection.features, maxYear, minYear],
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
              labelOffsetX={
                index === 0 && minYearLabel
                  ? minYearLabelOffsetXInMillimeters
                  : undefined
              }
              label={
                index === 0 && minYearLabel
                  ? minYearLabel
                  : Math.round(year / 10) === year / 10
                  ? `${year}`
                  : ""
              }
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
                  {(value / barTickLabelFrequency) % barTick ? null : (
                    <text
                      rx=".3mm"
                      fill="#fff"
                      y={yScale(value) + barTickGap}
                      width={yAxisThickness}
                      alignmentBaseline="text-before-edge"
                      textAnchor="start"
                      transform={`translate(${3 * pointsInMm},${
                        -0.5 * pointsInMm
                      })`}
                      // transform={`translate(${14 * pointsInMm},${
                      //   -0.5 * pointsInMm
                      // })`}
                      // textAnchor="end"
                    >
                      {value}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </Wrapper>
  );
};

const WrappedTimeline = React.memo(Timeline);
export { WrappedTimeline as Timeline };
