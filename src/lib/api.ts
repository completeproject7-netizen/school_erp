import type { User } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

function getCsrfToken() {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrf_token="))
    ?.split("=")[1];
}

type JsonRequestInit = Omit<RequestInit, "body"> & { body?: unknown };

function getStoredAccessToken() {
  return window.localStorage.getItem("campus_hub_access_token");
}

function getStoredCsrfToken() {
  return window.localStorage.getItem("campus_hub_csrf_token") || getCsrfToken();
}

async function apiRequest<T>(path: string, options: JsonRequestInit = {}) {
  const csrfToken = getStoredCsrfToken();
  const accessToken = getStoredAccessToken();
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        ...(options.headers || {}),
      },
      ...options,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Network error: ${error.message}`
        : "Network error: Unable to reach the API server",
    );
  }

  const contentType = response.headers.get("Content-Type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message || response.statusText || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export async function fetchStudents() {
  return apiRequest<{ students: Array<{ id: string; studentId: string; name: string; email: string; role: string; class?: string | null; meta?: Record<string, string | null> }> }>('/students');
}

export async function fetchStaff() {
  return apiRequest<{ staff: Array<{ id: string; name: string; email: string; role: string; meta?: Record<string, string> }> }>("/staff");
}

export async function createStudent(payload: { studentId?: string; name: string; email: string; password: string; meta?: Record<string, string> }) {
  return apiRequest<{ student: any }>("/students", {
    method: "POST",
    body: payload,
  });
}

export async function deleteStudent(id: string) {
  return apiRequest<{ message: string }>(`/students/${id}`, {
    method: "DELETE",
  });
}

export async function createStaff(payload: { name: string; email: string; password: string; role?: string; meta?: Record<string, string> }) {
  return apiRequest<{ staff: any }>("/staff", {
    method: "POST",
    body: payload,
  });
}

export async function deleteStaff(id: string) {
  return apiRequest<{ message: string }>(`/staff/${id}`, {
    method: "DELETE",
  });
}

export async function fetchCourses() {
  return apiRequest<{ courses: Array<{ id: string; title: string; description: string; teacherId: string | null; teacherName?: string | null; credits: number; grade?: string | null; createdAt: string }> }> ("/courses");
}

export async function createCourse(payload: { title: string; description: string; grade: string; teacherName?: string; credits?: number; day?: string; time?: string; room?: string }) {
  return apiRequest<{ course: any }>("/courses", {
    method: "POST",
    body: payload,
  });
}
export async function deleteCourse(id: string) {
  return apiRequest<{ message: string }>(`/courses/${id}`, {
    method: "DELETE",
  });
}
export type AssignmentAttachment = {
  fileName: string;
  mimeType: string;
  data: string;
};

export async function fetchAssignments() {
  return apiRequest<{ assignments: Array<{ id: string; courseId: string; title: string; description: string; dueDate: string | null; createdBy: string; createdByName?: string | null; attachment?: AssignmentAttachment | null; createdAt: string }> }>('/assignments');
}

export async function createAssignment(payload: { courseId: string; title: string; description: string; dueDate?: string; attachment?: AssignmentAttachment }) {
  return apiRequest<{ assignment: { id: string; courseId: string; title: string; description: string; dueDate: string | null; createdBy: string; attachment?: AssignmentAttachment | null; createdAt: string } }>('/assignments', {
    method: 'POST',
    body: payload,
  });
}

export type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  attachment?: AssignmentAttachment | null;
  submittedAt: string;
  grade: number | null;
  feedback: string;
};

export async function createSubmission(payload: {
  assignmentId: string;
  content?: string;
  attachment?: AssignmentAttachment;
}) {
  return apiRequest<{ submission: Submission }>('/submissions', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchSubmissions() {
  return apiRequest<{ submissions: Submission[] }>('/submissions');
}

export async function fetchSubmissionsForAssignment(assignmentId: string) {
  return apiRequest<{ submissions: Submission[] }>(`/submissions/assignment/${assignmentId}`);
}

export async function fetchStudentSubmissions(studentId: string) {
  return apiRequest<{ submissions: Submission[] }>(`/submissions/student/${studentId}`);
}

export async function fetchFees() {
  return apiRequest<{ fees: Array<{ id: string; studentId: string; amount: number; description: string; paidAt: string; paymentMethod: string; createdBy: string; createdByName?: string | null }> }>("/fees");
}

export async function createFee(payload: { studentId: string; amount: number; description: string; paymentMethod?: "online" | "cash" }) {
  return apiRequest<{ payment: { id: string } }>("/fees/pay", {
    method: "POST",
    body: payload,
  });
}

export async function fetchMyFees() {
  return apiRequest<{ fees: Array<{ id: string; studentId: string; amount: number; description: string; paidAt: string; paymentMethod: string; createdBy: string; createdByName?: string | null }> }>("/fees/mine");
}

export async function fetchAttendance(params?: { grade?: string; date?: string; courseId?: string; studentId?: string }) {
  const query = new URLSearchParams();
  if (params?.grade) query.set("grade", params.grade);
  if (params?.date) query.set("date", params.date);
  if (params?.courseId) query.set("courseId", params.courseId);
  if (params?.studentId) query.set("studentId", params.studentId);

  const queryString = query.toString();
  return apiRequest<{ attendance: Array<{ id: string; studentId: string; courseId: string | null; date: string; status: string; notes: string }> }>(
    `/attendance${queryString ? `?${queryString}` : ""}`,
  );
}

export async function fetchMyAttendance() {
  const response = await apiRequest<{ attendance: Array<{ id: string; studentId: string; courseId: string | null; date: string; status: string; notes: string }> }>("/attendance/mine");
  return {
    attendance: response.attendance.map((item) => ({
      ...item,
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase(),
    })),
  };
}

type AttendanceStatus = "present" | "absent" | "late";

function normalizeAttendanceStatus(status: string): AttendanceStatus {
  if (status === "P" || status.toLowerCase() === "present") return "present";
  if (status === "A" || status.toLowerCase() === "absent") return "absent";
  if (status === "L" || status.toLowerCase() === "late") return "late";
  throw new Error(`Invalid attendance status: ${status}`);
}

export async function submitAttendance(payload: { studentId: string; status: string; courseId?: string | null; date?: string; notes?: string }) {
  return apiRequest<{ attendance: { id: string } }>("/attendance", {
    method: "POST",
    body: {
      ...payload,
      status: normalizeAttendanceStatus(payload.status),
    },
  });
}

export async function fetchAnnouncements() {
  return apiRequest<{ announcements: Array<{ id: string; title: string; body: string; audience: string; pinned: boolean; postedBy: string; postedAt: string }>; connected: boolean; source?: string }>('/announcements');
}

export async function createAnnouncement(payload: { title: string; body: string; audience: string; pinned?: boolean }) {
  return apiRequest<{ announcement: any }>("/announcements", {
    method: "POST",
    body: payload,
  });
}

export async function deleteAnnouncement(id: string) {
  return apiRequest<{ message: string }>(`/announcements/${id}`, {
    method: "DELETE",
  });
}

export async function fetchInquiries() {
  return apiRequest<{ inquiries: Array<{ id: string; parent: string; email: string; phone: string; interestedIn: string; receivedOn: string; status: string }> }>("/inquiries");
}
export async function updateInquiry(id: string, payload: { status: string }) {
  return apiRequest<{ inquiry: any; application?: any }>(`/inquiries/${id}`, {
    method: 'PUT',
    body: payload,
  });
}
export async function fetchDocuments() {
  return apiRequest<{ documents: Array<{ id: string; name: string; type: string; owner: string; uploaded: string; size: string; content?: string | null }> }> ("/documents");
}
export async function uploadDocument(payload: { owner: string; name: string; type: string; size: string; data?: string }) {
  return apiRequest<{ document: any }>('/documents', {
    method: 'POST',
    body: payload,
  });
}
export async function fetchEvents() {
  return apiRequest<{
    events: Array<{ id: string; title: string; date: string; time: string; venue: string; category: string; attendees: string; status?: string; requestedByName?: string; approvedByName?: string; approvedAt?: string }>;
    requests?: Array<{ id: string; title: string; date: string; time: string; venue: string; category: string; attendees: string; status: string; requestedByName?: string; approvedByName?: string; approvedAt?: string }>;
    connected?: boolean;
    source?: string;
  }>('/events');
}

export async function createEvent(payload: { title: string; date: string; time: string; venue: string; category: string; attendees: string }) {
  return apiRequest<{ event: any }>("/events", {
    method: "POST",
    body: payload,
  });
}

export async function approveEvent(id: string) {
  return apiRequest<{ event: any }>(`/events/${id}/approve`, {
    method: "PUT",
  });
}

export async function deleteEvent(id: string) {
  return apiRequest<{ message: string }>(`/events/${id}`, {
    method: "DELETE",
  });
}

export async function fetchLibraryBooks() {
  return apiRequest<{ books: Array<{ id: string; title: string; author: string; category: string; copies: number; available: number; isbn: string }> }>("/library");
}

export async function fetchTasks() {
  return apiRequest<{ tasks: Array<{ id: string; title: string; assignee: string; due: string; priority: string; status: string }> }>("/tasks");
}

export async function fetchMessages() {
  return apiRequest<{ messages: Array<{ id: string; from: string; subject: string; preview: string; at: string; unread?: boolean; replies?: Array<{ id: string; from: string; body: string; at: string }> }>; }>('/messages');
}

export async function createMessage(payload: { subject: string; body: string; to?: string }) {
  return apiRequest<{ message: any }>('/messages', {
    method: 'POST',
    body: payload,
  });
}

export async function createMessageReply(payload: { messageId: string; body: string }) {
  return apiRequest<{ message: any }>("/messages/reply", {
    method: "POST",
    body: payload,
  });
}

export async function fetchTimetable(grade?: string) {
  const query = grade ? `?grade=${encodeURIComponent(grade)}` : "";
  return apiRequest<{ timetable: Array<{ day: string; time: string; subject: string; room: string; teacher: string; grade?: string }> }>(`/timetable${query}`);
}

export async function fetchApplications() {
  return apiRequest<{ applications: Array<{ id: string; applicant: string; appliedFor: string; date: string; stage: string; score?: number; studentId?: string }> }>('/applications');
}

export async function confirmApplication(id: string) {
  return apiRequest<{ enrollment: any }>(`/applications/${id}/confirm`, {
    method: 'PUT',
  });
}

export async function createApplication(payload: { applicant: string; appliedFor: string; stage: string; score?: number; date?: string }) {

  return apiRequest<{ application: any }>("/applications", {
    method: "POST",
    body: payload,
  });
}

export async function updateApplication(id: string, payload: { applicant?: string; appliedFor?: string; stage?: string; score?: number }) {
  return apiRequest<{ application: any }>(`/applications/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteApplication(id: string) {
  return apiRequest<{ message: string }>(`/applications/${id}`, {
    method: "DELETE",
  });
}

