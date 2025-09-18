const { z } = require("zod");

const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(35, "Name must be at least 3 characters long"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(35, "Name must be at least 3 characters long"),
});

module.exports = registerSchema;
