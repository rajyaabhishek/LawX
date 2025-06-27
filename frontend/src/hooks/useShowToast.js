import { useToast } from "@chakra-ui/toast";
import { useCallback } from "react";

const useShowToast = () => {
	const toast = useToast();

	// Only display toast for critical notifications (e.g., errors). All other
	// statuses should be routed through the in-app notifications page without a
	// pop-up on the main screen.

	const criticalStatuses = ["error", "warning", "critical"];

	const showToast = useCallback(
		(title, description, status = "info") => {
			// Skip non-critical notifications to avoid cluttering the main UI.
			if (!criticalStatuses.includes(status)) return;

			toast({
				title,
				description,
				status,
				duration: 3000,
				isClosable: true,
			});
		},
		[toast]
	);

	return showToast;
};

export default useShowToast;
