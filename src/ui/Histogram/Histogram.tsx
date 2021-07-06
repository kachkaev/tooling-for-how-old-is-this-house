import * as turf from "@turf/turf";
import { scaleLinear } from "@visx/scale";
import { bin } from "d3-array";
import { ScaleLinear, scaleOrdinal } from "d3-scale";
import { schemeYlGnBu } from "d3-scale-chromatic";
import _ from "lodash";
import * as React from "react";
import styled from "styled-components";

import {
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureCollection,
} from "../../shared/outputMixing";
import { GlobalStyle } from "../shared/GlobalStyle";

const backgroundColor = "#fff";

const Wrapper = styled.div`
  box-shadow: 5px 5px 10px #ddd;
  display: inline-block;
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
const barGapX = 0.2;
const barGabXExtraWhenLabel = 0.5;
const xAxisLabelColor = "rgba(0,0,0,0.7)";

const yAxisGridThickness = 1;
const yAxisLabelOffset = 5;
const yAxisLabelColor = "rgba(0,0,0,0.7)";
const yAxisGridColor = "rgba(0,0,0,0.07)";
const barTickOpacity = 1;
const barTickHeight = barGapX;

const paddingLeft = 50;
const paddingRight = 40;
const paddingTop = 30;
const paddingBottom = 50;

const minYear = 1850;
const maxYear = 2020;

const labelFontSize = 12;

const buildAreaBins = [0, 100, 200, 500, 1000, 2000];
const builtAreaColors = schemeYlGnBu[buildAreaBins.length + 1] ?? [];
const buildAreaColor = scaleOrdinal(buildAreaBins, builtAreaColors);
const binByBuiltArea = bin().domain([0, 10000]).thresholds(buildAreaBins);

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
  const total = buildings.length;
  if (total === 0) {
    return null;
  }
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
        const overlapCompensation = index === 0 ? 1 : 0;

        if (!rawHeight) {
          return null;
        }

        yOffset += rawHeight;

        const xOffset = showLabel ? barGabXExtraWhenLabel : 0;

        return (
          <rect
            key={index}
            x={xOffset}
            width={binWidth - barGapX - xOffset}
            y={y - yOffset + rawHeight - overlapCompensation}
            height={rawHeight + overlapCompensation}
            fill={buildAreaColor(currentBin.x1!)}
          />
        );
      })}
      {showLabel ? (
        <g x={0} transform={`translate(0.5,${yScale(0)})`}>
          <text
            fill={xAxisLabelColor}
            transform={`rotate(-90),translate(${-binLabelOffset},${
              binWidth - 1
            })`}
            fontSize={labelFontSize}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {labelPrefix ?? ""}
            {year}
          </text>
        </g>
      ) : null}
    </g>
  );
};

export interface HistogramProps extends React.DOMAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  buildingCollection: MixedPropertyVariantsFeatureCollection;
}

export const Histogram: React.VoidFunctionComponent<HistogramProps> = ({
  buildingCollection,
  ...rest
}) => {
  const width = paddingLeft + (maxYear - minYear + 2) * binWidth + paddingLeft;
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
    range: [paddingLeft, width - paddingRight - binWidth],
  });

  const yScale = scaleLinear({
    domain: [0, maxY],
    range: [height - paddingBottom, paddingTop],
  });

  const yAxisTicks = tickify(maxY, barTick);

  return (
    <>
      <GlobalStyle />
      <Wrapper {...rest}>
        <svg width={width} height={height}>
          <g transform={`translate(${paddingLeft},0)`}>
            {yAxisTicks.map((value, index) => {
              if ((value / barTickLabelFrequency) % barTick) {
                return;
              }
              const showText = value > 0;

              return (
                <g key={index}>
                  <rect
                    fill={yAxisGridColor}
                    y={yScale(value)}
                    width={width - paddingLeft - paddingRight - barGapX}
                    height={yAxisGridThickness}
                  />
                  {showText ? (
                    <text
                      fill={yAxisLabelColor}
                      fontSize={labelFontSize}
                      y={yScale(value)}
                      dominantBaseline="middle"
                      textAnchor="end"
                      transform={`translate(${-yAxisLabelOffset},1)`}
                    >
                      {value}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
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
          <g transform={`translate(${paddingLeft},0)`}>
            {yAxisTicks.map((value, index) => {
              return (
                <rect
                  key={index}
                  fill={backgroundColor}
                  opacity={barTickOpacity}
                  y={yScale(value) - barTickHeight / 2}
                  width={width - paddingLeft - paddingRight - barGapX}
                  height={barTickHeight}
                />
              );
            })}
          </g>
        </svg>
      </Wrapper>
    </>
  );
};
