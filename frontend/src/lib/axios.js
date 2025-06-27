import axios from "axios";

export const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api/v1" : "/api/v1",
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json'
	}
});

// Function to get session token and configure axios
export const configureAxiosWithClerk = (getToken) => {
	axiosInstance.interceptors.request.use(async (config) => {
		try {
			console.log('Axios interceptor: Getting token for request to', config.url);
			const token = await getToken();
			if (token) {
				console.log('Axios interceptor: Token retrieved successfully');
				config.headers.Authorization = `Bearer ${token}`;
			} else {
				console.log('Axios interceptor: No token available');
			}
		} catch (error) {
			console.error('Error getting Clerk token:', error);
		}
		return config;
	});

	// Add response interceptor for debugging
	axiosInstance.interceptors.response.use(
		(response) => {
			console.log('Axios response success:', response.config.url, response.status);
			return response;
		},
		(error) => {
			console.error('Axios response error:', error.config?.url, error.response?.status, error.response?.data);
			return Promise.reject(error);
		}
	);
};
