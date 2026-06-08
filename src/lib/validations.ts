import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createOrderSchema = z.object({
  tshirtColor: z.enum(["white", "black", "navy", "red", "grey"]),
  imagePublicId: z.string().min(1),
  imageUrl: z.string().url(),
  canvasState: z.record(z.unknown()),
  placementX: z.number(),
  placementY: z.number(),
  placementScale: z.number().positive(),
  placementAngle: z.number(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  adminNotes: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
