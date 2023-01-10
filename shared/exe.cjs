/** @todo after 2023-01-01
 * - Delete handle-deprecated-script-in-src.cjs
 * - Delete exe.cjs
 * - Use --require=suppress-experimental-warnings in package.json → scripts → exe
 */

require("./exe/handle-deprecated-script-in-src.cjs");
require("suppress-experimental-warnings");
