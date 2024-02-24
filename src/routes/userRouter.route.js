import { Router } from "express";
import {
  changeCurrentPassword,
  logOut,
  loginUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

userRouter.post("/login", loginUser);

userRouter.post("/logout", verifyUser, logOut);
userRouter.post("/refresh-token", refreshAccessToken);
userRouter.post("/change-password", verifyUser, changeCurrentPassword);

export default userRouter;
