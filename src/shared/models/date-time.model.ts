import { z } from 'zod';

export const DateTimeSchema = z.codec(z.iso.datetime(), z.date(), {
  decode: (value) => new Date(value),
  encode: (value) => value.toISOString()
});
