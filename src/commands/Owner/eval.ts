import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Eval extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "eval",

			enabled: true,
			guildOnly: false,
			ownerOnly: true,
			cooldown: 0,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("eval")
		.setDescription("Evaluate JavaScript code (owner only)")
		.addStringOption(opt =>
			opt.setName("code").setDescription("The code to evaluate").setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;

		await interaction.deferReply({ ephemeral: true });

		const code = interaction.options.getString("code", true);
		const hrStart = process.hrtime();

		try {
			// eslint-disable-next-line no-eval
			let evaled = await eval(code);
			const hrEnd = process.hrtime(hrStart);

			if (typeof evaled !== "string") {
				evaled = (await import("util")).inspect(evaled, { depth: 0 });
			}

			const cleaned = String(evaled)
				.replace(client.token!, "[REDACTED]")
				.replace(data.config.mongoDB, "[REDACTED]");

			const output = cleaned.length > 1900
				? `${cleaned.slice(0, 1900)}...`
				: cleaned;

			const embed = new EmbedBuilder()
				.setColor("#43B581")
				.setTitle("Eval Result")
				.addFields(
					{ name: "Input", value: `\`\`\`js\n${code.slice(0, 1000)}\n\`\`\`` },
					{ name: "Output", value: `\`\`\`js\n${output}\n\`\`\`` },
					{ name: "Type", value: `\`\`\`\n${typeof evaled}\n\`\`\``, inline: true },
					{ name: "Time", value: `\`\`\`\n${hrEnd[0] > 0 ? `${hrEnd[0]}s ` : ""}${hrEnd[1] / 1_000_000}ms\n\`\`\``, inline: true },
				)
				.setTimestamp();

			interaction.editReply({ embeds: [embed] });
		} catch (err) {
			const error = err instanceof Error ? err.message : String(err);
			const cleaned = error
				.replace(client.token!, "[REDACTED]")
				.replace(data.config.mongoDB, "[REDACTED]");

			const embed = new EmbedBuilder()
				.setColor("#F04747")
				.setTitle("Eval Error")
				.addFields(
					{ name: "Input", value: `\`\`\`js\n${code.slice(0, 1000)}\n\`\`\`` },
					{ name: "Error", value: `\`\`\`js\n${cleaned.slice(0, 1900)}\n\`\`\`` },
				)
				.setTimestamp();

			interaction.editReply({ embeds: [embed] });
		}
	}
}
