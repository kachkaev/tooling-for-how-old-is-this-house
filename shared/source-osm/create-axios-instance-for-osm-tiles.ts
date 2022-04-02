import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import http from "node:http";
import https from "node:https";

export const createAxiosInstanceForOsmTiles = (): AxiosInstance => {
  const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
  });

  axiosRetry(axiosInstance, {
    retries: 30,
    retryDelay: (retryCount) => (retryCount - 1) * 500,
    retryCondition: (error) =>
      ![200, 204, 404].includes(error.response?.status ?? 0),
    shouldResetTimeout: true,
  });

  return axiosInstance;
};
