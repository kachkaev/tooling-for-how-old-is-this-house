import { NextPage } from "next";
import Link from "next/link";
import * as React from "react";

import { GlobalStyle } from "../ui/shared/global-style";

const Page: NextPage = () => {
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
          <Link href="/color-legend">
            <a>color legend</a>
          </Link>
        </li>
        <li>
          <Link href="/histogram">
            <a>histogram</a>
          </Link>
        </li>
        <li>
          <Link href="/poster">
            <a>poster</a>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Page;
