const { z } = require("zod");

const attendanceSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  courseId: z.string().optional(),
  grade: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().optional(),
});

const attendanceUpdateSchema = attendanceSchema.partial();

module.exports = {
  attendanceSchema,
  attendanceUpdateSchema,
};
