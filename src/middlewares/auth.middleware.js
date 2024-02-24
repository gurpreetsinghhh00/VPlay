import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

export const verifyUser = async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header.authorization?.replace("Bearer ", "");
  if (!token) throw new ApiError(401, "Unauthorized request");

  try {
    const decodedJwt = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedJwt?._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new ApiError(401, "Invalid access token");
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while verifying access token"
    );
  }
};
