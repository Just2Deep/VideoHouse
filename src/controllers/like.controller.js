import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!(videoId && isValidObjectId(videoId))) {
        throw new ApiError(400, "invalid channel id");
    }

    const isLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    });

    if (isLiked) {
        await Like.findOneAndDelete({
            video: videoId,
            likedBy: req.user?._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "unliked video successfully!"));
    }

    const like = await Like.create({
        video: videoId,
        likedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, like, "liked video successfully!"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!(commentId && isValidObjectId(commentId))) {
        throw new ApiError(400, "invalid channel id");
    }

    const isLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    });

    if (isLiked) {
        await Like.findOneAndDelete({
            comment: commentId,
            likedBy: req.user?._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "unliked comment successfully!"));
    }

    const like = await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, like, "liked comment successfully!"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!(tweetId && isValidObjectId(tweetId))) {
        throw new ApiError(400, "invalid channel id");
    }

    const isLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    if (isLiked) {
        await Like.findOneAndDelete({
            tweet: tweetId,
            likedBy: req.user?._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "unliked tweet successfully!"));
    }

    const like = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, like, "liked tweet successfully!"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    // get all liked videos by current user

    const videosList = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $exists: true },
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            views: 1,
                            description: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                video: {
                    $first: "$video",
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videosList,
                "liked videos fetched successfully!"
            )
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
