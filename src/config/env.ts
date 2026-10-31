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
  LIVE_TIMING_WEB_URL: z
    .string()
    .url()
    .optional()
    .default('https://live.latamsimracing.com/'),
  STATUS_CHANNEL_ID: z.string().default('1564808711883464805'),
  ALERT_CHANNEL_ID: z.string().default('1564808847267467395'),
  ALERT_ROLE_ID: z.string().default('1529968757131186308'),
  MOD_ROLE_ID: z.string().default('1529967623864062002'),

  // Canales de Comisariato / Stewards (Donde llegan las denuncias)
  AC_STEWARDS_CHANNEL_ID: z.string().default('1565867684673888387'),
  ACC_STEWARDS_CHANNEL_ID: z.string().default('1565867710502666251'),

  // Canales donde los usuarios hacen denuncias o ven el panel de reportes
  AC_REPORT_CHANNEL_ID: z.string().default('1565868265316814858'),
  ACC_REPORT_CHANNEL_ID: z.string().default('1565868469508120717'),

  // Bienvenida, Reglas y Rol de Piloto
  WELCOME_CHANNEL_ID: z.string().default('1566120096886296708'),
  RULES_CHANNEL_ID: z.string().default('1529959238271635496'),
  ROLES_CHANNEL_ID: z.string().default('1538224717876695060'),
  PRESENTATION_CHANNEL_ID: z.string().default('1513731415911567471'),
  PILOT_ROLE_ID: z.string().default('1529968757131186308'),

  STEWARDS_CHANNEL_ID: z.string().optional(),
  SANCTIONS_CHANNEL_ID: z.string().optional(),
  POLLING_INTERVAL_SECONDS: z.coerce.number().int().min(10).default(30),
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  ADMIN_PASSWORD: z.string().min(1).default('LaTaM2026'),
  MOCK_MODE: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val.toLowerCase() === 'true' || val === '1'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Error en las variables de entorno (.env):');
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
  get acStewardsChannelId(): string {
    return (
      parsedEnv.data.AC_STEWARDS_CHANNEL_ID ||
      parsedEnv.data.STEWARDS_CHANNEL_ID ||
      parsedEnv.data.ALERT_CHANNEL_ID
    );
  },
  get accStewardsChannelId(): string {
    return (
      parsedEnv.data.ACC_STEWARDS_CHANNEL_ID ||
      parsedEnv.data.STEWARDS_CHANNEL_ID ||
      parsedEnv.data.ALERT_CHANNEL_ID
    );
  },
  get acReportChannelId(): string {
    return parsedEnv.data.AC_REPORT_CHANNEL_ID;
  },
  get accReportChannelId(): string {
    return parsedEnv.data.ACC_REPORT_CHANNEL_ID;
  },
  get stewardsChannelId(): string {
    return (
      parsedEnv.data.STEWARDS_CHANNEL_ID ||
      parsedEnv.data.AC_STEWARDS_CHANNEL_ID ||
      parsedEnv.data.ALERT_CHANNEL_ID
    );
  },
  get sanctionsChannelId(): string {
    return parsedEnv.data.SANCTIONS_CHANNEL_ID || parsedEnv.data.ALERT_CHANNEL_ID;
  },
  get welcomeChannelId(): string {
    return parsedEnv.data.WELCOME_CHANNEL_ID;
  },
  get rulesChannelId(): string {
    return parsedEnv.data.RULES_CHANNEL_ID;
  },
  get rolesChannelId(): string {
    return parsedEnv.data.ROLES_CHANNEL_ID;
  },
  get presentationChannelId(): string {
    return parsedEnv.data.PRESENTATION_CHANNEL_ID;
  },
  get pilotRoleId(): string {
    return parsedEnv.data.PILOT_ROLE_ID;
  },
};
