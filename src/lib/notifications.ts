import type { Role } from "@/lib/auth";

export interface NotificationItem {
  title: string;
  to: string;
}

const NOTIFICATIONS: Record<Role, NotificationItem[]> = {
  administrator: [
    { title: "3 event requests pending approval", to: "/events" },
    { title: "New announcement posted", to: "/announcements" },
    { title: "Pending audit review", to: "/audit" },
  ],
  teacher: [
    { title: "2 assignment submissions waiting", to: "/assignments" },
    { title: "New campus notice available", to: "/announcements" },
    { title: "Attendance reports need review", to: "/take-attendance" },
  ],
  student: [
    { title: "Fee due reminder", to: "/my-fees" },
    { title: "Upcoming event: Sports Day", to: "/events" },
    { title: "New grade posted in your gradebook", to: "/my-grades" },
  ],
  admission: [
    { title: "3 new inquiries received", to: "/inquiries" },
    { title: "Application pending review", to: "/admissions" },
    { title: "Enrollment request updated", to: "/enrollment" },
  ],
  staff: [
    { title: "Task updates available", to: "/tasks" },
    { title: "New internal memo", to: "/announcements" },
    { title: "Leave approval pending", to: "/my-leave" },
  ],
};

const STORAGE_PREFIX = "educore:notifications";

function getNotificationsStorageKey(role: Role) {
  return `${STORAGE_PREFIX}:${role}`;
}

export function getNotificationsForRole(role: Role): NotificationItem[] {
  return NOTIFICATIONS[role] ?? [];
}

export function loadNotificationsForRole(role: Role): NotificationItem[] {
  if (typeof window === "undefined") return getNotificationsForRole(role);

  try {
    const raw = window.localStorage.getItem(getNotificationsStorageKey(role));
    if (!raw) return getNotificationsForRole(role);
    const parsed = JSON.parse(raw) as NotificationItem[];
    if (!Array.isArray(parsed)) return getNotificationsForRole(role);
    return parsed;
  } catch {
    return getNotificationsForRole(role);
  }
}

export function saveNotificationsForRole(role: Role, notifications: NotificationItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getNotificationsStorageKey(role), JSON.stringify(notifications));
}

export function resetNotificationsForRole(role: Role) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getNotificationsStorageKey(role));
}
