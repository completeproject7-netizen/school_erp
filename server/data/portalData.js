const ANNOUNCEMENTS = [
  { id: "N-1", title: "Mid-term schedule published", body: "The mid-term examination schedule for Grades 6–12 is now available in the Academics section. Please review your timetable carefully.", audience: "Students", postedBy: "Dr. Aisha Khan", postedAt: "2h ago", pinned: true },
  { id: "N-2", title: "Library renovation — May 1–7", body: "The main library will be closed for renovations. The annex on Block C will remain operational.", audience: "All", postedBy: "Robert Lee", postedAt: "Yesterday" },
  { id: "N-3", title: "Faculty meeting Friday 4 PM", body: "All teaching staff are required to attend the faculty meeting in the Conference Hall.", audience: "Teachers", postedBy: "Dr. Aisha Khan", postedAt: "2 days ago" },
  { id: "N-4", title: "Sports Day — house allocations", body: "House captains may now register their teams via the Events page. Deadline: May 18.", audience: "Students", postedBy: "James Carter", postedAt: "3 days ago" },
  { id: "N-5", title: "April payslips processed", body: "April payslips have been issued. Please verify and report any discrepancies to Finance by May 5.", audience: "Staff", postedBy: "Marco Rossi", postedAt: "4 days ago" },
];

const INQUIRIES = [
  { id: "Q-301", parent: "Rebecca Stone", email: "rstone@example.com", phone: "+1 555-1100", interestedIn: "Grade 6 — 2026", receivedOn: "Apr 4", status: "New" },
  { id: "Q-302", parent: "Daniel Kim", email: "dkim@example.com", phone: "+1 555-1101", interestedIn: "Grade 9 — 2026", receivedOn: "Apr 4", status: "Contacted" },
  { id: "Q-303", parent: "Fatima Ahmed", email: "fahmed@example.com", phone: "+1 555-1102", interestedIn: "Grade 11 (Sci.) — 2026", receivedOn: "Apr 3", status: "Tour Scheduled" },
  { id: "Q-304", parent: "Marco Bianchi", email: "mbianchi@example.com", phone: "+1 555-1103", interestedIn: "Grade 7 — 2026", receivedOn: "Apr 3", status: "Contacted" },
  { id: "Q-305", parent: "Sara Johansson", email: "sjohan@example.com", phone: "+1 555-1104", interestedIn: "Grade 12 — 2026", receivedOn: "Apr 2", status: "Closed" },
];

const DOCUMENTS = [
  { id: "D-1", name: "Birth Certificate — John Smith", type: "PDF", owner: "AP-501", uploaded: "Apr 1", size: "1.2 MB" },
  { id: "D-2", name: "Previous Report Card — Aarti Patel", type: "PDF", owner: "AP-502", uploaded: "Apr 2", size: "880 KB" },
  { id: "D-3", name: "Transfer Certificate — Mei Chen", type: "PDF", owner: "AP-504", uploaded: "Apr 3", size: "640 KB" },
  { id: "D-4", name: "Photo ID — Diego Alvarez", type: "JPG", owner: "AP-505", uploaded: "Apr 3", size: "320 KB" },
  { id: "D-5", name: "Recommendation Letter — Hana Tanaka", type: "PDF", owner: "AP-506", uploaded: "Apr 4", size: "210 KB" },
];

const EVENTS = [
  { id: "E-1", title: "Parent-Teacher Meeting", date: "Apr 28", time: "10:00 AM", venue: "Main Auditorium", category: "Meeting", attendees: "All parents" },
  { id: "E-2", title: "Annual Science Fair", date: "May 5", time: "9:00 AM", venue: "Science Block", category: "Academic", attendees: "Grades 7–12" },
  { id: "E-3", title: "Mid-Term Examinations", date: "May 10–18", time: "All day", venue: "All classrooms", category: "Academic", attendees: "All students" },
  { id: "E-4", title: "Inter-house Sports Day", date: "May 25", time: "8:00 AM", venue: "Sports Ground", category: "Sports", attendees: "All houses" },
  { id: "E-5", title: "Spring Cultural Night", date: "Jun 2", time: "6:30 PM", venue: "Open Theatre", category: "Cultural", attendees: "Open invitation" },
  { id: "E-6", title: "Summer Break Begins", date: "Jun 15", time: "—", venue: "—", category: "Holiday", attendees: "All" },
];

