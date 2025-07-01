import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";

export const formatDate = (dateString) => {
	const date = parseISO(dateString);
	return isValid(date) ? format(date, "MMM yyyy") : "Present";
};

export const formatMessageTimestamp = (dateString) => {
	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		return ""; // Or some default for invalid dates
	}
	let hours = date.getHours();
	const minutes = date.getMinutes().toString().padStart(2, "0");
	const ampm = hours >= 12 ? "PM" : "AM";
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	return `${hours}:${minutes} ${ampm}`;
};

export const formatTimeAgo = (dateString) => {
	try {
		const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
		if (isNaN(date.getTime())) {
			return "Time not available";
		}
		return formatDistanceToNow(date, { addSuffix: true });
	} catch (error) {
		console.error('Error formatting time ago:', error);
		return "Time not available";
	}
};
