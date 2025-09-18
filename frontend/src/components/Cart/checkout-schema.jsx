import { z } from "zod";

const checkoutSchema = z.object({
  email: z.string().email("Invalid email"),
  shippingAddress: z.object({
    firstName: z.string().min(3, "First name is required at least 3 words"),
    lastName: z.string().min(3, "Last name is required at least 3 words"),
    address: z.string().min(9, "Address is required at least 9 words"),
    city: z.string().min(3, "City is required at least 3 words"),
    postalCode: z.string().regex(/^\d{6}$/, {
      message: "Postal Code must be exactly 6 digits and must be Number",
    }),
    country: z.string().min(1, "Country is required"),
    phone: z.string().regex(/^\d{10}$/, {
      message: "Phone number must be exactly 10 digits and must be Number",
    }),
  }),
});

export default checkoutSchema;
