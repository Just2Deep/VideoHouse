import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";

const createNewPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        throw new ApiError(400, "name is required!");
    }

    const playlist = await Playlist.create({
        name: name,
        description: description || "",
        owner: req.user?._id,
    });

    if (!playlist) {
        throw new ApiError(500, "some error while creating playlist");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, playlist, "playlist created successfully!"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!videoId || !playlistId) {
        throw new ApiError(400, "all fields are required");
    }

    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Incorrect data");
    }

    const playlistToAdd = await Playlist.findOne(
        {
            _id: playlistId,
            owner: req.user?._id,
        },
        { new: true }
    );

    if (!playlistToAdd) {
        throw new ApiError(400, "playlist does not exist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId,
            },
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "error while updating playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "video added to playlist"));
});

const updatePlaylistDetails = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "all fields are required");
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Incorrect playlist id");
    }

    const playlistToUpdate = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user?._id,
        },
        {
            $set: {
                name: name,
                description: description,
            },
        },
        { new: true }
    );

    if (!playlistToUpdate) {
        throw new ApiError(400, "playlist does not exist");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, playlistToUpdate, "playlist details updated")
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Incorrect playlist id");
    }

    const playlist = await Playlist.findOne({
        _id: playlistId,
        owner: req.user?._id,
    });

    if (!playlist) {
        throw new ApiError(400, "playlist does not exist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "playlist data fetched successfully")
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!videoId || !playlistId) {
        throw new ApiError(400, "all fields are required");
    }

    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Incorrect data");
    }

    const playlistToRemove = await Playlist.findOne({
        _id: playlistId,
        owner: req.user?._id,
    });

    if (!playlistToRemove) {
        throw new ApiError(400, "playlist does not exist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId,
            },
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "error while updating playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "video removed from playlist")
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Incorrect data");
    }

    const playlistToRemove = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user?._id,
    });

    if (!playlistToRemove) {
        throw new ApiError(400, "playlist does not exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "playlist deleted successfully!"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId && !isValidObjectId(userId)) {
        throw new ApiError(400, "user id invalid");
    }

    const playlists = await Playlist.find({
        owner: userId,
    });

    if (!playlists) {
        throw new ApiError(400, "playlists do not exist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, "playlists fetched successfully!")
        );
});

export {
    createNewPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylistDetails,
    getPlaylistById,
    deletePlaylist,
    getUserPlaylists,
};
