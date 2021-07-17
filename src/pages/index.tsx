import { NextPage } from "next";
import Link from "next/link";
import * as React from "react";

import { GlobalStyle } from "../ui/shared/GlobalStyle";

const IndexPage: NextPage = () => {
  return (
    <div style={{ margin: "0 20px" }}>
      <GlobalStyle />
      <h1>
        <a href="https://github.com/kachkaev/tooling-for-how-old-is-this-house">
          HOITH tooling
        </a>
      </h1>
      <ul>
        <li>
          <Link href="/histogram">
            <a>histogram</a>
          </Link>
        </li>
        <li>
          <Link href="/legend">
            <a>legend</a>
          </Link>
        </li>
        <li>
          <Link href="/poster">
            <a>
              <b>poster</b>
            </a>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default IndexPage;
