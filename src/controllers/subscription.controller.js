import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!(channelId && isValidObjectId(channelId))) {
        throw new ApiError(400, "invalid channel id");
    }

    const isSubscribed = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id,
    });

    if (isSubscribed) {
        await Subscription.findOneAndDelete({
            channel: channelId,
            subscriber: req.user?._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "unsubscribed successfully!"));
    }

    const subscribe = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, subscribe, "subscribed successfully!"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // TODO: can add pagination later if required
    const { channelId } = req.params;

    if (!(channelId && isValidObjectId(channelId))) {
        throw new ApiError(400, "channel id incorrect");
    }

    const subscribersList = await Subscription.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                subscriber: {
                    $first: "$subscriber",
                },
            },
        },
    ]);

    if (!subscribersList) {
        throw new ApiError(400, "no subscribers");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribersList,
                "subscribers fetched successfully!"
            )
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // TODO: can add pagination later if required
    const { subscriberId } = req.params;

    if (!(subscriberId && isValidObjectId(subscriberId))) {
        throw new ApiError(400, "channel id incorrect");
    }

    const channelsList = await Subscription.aggregate([
        { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                channel: {
                    $first: "$channel",
                },
            },
        },
    ]);

    if (!channelsList) {
        throw new ApiError(400, "no channels subscribed");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelsList,
                "subscribed channels fetched successfully!"
            )
        );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
