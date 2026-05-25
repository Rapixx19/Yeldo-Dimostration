import { z } from 'zod';

export const createInvestmentSchema = z.object({
  dealId: z.string().min(1),
  amount: z.number().positive(),
});

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
