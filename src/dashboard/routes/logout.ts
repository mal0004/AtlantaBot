import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
	req.session.destroy(() => {});
	res.redirect(req.client.config.dashboard.failureURL);
});

export default router;
