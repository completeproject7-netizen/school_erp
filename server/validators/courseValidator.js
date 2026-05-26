const { z } = require("zod");

const gradePattern = /^(?:Grade\s*)?(?:[1-9]|1[0-2])$/i;
const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const daySchema = z
  .string()
  .optional()
  .refine((value) => {
    if (!value) {
      return true;
    }

    const tokens = value
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      return false;
    }

    return tokens.every((token) => validDays.includes(token));
  }, {
    message: "Day must be one or more valid weekdays",
  });

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  grade: z
    .string()
    .min(1, "Grade/class is required")
    .regex(gradePattern, "Grade must be between Grade 1 and Grade 12"),
  section: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  teacherId: z.string().optional(),
  teacherName: z.string().optional(),
  credits: z.number().min(1).max(10).optional(),
  day: daySchema,
  time: z.string().optional(),
  room: z.string().optional(),
});

const updateCourseSchema = courseSchema.partial();

module.exports = {
  courseSchema,
  updateCourseSchema,
};
