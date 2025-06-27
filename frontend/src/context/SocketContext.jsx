import { createContext, useContext, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";

const SocketContext = createContext();

export const useSocket = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { user, isSignedIn } = useUser();

	useEffect(() => {
		if (!user?.id || !isSignedIn) return;
		
		const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", {
			withCredentials: true,
			query: {
				userId: user.id,
			},
		});

		setSocket(socket);

		// Handle online users updates
		socket.on("onlineUsers", (users) => {
			console.log('Online users updated:', users);
			setOnlineUsers(users);
		});

		// Handle user coming online
		socket.on("userOnline", ({ userId }) => {
			setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
		});

		// Handle user going offline
		socket.on("userOffline", ({ userId }) => {
			setOnlineUsers(prev => prev.filter(id => id !== userId));
		});

		// Handle connection events for debugging
		socket.on("connect", () => {
			console.log("Socket connected:", socket.id);
		});

		socket.on("disconnect", () => {
			console.log("Socket disconnected");
		});

		return () => socket && socket.close();
	}, [user?.id, isSignedIn]);

	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};
