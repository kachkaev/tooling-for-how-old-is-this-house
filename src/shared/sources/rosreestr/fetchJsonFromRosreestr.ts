import axios, { AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import https from "node:https";

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

axiosRetry(axiosInstance, {
  retries: 30,
  retryDelay: (retryCount) =>
    (retryCount - 1) * 500 +
    Math.max(retryCount - 3, 0) * (retryCount - 3) * 1000 * 5, // long retry mode after 10 attempts in case of request throttling
  retryCondition: (error) =>
    ![200, 204, 404].includes(error.response?.status ?? 0),
  shouldResetTimeout: true,
});

export const fetchJsonFromRosreestr = async <T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<AxiosResponse<T>> => {
  return await axiosInstance.get<T>(url, {
    params,
    responseType: "json",
    timeout: 5000,
  });
};
