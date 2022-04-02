import * as turf from "@turf/turf";
import { bin } from "d3-array";
import { ScaleLinear, scaleLinear, scaleThreshold } from "d3-scale";
import { schemeYlGnBu } from "d3-scale-chromatic";
import _ from "lodash";
import { useRouter } from "next/dist/client/router";
import * as React from "react";
import styled from "styled-components";

import { PosterConfig } from "../../shared/poster";
import {
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureCollection,
} from "../../shared/stage-mixing";
import { GlobalStyle } from "../shared/global-style";

const backgroundColor = "#fff";

const Wrapper = styled.div`
  box-shadow: 5px 5px 10px #ddd;
  display: block;
  float: left;
  overflow: hidden;
  background-color: ${backgroundColor};

  svg {
    display: block;
  }
`;

const binLabelOffset = 5;
const binWidth = 4;

const barTick = 100;
const barTickLabelFrequency = 5;
const barGapXOpacity = 0.5;
const barGapX = 0.2;
const barGabXExtraWhenLabel = 0.5;
const barGapXOpacityWhenLabel = 0.8;

const yAxisGridThickness = 1;
const yAxisLabelOffset = 5;
const yAxisGridColor = "rgba(0,0,0,0.07)";
const barTickOpacity = barGapXOpacity;
const barTickHeight = barGapX;

const paddingLeft = 56;
const paddingRight = 40;
const paddingTop = 30;
const paddingBottom = 50;

const labelFontSize = 12;
const labelColor = "rgba(0,0,0,0.7)";

const buildAreaThresholds = [
  100,
  200,
  500,
  1000,
  2000,
  Number.MAX_SAFE_INTEGER,
];
const buildAreaColors =
  schemeYlGnBu[buildAreaThresholds.length + 1]?.slice(1) ?? [];
const buildAreaColor = scaleThreshold(buildAreaThresholds, buildAreaColors);
const binByBuiltArea = bin()
  .domain([0, 10_000])
  .thresholds(buildAreaThresholds);

const gapOverlap = 0.2;

const legendHeaderOffsetX = 5;
const legendHeaderOffsetY = labelFontSize;
const legendBackgroundWidth = 100;

const tickify = (value: number, tickSize: number): number[] => {
  const result: number[] = [];

  for (let tick = 0; tick < value; tick += tickSize) {
    result.push(tick);
  }
  result.push(value);

  return result;
};

