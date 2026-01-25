// services/reportService.js
// Service for handling report-related Firestore operations

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  limit,
  increment,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Report Status Types
export const REPORT_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
  ACTION_TAKEN: 'action_taken',
};

// Report Priority Types
export const REPORT_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// Report Types
export const REPORT_TYPES = {
  USER: 'user',
  POST: 'post',
  COMMENT: 'comment',
  MESSAGE: 'message',
  COMMUNITY: 'community',
  PRODUCT: 'product',
  STORY: 'story',
};

// Admin Actions
export const ADMIN_ACTIONS = {
  WARNING: 'warning',
  TEMPORARY_BAN: 'temporary_ban',
  PERMANENT_BAN: 'permanent_ban',
  ACCOUNT_SUSPENDED: 'account_suspended',
  CONTENT_REMOVED: 'content_removed',
  NO_VIOLATION: 'no_violation',
  DISMISSED: 'dismissed',
};

// Report Reasons with Categories and Priority
export const REPORT_REASONS = {
  // Safety (High Priority)
  violence: { label: 'Violence or Threats', category: 'safety', priority: 'high' },
  self_harm: { label: 'Self-Harm or Suicide', category: 'safety', priority: 'high' },
  underage: { label: 'Underage User', category: 'safety', priority: 'high' },
  
  // Behavior (Medium Priority)
  harassment: { label: 'Harassment or Bullying', category: 'behavior', priority: 'medium' },
  hate_speech: { label: 'Hate Speech', category: 'behavior', priority: 'medium' },
  
  // Content (Low-Medium Priority)
  inappropriate_content: { label: 'Inappropriate Content', category: 'content', priority: 'medium' },
  spam: { label: 'Spam', category: 'content', priority: 'low' },
  
  // Identity
  impersonation: { label: 'Impersonation', category: 'identity', priority: 'medium' },
  fake_profile: { label: 'Fake Profile', category: 'identity', priority: 'low' },
  
  // Security
  scam: { label: 'Scam or Fraud', category: 'security', priority: 'high' },
  
  // Legal
  copyright: { label: 'Copyright Violation', category: 'legal', priority: 'medium' },
  
  // Other
  other: { label: 'Other', category: 'other', priority: 'low' },
};

/**
 * Fetch reports with optional filters
 */