export async function fetchEnrollments() {
  return apiRequest<{ enrollments: Array<{ id: string; applicant: string; appliedFor: string; date: string; stage: string; score?: number; enrollmentStatus: string; studentId?: string }> }>('/enrollments');
}

export async function enrollStudent(id: string, email: string, parentMobile: string) {
  return apiRequest<{ student: any; enrollment: any }>(`/enrollments/${id}/enroll`, {
    method: 'POST',
    body: { email, parentMobile },
  });
}

export async function fetchLeaves() {
  return apiRequest<{ leaves: Array<{ id: string; applicant: string; type: string; from: string; to: string; days: number; status: string }> }>("/leaves");
}

export async function fetchMyGrades() {
  return apiRequest<{ grades: Array<{ course: string; teacher: string; grade: string; percent: number; trend: string }> }>("/grades/mine");
}

export async function fetchGradebook() {
  return apiRequest<{ gradebook: Array<{ id: string; name: string; grade: string; quiz1: number; midterm: number; project: number; final: number; gpa: number; course?: string; teacher?: string }> }>("/gradebook");
}

export async function updateGradebookEntry(payload: { id: string; quiz1: number; midterm: number; project: number; final: number; name?: string; studentEmail?: string }) {
  return apiRequest<{ gradebook: any }>("/gradebook", {
    method: "POST",
    body: payload,
  });
}

