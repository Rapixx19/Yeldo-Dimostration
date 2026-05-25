import { z } from 'zod';

export const dealListQuerySchema = z.object({
  country: z.string().length(2).optional(),
  instrument: z.enum(['senior_loan', 'mezzanine', 'senior_debt', 'secured_mezzanine']).optional(),
  status: z.enum(['open', 'closed', 'exited']).optional(),
  maturityMin: z.coerce.number().optional(),
  maturityMax: z.coerce.number().optional(),
  search: z.string().optional(),
});

export type DealListQuery = z.infer<typeof dealListQuerySchema>;
