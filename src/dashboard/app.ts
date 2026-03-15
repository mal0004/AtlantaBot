import express from "express";
import session from "express-session";
import path from "path";
import ejs from "ejs";
import type Atlanta from "../base/Atlanta.js";
import { fetchUser } from "./utils.js";
import CheckAuth from "./auth/CheckAuth.js";

import mainRouter from "./routes/index.js";
import discordAPIRouter from "./routes/discord.js";
import logoutRouter from "./routes/logout.js";
import settingsRouter from "./routes/settings.js";
import guildStatsRouter from "./routes/guild-stats.js";
import guildManagerRouter from "./routes/guild-manager.js";

export function loadDashboard(client: Atlanta): void {
	const app = express();

	const dashboardViewsDir = path.resolve(process.cwd(), "dashboard/views");
	const dashboardPublicDir = path.resolve(process.cwd(), "dashboard/public");

	app
		.use(express.json())
		.use(express.urlencoded({ extended: true }))
		.engine("html", ejs.renderFile as any)
		.set("view engine", "ejs")
		.use(express.static(dashboardPublicDir))
		.set("views", dashboardViewsDir)
		.set("port", client.config.dashboard.port)
		.use(
			session({
				secret: client.config.dashboard.expressSessionPassword,
				resave: false,
				saveUninitialized: false,
			})
		)
		.use(async (req, _res, next) => {
			req.user = (req.session as any).user;
			req.client = client;
			req.locale = req.user ? (req.user.locale === "fr" ? "fr-FR" : "en-US") : "en-US";
			if (req.user && req.url !== "/") {
				req.userInfos = await fetchUser(req.user, client);
			}
			if (req.user) {
				req.translate = client.translations.get(req.locale)!;
				req.printDate = (date: Date | number) => client.printDate(date, undefined, req.locale);
			}
			next();
		})
		.use("/api", discordAPIRouter)
		.use("/logout", logoutRouter)
		.use("/manage", guildManagerRouter)
		.use("/stats", guildStatsRouter)
		.use("/settings", settingsRouter)
		.use("/", mainRouter)
		.use(CheckAuth, (req, res) => {
			res.status(404).render("404", {
				user: req.userInfos,
				translate: req.translate,
				currentURL: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
			});
		});

	app.listen(app.get("port"), () => {
		console.log(`Atlanta Dashboard is listening on port ${app.get("port")}`);
	});
}
