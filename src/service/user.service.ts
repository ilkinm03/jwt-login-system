import bcrypt from "bcrypt";
import UserRepository from "repository/user.repository";
import UserUtil from "util/user.util";
import RoleModel from "model/role.model";
import RoleEnum from "enum/role.enum";
import MailService from "./mail_service/mail.service";
import TokenService from "./token.service";
import logger from "logger/logger";
import ApiError from "exception/api.error";
import { Signup, QuerySignup, QueryLogin } from "types/types";

class UserService {
  public signup: Signup = async (
    fullName,
    emailOrPhone,
    password,
    confirmPassword
  ) => {
    logger.debug("UserController.signup.UserService -- START");
    if (password !== confirmPassword) {
      logger.warn("UserController.signup.UserService -- not match");
      throw ApiError.BadRequest("Confirm password field is not same!");
    }
    try {
      const hashPassword = await bcrypt.hash(password, 12);
      const query: QuerySignup = { fullName, password: hashPassword };
      const result = UserUtil.checkEmailOrPhone(emailOrPhone);
      result ? (query.email = emailOrPhone) : (query.phone = emailOrPhone);
      const candidate = query.email
        ? await UserRepository.findUserByEmail(query.email)
        : query.phone && (await UserRepository.findUserByPhone(query.phone));
      if (candidate) {
        logger.warn("UserController.signup.UserService -- already exists");
        throw ApiError.ConflictException("Email is already registered!");
      }
      const userRoleID = await RoleModel.findOne({
        role: RoleEnum.USER,
      }).lean();
      query.role = userRoleID;
      if (query.email) {
        UserRepository.createUser(query);
        const verifyToken = await TokenService.generateVerifyToken(query.email);
        await UserRepository.updateUserVerifyToken(query.email, verifyToken);
        await MailService.sendVerifyEmail(
          query.email,
          `${process.env.API_URL}/auth/verify-account/${verifyToken}`
        );
      } else if (query.phone) {
        await UserRepository.createUser(query);
      }
      logger.debug("UserController.signup.UserService -- SUCCESS");
    } catch (error) {
      throw error;
    }
  };

  public async login(emailOrPhone: string, password: string) {
    logger.debug("UserController.login.UserService -- START");
    try {
      const query: QueryLogin = {};
      const result = UserUtil.checkEmailOrPhone(emailOrPhone);
      result ? (query.email = emailOrPhone) : (query.phone = emailOrPhone);
      const user = query.email
        ? await UserRepository.findUserByEmail(query.email)
        : query.phone && (await UserRepository.findUserByPhone(query.phone));
      if (!user) {
        logger.warn("UserController.login.UserService -- not found");
        throw ApiError.BadRequest("Email or password is incorrect!");
      }
      const isPasswordCorrect: boolean = await bcrypt.compare(
        password,
        user.password
      );
      if (!isPasswordCorrect) {
        logger.warn("UserController.login.UserService -- incorrect password");
        throw ApiError.BadRequest("Email or password is incorrect!");
      }
      await UserRepository.updateUserLoginInfo(user._id);
      logger.debug("UserController.login.UserService -- SUCCESS");
      return user;
    } catch (error) {
      throw error;
    }
  }

  public async verifyAccount(verifyToken: string) {
    try {
      logger.debug("UserController.verifyAccount.UserService -- START");
      const user: any = await UserRepository.findUserByToken(verifyToken);
      await UserRepository.findUserByIdAndUpdate(user._id);
      logger.debug("UserController.verifyAccount.UserService -- SUCCESS");
      return user;
    } catch (error) {
      throw error;
    }
  }

  public async forgotPassword(emailOrPhone: string) {
    try {
      logger.debug("UserController.forgotPassword.UserService -- START");
      const user = await UserRepository.findUserByEmail(emailOrPhone);
      if (!user) {
        logger.warn(
          "UserController.forgotPassword.UserService -- user not found"
        );
        throw ApiError.NotFoundException("User not found!");
      }
      const resetToken = await TokenService.generateResetToken(emailOrPhone);
      user.resetToken = resetToken;
      user.save();
      await MailService.sendResetEmail(
        emailOrPhone,
        `${process.env.API_URL}/auth/reset-password/${resetToken}`
      );
      logger.debug("UserController.forgotPassword.UserService -- SUCCESS");
      return user;
    } catch (error) {
      throw error;
    }
  }

  public async resetPassword(
    resetToken: string,
    password: string,
    confirmPassword: string
  ) {
    logger.debug("UserController.resetPassword.UserService -- START");
    if (password !== confirmPassword) {
      logger.warn("UserController.resetPassword.UserService -- not same");
      throw ApiError.BadRequest("Password are not same!");
    }
    try {
      const user = await UserRepository.findUserByToken(resetToken);
      if (!user) {
        logger.warn(
          "UserController.resetPassword.UserService -- user not found"
        );
        throw ApiError.NotFoundException("User not found!");
      }
      if (user.resetToken !== resetToken) {
        logger.warn("UserController.resetPassword.UserService -- expired");
        throw ApiError.GeneralException("The link has expired!");
      }
      const hashPassword = await bcrypt.hash(password, 12);
      const newUser = await UserRepository.resetUserPassword(
        resetToken,
        hashPassword
      );
      logger.debug("UserController.resetPassword.UserService -- SUCCESS");
      return newUser;
    } catch (error) {
      throw error;
    }
  }

  public async refresh(refreshToken: string) {
    try {
      logger.debug("UserService.refresh -- START");
      const userData: any = await TokenService.validateRefreshToken(
        refreshToken
      );
      if (!userData) {
        logger.warn("UserService.refresh -- not found");
        throw ApiError.UnauthorizedError("You are not logged in!");
      }
      const user = await UserRepository.findUserById(userData.payload);
      if (!user) {
        logger.warn("UserService.refresh -- user not found");
        throw ApiError.UnauthorizedError("You are not logged in!");
      }
      const tokens = await TokenService.generateTokens(user._id);
      if (!tokens) {
        logger.warn("UserService.refresh -- tokens not found");
        throw ApiError.UnauthorizedError("You are not logged in!");
      }
      logger.debug("UserService.refresh -- SUCCESS");
      return { ...tokens, user: user._id };
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();