export const getReports = async (options = {}) => {
  try {
    const { status, priority, reportType, limitCount = 100 } = options;
    
    let q = collection(db, 'reports');
    const constraints = [];
    
    if (status && status !== 'all') {
      constraints.push(where('status', '==', status));
    }
    if (priority) {
      constraints.push(where('priority', '==', priority));
    }
    if (reportType) {
      constraints.push(where('reportType', '==', reportType));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limitCount));
    
    const snapshot = await getDocs(query(q, ...constraints));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

/**
 * Get a single report by ID
 */
export const getReportById = async (reportId) => {
  try {
    const reportDoc = await getDoc(doc(db, 'reports', reportId));
    if (reportDoc.exists()) {
      return { id: reportDoc.id, ...reportDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

/**
 * Get report statistics
 */
export const getReportStats = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'reports'));
    const reports = snapshot.docs.map(doc => doc.data());
    
    return {
      total: reports.length,
      pending: reports.filter(r => r.status === REPORT_STATUS.PENDING).length,
      underReview: reports.filter(r => r.status === REPORT_STATUS.UNDER_REVIEW).length,
      resolved: reports.filter(r => r.status === REPORT_STATUS.RESOLVED).length,
      actionTaken: reports.filter(r => r.status === REPORT_STATUS.ACTION_TAKEN).length,
      dismissed: reports.filter(r => r.status === REPORT_STATUS.DISMISSED).length,
      highPriority: reports.filter(r => r.priority === REPORT_PRIORITY.HIGH && r.status === REPORT_STATUS.PENDING).length,
      mediumPriority: reports.filter(r => r.priority === REPORT_PRIORITY.MEDIUM && r.status === REPORT_STATUS.PENDING).length,
      lowPriority: reports.filter(r => r.priority === REPORT_PRIORITY.LOW && r.status === REPORT_STATUS.PENDING).length,
    };
  } catch (error) {
    console.error('Error fetching report stats:', error);
    throw error;
  }
};

/**
 * Update report status
 */
export const updateReportStatus = async (reportId, status, adminId) => {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      updatedAt: serverTimestamp(),
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
};

/**
 * Take action on a report
 */
export const takeActionOnReport = async (reportId, { action, actionDetails, adminId }) => {
  try {
    // Validate inputs
    if (!reportId || !action || !adminId) {
      throw new Error('Missing required parameters: reportId, action, or adminId');
    }

    const batch = writeBatch(db);
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);
    
    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }
    
    const report = reportDoc.data();
    
    // Validate reported user exists
    if (!report.reportedId) {
      throw new Error('Report does not have a valid reported user ID');
    }

    // Update report status
    batch.update(reportRef, {
      status: REPORT_STATUS.ACTION_TAKEN,
      actionTaken: action,
      actionDetails: actionDetails || {},
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isResolved: true,
    });
    
    // Take action on user based on action type
    const userRef = doc(db, 'users', report.reportedId);
    
    switch (action) {
      case ADMIN_ACTIONS.WARNING:
        // Issue a warning to the user
        batch.update(userRef, {
          warningsCount: increment(1),
          lastWarning: actionDetails?.message || 'You have received a warning for violating community guidelines.',
          lastWarningDate: serverTimestamp(),
          warnedAt: serverTimestamp(),
          warnedBy: adminId,
        });
        
        // Create notification for user
        const warningNotifRef = doc(collection(db, 'users', report.reportedId, 'notifications'));
        batch.set(warningNotifRef, {
          type: 'warning',
          title: '⚠️ Warning Issued',
          message: actionDetails?.message || 'You have received a warning for violating community guidelines.',
          reason: actionDetails?.reason || report.reasonLabel,
          createdAt: serverTimestamp(),
          read: false,
        });
        break;
        
      case ADMIN_ACTIONS.TEMPORARY_BAN:
        // Temporary ban the user
        const duration = parseInt(actionDetails?.duration) || 7;
        const banExpires = new Date();
        banExpires.setDate(banExpires.getDate() + duration);
        
        batch.update(userRef, {
          isBanned: true,
          banType: 'temporary',
          banReason: actionDetails?.reason || 'Violation of community guidelines',
          bannedAt: serverTimestamp(),
          banExpiresAt: banExpires,
          bannedBy: adminId,
        });
        
        // Create notification for user
        const tempBanNotifRef = doc(collection(db, 'users', report.reportedId, 'notifications'));
        batch.set(tempBanNotifRef, {
          type: 'ban',
          title: '🚫 Temporary Ban',
          message: `Your account has been temporarily banned for ${duration} days.`,
          reason: actionDetails?.reason || report.reasonLabel,
          duration: duration,
          expiresAt: banExpires,
          createdAt: serverTimestamp(),
          read: false,
        });
        break;
        
      case ADMIN_ACTIONS.PERMANENT_BAN:
        // Permanently ban the user
        batch.update(userRef, {
          isBanned: true,
          banType: 'permanent',
          banReason: actionDetails?.reason || 'Serious violation of community guidelines',
          bannedAt: serverTimestamp(),
          bannedBy: adminId,
          accountStatus: 'banned',
        });
        
        // Create notification for user
        const permBanNotifRef = doc(collection(db, 'users', report.reportedId, 'notifications'));
        batch.set(permBanNotifRef, {
          type: 'ban',
          title: '🚫 Permanent Ban',
          message: 'Your account has been permanently banned.',
          reason: actionDetails?.reason || report.reasonLabel,
          isPermanent: true,
          createdAt: serverTimestamp(),
          read: false,
        });
        break;
        
      case ADMIN_ACTIONS.ACCOUNT_SUSPENDED:
        // Suspend the account
        batch.update(userRef, {
          isSuspended: true,
          suspendedReason: actionDetails?.reason || 'Account suspended pending review',
          suspendedAt: serverTimestamp(),
          suspendedBy: adminId,
          accountStatus: 'suspended',
        });
        
        // Create notification for user
        const suspendNotifRef = doc(collection(db, 'users', report.reportedId, 'notifications'));
        batch.set(suspendNotifRef, {
          type: 'suspension',
          title: '⏸️ Account Suspended',
          message: 'Your account has been suspended pending review.',
          reason: actionDetails?.reason || report.reasonLabel,
          createdAt: serverTimestamp(),
          read: false,
        });
        break;
        
      case ADMIN_ACTIONS.CONTENT_REMOVED:
        // Remove the reported content
        if (report.contentId && report.contentType) {
          await removeReportedContent(report, batch, adminId);
        } else {
          console.warn('No content to remove - contentId or contentType missing');
        }
        
        // Notify user about content removal
        const contentNotifRef = doc(collection(db, 'users', report.reportedId, 'notifications'));
        batch.set(contentNotifRef, {
          type: 'content_removed',
          title: '🗑️ Content Removed',
          message: `Your ${report.contentType || 'content'} has been removed for violating community guidelines.`,
          reason: actionDetails?.reason || report.reasonLabel,
          contentType: report.contentType,
          createdAt: serverTimestamp(),
          read: false,
        });
        break;
        
      case ADMIN_ACTIONS.NO_VIOLATION:
      case ADMIN_ACTIONS.DISMISSED:
        // No action on user - report was dismissed
        break;
        
      default:
        throw new Error(`Unknown action type: ${action}`);
    }
    
    // Log the admin action
    const actionLogRef = doc(collection(db, 'admin_actions'));
    batch.set(actionLogRef, {
      adminId,
      reportId,
      targetUserId: report.reportedId,
      targetUsername: report.reportedUsername,
      reportType: report.reportType,
      reason: report.reasonLabel,
      action,
      actionDetails: actionDetails || {},
      createdAt: serverTimestamp(),
    });
    
    // Commit all changes atomically
    console.log(`Committing batch with action: ${action} for report: ${reportId}`);
    await batch.commit();
    
    console.log(`Successfully took action "${action}" on report ${reportId}`);
    return { success: true, action, reportId };
  } catch (error) {
    console.error('Error taking action on report:', error);
    console.error('Full error details:', error.code, error.message, error.stack);
    throw new Error(`Failed to take action: ${error.message}`);
  }
};

