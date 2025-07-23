import axios from "axios";

const BASE_URL ="https://chatapplicationbackend-1-1oyd.onrender.com";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});
