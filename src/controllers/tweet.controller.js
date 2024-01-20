import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createNewTweet = asyncHandler(async (req, res) => {
    const content = req.body?.tweetContent;

    if (!content) {
        throw new ApiError(400, "content is required!");
    }

    const tweet = await Tweet.create({
        owner: req.user?._id,
        content: content,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet added successfully!"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const tweetId = req.params?.tweetId;

    if (!tweetId) {
        throw new ApiError(400, "tweet id is required!");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id!");
    }

    const tweetToDelete = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user?._id,
    });

    if (!tweetToDelete) {
        throw new ApiError(400, "tweet does not exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "tweet deleted successfully!"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const tweetId = req.params?.tweetId;
    const content = req.body?.tweetContent;

    if (!tweetId || !(content && content.trim())) {
        throw new ApiError(400, "all fields are required!");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id!");
    }

    const tweetToUpdate = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user?._id,
        },
        {
            $set: {
                content: content,
            },
        },
        { new: true }
    );

    if (!tweetToUpdate) {
        throw new ApiError(400, "tweet does not exist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweetToUpdate, "tweet updated successfully!")
        );
});

const getTweet = asyncHandler(async (req, res) => {
    const tweetId = req.params?.tweetId;

    if (!tweetId) {
        throw new ApiError(400, "all fields are required!");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id!");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(400, "tweet does not exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "tweet fetched successfully!"));
});

const getAllTweetsByUser = asyncHandler(async (req, res) => {
    const userId = req.params?.userId;

    if (!userId) {
        throw new ApiError(400, "user id is required");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "invalid user id!");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, "user does not exist!");
    }

    const tweets = await Tweet.find({ owner: userId });

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "fetched tweets successfully!"));
});

export {
    createNewTweet,
    deleteTweet,
    updateTweet,
    getTweet,
    getAllTweetsByUser,
};
