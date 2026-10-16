import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN es obligatorio'),
  CLIENT_ID: z.string().min(1, 'CLIENT_ID es obligatorio'),
  GUILD_ID: z.string().min(1, 'GUILD_ID es obligatorio'),
  EMPEROR_IP_OR_DOMAIN: z.string().min(1).default('216.238.100.32'),
  EMPEROR_HTTP_PORT: z.coerce.number().int().positive().default(9649),
  AC_JOIN_HTTP_PORT: z.coerce.number().int().positive().optional(),
  AC_SERVER_PASSWORD: z.string().optional().default('LaTaM2026'),
  EMPEROR_WEB_URL: z
    .string()
    .url()
    .optional()
    .default('https://aclsa.emperorservers.com'),
  STATUS_CHANNEL_ID: z.string().min(1, 'STATUS_CHANNEL_ID es obligatorio'),
  ALERT_CHANNEL_ID: z.string().min(1, 'ALERT_CHANNEL_ID es obligatorio'),
  ALERT_ROLE_ID: z.string().min(1, 'ALERT_ROLE_ID es obligatorio'),
  POLLING_INTERVAL_SECONDS: z.coerce.number().int().min(10).default(30),
  MOCK_MODE: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val.toLowerCase() === 'true' || val === '1'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Error en las variables de entorno (.env):');
  for (const issue of parsedEnv.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  /** Puerto HTTP usado para el link de entrada en Content Manager */
  get joinHttpPort(): number {
    return parsedEnv.data.AC_JOIN_HTTP_PORT ?? parsedEnv.data.EMPEROR_HTTP_PORT;
  },
};
