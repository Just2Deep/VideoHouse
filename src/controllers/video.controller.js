import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";

// when thumbnail is not provided use thumbnail given by cloudinary
const getImageExtensionOfVideo = (filename) => {
    return filename.substring(0, filename.lastIndexOf(".")) + ".jpg";
};

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const sortOptions = ["views", "duration", "title"];
    let sortByVar;

    if (!sortOptions.includes(sortBy)) {
        sortByVar = "views";
    } else {
        sortByVar = sortBy;
    }

    let sort = {};
    sort[sortByVar] = sortType == "desc" ? -1 : 1;

    const searchQuery = Video.aggregate([
        {
            $match: {
                isPublished: true,
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } },
                ],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: {
                    $first: "$owner",
                },
            },
        },
        { $sort: sort },
    ]);

    const options = { page, limit };

    Video.aggregatePaginate(searchQuery, options)
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

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!(title && description)) {
        throw new ApiError("all fields are required!");
    }

    const localVideoPath = req.files?.videoFile?.[0]?.path;
    const localThumbnailPath = req.files?.thumbnail?.[0]?.path;

    if (!localVideoPath) {
        throw new ApiError(400, "video file is required!");
    }

    const video = await uploadOnCloudinary(localVideoPath);
    const thumbnail = await uploadOnCloudinary(localThumbnailPath);

    if (!video) {
        throw new ApiError(500, "error uploading to cloudinary");
    }

    const newVideo = await Video.create({
        videoFile: video.url, // cloudinary url
        thumbnail: thumbnail?.url || getImageExtensionOfVideo(video.url), // cloudinary url
        title: title,
        description: description,
        duration: video.duration,
        owner: req.user?._id,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, newVideo, "new video uploaded successfully!")
        );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!(videoId && isValidObjectId(videoId))) {
        throw new ApiError(400, "video id is invalid!");
    }

    const video = await Video.findById(videoId);

    if (!(video && (video.isPublished || video.owner.equals(req.user?._id)))) {
        throw new ApiError(400, "video does not exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "video fetched successfully!"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    //TODO: update video details like title, description, thumbnail

    if (!(videoId && isValidObjectId(videoId))) {
        throw new ApiError(400, "video id is invalid!");
    }

    const videoToUpdate = await Video.findById(videoId);

    if (!(videoToUpdate && videoToUpdate.owner.equals(req.user?._id))) {
        throw new ApiError(400, "video does not exist");
    }

    const localThumbnailPath = req.file?.path;

    const thumbnail = await uploadOnCloudinary(localThumbnailPath);

    const video = await findByIdAndUpdate(
        videoId,
        {
            title: title || videoToUpdate.title,
            description: description || videoToUpdate.description,
            thumbnail: thumbnail?.url || videoToUpdate.thumbnail,
        },
        { new: true }
    );

    if (!video) {
        throw new ApiError(500, "error while updating the video");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video details updated successfull!")
        );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!(videoId && isValidObjectId(videoId))) {
        throw new ApiError(400, "video id is invalid!");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "video does not exist");
    }

    if (!video.owner.equals(req.user?._id)) {
        throw new ApiError(403, "you cannot perform this action.");
    }

    // delete video from database
    await Video.findByIdAndDelete(videoId);

    //delete video & thumbnail from cloudinary
    await deleteFromCloudinary(video?.thumbnail);
    await deleteFromCloudinary(video?.videoFile);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "video deleted successfully!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!(videoId && isValidObjectId(videoId))) {
        throw new ApiError(400, "video id is invalid!");
    }

    const videoToToggle = await Video.findByIdAndUpdate(videoId);

    if (!videoToToggle.owner.equals(req.user?._id)) {
        throw new ApiError(403, "you cannot perform this action.");
    }

    if (!videoToToggle) {
        throw new ApiError(400, "video does not exist");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !videoToToggle.isPublished,
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "updated publish status successfully!")
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
