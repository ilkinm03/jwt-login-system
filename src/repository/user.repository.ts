import UserModel from "../model/user.model";
import logger from "../logger/logger";
import { QuerySignup } from "../types/types";

class UserRepository {
  public async findUserByEmail(email: string) {
    logger.debug("UserRepository.findUserByEmail -- START");
    const user = await UserModel.findOne({ email });
    logger.debug("UserRepository.findUserByEmail -- SUCCESS");
    return user;
  }

  public async findUserByPhone(phone: string) {
    logger.debug("UserRepository.findUserByPhone -- START");
    const user = await UserModel.findOne({ phone });
    logger.debug("UserRepository.findUserByPhone -- SUCCESS");
    return user;
  }

  public async findUserById(userID: string) {
    logger.debug("UserRepository.findUserById -- START");
    const user = await UserModel.findById(userID);
    logger.debug("UserRepository.findUserById -- SUCCESS");
    return user;
  }

  public async createUser(query: QuerySignup) {
    logger.debug("UserRepository.createUser -- START");
    let user = await UserModel.create(query);
    logger.debug("UserRepository.createUser -- START");
    return user;
  }

  public async updateUserVerifyToken(email: string, verifyToken: string) {
    logger.debug("UserRepository.updateUserVerifyToken -- START");
    const user = await UserModel.findOneAndUpdate({ email }, { verifyToken });
    logger.debug("UserRepository.updateUserVerifyToken -- SUCCESS");
    return user;
  }
  public async updateUserLoginInfo(userID: string) {
    logger.debug("UserRepository.updateUserLoginInfo -- START");
    await UserModel.findByIdAndUpdate(
      userID,
      {
        isActive: false && true,
        lastLogin: new Date(),
      },
      { new: true }
    );
    logger.debug("UserRepository.updateUserLoginInfo -- SUCCESS");
  }

  public async findUserByToken(token: string) {
    logger.debug("UserRepository.findUserByToken -- START");
    const user = await UserModel.findOne({ resetToken: token });
    logger.debug("UserRepository.findUserByToken -- SUCCESS");
    return user;
  }

  public async findUserByIdAndUpdate(userID: string) {
    logger.debug("UserRepository.findUserByIdAndUpdate -- START");
    const user = await UserModel.findByIdAndUpdate(userID, {
      isVerified: true,
      verifyToken: "",
    });
    logger.debug("UserRepository.findUserByIdAndUpdate -- SUCCESS");
    return user;
  }

  public async resetUserPassword(resetToken: string, newPassword: string) {
    logger.debug("UserRepository.resetUserPassword -- START");
    const user = await UserModel.findOneAndUpdate(
      { resetToken },
      { password: newPassword, resetToken: "" }
    );
    logger.debug("UserRepository.resetUserPassword -- SUCCESS");
    return user;
  }
}

export default new UserRepository();
