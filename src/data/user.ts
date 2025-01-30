import { useQuery } from 'react-query';
import { API_ENDPOINTS } from "@/config/api-endpoint";
import axiosApi from "@/utils/axios-api";
import axios from "axios";
import { useDispatch } from "react-redux";
import { profileDetail } from "@/app/store/slices/profileDetailReducer";
import { getAuthCredentials } from "@/utils/auth-utils";

export const useMeQuery = (enabled: boolean = true) => {
    const dispatch = useDispatch();

    return useQuery<any, Error>(
        [API_ENDPOINTS.ME],
        () => {
            const { token } = getAuthCredentials();
            if (!token) {
                return Promise.reject(new Error('No token found'));
            }
            return userClient.me();
        },
        {
            enabled,
            retry: false,
            staleTime: 3600000,
            cacheTime: 3600000,
            refetchOnWindowFocus: true,
            refetchOnMount: 'always',
            onSuccess: (response: any) => {
                const userData = response.data.data;
                dispatch(profileDetail(userData));
            },
            onError: (err: any) => {
                if (axios.isAxiosError(err)) {
                    console.error('Error fetching user data:', err);
                }
            },
        }
    );
};

// User API client
const userClient = {
    me: () => {
        return axiosApi.auth.get<any>(API_ENDPOINTS.ME);
    },
};