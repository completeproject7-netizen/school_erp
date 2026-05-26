import {
  LayoutDashboard, GraduationCap, Users, BookOpen, ClipboardCheck, Wallet,
  Bell, CalendarDays, Settings, UserCog, Building2, FileText, BarChart3,
  Library, MessageSquare, ClipboardList, Receipt, Shield,
} from "lucide-react";
import type { Role } from "@/lib/auth";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

const dashboard: NavItem = { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard };

const NAV: Record<Role, NavGroup[]> = {
  administrator: [
    { label: "Overview", items: [dashboard] },
    { label: "People", items: [
      { title: "Students", to: "/students", icon: GraduationCap },
      { title: "Staff & Teachers", to: "/staff", icon: UserCog },
      { title: "Admissions", to: "/admissions", icon: Building2 },
    ]},
    { label: "Operations", items: [
      { title: "Academics", to: "/academics", icon: BookOpen },
      { title: "Fees", to: "/fees", icon: Wallet },
      { title: "Announcements", to: "/announcements", icon: Bell },
      { title: "Events", to: "/events", icon: CalendarDays },
    ]},
    { label: "Insights", items: [
      { title: "Analytics", to: "/analytics", icon: BarChart3 },
      { title: "Audit Logs", to: "/audit", icon: Shield },
      { title: "Settings", to: "/settings", icon: Settings },
    ]},
  ],
  teacher: [
    { label: "Overview", items: [dashboard] },
    { label: "Teaching", items: [
      { title: "My Classes", to: "/my-classes", icon: Users },
      { title: "Attendance", to: "/take-attendance", icon: ClipboardCheck },
      { title: "Gradebook", to: "/gradebook", icon: BookOpen },
      { title: "Assignments", to: "/assignments", icon: FileText },
      { title: "Timetable", to: "/timetable", icon: CalendarDays },
      { title: "Library", to: "/library", icon: Library },
    ]},
    { label: "Communication", items: [
      { title: "Announcements", to: "/announcements", icon: Bell },
      { title: "Messages", to: "/messages", icon: MessageSquare },
    ]},
  ],
  student: [
    { label: "Overview", items: [dashboard] },
    { label: "Academics", items: [
      { title: "My Courses", to: "/my-courses", icon: BookOpen },
      { title: "Grades", to: "/my-grades", icon: ClipboardCheck },
      { title: "Assignments", to: "/my-assignments", icon: FileText },
      { title: "Timetable", to: "/timetable", icon: CalendarDays },
      { title: "Attendance", to: "/my-attendance", icon: ClipboardList },
    ]},
    { label: "School Life", items: [
      { title: "Fees", to: "/my-fees", icon: Wallet },
      { title: "Library", to: "/library", icon: Library },
      { title: "Announcements", to: "/announcements", icon: Bell },
      { title: "Events", to: "/events", icon: CalendarDays },
    ]},
  ],
  admission: [
    { label: "Overview", items: [dashboard] },
    { label: "Admissions", items: [
      { title: "Applications", to: "/admissions", icon: Building2 },
      { title: "Inquiries", to: "/inquiries", icon: MessageSquare },
      { title: "Enrollment", to: "/enrollment", icon: GraduationCap },
      { title: "Documents", to: "/documents", icon: FileText },
    ]},
    { label: "Communication", items: [
      { title: "Announcements", to: "/announcements", icon: Bell },
      { title: "Messages", to: "/messages", icon: MessageSquare },
    ]},
  ],
  staff: [
    { label: "Overview", items: [dashboard] },
    { label: "Workplace", items: [
      { title: "My Profile", to: "/my-profile", icon: UserCog },
      { title: "Leave", to: "/my-leave", icon: CalendarDays },
      { title: "Payslips", to: "/payslips", icon: Receipt },
      { title: "Tasks", to: "/tasks", icon: ClipboardList },
    ]},
    { label: "School", items: [
      { title: "Announcements", to: "/announcements", icon: Bell },
      { title: "Events", to: "/events", icon: CalendarDays },
    ]},
  ],
};

export function getNavForRole(role: Role): NavGroup[] {
  return NAV[role];
}