const BOOKS = [
  { id: "B-1", title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", copies: 12, available: 4, isbn: "978-0061120084" },
  { id: "B-2", title: "Sapiens", author: "Yuval Noah Harari", category: "History", copies: 8, available: 2, isbn: "978-0062316097" },
  { id: "B-3", title: "Calculus: Early Transcendentals", author: "James Stewart", category: "Mathematics", copies: 15, available: 9, isbn: "978-1285741550" },
  { id: "B-4", title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", copies: 6, available: 1, isbn: "978-0553380163" },
  { id: "B-5", title: "Pride and Prejudice", author: "Jane Austen", category: "Fiction", copies: 10, available: 6, isbn: "978-1503290563" },
  { id: "B-6", title: "The Selfish Gene", author: "Richard Dawkins", category: "Biology", copies: 5, available: 0, isbn: "978-0198788607" },
  { id: "B-7", title: "Cosmos", author: "Carl Sagan", category: "Science", copies: 7, available: 3, isbn: "978-0345539434" },
];

const LEAVES = [
  { id: "L-1", applicant: "Robert Lee", type: "Sick", from: "Apr 12", to: "Apr 13", days: 2, status: "Approved" },
  { id: "L-2", applicant: "Robert Lee", type: "Casual", from: "May 2", to: "May 2", days: 1, status: "Pending" },
  { id: "L-3", applicant: "Robert Lee", type: "Earned", from: "Jun 10", to: "Jun 14", days: 5, status: "Pending" },
  { id: "L-4", applicant: "Robert Lee", type: "Sick", from: "Mar 3", to: "Mar 3", days: 1, status: "Approved" },
];

const PAYSLIPS = [
  { id: "PS-202604", month: "April 2026", gross: 3200, deductions: 360, net: 2840, status: "Paid" },
  { id: "PS-202603", month: "March 2026", gross: 3200, deductions: 360, net: 2840, status: "Paid" },
  { id: "PS-202602", month: "February 2026", gross: 3200, deductions: 360, net: 2840, status: "Paid" },
  { id: "PS-202601", month: "January 2026", gross: 3100, deductions: 340, net: 2760, status: "Paid" },
];

const TASKS = [
  { id: "TK-1", title: "Restock library returns", assignee: "Robert Lee", due: "Today", priority: "High", status: "In Progress" },
  { id: "TK-2", title: "Process visitor logs", assignee: "Robert Lee", due: "Today", priority: "Normal", status: "Todo" },
  { id: "TK-3", title: "Inventory check — Lab B", assignee: "Tom O'Brien", due: "Tomorrow", priority: "Normal", status: "Todo" },
  { id: "TK-4", title: "Submit weekly report", assignee: "Robert Lee", due: "Fri", priority: "High", status: "Todo" },
  { id: "TK-5", title: "Order new whiteboard markers", assignee: "Tom O'Brien", due: "Next week", priority: "Low", status: "Done" },
];

const AUDIT = [
  { id: "AU-1", actor: "admin@educore.school", action: "Updated student record", target: "S-2026-104", at: "2m ago", ip: "10.0.0.42" },
  { id: "AU-2", actor: "teacher@educore.school", action: "Posted grades", target: "C-102 / Quiz 3", at: "12m ago", ip: "10.0.0.51" },
  { id: "AU-3", actor: "admissions@educore.school", action: "Approved application", target: "AP-504", at: "1h ago", ip: "10.0.0.66" },
  { id: "AU-4", actor: "admin@educore.school", action: "Created announcement", target: "N-1", at: "2h ago", ip: "10.0.0.42" },
  { id: "AU-5", actor: "staff@educore.school", action: "Logged in", target: "—", at: "3h ago", ip: "10.0.0.81" },
  { id: "AU-6", actor: "admin@educore.school", action: "Issued payslips", target: "PS-202604 (×186)", at: "1d ago", ip: "10.0.0.42" },
];

const MESSAGES = [
  { id: "M-1", from: "Dr. Aisha Khan", subject: "Friday faculty meeting", preview: "Reminder: please bring your term plans…", at: "1h", unread: true },
  { id: "M-2", from: "Sarah Bennett", subject: "Co-teaching Grade 10", preview: "Could we sync about the joint project for…", at: "3h", unread: true },
  { id: "M-3", from: "Robert Lee", subject: "Library hours change", preview: "Starting Monday the library will open at…", at: "Yesterday" },
  { id: "M-4", from: "Marco Rossi", subject: "Reimbursement processed", preview: "Your March travel reimbursement has been…", at: "2d" },
  { id: "M-5", from: "Priya Sharma", subject: "New applicant tour", preview: "Could you host a brief campus tour for…", at: "3d" },
];

const TIMETABLE = [
  { day: "Mon", time: "08:30", subject: "Algebra", room: "204", teacher: "James Carter", grade: "Grade 10A" },
  { day: "Mon", time: "10:00", subject: "English", room: "112", teacher: "S. Bennett", grade: "Grade 10A" },
  { day: "Mon", time: "11:30", subject: "Physics", room: "Lab 3", teacher: "D. Park", grade: "Grade 11A" },
  { day: "Mon", time: "13:30", subject: "History", room: "208", teacher: "S. Bennett", grade: "Grade 10A" },
  { day: "Tue", time: "08:30", subject: "Geometry", room: "204", teacher: "James Carter", grade: "Grade 9A" },
  { day: "Tue", time: "10:00", subject: "Biology", room: "Lab 1", teacher: "M. Iyer", grade: "Grade 11A" },
  { day: "Tue", time: "11:30", subject: "English", room: "112", teacher: "S. Bennett", grade: "Grade 9A" },
  { day: "Tue", time: "13:30", subject: "Physical Ed.", room: "Field", teacher: "Coach R.", grade: "Grade 9A" },
  { day: "Wed", time: "08:30", subject: "Algebra", room: "204", teacher: "James Carter", grade: "Grade 10A" },
  { day: "Wed", time: "10:00", subject: "Chemistry", room: "Lab 2", teacher: "D. Park", grade: "Grade 11A" },
  { day: "Wed", time: "11:30", subject: "Art", room: "Studio", teacher: "L. Romano", grade: "Grade 8A" },
  { day: "Wed", time: "13:30", subject: "History", room: "208", teacher: "S. Bennett", grade: "Grade 10A" },
  { day: "Thu", time: "08:30", subject: "Geometry", room: "204", teacher: "James Carter", grade: "Grade 9A" },
  { day: "Thu", time: "10:00", subject: "Biology", room: "Lab 1", teacher: "M. Iyer", grade: "Grade 11A" },
  { day: "Thu", time: "11:30", subject: "Music", room: "Hall", teacher: "T. Adams", grade: "Grade 8A" },
  { day: "Thu", time: "13:30", subject: "Library", room: "Library", teacher: "R. Lee", grade: "Grade 8A" },
  { day: "Fri", time: "08:30", subject: "Algebra", room: "204", teacher: "James Carter", grade: "Grade 10A" },
  { day: "Fri", time: "10:00", subject: "Physics", room: "Lab 3", teacher: "D. Park", grade: "Grade 11A" },
  { day: "Fri", time: "11:30", subject: "English", room: "112", teacher: "S. Bennett", grade: "Grade 9A" },
  { day: "Fri", time: "13:30", subject: "Assembly", room: "Auditorium", teacher: "—", grade: "Grade 10A" },
];

const APPLICATIONS = [
  { id: "AP-501", applicant: "John Smith", appliedFor: "Grade 7", date: "Apr 1", stage: "Documents", applicantType: "student" },
  { id: "AP-502", applicant: "Aarti Patel", appliedFor: "Grade 9", date: "Apr 2", stage: "Interview", score: 87, applicantType: "student" },
  { id: "AP-503", applicant: "Liam O'Connor", appliedFor: "Grade 11", date: "Apr 2", stage: "New", applicantType: "student" },
  { id: "AP-504", applicant: "Mei Chen", appliedFor: "Grade 6", date: "Apr 3", stage: "Approved", score: 95, studentId: "STU-2026-001", applicantType: "student" },
  { id: "AP-505", applicant: "Diego Alvarez", appliedFor: "Grade 8", date: "Apr 3", stage: "Waitlist", score: 72, applicantType: "student" },
  { id: "AP-506", applicant: "Hana Tanaka", appliedFor: "Grade 10", date: "Apr 4", stage: "Documents", applicantType: "student" },
  { id: "AP-507", applicant: "Yusuf Ali", appliedFor: "Grade 7", date: "Apr 5", stage: "Rejected", score: 58, applicantType: "student" },
  { id: "AP-508", applicant: "Chloe Dubois", appliedFor: "Grade 12", date: "Apr 5", stage: "Approved", score: 91, studentId: "STU-2026-002", applicantType: "student" },
];

const ENROLLMENTS = [];

const STUDENTS = [
  {
    id: "STU-2026-001",
    studentId: "STU-2026-001",
    name: "Mei Chen",
    email: "mei.chen@educore.school",
    role: "student",
    status: "active",
    meta: { class: "Grade 6" },
    enrolledAt: "Apr 3",
  },
];

const MY_GRADES = [
  { course: "Algebra I", teacher: "J. Carter", grade: "A-", percent: 91, trend: "up" },
  { course: "English Literature", teacher: "S. Bennett", grade: "B+", percent: 87, trend: "flat" },
  { course: "Physics", teacher: "D. Park", grade: "A", percent: 94, trend: "up" },
  { course: "World History", teacher: "S. Bennett", grade: "B", percent: 83, trend: "down" },
  { course: "Biology", teacher: "M. Iyer", grade: "A-", percent: 90, trend: "up" },
];

const GRADEBOOK = [
  {
    id: "S-2026-104",
    studentEmail: "student@educore.school",
    name: "Emma Wilson",
    course: "Algebra I",
    teacher: "James Carter",
    grade: "A-",
    quiz1: 88,
    midterm: 76,
    project: 85,
    final: 92,
    percent: 85,
    gpa: 3.8,
    trend: "up",
  },
  {
    id: "S-2026-105",
    studentEmail: "liam.patel@educore.school",
    name: "Liam Patel",
    course: "Algebra I",
    teacher: "James Carter",
    grade: "B",
    quiz1: 74,
    midterm: 68,
    project: 79,
    final: 82,
    percent: 76,
    gpa: 3.1,
    trend: "flat",
  },
  {
    id: "S-2026-106",
    studentEmail: "sophia.garcia@educore.school",
    name: "Sophia Garcia",
    course: "Algebra I",
    teacher: "James Carter",
    grade: "A",
    quiz1: 92,
    midterm: 88,
    project: 91,
    final: 96,
    percent: 91,
    gpa: 3.9,
    trend: "up",
  },
  {
    id: "S-2026-107",
    studentEmail: "noah.kim@educore.school",
    name: "Noah Kim",
    course: "Algebra I",
    teacher: "James Carter",
    grade: "C",
    quiz1: 69,
    midterm: 72,
    project: 71,
    final: 74,
    percent: 72,
    gpa: 2.9,
    trend: "down",
  },
  {
    id: "S-2026-108",
    studentEmail: "olivia.brown@educore.school",
    name: "Olivia Brown",
    course: "Algebra I",
    teacher: "James Carter",
    grade: "B+",
    quiz1: 81,
    midterm: 78,
    project: 84,
    final: 88,
    percent: 83,
    gpa: 3.4,
    trend: "flat",
  },
];

module.exports = {
  ANNOUNCEMENTS,
  INQUIRIES,
  DOCUMENTS,
  EVENTS,
  BOOKS,
  LEAVES,
  PAYSLIPS,
  TASKS,
  AUDIT,
  MESSAGES,
  TIMETABLE,
  APPLICATIONS,
  ENROLLMENTS,
  STUDENTS,
  MY_GRADES,
  GRADEBOOK,
};
