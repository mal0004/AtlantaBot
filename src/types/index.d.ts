import { Collection, ChatInputCommandInteraction, Guild } from "discord.js";
import { TFunction } from "i18next";
import { HydratedDocument } from "mongoose";
import type { IGuild } from "../base/Guild.js";
import type { IMember } from "../base/Member.js";
import type { IUser } from "../base/User.js";
import type { Command } from "../base/Command.js";

export interface LanguageMeta {
	name: string;
	nativeName: string;
	moment: string;
	defaultMomentFormat: string;
	default: boolean;
	aliases: string[];
}

export interface BotConfig {
	token: string;
	support: {
		id: string;
		logs: string;
	};
	dashboard: {
		enabled: boolean;
		secret: string;
		baseURL: string;
		logs: string;
		port: number;
		expressSessionPassword: string;
		failureURL: string;
	};
	mongoDB: string;
	embed: {
		color: `#${string}`;
		footer: string;
	};
	owner: {
		id: string;
		name: string;
	};
	votes: {
		port: number;
		password: string;
		channel: string;
	};
	apiKeys: {
		dbl: string;
		sentryDSN: string;
	};
	others: {
		github: string;
		donate: string;
	};
	status: Array<{
		name: string;
		type: string;
	}>;
}

export interface DatabaseCache {
	users: Collection<string, HydratedDocument<IUser>>;
	guilds: Collection<string, HydratedDocument<IGuild>>;
	members: Collection<string, HydratedDocument<IMember>>;
	usersReminds: Collection<string, HydratedDocument<IUser>>;
	mutedUsers: Collection<string, HydratedDocument<IMember>>;
}

export interface CommandData {
	config: BotConfig;
	guild: HydratedDocument<IGuild>;
	memberData: HydratedDocument<IMember>;
	userData: HydratedDocument<IUser>;
}

export interface CustomEmojis {
	[key: string]: string | Record<string, string>;
	error: string;
	success: string;
	loading: string;
}

declare module "express-serve-static-core" {
	interface Request {
		client: import("../base/Atlanta.js").default;
		user?: SessionUser;
		locale: string;
		userInfos?: DashboardUserInfo;
		translate: TFunction;
		printDate: (date: Date | number) => string;
	}
}

export interface SessionUser {
	id: string;
	username: string;
	discriminator: string;
	avatar: string;
	locale: string;
	accessToken: string;
	guilds: Array<{
		id: string;
		name: string;
		icon: string;
		owner: boolean;
		permissions: number;
	}>;
}

export interface DashboardUserInfo {
	username: string;
	displayedGuilds?: any[];
	visibleGuilds: Array<{
		id: string;
		name: string;
		icon: string;
	}>;
}

