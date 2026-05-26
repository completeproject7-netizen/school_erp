// Dummy in-memory "database" for the EduCore demo.
// Used across all role pages to render realistic content.

export interface Student {
  id: string;
  name: string;
  roll: string;
  grade: string;
  section: string;
  guardian: string;
  email: string;
  phone: string;
  attendance: number; // %
  gpa: number;
  feeStatus: "Paid" | "Pending" | "Overdue";
  status: "Active" | "On Leave" | "Graduated";
}

export interface StaffMember {
  id: string;
  name: string;
  role: "Teacher" | "Admission" | "Librarian" | "Accountant" | "Admin" | "Maintenance" | "Counselor";
  department: string;
  email: string;
  phone: string;
  joined: string;
  status: "Active" | "On Leave";
}

export interface Course {
  id: string;
  code: string;
  title: string;
  teacher: string;
  grade: string;
  credits: number;
  students: number;
  schedule: string;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  due: string;
  status: "Open" | "Submitted" | "Graded" | "Late";
  score?: string;
}

export interface FeeRecord {
  id: string;
  student: string;
  grade: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Pending" | "Overdue";
  method?: string;
}

export interface Application {
  id: string;
  applicant: string;
  appliedFor: string;
  date: string;
  stage: "New" | "Documents" | "Interview" | "Approved" | "Rejected" | "Waitlist";
  score?: number;
}

export interface Inquiry {
  id: string;
  parent: string;
  email: string;
  phone: string;
  interestedIn: string;
  receivedOn: string;
  status: "New" | "Contacted" | "Tour Scheduled" | "Closed";
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  category: "Academic" | "Sports" | "Cultural" | "Meeting" | "Holiday";
  attendees: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "All" | "Students" | "Teachers" | "Staff" | "Parents";
  postedBy: string;
  postedAt: string;
  pinned?: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  copies: number;
  available: number;
  isbn: string;
}

export interface LeaveRequest {
  id: string;
  applicant: string;
  type: "Sick" | "Casual" | "Earned" | "Unpaid";
  from: string;
  to: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
}

export interface Payslip {
  id: string;
  month: string;
  gross: number;
  deductions: number;
  net: number;
  status: "Paid" | "Processing";
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  due: string;
  priority: "Low" | "Normal" | "High";
  status: "Todo" | "In Progress" | "Done";
}

export interface Document {
  id: string;
  name: string;
  type: string;
  owner: string;
  uploaded: string;
  size: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  ip: string;
}

export interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  at: string;
  unread?: boolean;
}

