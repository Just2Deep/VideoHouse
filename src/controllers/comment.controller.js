import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    if (!content || !content.trim()) {
        throw new ApiError(400, "content is required!");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id");
    }

    const videoToAddComment = await Video.findOne({
        _id: videoId,
        isPublished: true,
    });

    if (!videoToAddComment) {
        throw new ApiError(400, "video does not exist");
    }

    const comment = await Comment.create({
        owner: req.user?._id,
        video: videoToAddComment?._id,
        content: content,
    });

    if (!comment) {
        throw new ApiError(500, "error while creating comment");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "new comment added."));
});

const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { commentId } = req.params;

    if (!content || !content.trim()) {
        throw new ApiError(400, "content is required!");
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid comment id");
    }

    const comment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user?._id },
        {
            $set: {
                content: content,
            },
        },
        { new: true }
    );

    if (!comment) {
        throw new ApiError(400, "comment does not exist");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, comment, "comment updated."));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid comment id");
    }

    const comment = await Comment.findById(commentId);

    if (!(comment && comment.owner.equals(req.user?._id))) {
        throw new ApiError(400, "comment does not exist");
    }

    await Comment.deleteOne({ _id: comment._id });

    return res
        .status(204)
        .json(new ApiResponse(204, {}, "comment deleted successfully"));
});

// const getComment = asyncHandler(async (req, res) => {
//     const { commentId } = req.params;

//     if (!isValidObjectId(commentId)) {
//         throw new ApiError(400, "invalid comment id");
//     }

//     const comment = await Comment.findById(commentId);

//     if (!comment) {
//         throw new ApiError(400, "comment does not exist");
//     }

//     return res
//         .status(201)
//         .json(new ApiResponse(200, comment, "comment fetched successfully."));
// });

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const customLabels = {
        totalDocs: "commentCount",
        docs: "commentsList",
        limit: "commentsPerPage",
        page: "currentPage",
        nextPage: "next",
        prevPage: "prev",
        totalPages: "totalComments",
        hasPrevPage: "hasPrev",
        hasNextPage: "hasNext",
        pagingCounter: "pageCounter",
        meta: "paginator",
    };

    const options = { page, limit, customLabels };

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id");
    }

    // Define your aggregate.
    const comments = Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
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
    ]);

    Comment.aggregatePaginate(comments, options)
        .then(function (result) {
            return res
                .status(200)
                .json(new ApiResponse(200, result, "fetched comments"));
        })
        .catch(function (err) {
            console.log(err);
            throw new ApiError(500, "error getting comments");
        });
});

export {
    addComment,
    updateComment,
    deleteComment,
    // getComment,
    getVideoComments,
};
