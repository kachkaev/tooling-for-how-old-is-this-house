import { scaleLinear } from "@visx/scale";
import { ScaleLinear } from "d3-scale";
import _ from "lodash";
import * as React from "react";
import styled from "styled-components";

import {
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureCollection,
} from "../../shared/outputMixing";
import { GlobalStyle } from "../shared/GlobalStyle";

const Wrapper = styled.div`
  outline: 1px solid green;
  display: inline-block;
  overflow: hidden;
`;

const barLabelOffset = 5;
const barWidth = 5;

const barTick = 100;
const barTickLabelFrequency = 5;
const barTickGap = 0.2;

const xAxisLabelColor = "rgba(0,0,0,0.7)";

const yAxisGridThickness = 1;
const yAxisLabelOffset = 5;
const yAxisLabelColor = "rgba(0,0,0,0.7)";
// const yAxisGridColor = "#ccc";
const yAxisGridColor = "rgba(0,0,0,0.05)";

const paddingLeft = 50;
const paddingRight = 40;
const paddingTop = 30;
const paddingBottom = 50;

const minYear = 1850;
const maxYear = 2020;

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
  const color = "#ccc";

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
        const height = rawHeight - (index > 0 ? barTickGap : 0);

        if (!height) {
          return null;
        }

        return (
          <rect
            key={index}
            x={0}
            width={barWidth - 0.2}
            y={yScale(prevTickifiedValue) - height + 0.2}
            height={height}
            fill={color}
          />
        );
      })}
      {showLabel ? (
        <g x={0} transform={`translate(0,${yScale(0) + barLabelOffset})`}>
          <text
            fill={xAxisLabelColor}
            transform={`rotate(-90),translate(-3,${barWidth - 1})`}
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
  const width = paddingLeft + (maxYear - minYear + 2) * barWidth + paddingLeft;
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
    range: [paddingLeft, width - paddingRight - barWidth],
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
                    y={yScale(value) + barTickGap}
                    width={width - paddingLeft - paddingRight}
                    height={yAxisGridThickness}
                  />
                  {showText ? (
                    <text
                      fill={yAxisLabelColor}
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
        </svg>
      </Wrapper>
    </>
  );
};
