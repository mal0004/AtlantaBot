import { Router } from "express";
import CheckAuth from "../auth/CheckAuth.js";

const router = Router();

router.get("/", CheckAuth, async (_req, res) => {
	res.redirect("/selector");
});

router.get("/selector", CheckAuth, async (req, res) => {
	res.render("selector", {
		user: req.userInfos,
		translate: req.translate,
		currentURL: `${req.client.config.dashboard.baseURL}/${req.originalUrl}`,
	});
});

export default router;
