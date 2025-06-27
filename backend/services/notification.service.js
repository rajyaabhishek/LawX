import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import Case from "../models/Case.js";
import { emitNotification } from "../socket/socket.js";

/**
 * Create a new notification
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.recipient - ID of the user receiving the notification
 * @param {string} notificationData.type - Type of notification
 * @param {string} [notificationData.message] - Optional message
 * @param {string} [notificationData.relatedUser] - ID of related user (optional)
 * @param {string} [notificationData.relatedPost] - ID of related post (optional)
 * @param {string} [notificationData.relatedCase] - ID of related case (optional)
 * @param {Object} [metadata] - Additional metadata for the notification
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async ({
  recipient,
  type,
  message = '',
  relatedUser = null,
  relatedPost = null,
  relatedCase = null,
  metadata = {}
}) => {
  try {
    const notification = new Notification({
      recipient,
      type,
      message,
      relatedUser,
      relatedPost,
      relatedCase,
      metadata,
      read: false
    });

    await notification.save();
    
    // Populate the related fields for the socket emission
    const populatedNotification = await Notification.populate(notification, [
      { path: 'relatedUser', select: 'name username profilePicture' },
      { path: 'relatedPost', select: 'content' },
      { path: 'relatedCase', select: 'title' }
    ]);
    
    // Emit the notification to the recipient via socket
    emitNotification(recipient.toString(), populatedNotification);
    
    return populatedNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple recipients
 * @param {Object} params - Parameters
 * @param {string[]} params.recipientIds - Array of user IDs to receive the notification
 * @param {string} params.type - Type of notification
 * @param {string} [params.message] - Optional message
 * @param {string} [params.relatedUser] - ID of related user (optional)
 * @param {string} [params.relatedPost] - ID of related post (optional)
 * @param {string} [params.relatedCase] - ID of related case (optional)
 * @param {Object} [metadata] - Additional metadata for the notification
 * @returns {Promise<Array>} Array of created notifications
 */
export const createBulkNotifications = async ({
  recipientIds,
  type,
  message = '',
  relatedUser = null,
  relatedPost = null,
  relatedCase = null,
  metadata = {}
}) => {
  // Ensure recipientIds is an array and has values
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    throw new Error('recipientIds must be a non-empty array');
  }

  // Remove duplicates
  const uniqueRecipientIds = [...new Set(recipientIds)];

  try {
    // Create notification documents
    const notificationPromises = uniqueRecipientIds.map(recipientId => 
      createNotification({
        recipient: recipientId,
        type,
        message,
        relatedUser,
        relatedPost,
        relatedCase,
        metadata
      })
    );

    return await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Mark notifications as read
 * @param {string} userId - ID of the user
 * @param {string[]} notificationIds - Array of notification IDs to mark as read
 * @returns {Promise<Object>} Update result
 */
export const markNotificationsAsRead = async (userId, notificationIds) => {
  try {
    return await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: userId,
        read: false
      },
      { $set: { read: true } }
    );
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread notifications count for a user
 * @param {string} userId - ID of the user
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadNotificationsCount = async (userId) => {
  try {
    return await Notification.countDocuments({
      recipient: userId,
      read: false
    });
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    throw error;
  }
};

/**
 * Get notifications for a user with pagination
 * @param {string} userId - ID of the user
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of notifications per page
 * @returns {Promise<Object>} Paginated notifications
 */
export const getUserNotifications = async (userId, { page = 1, limit = 10 } = {}) => {
  try {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedUser', 'name username profilePicture')
        .populate('relatedPost', 'content')
        .populate('relatedCase', 'title'),
      Notification.countDocuments({ recipient: userId })
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Notify all lawyers about a new case
 * @param {string} caseId - ID of the case
 * @param {string} postedBy - ID of the user who posted the case
 * @returns {Promise<void>}
 */
export const notifyLawyersAboutNewCase = async (caseId, postedBy) => {
  try {
    // Find all verified lawyers
    const lawyers = await User.find({ 
      role: 'lawyer',
      isVerified: true,
      _id: { $ne: postedBy } // Don't notify the poster
    }).select('_id');

    if (lawyers.length === 0) return;

    const lawyerIds = lawyers.map(lawyer => lawyer._id);
    
    await createBulkNotifications({
      recipientIds: lawyerIds,
      type: 'new_case',
      message: 'A new case has been posted that matches your expertise',
      relatedCase: caseId,
      relatedUser: postedBy,
      metadata: { 
        action: 'view_case',
        actionId: caseId
      }
    });
  } catch (error) {
    console.error('Error notifying lawyers about new case:', error);
    // Don't throw error as this is a non-critical notification
  }
};

/**
 * Notify case poster about a new application
 * @param {string} caseId - ID of the case
 * @param {string} applicantId - ID of the lawyer who applied
 * @param {string} message - Application message
 * @returns {Promise<Object>} Created notification
 */
export const notifyCasePosterAboutApplication = async (caseId, applicantId, message) => {
  try {
    // Get the case to find the poster
    const caseDoc = await Case.findById(caseId).select('user');
    if (!caseDoc) throw new Error('Case not found');
    
    return await createNotification({
      recipient: caseDoc.user,
      type: 'case_application',
      message: message || 'A lawyer has applied to your case',
      relatedCase: caseId,
      relatedUser: applicantId,
      metadata: {
        action: 'view_application',
        actionId: caseId
      }
    });
  } catch (error) {
    console.error('Error notifying case poster about application:', error);
    throw error;
  }
};

/**
 * Notify lawyer about their application status
 * @param {string} caseId - ID of the case
 * @param {string} lawyerId - ID of the lawyer
 * @param {string} status - New status ('accepted' or 'rejected')
 * @returns {Promise<Object>} Created notification
 */
export const notifyLawyerAboutApplicationStatus = async (caseId, lawyerId, status) => {
  try {
    if (!['accepted', 'rejected'].includes(status)) {
      throw new Error('Invalid status. Must be "accepted" or "rejected"');
    }
    
    const caseDoc = await Case.findById(caseId).select('title user');
    if (!caseDoc) throw new Error('Case not found');
    
    const notificationType = status === 'accepted' 
      ? 'case_application_accepted' 
      : 'case_application_rejected';
    
    const message = status === 'accepted'
      ? `Your application for case "${caseDoc.title}" has been accepted!`
      : `Your application for case "${caseDoc.title}" has been declined.`;
    
    return await createNotification({
      recipient: lawyerId,
      type: notificationType,
      message,
      relatedCase: caseId,
      relatedUser: caseDoc.user,
      metadata: {
        action: 'view_case',
        actionId: caseId
      }
    });
  } catch (error) {
    console.error('Error notifying lawyer about application status:', error);
    throw error;
  }
};
