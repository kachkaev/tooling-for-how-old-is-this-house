import axios, { AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import https from "https";

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});
axiosRetry(axiosInstance, {
  retries: 30,
  retryDelay: (retryCount) => (retryCount - 1) * 500,
  retryCondition: (error) =>
    ![200, 204, 404].includes(error.response?.status ?? 0),
});

export const fetchJsonFromRosreestr = async <T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<AxiosResponse<T>> => {
  return await axiosInstance.get<T>(url, {
    params,
    responseType: "json",
  });
};