/**
 * Helper function to remove reported content
 */
const removeReportedContent = async (report, batch, adminId) => {
  const { contentId, contentType, reportedId, communityId, parentId } = report;
  
  console.log(`Attempting to remove ${contentType} content with ID: ${contentId} by admin: ${adminId}`);
  console.log(`Report data:`, { contentId, contentType, communityId, parentId });
  
  try {
    switch (contentType) {
      case 'post':
        // Try to delete from global posts first
        const postRef = doc(db, 'posts', contentId);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists()) {
          console.log(`Deleting post from global posts collection`);
          batch.delete(postRef);
        } else if (communityId) {
          // Try community posts
          console.log(`Post not in global collection, trying community posts: ${communityId}`);
          const communityPostRef = doc(db, 'communities', communityId, 'posts', contentId);
          const communityPostDoc = await getDoc(communityPostRef);
          
          if (communityPostDoc.exists()) {
            console.log(`Deleting post from community posts`);
            batch.delete(communityPostRef);
          } else {
            console.error(`Post ${contentId} not found in global posts or community ${communityId} posts`);
          }
        } else {
          console.error(`Post ${contentId} not found in global posts and no communityId provided`);
        }
        break;
        
      case 'comment':
        // Delete comment from top-level comments or post comments
        const commentRef = doc(db, 'comments', contentId);
        const commentDoc = await getDoc(commentRef);
        
        if (commentDoc.exists()) {
          batch.delete(commentRef);
        } else {
          // Try to delete from posts/{postId}/comments/{commentId}
          // Note: This requires knowing the parent postId from the report
          if (report.parentId) {
            const postCommentRef = doc(db, 'posts', report.parentId, 'comments', contentId);
            const postCommentDoc = await getDoc(postCommentRef);
            if (postCommentDoc.exists()) {
              batch.delete(postCommentRef);
            }
          } else {
            console.warn(`Comment ${contentId} not found in comments collection`);
          }
        }
        break;
        
      case 'message':
        // Delete message
        const messageRef = doc(db, 'messages', contentId);
        const messageDoc = await getDoc(messageRef);
        
        if (messageDoc.exists()) {
          batch.delete(messageRef);
        }
        break;
        
      case 'story':
        // Delete story
        const storyRef = doc(db, 'stories', contentId);
        const storyDoc = await getDoc(storyRef);
        
        if (storyDoc.exists()) {
          batch.delete(storyRef);
        }
        break;
        
      case 'community':
        // Delete or suspend community
        const communityRef = doc(db, 'communities', contentId);
        const communityDoc = await getDoc(communityRef);
        
        if (communityDoc.exists()) {
          batch.update(communityRef, {
            isDisabled: true,
            disabledAt: serverTimestamp(),
            disabledBy: adminId,
            disabledReason: 'Removed by admin due to violation',
          });
        }
        break;
        
      case 'product':
        // Delete marketplace product
        const productRef = doc(db, 'products', contentId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          batch.delete(productRef);
        }
        break;
        
      default:
        console.warn(`Unknown content type: ${contentType}`);
    }
  } catch (error) {
    console.error(`Error removing ${contentType} content:`, error);
    console.error('Full error details:', error.code, error.message, error.stack);
    // Don't throw - let the batch commit the report update even if content deletion fails
    console.warn(`Content deletion failed but continuing with report update`);
  }
};

