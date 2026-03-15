import {
	ChatInputCommandInteraction,
	PermissionResolvable,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type Atlanta from "./Atlanta.js";
import type { CommandData } from "../types/index.js";

export interface CommandOptions {
	name: string;
	category?: string;
	enabled?: boolean;
	guildOnly?: boolean;
	botPermissions?: PermissionResolvable[];
	memberPermissions?: PermissionResolvable[];
	nsfw?: boolean;
	ownerOnly?: boolean;
	cooldown?: number;
}

export interface CommandConf {
	enabled: boolean;
	guildOnly: boolean;
	memberPermissions: PermissionResolvable[];
	botPermissions: PermissionResolvable[];
	nsfw: boolean;
	ownerOnly: boolean;
	cooldown: number;
}

export interface CommandHelp {
	name: string;
	category: string;
}

export abstract class Command {
	client: Atlanta;
	conf: CommandConf;
	help: CommandHelp;

	abstract slashCommand: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder;

	constructor(client: Atlanta, options: CommandOptions) {
		this.client = client;
		this.conf = {
			enabled: options.enabled ?? true,
			guildOnly: options.guildOnly ?? false,
			memberPermissions: options.memberPermissions ?? [],
			botPermissions: options.botPermissions ?? [],
			nsfw: options.nsfw ?? false,
			ownerOnly: options.ownerOnly ?? false,
			cooldown: options.cooldown ?? 3000,
		};
		this.help = {
			name: options.name,
			category: options.category ?? "Other",
		};
	}

	abstract run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void>;
}
