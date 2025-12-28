import { z } from 'zod';

// Auth validation schemas
export const SendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const VerifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
});

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().min(2, 'Business name is required'),
});

// Valuation validation schemas
export const ValuationInputSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  businessDescription: z.string().optional(),
  sector: z.string().min(1, 'Sector is required'),
  annualRevenue: z.number().positive('Annual revenue must be positive'),
  ebitda: z.number().finite('EBITDA must be a valid number').optional(),
  netIncome: z.number().finite('Net income must be a valid number'),
  freeCashFlow: z.number().finite('Free cash flow must be a valid number').optional(),
  totalAssets: z.number().nonnegative('Total assets must be non-negative'),
  totalLiabilities: z.number().nonnegative('Total liabilities must be non-negative'),
  bookValueOfEquity: z.number().nonnegative('Book value of equity must be non-negative').optional(),
  marketCapitalization: z.number().optional(),
  numberOfShares: z.number().optional(),
  // Scenario weights
  conservativeWeight: z.number().min(0).max(1),
  baseWeight: z.number().min(0).max(1),
  upSideWeight: z.number().min(0).max(1),
  // DCF parameters
  terminalGrowthRate: z.number().min(0).max(5, 'Terminal growth must be between 0-5%').optional(),
  discountRate: z.number().min(0).max(100, 'Discount rate must be between 0-100%'),
  projectedGrowthRate: z.number().min(0).max(1).optional(),
  projectionYears: z.number().int().min(1).max(10, 'Projection years must be 1-10').optional(),
});

export const AssumptionsCheckSchema = z.object({
  businessName: z.string(),
  sector: z.string(),
  revenue: z.number().positive(),
  netIncome: z.number(),
  totalAssets: z.number().nonnegative(),
  totalLiabilities: z.number().nonnegative(),
  bookValueOfEquity: z.number().nonnegative(),
  wacc: z.number().min(0).max(100, 'WACC must be between 0-100%'),
  terminalGrowth: z.number().min(0).max(5),
  growthRate: z.number().min(-50).max(100),
  projectionYears: z.number().int().min(1).max(10),
  conservativeWeight: z.number().min(0).max(1),
  baseWeight: z.number().min(0).max(1),
  upSideWeight: z.number().min(0).max(1),
});

// Type exports for use in components
export type SendOTPInput = z.infer<typeof SendOTPSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type ValuationInput = z.infer<typeof ValuationInputSchema>;
export type AssumptionsCheckInput = z.infer<typeof AssumptionsCheckSchema>;

// Helper function for safe parsing
export function safeParseRequest<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: boolean; data?: z.infer<T>; error?: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errors };
    }
  } catch (e) {
    return { success: false, error: 'Invalid request format' };
  }
}