const Bar: React.VoidFunctionComponent<{
  year: number;
  maxYear: number;
  label: string;
  labelOffsetX?: number;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  buildings: MixedPropertyVariantsFeature[];
}> = ({
  year,
  maxYear,
  label,
  labelOffsetX = 0,
  xScale,
  yScale,
  buildings,
}) => {
  const bins = binByBuiltArea(
    buildings.map((building) => turf.area(building)),
  ).reverse();

  let yOffset = 0;

  return (
    <g key={year} transform={`translate(${xScale(year)},0)`}>
      {bins.map((currentBin, index) => {
        const binValue = currentBin.length;

        const y = yScale(binValue);
        const rawHeight = yScale(0) - yScale(binValue);
        const overlapCompensationV =
          index !== bins.length - 1 && rawHeight > gapOverlap ? gapOverlap : 0;

        const overlapCompensationH = year !== maxYear ? gapOverlap : 0;

        if (!rawHeight) {
          return;
        }

        yOffset += rawHeight;

        const color = buildAreaColor(currentBin.x0!);

        return (
          <React.Fragment key={index}>
            <rect
              x={0}
              width={binWidth + overlapCompensationH}
              y={y - yOffset + rawHeight - overlapCompensationV}
              height={rawHeight + overlapCompensationV}
              fill={color}
            />
          </React.Fragment>
        );
      })}
      {label ? (
        <g x={0} transform={`translate(0.5,${yScale(0)})`}>
          <text
            fill={labelColor}
            transform={`rotate(-90),translate(${-binLabelOffset},${
              binWidth - 1 + labelOffsetX
            })`}
            fontSize={labelFontSize}
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

export interface HistogramProps extends React.DOMAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  buildingCollection: MixedPropertyVariantsFeatureCollection;
  posterConfig: PosterConfig;
}

export const Histogram: React.VoidFunctionComponent<HistogramProps> = ({
  buildingCollection,
  posterConfig,
  ...rest
}) => {
  const { maxYear, minYear, minYearLabel, minYearLabelOffsetXInMillimeters } =
    posterConfig.timeline;

  const width = paddingLeft + (maxYear - minYear + 1) * binWidth + paddingRight;
  const height = paddingTop + 300 + paddingBottom;

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
    Math.ceil(
      (maxBuildingsPerYear - barTick) / barTick / barTickLabelFrequency,
    ) *
    barTick *
    barTickLabelFrequency;

  const xScale = scaleLinear()
    .domain([minYear, maxYear])
    .range([paddingLeft, width - paddingRight - binWidth]);

  const yScale = scaleLinear()
    .domain([0, maxY])
    .range([height - paddingBottom, paddingTop]);

  const yAxisTicks = tickify(maxY, barTick);

  const years = _.range(minYear, maxYear + 1);

  const hasLabel = (year: number): boolean =>
    year === minYear || Math.round(year / 10) === year / 10;

  const { locale } = useRouter();

  return (
    <>
      <GlobalStyle />
      <Wrapper {...rest}>
        <svg width={width} height={height}>
          {years.map((year, index) => (
            <Bar
              key={year}
              year={year}
              maxYear={maxYear}
              labelOffsetX={index === 0 ? minYearLabelOffsetXInMillimeters : 0}
              label={
                index === 0 && minYearLabel
                  ? minYearLabel
                  : hasLabel(year)
                  ? `${year}`
                  : ""
              }
              buildings={buildingsByYear[year] ?? []}
              xScale={xScale}
              yScale={yScale}
            />
          ))}
          {years.map((year, index) => {
            if (index === 0) {
              return;
            }

            return (
              <rect
                key={index}
                fill={backgroundColor}
                x={xScale(year)}
                opacity={
                  hasLabel(year) ? barGapXOpacityWhenLabel : barGapXOpacity
                }
                y={yScale(maxY)}
                height={yScale(0) - yScale(maxY)}
                width={hasLabel(year) ? barGabXExtraWhenLabel : barGapX}
              />
            );
          })}
          <g transform={`translate(${paddingLeft},0)`}>
            {yAxisTicks.map((value, index) => {
              const subTick = (
                <rect
                  key={index}
                  fill={backgroundColor}
                  opacity={barTickOpacity}
                  y={yScale(value) - barTickHeight / 2}
                  width={width - paddingLeft - paddingRight - barGapX}
                  height={barTickHeight}
                />
              );

              if ((value / barTickLabelFrequency) % barTick > 0) {
                return subTick;
              }

              const showText = value > 0;

              return (
                <g key={index}>
                  <rect
                    fill={yAxisGridColor}
                    y={yScale(value) - (showText ? yAxisGridThickness / 2 : 0)}
                    width={width - paddingLeft - paddingRight}
                    height={yAxisGridThickness}
                  />
                  {subTick}
                  {showText ? (
                    <text
                      fill={labelColor}
                      fontSize={labelFontSize}
                      y={yScale(value)}
                      dominantBaseline="middle"
                      textAnchor="end"
                      transform={`translate(${-yAxisLabelOffset},1)`}
                    >
                      {value}
                      {index === yAxisTicks.length - 1 ? (
                        <tspan x={0} dy={labelFontSize}>
                          {locale === "en" ? "buildings" : "зданий"}
                        </tspan>
                      ) : undefined}
                    </text>
                  ) : undefined}
                </g>
              );
            })}
          </g>
          {/* Legend */}
          <rect
            height={yAxisGridThickness * 2}
            fill="#fff"
            x={width - paddingRight - legendBackgroundWidth}
            y={paddingTop - yAxisGridThickness}
            width={legendBackgroundWidth}
          />
          <g transform={`translate(${width - paddingRight}, ${paddingTop})`}>
            <text
              textAnchor="end"
              dx={legendHeaderOffsetX}
              dy={1}
              fill={labelColor}
              dominantBaseline="middle"
            >
              {locale === "en"
                ? "building footprint, m²"
                : "площадь застройки, м²"}
            </text>
            {buildAreaThresholds.map((threshold, index) => {
              return (
                <React.Fragment key={index}>
                  <rect
                    width={binWidth}
                    x={-binWidth}
                    y={
                      -gapOverlap + labelFontSize * index + legendHeaderOffsetY
                    }
                    height={labelFontSize + gapOverlap}
                    fill={buildAreaColor(threshold - 1)}
                  />
                  {threshold < Number.MAX_SAFE_INTEGER ? (
                    <text
                      fill={labelColor}
                      dx={-binWidth * 2}
                      dominantBaseline="middle"
                      y={labelFontSize * (index + 1) + legendHeaderOffsetY + 1}
                      textAnchor="end"
                    >
                      {index === 0 ? "< " : ""}
                      {threshold}
                    </text>
                  ) : undefined}
                </React.Fragment>
              );
            })}
          </g>
        </svg>
      </Wrapper>
    </>
  );
};
