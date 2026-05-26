const { z } = require("zod");

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  section: z.string().min(1, "Section is required"),
  description: z.string().max(500).optional(),
  teacherId: z.string().optional(),
});

const updateClassSchema = classSchema.partial();

module.exports = {
  classSchema,
  updateClassSchema,
};