export async function fetchPayslips() {
  return apiRequest<{ payslips: Array<{ id: string; month: string; gross: number; deductions: number; net: number; status: string }> }>("/payslips/mine");
}

export async function fetchAuditLogs() {
  return apiRequest<{ audit: Array<{ id: string; actor: string; action: string; target: string; at: string; ip: string }> }>("/audit");
}

export async function fetchAnalytics() {
  return apiRequest<{
    totals: {
      students: number;
      teachers: number;
      staff: number;
      admissions: number;
      courses: number;
      assignments: number;
    };
    fees: {
      totalCollected: number;
      totalPayments: number;
    };
    events: {
      approved: number;
      pending: number;
    };
    announcements: number;
    studentTrend: Array<{ _id: string; count: number }>;
  }>("/analytics/dashboard");
}
export async function fetchAttendanceSummary() {
  return apiRequest<{ summary: Array<{ status: string; count: number }>; byGrade: Array<{ grade: string; statuses: Array<{ status: string; count: number }> }> }>('/analytics/attendance-summary');
}
export async function fetchMe() {
  return apiRequest<{ user: User }>("/auth/me");
}

export async function loginRequest(email: string, password: string) {
  return apiRequest<{ user: User }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}
export async function forgotPasswordRequest(email: string, newPassword: string) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email, newPassword, confirmPassword: newPassword },
  });
}
export async function logoutRequest() {
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}
