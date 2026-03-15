import "@dotenvx/dotenvx/config";
import type { BotConfig } from "./types/index.js";

function env(key: string, fallback?: string): string {
	const value = process.env[key] ?? fallback;
	if (value === undefined) throw new Error(`Missing environment variable: ${key}`);
	return value;
}

export const config: BotConfig = {
	token: env("DISCORD_TOKEN"),
	support: {
		id: env("SUPPORT_SERVER_ID", ""),
		logs: env("SUPPORT_LOGS_CHANNEL", ""),
	},
	dashboard: {
		enabled: process.env.DASHBOARD_ENABLED === "true",
		secret: env("DASHBOARD_SECRET", ""),
		baseURL: env("DASHBOARD_BASE_URL", "http://localhost:8080"),
		logs: env("DASHBOARD_LOGS_CHANNEL", ""),
		port: parseInt(env("DASHBOARD_PORT", "8080"), 10),
		expressSessionPassword: env("DASHBOARD_SESSION_PASSWORD", "atlanta-session-secret"),
		failureURL: env("DASHBOARD_FAILURE_URL", "http://localhost:8080"),
	},
	mongoDB: env("MONGODB_URI", "mongodb://localhost:27017/AtlantaBot"),
	embed: {
		color: (env("EMBED_COLOR", "#0091fc") || "#0091fc") as `#${string}`,
		footer: env("EMBED_FOOTER", "Atlanta | Open Source"),
	},
	owner: {
		id: env("OWNER_ID", ""),
		name: env("OWNER_NAME", ""),
	},
	votes: {
		port: parseInt(env("VOTES_PORT", "5000"), 10),
		password: env("VOTES_PASSWORD", ""),
		channel: env("VOTES_CHANNEL", ""),
	},
	apiKeys: {
		dbl: env("API_DBL", ""),
		sentryDSN: env("SENTRY_DSN", ""),
	},
	others: {
		github: env("GITHUB_URL", "https://github.com/Androz2091"),
		donate: env("DONATE_URL", "https://patreon.com/Androz2091"),
	},
	status: [
		{ name: "@Atlanta help on {serversCount} servers", type: "Listening" },
		{ name: "my website : atlanta-bot.fr", type: "Playing" },
	],
};
