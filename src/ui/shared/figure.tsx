import * as React from "react";
import styled from "styled-components";

import { ExternalLink as OriginalExternalLink } from "./essentials";
import { GlobalStyle } from "./global-style";

const Wrapper = styled.div`
  box-sizing: border-box;
  padding: 10px 20px 15px;
  box-shadow: 5px 5px 10px #ddd;
  display: inline-block;
  overflow: hidden;
  display: flex;

  color: rgb(242, 246, 249);
  background: #0b0c0f;
`;

const Content = styled.div`
  display: block;
  position: relative;
  width: 100%;
`;

const ExternalLink = styled(OriginalExternalLink)`
  color: inherit;
`;

const Title = styled.h1`
  font-weight: normal;
  font-size: 2em;
  text-align: left;
  line-height: 1.2em;
  margin: 0;
`;

const Subtitle = styled.div`
  padding-top: 0.2em;
`;

export interface FigureProps {
  children?: React.ReactNode;
  height: number;
  width: number;
  unrelatedToMappingParty?: boolean;
  header?: React.ReactNode;
}

export const Figure: React.VoidFunctionComponent<FigureProps> = ({
  children,
  width,
  height,
}) => {
  const gap = "   ";

  return (
    <>
      <GlobalStyle />
      <Wrapper style={{ width, height }}>
        <Content>
          <Title>Возраст зданий Пензы, Заречного и Засечного</Title>
          <Subtitle>
            <span style={{ opacity: 0.5 }}>
              данные: © участники <ExternalLink href="https://osm.org" />,{" "}
              <ExternalLink href="https://www.openstreetmap.org/copyright">
                ODbL
              </ExternalLink>
              {gap} визуализация: Александр Качкаев,{" "}
              <ExternalLink href="https://kachkaev.ru" />
            </span>
          </Subtitle>
          {children}
        </Content>
      </Wrapper>
    </>
  );
};
