import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createNewTweet,
    deleteTweet,
    getAllTweetsByUser,
    getTweet,
    updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createNewTweet);
router.route("/:tweetId").get(getTweet).patch(updateTweet).delete(deleteTweet);
router.route("/user/:userId").get(getAllTweetsByUser);

export default router;
