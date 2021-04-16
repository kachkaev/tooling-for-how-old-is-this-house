import { createGlobalStyle, css } from "styled-components";
import normalize from "styled-normalize";

const base = css`
  body {
    color: #24292e;
    font-size: 12px;
    font-family: "Helvetica Neue", Helvetica, sans-serif;
    margin: 0;
    line-height: 1.4em;

    &.dark-mode {
      background: #24292e;
      color: #fff;
    }
  }

  a {
    color: #0366d6;
    text-decoration: none;

    .dark-mode & {
      color: #59a7ff;
    }

    :hover {
      text-decoration: underline;
    }
  }
`;

export const GlobalStyle = createGlobalStyle`
  ${normalize}
  ${base}
`;
