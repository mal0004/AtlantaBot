import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

interface GitHubRepo {
	full_name: string;
	html_url: string;
	description: string | null;
	language: string | null;
	stargazers_count: number;
	forks_count: number;
	open_issues_count: number;
	owner: { avatar_url: string; login: string };
	created_at: string;
	updated_at: string;
}

interface GitHubUser {
	login: string;
	avatar_url: string;
	html_url: string;
	bio: string | null;
	public_repos: number;
	followers: number;
	following: number;
	created_at: string;
}

export default class GitHub extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("github")
		.setDescription("Get information about a GitHub user or repository")
		.addStringOption(option =>
			option.setName("query")
				.setDescription("GitHub username or user/repo")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "github",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const query = interaction.options.getString("query", true);

		await interaction.deferReply();

		const isRepo = query.includes("/");

		try {
			const url = isRepo
				? `https://api.github.com/repos/${query}`
				: `https://api.github.com/users/${query}`;

			const res = await fetch(url);
			if (!res.ok) {
				await interaction.editReply({
					content: `${client.customEmojis.error} No GitHub result found for \`${query}\`.`,
				});
				return;
			}

			const embed = new EmbedBuilder()
				.setColor(data.config.embed.color)
				.setFooter({ text: data.config.embed.footer });

			if (isRepo) {
				const repo = await res.json() as GitHubRepo;
				embed
					.setAuthor({ name: repo.full_name, url: repo.html_url, iconURL: repo.owner.avatar_url })
					.setDescription(`[${client.translate("general/github:CLICK_HERE", undefined, locale)}](${repo.html_url})`)
					.setThumbnail(repo.owner.avatar_url)
					.addFields(
						{ name: "⭐ Stars", value: repo.stargazers_count.toString(), inline: true },
						{ name: "🍴 Forks", value: repo.forks_count.toString(), inline: true },
						{ name: "🐛 Issues", value: repo.open_issues_count.toString(), inline: true },
						{ name: client.translate("general/github:LANGUAGE", undefined, locale), value: repo.language ?? "N/A", inline: true },
						{ name: client.translate("general/github:OWNER", undefined, locale), value: repo.owner.login, inline: true },
					);
			} else {
				const user = await res.json() as GitHubUser;
				embed
					.setAuthor({ name: user.login, url: user.html_url, iconURL: user.avatar_url })
					.setDescription(user.bio ?? "No bio")
					.setThumbnail(user.avatar_url)
					.addFields(
						{ name: "Repositories", value: user.public_repos.toString(), inline: true },
						{ name: "Followers", value: user.followers.toString(), inline: true },
						{ name: "Following", value: user.following.toString(), inline: true },
						{ name: client.translate("common:CREATION", undefined, locale), value: client.printDate(new Date(user.created_at), undefined, locale), inline: true },
					);
			}

			await interaction.editReply({ embeds: [embed] });
		} catch {
			await interaction.editReply({
				content: `${client.customEmojis.error} An error occurred while fetching GitHub data.`,
			});
		}
	}
}
