import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // upload file on cloudinary
        const repsonse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        //file has been uploaded successfully.
        // console.log("file is uploaded on cloudinary", repsonse.url);
        fs.unlinkSync(localFilePath);

        return repsonse;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove locally saved temporary file as upload operation failed.
        return null;
    }
};

const deleteFromCloudinary = async (url) => {
    try {
        const publicId = path.parse(url).name;
        if (!publicId) return null;

        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        // operation failed
        console.log(`Error ${error}`);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
