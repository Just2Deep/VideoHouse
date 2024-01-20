import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "invalid channel id.");
    }

    const stats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "allVideos",
                pipeline: [
                    {
                        $match: {
                            isPublished: true,
                        },
                    },
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes",
                        },
                    },
                    {
                        $addFields: {
                            likesCount: { $size: "$likes" },
                        },
                    },
                    {
                        $project: {
                            likes: 0,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $addFields: {
                totalSubscribers: { $size: "$subscribers" },
                totalVideos: { $size: "$allVideos" },
                totalViews: { $sum: "$allVideos.views" },
                totalLikes: { $sum: "$allVideos.likesCount" },
            },
        },
        {
            $project: {
                totalVideos: 1,
                totalViews: 1,
                totalLikes: 1,
                totalSubscribers: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
            },
        },
    ]);

    if (!stats) {
        throw new ApiError(400, "error while fetching!");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats[0], "fetched stats successfully!"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "channel id is incorrect.");
    }

    const videos = Video.aggregate([
        {
            $match: {
                isPublished: true,
                owner: new mongoose.Types.ObjectId(channelId),
            },
        },
    ]);

    const options = { page, limit };

    Video.aggregatePaginate(videos, options)
        .then(function (result) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, result, "fetched videos successfull!")
                );
        })
        .catch(function (err) {
            console.log(err);
            throw new ApiError(500, "error getting videos!");
        });
});

export { getChannelStats, getChannelVideos };
