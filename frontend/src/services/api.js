import axios from "axios";
import { urlApi, vigilarLentitud } from "./urlApi";


const api = axios.create({

    baseURL: urlApi(),

    headers: {
        "Content-Type": "application/json",
    },

});


api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});


api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            delete api.defaults.headers.common.Authorization;

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

vigilarLentitud(api);

export default api;
