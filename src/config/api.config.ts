// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://mpiglobal.org",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      REFRESH: "/auth/refresh", // Updated to match API spec
      GENERATE_OTP: "/auth/generate-otp",
      VERIFY_OTP: "/auth/verify-otp",
      SESSIONS: "/auth/sessions",
      REQUEST_PASSWORD_RESET: "/auth/request-password-reset",
      VERIFY_PASSWORD_RESET_OTP: "/auth/forget-password-otp",
      RESET_PASSWORD_OTP: "/auth/reset-password-otp",
    },
    USER: {
      PROFILE: "/user/profile",
      UPDATE: "/user/update",
    },
    MATCHES: {
      LIST: "/matches",
      CREATE: "/matches/create",
      DETAIL: "/matches/:id",
    },
    CALENDAR: {
      EVENTS: "/api/v1/calendar/events",
      UPCOMING: "/api/v1/calendar/upcoming",
    },
    JOURNALS: {
      LIST: "/api/v1/journals",
      CREATE: "/api/v1/journals",
      DETAIL: "/api/v1/journals/:id",
      UPDATE: "/api/v1/journals/:id",
      DELETE: "/api/v1/journals/:id",
    },
    JOURNAL_FOLDERS: {
      LIST: "/api/v1/folder",
      CREATE: "/api/v1/folder",
      DETAIL: "/api/v1/folder/:id",
      UPDATE: "/api/v1/folder/:id",
      DELETE: "/api/v1/folder/:id",
    },
    FRIENDSHIP: {
      BASE: "/api/v1/friendship",
      FRIEND_REQUEST: "/api/v1/friendship/friendRequest",
      SENT: "/api/v1/friendship/sent",
      ACCEPT: "/api/v1/friendship/:id/accept",
      REJECT: "/api/v1/friendship/:id/reject",
      UNFRIEND: "/api/v1/friendship/:id/unfriend",
      BLOCK: "/api/v1/friendship/:id/block",
      UNBLOCK: "/api/v1/friendship/:id/unblock",
      BLOCKED: "/api/v1/friendship/blocked",
    },
    USERS: {
      SEARCH: "/api/v1/users/search",
      INVITE: "/api/v1/users/invite",
    },
    PLAYERS: {
      LIST: "/api/v1/users/players",
      DETAIL: "/api/v1/users/players/:id",
      SEARCH: "/api/v1/users/players/search",
      STATS: "/api/v1/users/players/:id/stats",
    },
    CHILDREN: {
      LIST: "/api/v1/users/children",
      DETAIL: "/api/v1/users/children/:id",
      SEARCH: "/api/v1/users/children/search",
    },
    SOT: {
      BASE: "/api/v1/periodizations",
      PLAYER_PERIODIZATIONS: "/api/v1/periodizations/:playerId",
      PERIODIZATION_DETAIL: "/api/v1/periodizations/:playerId/:periodizationId",
      STATUS: "/api/v1/periodizations/:playerId/:periodizationId/status",
      PREPARATION: "/api/v1/periodizations/:playerId/:periodizationId/preparation",
      COMPETITION: "/api/v1/periodizations/:playerId/:periodizationId/competition",
      TRANSITION: "/api/v1/periodizations/:playerId/:periodizationId/transition",
    },
    CHATS: {
      BASE: "/api/v1/chats",
      LIST: "/api/v1/chats",
      DIRECT: "/api/v1/chats",
      GROUP: "/api/v1/chats/group",
      GROUP_DETAIL: "/api/v1/chats/group/:chatId",
      GROUP_NAME: "/api/v1/chats/group/:chatId/name",
      GROUP_PHOTO: "/api/v1/chats/group/:chatId/photo",
      GROUP_ADD_USERS: "/api/v1/chats/group/:chatId/add",
      GROUP_REMOVE_USERS: "/api/v1/chats/group/:chatId/remove",
      GROUP_LEAVE: "/api/v1/chats/group/:chatId/leave",
      GROUP_DELETE: "/api/v1/chats/group/:chatId",
      GROUP_TRANSFER_ADMIN: "/api/v1/chats/group/:chatId/transfer-admin",
      ARCHIVE: "/api/v1/chats/:chatId/archive",
      PIN: "/api/v1/chats/:chatId/pin",
      MARK_READ: "/api/v1/chats/:chatId/mark-read",
      MUTE: "/api/v1/chats/:chatId/mute",
      STATISTICS: "/api/v1/chats/:chatId/statistics",
      SEARCH_MESSAGES: "/api/v1/chats/:chatId/search",
      TOTAL_UNREAD: "/api/v1/chats/totalUnreadCount",
      BULK_OPERATIONS: "/api/v1/chats/bulk-operations",
      USER_CHAT: "/api/v1/chats/user/:userId",
    },
    DASHBOARD: {
      BASE: "/api/v1/dashboard",
      ME: "/api/v1/dashboard/me",
      MATCHES: "/api/v1/dashboard/matches/:matchId",
      PLAYER_MATCHES: "/api/v1/dashboard/:playerId/matches",
    },
    NOTIFICATIONS: {
      BASE: "/api/v1/notifications",
      LIST: "/api/v1/notifications",
      STATS: "/api/v1/notifications/stats",
      MARK_READ: "/api/v1/notifications/read",
      MARK_READ_BY_ID: "/api/v1/notifications/:id/read",
      DELETE: "/api/v1/notifications/:id",
      CREATE: "/api/v1/notifications",
      PLAYER_MATCH: "/api/v1/dashboard/:playerId/matches/:matchId",
      PLAYER_DASHBOARD: "/api/v1/dashboard/:playerId",
    },
  },
  TIMEOUT: 60000, // 60 seconds - increased for calendar operations
  RETRY_ATTEMPTS: 3,
};

// Helper function to build full URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