/**
 * Dismiss a report
 */
export const dismissReport = async (reportId, adminId, notes = '') => {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status: REPORT_STATUS.DISMISSED,
      actionTaken: ADMIN_ACTIONS.DISMISSED,
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      adminNotes: notes,
      isResolved: true,
    });
    
    // Log the action
    await addDoc(collection(db, 'admin_actions'), {
      adminId,
      reportId,
      action: ADMIN_ACTIONS.DISMISSED,
      actionDetails: { notes },
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error dismissing report:', error);
    throw error;
  }
};

/**
 * Add admin notes to a report
 */
export const addAdminNotes = async (reportId, notes) => {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      adminNotes: notes,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding admin notes:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time report updates
 */
export const subscribeToReports = (options = {}, callback) => {
  const { status, priority, limitCount = 50 } = options;
  
  let q = collection(db, 'reports');
  const constraints = [];
  
  if (status && status !== 'all') {
    constraints.push(where('status', '==', status));
  }
  if (priority) {
    constraints.push(where('priority', '==', priority));
  }
  
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(limitCount));
  
  return onSnapshot(query(q, ...constraints), (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const changes = snapshot.docChanges().map(change => ({
      type: change.type,
      report: { id: change.doc.id, ...change.doc.data() },
    }));
    callback(reports, changes);
  });
};

/**
 * Get admin action history
 */
export const getAdminActionHistory = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'admin_actions'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching admin action history:', error);
    throw error;
  }
};

/**
 * Get user's report history (how many times they've been reported)
 */
export const getUserReportHistory = async (userId) => {
  try {
    const q = query(
      collection(db, 'reports'),
      where('reportedId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching user report history:', error);
    throw error;
  }
};

/**
 * Get priority color for UI
 */
export const getPriorityColor = (priority) => {
  switch (priority) {
    case REPORT_PRIORITY.HIGH:
      return '#EF4444';
    case REPORT_PRIORITY.MEDIUM:
      return '#F59E0B';
    case REPORT_PRIORITY.LOW:
      return '#6B7280';
    default:
      return '#6B7280';
  }
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status) => {
  switch (status) {
    case REPORT_STATUS.PENDING:
      return '#F59E0B';
    case REPORT_STATUS.UNDER_REVIEW:
      return '#3B82F6';
    case REPORT_STATUS.RESOLVED:
      return '#10B981';
    case REPORT_STATUS.ACTION_TAKEN:
      return '#8B5CF6';
    case REPORT_STATUS.DISMISSED:
      return '#6B7280';
    default:
      return '#6B7280';
  }
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Verify user ban status
 */
export const verifyUserBanStatus = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { exists: false };
    }
    
    const userData = userDoc.data();
    return {
      exists: true,
      isBanned: userData.isBanned || false,
      banType: userData.banType,
      banReason: userData.banReason,
      bannedAt: userData.bannedAt,
      banExpiresAt: userData.banExpiresAt,
      isSuspended: userData.isSuspended || false,
      warningsCount: userData.warningsCount || 0,
    };
  } catch (error) {
    console.error('Error verifying user ban status:', error);
    throw error;
  }
};

/**
 * Unban a user (reverse ban action)
 */
