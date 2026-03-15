import { ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField } from "discord.js";
import type Atlanta from "../base/Atlanta.js";
import type { CommandData } from "../types/index.js";

const cmdCooldown: Record<string, Record<string, number>> = {};
const xpCooldown: Record<string, number> = {};

export default class InteractionCreateEvent {
	client: Atlanta;

	constructor(client: Atlanta) {
		this.client = client;
	}

	async run(interaction: ChatInputCommandInteraction): Promise<void> {
		if (!interaction.isChatInputCommand()) return;

		const client = this.client;
		const cmd = client.commands.get(interaction.commandName);
		if (!cmd) return;

		const data: Partial<CommandData> = { config: client.config };

		if (interaction.guild) {
			const guild = await client.findOrCreateGuild({ id: interaction.guild.id });
			data.guild = guild;

			const memberData = await client.findOrCreateMember({
				id: interaction.user.id,
				guildID: interaction.guild.id,
			});
			data.memberData = memberData;
		}

		const userData = await client.findOrCreateUser({ id: interaction.user.id });
		data.userData = userData;

		if (cmd.conf.guildOnly && !interaction.guild) {
			await interaction.reply({
				content: client.translate("misc:GUILD_ONLY"),
				ephemeral: true,
			});
			return;
		}

		if (interaction.guild && interaction.member) {
			const memberPerms = interaction.member.permissions;
			if (memberPerms instanceof PermissionsBitField) {
				const missingBot: string[] = [];
				const botPerms = interaction.guild.members.me?.permissions;
				for (const perm of cmd.conf.botPermissions) {
					if (!botPerms?.has(perm)) missingBot.push(String(perm));
				}
				if (missingBot.length > 0) {
					await interaction.reply({
						content: client.translate("misc:MISSING_BOT_PERMS", {
							list: missingBot.map((p) => `\`${p}\``).join(", "),
						}),
						ephemeral: true,
					});
					return;
				}

				const missingMember: string[] = [];
				for (const perm of cmd.conf.memberPermissions) {
					if (!memberPerms.has(perm)) missingMember.push(String(perm));
				}
				if (missingMember.length > 0) {
					await interaction.reply({
						content: client.translate("misc:MISSING_MEMBER_PERMS", {
							list: missingMember.map((p) => `\`${p}\``).join(", "),
						}),
						ephemeral: true,
					});
					return;
				}
			}

			if (cmd.conf.nsfw && interaction.channel && !("nsfw" in interaction.channel && interaction.channel.nsfw)) {
				await interaction.reply({
					content: client.translate("misc:NSFW_COMMAND"),
					ephemeral: true,
				});
				return;
			}
		}

		if (!cmd.conf.enabled) {
			await interaction.reply({
				content: client.translate("misc:COMMAND_DISABLED"),
				ephemeral: true,
			});
			return;
		}

		if (cmd.conf.ownerOnly && interaction.user.id !== client.config.owner.id) {
			await interaction.reply({
				content: client.translate("misc:OWNER_ONLY"),
				ephemeral: true,
			});
			return;
		}

		if (!cmdCooldown[interaction.user.id]) cmdCooldown[interaction.user.id] = {};
		const cooldownEnd = cmdCooldown[interaction.user.id][cmd.help.name] ?? 0;
		if (cooldownEnd > Date.now()) {
			await interaction.reply({
				content: client.translate("misc:COOLDOWNED", {
					seconds: Math.ceil((cooldownEnd - Date.now()) / 1000),
				}),
				ephemeral: true,
			});
			return;
		}
		cmdCooldown[interaction.user.id][cmd.help.name] = Date.now() + cmd.conf.cooldown;

		client.logger.log(
			`${interaction.user.username} (${interaction.user.id}) ran command ${cmd.help.name}`,
			"cmd"
		);

		const log = new client.logs({
			commandName: cmd.help.name,
			author: { username: interaction.user.username, id: interaction.user.id },
			guild: {
				name: interaction.guild?.name ?? "dm",
				id: interaction.guild?.id ?? "dm",
			},
		});
		await log.save();

		if (data.userData && !data.userData.achievements.firstCommand.achieved) {
			data.userData.achievements.firstCommand.progress.now = 1;
			data.userData.achievements.firstCommand.achieved = true;
			data.userData.markModified("achievements.firstCommand");
			await data.userData.save();
		}

		if (interaction.guild && data.memberData) {
			await updateXp(interaction, data.memberData);
		}

		try {
			await cmd.run(interaction, data as CommandData);
		} catch (e) {
			console.error(e);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: client.translate("misc:ERR_OCCURRED"),
					ephemeral: true,
				}).catch(() => {});
			} else {
				await interaction.reply({
					content: client.translate("misc:ERR_OCCURRED"),
					ephemeral: true,
				}).catch(() => {});
			}
		}
	}
}

async function updateXp(
	interaction: ChatInputCommandInteraction,
	memberData: CommandData["memberData"]
): Promise<void> {
	const isInCooldown = xpCooldown[interaction.user.id];
	if (isInCooldown && isInCooldown > Date.now()) return;

	xpCooldown[interaction.user.id] = Date.now() + 60000;

	const won = Math.floor(Math.random() * (10 - 5)) + 5;
	const newXp = memberData.exp + won;
	const neededXp = 5 * (memberData.level * memberData.level) + 80 * memberData.level + 100;

	if (newXp > neededXp) {
		memberData.level += 1;
	}
	memberData.exp = newXp;
	await memberData.save();
}
