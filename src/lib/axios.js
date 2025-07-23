import axios from "axios";

const BASE_URL ="https://chatapplicationbackend-2.onrender.com/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});