export const unbanUser = async (userId, adminId, reason = '') => {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', userId);
    
    // Remove ban
    batch.update(userRef, {
      isBanned: false,
      banType: null,
      banReason: null,
      bannedAt: null,
      banExpiresAt: null,
      bannedBy: null,
      unbannedAt: serverTimestamp(),
      unbannedBy: adminId,
      unbanReason: reason,
    });
    
    // Create notification
    const notifRef = doc(collection(db, 'users', userId, 'notifications'));
    batch.set(notifRef, {
      type: 'unban',
      title: '✅ Account Unbanned',
      message: 'Your account has been unbanned. You can now access the platform.',
      reason: reason,
      createdAt: serverTimestamp(),
      read: false,
    });
    
    // Log the action
    const actionLogRef = doc(collection(db, 'admin_actions'));
    batch.set(actionLogRef, {
      adminId,
      targetUserId: userId,
      action: 'unban',
      actionDetails: { reason },
      createdAt: serverTimestamp(),
    });
    
    await batch.commit();
    return { success: true, userId };
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
};

/**
 * Unsuspend a user account
 */
export const unsuspendUser = async (userId, adminId, reason = '') => {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', userId);
    
    // Remove suspension
    batch.update(userRef, {
      isSuspended: false,
      suspendedReason: null,
      suspendedAt: null,
      suspendedBy: null,
      unsuspendedAt: serverTimestamp(),
      unsuspendedBy: adminId,
      accountStatus: 'active',
    });
    
    // Create notification
    const notifRef = doc(collection(db, 'users', userId, 'notifications'));
    batch.set(notifRef, {
      type: 'unsuspend',
      title: '✅ Account Unsuspended',
      message: 'Your account suspension has been lifted.',
      reason: reason,
      createdAt: serverTimestamp(),
      read: false,
    });
    
    // Log the action
    const actionLogRef = doc(collection(db, 'admin_actions'));
    batch.set(actionLogRef, {
      adminId,
      targetUserId: userId,
      action: 'unsuspend',
      actionDetails: { reason },
      createdAt: serverTimestamp(),
    });
    
    await batch.commit();
    return { success: true, userId };
  } catch (error) {
    console.error('Error unsuspending user:', error);
    throw error;
  }
};

/**
 * Clear user warnings
 */
export const clearUserWarnings = async (userId, adminId, reason = '') => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      warningsCount: 0,
      lastWarning: null,
      lastWarningDate: null,
      warningsCleared: true,
      warningsClearedAt: serverTimestamp(),
      warningsClearedBy: adminId,
    });
    
    // Log the action
    await addDoc(collection(db, 'admin_actions'), {
      adminId,
      targetUserId: userId,
      action: 'clear_warnings',
      actionDetails: { reason },
      createdAt: serverTimestamp(),
    });
    
    return { success: true, userId };
  } catch (error) {
    console.error('Error clearing user warnings:', error);
    throw error;
  }
};

/**
 * Bulk action on multiple reports
 */
export const bulkActionOnReports = async (reportIds, action, adminId, actionDetails = {}) => {
  try {
    const results = {
      successful: [],
      failed: [],
    };
    
    for (const reportId of reportIds) {
      try {
        await takeActionOnReport(reportId, { action, actionDetails, adminId });
        results.successful.push(reportId);
      } catch (error) {
        results.failed.push({ reportId, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error performing bulk action:', error);
    throw error;
  }
};

/**
 * Get action summary for a user
 */
export const getUserActionSummary = async (userId) => {
  try {
    const actionsQuery = query(
      collection(db, 'admin_actions'),
      where('targetUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(actionsQuery);
    const actions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const summary = {
      totalActions: actions.length,
      warnings: actions.filter(a => a.action === ADMIN_ACTIONS.WARNING).length,
      bans: actions.filter(a => a.action === ADMIN_ACTIONS.TEMPORARY_BAN || a.action === ADMIN_ACTIONS.PERMANENT_BAN).length,
      suspensions: actions.filter(a => a.action === ADMIN_ACTIONS.ACCOUNT_SUSPENDED).length,
      contentRemovals: actions.filter(a => a.action === ADMIN_ACTIONS.CONTENT_REMOVED).length,
      recentActions: actions.slice(0, 5),
    };
    
    return summary;
  } catch (error) {
    console.error('Error getting user action summary:', error);
    throw error;
  }
};