const { z } = require("zod");

const payFeeSchema = z.object({
  studentId: z.string().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().min(3, "Description is required"),
  paymentMethod: z.enum(["online", "cash"]).optional(),
});

const updateFeeSchema = payFeeSchema.partial();

module.exports = {
  payFeeSchema,
  updateFeeSchema,
};
