const { z } = require("zod");

const createStudentSchema = z.object({
  studentId: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  class: z.string().optional(),
  section: z.string().optional(),
  admissionNumber: z.string().optional(),
  rollNumber: z.string().optional(),
  meta: z.record(z.string()).optional(),
});

const updateStudentSchema = createStudentSchema.partial();

module.exports = {
  createStudentSchema,
  updateStudentSchema,
};
