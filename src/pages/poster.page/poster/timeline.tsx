import { LinearGradient } from "@visx/gradient";
import { ScaleLinear, scaleLinear } from "d3-scale";
import _ from "lodash";
import * as React from "react";
import { useMeasure } from "react-use";
import styled from "styled-components";

import {
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureCollection,
} from "../../../shared/stage-mixing";
import { pointsInMm } from "../../shared/printing";
import { MapCompletionYearToColor } from "./types";

const numberFormat = Intl.NumberFormat("ru");

const formatNumber = (number: number) => {
  return numberFormat.format(number).replace(/\u00A0/g, "\u202F");
};

const Wrapper = styled.div`
  height: 140mm;
  position: relative;

  svg {
    position: absolute;
  }
`;

const barLabelOffset = 4 * pointsInMm;
const barWidth = 1.5 * pointsInMm;
const barMinHeight = 0.5 * pointsInMm;

const barTick = 100;
const barTickLabelFrequency = 5;
const barTickGap = 0.5 * pointsInMm;

const yAxisThickness = 0.3 * pointsInMm;
const yAxisOffsetLeft = 6 * pointsInMm;
const yAxisOpacity = 0.8;

const paddingLeft = 3 * pointsInMm;
const paddingRight = 25 * pointsInMm;
const paddingTop = 1 * pointsInMm;
const paddingBottom = 28 * pointsInMm;

const tickify = (value: number, tickSize: number): number[] => {
  const result: number[] = [];

  for (let tick = 0; tick < value; tick += tickSize) {
    result.push(tick);
  }
  result.push(value);

  return result;
};

const Bar: React.VoidFunctionComponent<{
  abnormalYears: number[];
  abnormalYearBuildingCountCap: number;
  buildings: MixedPropertyVariantsFeature[];
  label: string;
  labelOffsetX?: number | undefined;
  mapCompletionYearToColor: MapCompletionYearToColor;
  xScale: ScaleLinear<number, number>;
  year: number;
  yScale: ScaleLinear<number, number>;
}> = ({
  abnormalYears,
  abnormalYearBuildingCountCap,
  buildings,
  label,
  labelOffsetX = 0,
  mapCompletionYearToColor,
  xScale,
  year,
  yScale,
}) => {
  const labelColor = mapCompletionYearToColor(year);
  const barColor = mapCompletionYearToColor(
    buildings.length > 0 ? year : undefined,
  );

  const yearIsAbnormal = abnormalYears.includes(year);
  const total =
    yearIsAbnormal && abnormalYearBuildingCountCap > 0
      ? Math.min(buildings.length, abnormalYearBuildingCountCap)
      : buildings.length;
  const tickifiedValues = tickify(total, barTick);

  return (
    <g key={year} transform={`translate(${xScale(year)},0)`}>
      {tickifiedValues.map((tickifiedValue, index) => {
        if (index === 0 && total !== 0) {
          return;
        }

        const gradientId = yearIsAbnormal ? `g-${year}-${index}` : undefined;
        const prevTickifiedValue = tickifiedValues[index - 1] ?? 0;

        const rawHeight = yScale(prevTickifiedValue) - yScale(tickifiedValue);
        const height = Math.max(
          rawHeight - (index > 0 ? barTickGap : 0),
          barMinHeight,
        );

        if (height < barMinHeight) {
          return;
        }

        return (
          <React.Fragment key={index}>
            {gradientId ? (
              <LinearGradient
                id={gradientId}
                from={barColor}
                fromOpacity={1 - tickifiedValue / total}
                to={barColor}
                toOpacity={1 - prevTickifiedValue / total}
              />
            ) : undefined}
            <rect
              x={-barWidth / 2}
              width={barWidth}
              y={yScale(prevTickifiedValue) - height}
              height={height}
              fill={gradientId ? `url('#${gradientId}')` : barColor}
            />
          </React.Fragment>
        );
      })}
      {label ? (
        <g x={0} transform={`translate(0,${yScale(0) + barLabelOffset})`}>
          <text
            fill={labelColor}
            transform={`rotate(-90),translate(0,${
              barWidth / 2 + labelOffsetX - 0.5
            })`}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {label}
          </text>
        </g>
      ) : undefined}
    </g>
  );
};

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: never;
  buildingCollection: MixedPropertyVariantsFeatureCollection;
  mapCompletionYearToColor: MapCompletionYearToColor;

  abnormalYears: number[];
  abnormalYearBuildingCountCap: number;
  minYear: number;
  minYearLabelOffsetXInMillimeters: number;
  minYearLabel?: string;

  maxYear: number;
}

const Timeline: React.VoidFunctionComponent<TimelineProps> = ({
  buildingCollection,
  abnormalYears,
  abnormalYearBuildingCountCap,
  minYear,
  minYearLabelOffsetXInMillimeters,
  minYearLabel,
  maxYear,
  mapCompletionYearToColor,
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

  const maxY =
    Math.ceil(maxBuildingsPerYear / barTick / barTickLabelFrequency) *
    barTick *
    barTickLabelFrequency;

  const svgWidth = width + paddingLeft + paddingRight;
  const svgHeight = height + paddingTop + paddingBottom;

  const xScale = scaleLinear()
    .domain([minYear, maxYear])
    .range([paddingLeft, width + paddingLeft - yAxisOffsetLeft]);

  const yScale = scaleLinear()
    .domain([0, maxY])
    .range([height - paddingBottom, paddingTop]);

  const yAxisTicks = tickify(maxY, barTick);

  return (
    <Wrapper {...rest} ref={ref}>
      {!height || !width ? undefined : (
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{
            left: -paddingLeft,
            top: -paddingTop,
          }}
        >
          {_.range(minYear, maxYear + 1).map((year, index) => (
            <Bar
              key={year}
              year={year}
              abnormalYears={abnormalYears}
              abnormalYearBuildingCountCap={abnormalYearBuildingCountCap}
              mapCompletionYearToColor={mapCompletionYearToColor}
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
            transform={`translate(${svgWidth - paddingRight},0)`}
          >
            {yAxisTicks.map((value, index) => {
              if (index === 0) {
                return;
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
                  />
                  {(value / barTickLabelFrequency) % barTick ? undefined : (
                    <text
                      fontSize="0.8em"
                      fill="#fff"
                      y={yScale(value) + barTickGap}
                      width={yAxisThickness}
                      dominantBaseline="text-before-edge"
                      textAnchor="start"
                      transform={`translate(${3 * pointsInMm},${
                        -1.2 * pointsInMm
                      })`}
                    >
                      {formatNumber(value)}
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