export interface TimetableSlot {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  time: string;
  subject: string;
  room: string;
  teacher?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const STUDENTS: Student[] = [
  { id: "S-2026-104", name: "Emma Wilson", roll: "104", grade: "Grade 10", section: "A", guardian: "Robert Wilson", email: "emma.w@educore.school", phone: "+1 555-0104", attendance: 97, gpa: 3.8, feeStatus: "Paid", status: "Active" },
  { id: "S-2026-105", name: "Liam Patel", roll: "105", grade: "Grade 10", section: "A", guardian: "Anita Patel", email: "liam.p@educore.school", phone: "+1 555-0105", attendance: 92, gpa: 3.5, feeStatus: "Pending", status: "Active" },
  { id: "S-2026-106", name: "Sophia Garcia", roll: "106", grade: "Grade 10", section: "B", guardian: "Maria Garcia", email: "sophia.g@educore.school", phone: "+1 555-0106", attendance: 99, gpa: 3.9, feeStatus: "Paid", status: "Active" },
  { id: "S-2026-107", name: "Noah Kim", roll: "107", grade: "Grade 9", section: "A", guardian: "Joon Kim", email: "noah.k@educore.school", phone: "+1 555-0107", attendance: 88, gpa: 3.2, feeStatus: "Overdue", status: "Active" },
  { id: "S-2026-108", name: "Olivia Brown", roll: "108", grade: "Grade 9", section: "B", guardian: "Lisa Brown", email: "olivia.b@educore.school", phone: "+1 555-0108", attendance: 94, gpa: 3.6, feeStatus: "Paid", status: "Active" },
  { id: "S-2026-109", name: "Mason Lee", roll: "109", grade: "Grade 11", section: "A", guardian: "David Lee", email: "mason.l@educore.school", phone: "+1 555-0109", attendance: 96, gpa: 3.7, feeStatus: "Paid", status: "Active" },
  { id: "S-2026-110", name: "Ava Martinez", roll: "110", grade: "Grade 11", section: "B", guardian: "Carlos Martinez", email: "ava.m@educore.school", phone: "+1 555-0110", attendance: 91, gpa: 3.4, feeStatus: "Pending", status: "Active" },
  { id: "S-2026-111", name: "Ethan Singh", roll: "111", grade: "Grade 12", section: "A", guardian: "Raj Singh", email: "ethan.s@educore.school", phone: "+1 555-0111", attendance: 85, gpa: 3.1, feeStatus: "Paid", status: "Active" },
  { id: "S-2026-112", name: "Isabella Chen", roll: "112", grade: "Grade 12", section: "A", guardian: "Wei Chen", email: "isabella.c@educore.school", phone: "+1 555-0112", attendance: 98, gpa: 4.0, feeStatus: "Paid", status: "Active" },
  { id: "S-2026-113", name: "Lucas Müller", roll: "113", grade: "Grade 8", section: "A", guardian: "Hans Müller", email: "lucas.m@educore.school", phone: "+1 555-0113", attendance: 93, gpa: 3.5, feeStatus: "Paid", status: "Active" },
  { id: "S-2026-114", name: "Mia Johnson", roll: "114", grade: "Grade 8", section: "B", guardian: "Karen Johnson", email: "mia.j@educore.school", phone: "+1 555-0114", attendance: 89, gpa: 3.3, feeStatus: "Pending", status: "On Leave" },
  { id: "S-2026-115", name: "Aiden Nguyen", roll: "115", grade: "Grade 7", section: "A", guardian: "Linh Nguyen", email: "aiden.n@educore.school", phone: "+1 555-0115", attendance: 95, gpa: 3.6, feeStatus: "Paid", status: "Active" },
];

export const STAFF: StaffMember[] = [
  { id: "T-001", name: "James Carter", role: "Teacher", department: "Mathematics", email: "j.carter@educore.school", phone: "+1 555-0201", joined: "2019-08-12", status: "Active" },
  { id: "T-002", name: "Sarah Bennett", role: "Teacher", department: "English", email: "s.bennett@educore.school", phone: "+1 555-0202", joined: "2020-01-09", status: "Active" },
  { id: "T-003", name: "David Park", role: "Teacher", department: "Physics", email: "d.park@educore.school", phone: "+1 555-0203", joined: "2018-07-22", status: "Active" },
  { id: "T-004", name: "Maya Iyer", role: "Teacher", department: "Biology", email: "m.iyer@educore.school", phone: "+1 555-0204", joined: "2021-09-01", status: "Active" },
  { id: "T-005", name: "Robert Lee", role: "Librarian", department: "Library", email: "r.lee@educore.school", phone: "+1 555-0205", joined: "2017-03-15", status: "Active" },
  { id: "T-006", name: "Priya Sharma", role: "Admission", department: "Admissions", email: "p.sharma@educore.school", phone: "+1 555-0206", joined: "2022-04-04", status: "Active" },
  { id: "T-007", name: "Aisha Khan", role: "Admin", department: "Administration", email: "a.khan@educore.school", phone: "+1 555-0207", joined: "2015-06-01", status: "Active" },
  { id: "T-008", name: "Marco Rossi", role: "Accountant", department: "Finance", email: "m.rossi@educore.school", phone: "+1 555-0208", joined: "2019-11-11", status: "Active" },
  { id: "T-009", name: "Hannah Cole", role: "Counselor", department: "Student Affairs", email: "h.cole@educore.school", phone: "+1 555-0209", joined: "2023-02-20", status: "On Leave" },
  { id: "T-010", name: "Tom O'Brien", role: "Maintenance", department: "Facilities", email: "t.obrien@educore.school", phone: "+1 555-0210", joined: "2016-10-05", status: "Active" },
];

export const COURSES: Course[] = [
  { id: "C-101", code: "MATH-9A", title: "Algebra I", teacher: "James Carter", grade: "Grade 9", credits: 4, students: 32, schedule: "Mon/Wed/Fri 09:00" },
  { id: "C-102", code: "MATH-10A", title: "Geometry", teacher: "James Carter", grade: "Grade 10", credits: 4, students: 28, schedule: "Tue/Thu 10:00" },
  { id: "C-103", code: "ENG-10", title: "English Literature", teacher: "Sarah Bennett", grade: "Grade 10", credits: 3, students: 30, schedule: "Mon/Wed 11:00" },
  { id: "C-104", code: "PHY-11", title: "Physics", teacher: "David Park", grade: "Grade 11", credits: 4, students: 26, schedule: "Tue/Thu/Fri 13:00" },
  { id: "C-105", code: "BIO-12", title: "Biology Honors", teacher: "Maya Iyer", grade: "Grade 12", credits: 4, students: 22, schedule: "Mon/Wed/Fri 14:30" },
  { id: "C-106", code: "HIS-9", title: "World History", teacher: "Sarah Bennett", grade: "Grade 9", credits: 3, students: 31, schedule: "Tue/Thu 11:30" },
];

export const ASSIGNMENTS: Assignment[] = [
  { id: "A-1", title: "Algebra Worksheet 5", course: "Algebra I", due: "Apr 8", status: "Open" },
  { id: "A-2", title: "Lab Report — Optics", course: "Physics", due: "Apr 10", status: "Submitted", score: "—" },
  { id: "A-3", title: "Essay: Industrial Era", course: "World History", due: "Apr 14", status: "Open" },
  { id: "A-4", title: "Reading: Ch. 12 — Macbeth", course: "English Literature", due: "Apr 18", status: "Open" },
  { id: "A-5", title: "Geometry Quiz 3", course: "Geometry", due: "Apr 4", status: "Graded", score: "92/100" },
  { id: "A-6", title: "Cell Biology Diagram", course: "Biology Honors", due: "Apr 2", status: "Late" },
];

export const FEES: FeeRecord[] = [
  { id: "F-1001", student: "Emma Wilson", grade: "Grade 10", amount: 2500, dueDate: "Apr 15", status: "Paid", method: "Card" },
  { id: "F-1002", student: "Liam Patel", grade: "Grade 10", amount: 2500, dueDate: "Apr 15", status: "Pending" },
  { id: "F-1003", student: "Sophia Garcia", grade: "Grade 10", amount: 2500, dueDate: "Apr 15", status: "Paid", method: "Bank" },
  { id: "F-1004", student: "Noah Kim", grade: "Grade 9", amount: 2300, dueDate: "Mar 15", status: "Overdue" },
  { id: "F-1005", student: "Olivia Brown", grade: "Grade 9", amount: 2300, dueDate: "Apr 15", status: "Paid", method: "Card" },
  { id: "F-1006", student: "Mason Lee", grade: "Grade 11", amount: 2700, dueDate: "Apr 15", status: "Paid", method: "Bank" },
  { id: "F-1007", student: "Ava Martinez", grade: "Grade 11", amount: 2700, dueDate: "Apr 15", status: "Pending" },
  { id: "F-1008", student: "Isabella Chen", grade: "Grade 12", amount: 2900, dueDate: "Apr 15", status: "Paid", method: "Card" },
];

export const APPLICATIONS: Application[] = [
  { id: "AP-501", applicant: "John Smith", appliedFor: "Grade 7", date: "Apr 1", stage: "Documents" },
  { id: "AP-502", applicant: "Aarti Patel", appliedFor: "Grade 9", date: "Apr 2", stage: "Interview", score: 87 },
  { id: "AP-503", applicant: "Liam O'Connor", appliedFor: "Grade 11", date: "Apr 2", stage: "New" },
  { id: "AP-504", applicant: "Mei Chen", appliedFor: "Grade 6", date: "Apr 3", stage: "Approved", score: 95 },
  { id: "AP-505", applicant: "Diego Alvarez", appliedFor: "Grade 8", date: "Apr 3", stage: "Waitlist", score: 72 },
  { id: "AP-506", applicant: "Hana Tanaka", appliedFor: "Grade 10", date: "Apr 4", stage: "Documents" },
  { id: "AP-507", applicant: "Yusuf Ali", appliedFor: "Grade 7", date: "Apr 5", stage: "Rejected", score: 58 },
  { id: "AP-508", applicant: "Chloe Dubois", appliedFor: "Grade 12", date: "Apr 5", stage: "Approved", score: 91 },
];

export const INQUIRIES: Inquiry[] = [
  { id: "Q-301", parent: "Rebecca Stone", email: "rstone@example.com", phone: "+1 555-1100", interestedIn: "Grade 6 — 2026", receivedOn: "Apr 4", status: "New" },
  { id: "Q-302", parent: "Daniel Kim", email: "dkim@example.com", phone: "+1 555-1101", interestedIn: "Grade 9 — 2026", receivedOn: "Apr 4", status: "Contacted" },
  { id: "Q-303", parent: "Fatima Ahmed", email: "fahmed@example.com", phone: "+1 555-1102", interestedIn: "Grade 11 (Sci.) — 2026", receivedOn: "Apr 3", status: "Tour Scheduled" },
  { id: "Q-304", parent: "Marco Bianchi", email: "mbianchi@example.com", phone: "+1 555-1103", interestedIn: "Grade 7 — 2026", receivedOn: "Apr 3", status: "Contacted" },
  { id: "Q-305", parent: "Sara Johansson", email: "sjohan@example.com", phone: "+1 555-1104", interestedIn: "Grade 12 — 2026", receivedOn: "Apr 2", status: "Closed" },
];

export const EVENTS: Event[] = [
  { id: "E-1", title: "Parent-Teacher Meeting", date: "Apr 28", time: "10:00 AM", venue: "Main Auditorium", category: "Meeting", attendees: "All parents" },
  { id: "E-2", title: "Annual Science Fair", date: "May 5", time: "9:00 AM", venue: "Science Block", category: "Academic", attendees: "Grades 7–12" },
  { id: "E-3", title: "Mid-Term Examinations", date: "May 10–18", time: "All day", venue: "All classrooms", category: "Academic", attendees: "All students" },
  { id: "E-4", title: "Inter-house Sports Day", date: "May 25", time: "8:00 AM", venue: "Sports Ground", category: "Sports", attendees: "All houses" },
  { id: "E-5", title: "Spring Cultural Night", date: "Jun 2", time: "6:30 PM", venue: "Open Theatre", category: "Cultural", attendees: "Open invitation" },
  { id: "E-6", title: "Summer Break Begins", date: "Jun 15", time: "—", venue: "—", category: "Holiday", attendees: "All" },
];

export const ANNOUNCEMENTS: Announcement[] = [
  { id: "N-1", title: "Mid-term schedule published", body: "The mid-term examination schedule for Grades 6–12 is now available in the Academics section. Please review your timetable carefully.", audience: "Students", postedBy: "Dr. Aisha Khan", postedAt: "2h ago", pinned: true },
  { id: "N-2", title: "Library renovation — May 1–7", body: "The main library will be closed for renovations. The annex on Block C will remain operational.", audience: "All", postedBy: "Robert Lee", postedAt: "Yesterday" },
  { id: "N-3", title: "Faculty meeting Friday 4 PM", body: "All teaching staff are required to attend the faculty meeting in the Conference Hall.", audience: "Teachers", postedBy: "Dr. Aisha Khan", postedAt: "2 days ago" },
  { id: "N-4", title: "Sports Day — house allocations", body: "House captains may now register their teams via the Events page. Deadline: May 18.", audience: "Students", postedBy: "James Carter", postedAt: "3 days ago" },
  { id: "N-5", title: "April payslips processed", body: "April payslips have been issued. Please verify and report any discrepancies to Finance by May 5.", audience: "Staff", postedBy: "Marco Rossi", postedAt: "4 days ago" },
];

export const BOOKS: Book[] = [
  { id: "B-1", title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", copies: 12, available: 4, isbn: "978-0061120084" },
  { id: "B-2", title: "Sapiens", author: "Yuval Noah Harari", category: "History", copies: 8, available: 2, isbn: "978-0062316097" },
  { id: "B-3", title: "Calculus: Early Transcendentals", author: "James Stewart", category: "Mathematics", copies: 15, available: 9, isbn: "978-1285741550" },
  { id: "B-4", title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", copies: 6, available: 1, isbn: "978-0553380163" },
  { id: "B-5", title: "Pride and Prejudice", author: "Jane Austen", category: "Fiction", copies: 10, available: 6, isbn: "978-1503290563" },
  { id: "B-6", title: "The Selfish Gene", author: "Richard Dawkins", category: "Biology", copies: 5, available: 0, isbn: "978-0198788607" },
  { id: "B-7", title: "Cosmos", author: "Carl Sagan", category: "Science", copies: 7, available: 3, isbn: "978-0345539434" },
];

export const LEAVES: LeaveRequest[] = [
  { id: "L-1", applicant: "Robert Lee", type: "Sick", from: "Apr 12", to: "Apr 13", days: 2, status: "Approved" },
  { id: "L-2", applicant: "Robert Lee", type: "Casual", from: "May 2", to: "May 2", days: 1, status: "Pending" },
  { id: "L-3", applicant: "Robert Lee", type: "Earned", from: "Jun 10", to: "Jun 14", days: 5, status: "Pending" },
  { id: "L-4", applicant: "Robert Lee", type: "Sick", from: "Mar 3", to: "Mar 3", days: 1, status: "Approved" },
];

export const PAYSLIPS: Payslip[] = [
  { id: "PS-202604", month: "April 2026", gross: 3200, deductions: 360, net: 2840, status: "Paid" },
  { id: "PS-202603", month: "March 2026", gross: 3200, deductions: 360, net: 2840, status: "Paid" },
  { id: "PS-202602", month: "February 2026", gross: 3200, deductions: 360, net: 2840, status: "Paid" },
  { id: "PS-202601", month: "January 2026", gross: 3100, deductions: 340, net: 2760, status: "Paid" },
];

export const TASKS: Task[] = [
  { id: "TK-1", title: "Restock library returns", assignee: "Robert Lee", due: "Today", priority: "High", status: "In Progress" },
  { id: "TK-2", title: "Process visitor logs", assignee: "Robert Lee", due: "Today", priority: "Normal", status: "Todo" },
  { id: "TK-3", title: "Inventory check — Lab B", assignee: "Tom O'Brien", due: "Tomorrow", priority: "Normal", status: "Todo" },
  { id: "TK-4", title: "Submit weekly report", assignee: "Robert Lee", due: "Fri", priority: "High", status: "Todo" },
  { id: "TK-5", title: "Order new whiteboard markers", assignee: "Tom O'Brien", due: "Next week", priority: "Low", status: "Done" },
];

export const DOCUMENTS: Document[] = [
  { id: "D-1", name: "Birth Certificate — John Smith", type: "PDF", owner: "AP-501", uploaded: "Apr 1", size: "1.2 MB" },
  { id: "D-2", name: "Previous Report Card — Aarti Patel", type: "PDF", owner: "AP-502", uploaded: "Apr 2", size: "880 KB" },
  { id: "D-3", name: "Transfer Certificate — Mei Chen", type: "PDF", owner: "AP-504", uploaded: "Apr 3", size: "640 KB" },
  { id: "D-4", name: "Photo ID — Diego Alvarez", type: "JPG", owner: "AP-505", uploaded: "Apr 3", size: "320 KB" },
  { id: "D-5", name: "Recommendation Letter — Hana Tanaka", type: "PDF", owner: "AP-506", uploaded: "Apr 4", size: "210 KB" },
];

export const AUDIT: AuditLog[] = [
  { id: "AU-1", actor: "admin@educore.school", action: "Updated student record", target: "S-2026-104", at: "2m ago", ip: "10.0.0.42" },
  { id: "AU-2", actor: "teacher@educore.school", action: "Posted grades", target: "C-102 / Quiz 3", at: "12m ago", ip: "10.0.0.51" },
  { id: "AU-3", actor: "admissions@educore.school", action: "Approved application", target: "AP-504", at: "1h ago", ip: "10.0.0.66" },
  { id: "AU-4", actor: "admin@educore.school", action: "Created announcement", target: "N-1", at: "2h ago", ip: "10.0.0.42" },
  { id: "AU-5", actor: "staff@educore.school", action: "Logged in", target: "—", at: "3h ago", ip: "10.0.0.81" },
  { id: "AU-6", actor: "admin@educore.school", action: "Issued payslips", target: "PS-202604 (×186)", at: "1d ago", ip: "10.0.0.42" },
];

export const MESSAGES: Message[] = [
  { id: "M-1", from: "Dr. Aisha Khan", subject: "Friday faculty meeting", preview: "Reminder: please bring your term plans…", at: "1h", unread: true },
  { id: "M-2", from: "Sarah Bennett", subject: "Co-teaching Grade 10", preview: "Could we sync about the joint project for…", at: "3h", unread: true },
  { id: "M-3", from: "Robert Lee", subject: "Library hours change", preview: "Starting Monday the library will open at…", at: "Yesterday" },
  { id: "M-4", from: "Marco Rossi", subject: "Reimbursement processed", preview: "Your March travel reimbursement has been…", at: "2d" },
  { id: "M-5", from: "Priya Sharma", subject: "New applicant tour", preview: "Could you host a brief campus tour for…", at: "3d" },
];

export const TIMETABLE: TimetableSlot[] = [
  { day: "Mon", time: "08:30", subject: "Algebra", room: "204", teacher: "J. Carter" },
  { day: "Mon", time: "10:00", subject: "English", room: "112", teacher: "S. Bennett" },
  { day: "Mon", time: "11:30", subject: "Physics", room: "Lab 3", teacher: "D. Park" },
  { day: "Mon", time: "13:30", subject: "History", room: "208", teacher: "S. Bennett" },
  { day: "Tue", time: "08:30", subject: "Geometry", room: "204", teacher: "J. Carter" },
  { day: "Tue", time: "10:00", subject: "Biology", room: "Lab 1", teacher: "M. Iyer" },
  { day: "Tue", time: "11:30", subject: "English", room: "112", teacher: "S. Bennett" },
  { day: "Tue", time: "13:30", subject: "Physical Ed.", room: "Field", teacher: "Coach R." },
  { day: "Wed", time: "08:30", subject: "Algebra", room: "204", teacher: "J. Carter" },
  { day: "Wed", time: "10:00", subject: "Chemistry", room: "Lab 2", teacher: "D. Park" },
  { day: "Wed", time: "11:30", subject: "Art", room: "Studio", teacher: "L. Romano" },
  { day: "Wed", time: "13:30", subject: "History", room: "208", teacher: "S. Bennett" },
  { day: "Thu", time: "08:30", subject: "Geometry", room: "204", teacher: "J. Carter" },
  { day: "Thu", time: "10:00", subject: "Biology", room: "Lab 1", teacher: "M. Iyer" },
  { day: "Thu", time: "11:30", subject: "Music", room: "Hall", teacher: "T. Adams" },
  { day: "Thu", time: "13:30", subject: "Library", room: "Library", teacher: "R. Lee" },
  { day: "Fri", time: "08:30", subject: "Algebra", room: "204", teacher: "J. Carter" },
  { day: "Fri", time: "10:00", subject: "Physics", room: "Lab 3", teacher: "D. Park" },
  { day: "Fri", time: "11:30", subject: "English", room: "112", teacher: "S. Bennett" },
  { day: "Fri", time: "13:30", subject: "Assembly", room: "Auditorium", teacher: "—" },
];

// ── Per-student attendance log ──────────────────────────────────────────────
export const ATTENDANCE_LOG = [
  { date: "Apr 7", status: "Present" as const },
  { date: "Apr 6", status: "Present" as const },
  { date: "Apr 5", status: "Present" as const },
  { date: "Apr 4", status: "Late" as const },
  { date: "Apr 3", status: "Present" as const },
  { date: "Apr 2", status: "Absent" as const },
  { date: "Apr 1", status: "Present" as const },
];

// ── Per-student grades ──────────────────────────────────────────────────────
export const MY_GRADES = [
  { course: "Algebra I", teacher: "J. Carter", grade: "A-", percent: 91, trend: "up" as const },
  { course: "English Literature", teacher: "S. Bennett", grade: "B+", percent: 87, trend: "flat" as const },
  { course: "Physics", teacher: "D. Park", grade: "A", percent: 94, trend: "up" as const },
  { course: "World History", teacher: "S. Bennett", grade: "B", percent: 83, trend: "down" as const },
  { course: "Biology", teacher: "M. Iyer", grade: "A-", percent: 90, trend: "up" as const },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
export function statusTone(s: string): "success" | "warning" | "destructive" | "default" | "secondary" {
  if (["Paid", "Approved", "Active", "Done", "Graded", "Present"].includes(s)) return "success";
  if (["Pending", "In Progress", "New", "Documents", "Interview", "Open", "Submitted", "Tour Scheduled", "Contacted", "Late", "On Leave", "Waitlist", "Processing"].includes(s)) return "warning";
  if (["Overdue", "Rejected", "Absent"].includes(s)) return "destructive";
  return "secondary";
}
