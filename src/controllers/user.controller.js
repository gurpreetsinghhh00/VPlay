import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { z } from "zod";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// access and refresh token logic
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshHToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

// register logic
const registerBody = z.object({
  username: z.string().min(6),
  fullname: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export const registerUser = asyncHandler(async (req, res) => {
  const { success } = registerBody.safeParse(req.body);
  if (!success)
    throw new ApiError(400, "Invalid username, password, fullname or email");

  const existingUser = await User.findOne({
    $or: [{ username: req.body.username }, { email: req.body.email }],
  });

  if (existingUser) {
    throw new ApiError(411, "User already exists");
  }

  // console.log(req.files);
  // const avatarImageLocal = req.files?.avatar[0]?.path;
  // const coverImageLocal = req.files?.coverImage[0].path;

  let coverImageLocal;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocal = req.files.coverImage[0].path;
  }

  let avatarImageLocal;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarImageLocal = req.files.avatar[0].path;
  }

  // if (!avatarImageLocal) {
  //   throw new ApiError(400, "Avatar image is required local storage");
  // }

  const avatar = await uploadOnCloudinary(avatarImageLocal);
  const coverImage = await uploadOnCloudinary(coverImageLocal);

  // if (!avatar) {
  //   throw new ApiError(400, "Avatar image is required cloudinary");
  // }

  const response = await User.create({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname,
    password: req.body.password,
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(response._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

// login logic
const loginBody = z.object({
  username: z.string().min(6),
  password: z.string().optional(),
  email: z.string().email().optional(),
});

export const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(username || email))
    throw new ApiError(400, "username or email is required");

  const { success } = loginBody.safeParse({ username, password, email });
  if (!success) throw new ApiError(400, "Bad request");

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!existingUser) throw new ApiError(404, "User does not exists");

  const checkPassword = await existingUser.isPasswordCorrect(password);
  if (!checkPassword) throw new ApiError(404, "Incorrect password");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existingUser._id
  );

  const loggedUser = await User.findById(existingUser._id).select(
    "-password -refreshToken"
  );

  console.log(loggedUser);
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

export const logOut = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Loggod out"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingAccessToken = req.cookie.accessToken || req.body.accessToken;

  if (!incomingAccessToken) throw new ApiError(401, "Unauthorised request");

  try {
    const decoded = jwt.verify(
      incomingAccessToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decoded?._id);

    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (incomingAccessToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token has expired");

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message);
  }
});

export const changeCurrentPassword = asyncHandler(async (res, res) => {
  const { oldPassword, newPassword } = req.user;

  const user = await User.findById(req.user?._id);
  const verifyPassword = user.isPasswordCorrect(oldPassword);
  if (!verifyPassword) throw new ApiError(400, "Invalid Password");
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  res
    .status(200)
    .json(new ApiResponse(200, { user }, "Current user fetched successfully"));
});

const updateBody = z.object({
  fullname: z.string(),
  email: z.string().email(),
});

export const updateAccount = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) throw new ApiError(400, "All feilds are required");

  const { success } = updateBody.safeParse({ fullname, email });
  if (!success) throw new ApiError(400, "Invalid fullname or email");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullname, email },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Account details updated successfully")
    );
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocal = req.file?.path;
  if (!avatarLocal) throw new ApiError(400, "Avatar file is missing");

  const avatar = await uploadOnCloudinary(avatarLocal);

  if (!avatar.url)
    throw new ApiError(500, "Error while uploading avatar file to cloudinary");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, { user }, "Avatar updated successfully"));
});
