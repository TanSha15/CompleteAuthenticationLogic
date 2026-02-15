import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../mailTrap/emails.js";


/*------------------------------ SIGNUP ----------------------------------------------------*/
export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Please provide all the fields" });
    }

    if (password.length < 3) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24*60*60*1000,
    });

    generateTokenAndSetCookie(res, user._id);

    const { password: _, ...safeUser } = user.toObject();


    res.status(201).json({
      message: "User created successfully",
      user: safeUser,
    });


    sendVerificationEmail(user.email, user.verificationToken)
      .catch(err => console.log("Mail error:", err));

  } catch (error) {
    res.status(500).json({
      message: "Error while creating User...",
      error: error.message,
    });
  }
};


/*------------------------------ VERIFY EMAIL ----------------------------------------------------*/
export const verifyEmail = async (req, res) => {
  try {
    const {code} = req.body;

    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if(!user){
      return res.status(400).json({message: "Invalid or expired verification code"});
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();
    
    await sendWelcomeEmail(user.email, user.name); // Optional: send welcome email after verification

    res.json({message: "Email verified successfully!"});
  } catch (error) {
    console.error("Error verifying email", error);
    res.status(500).json({message: "Error verifying email", error: error.message});
  }
}

/*---------------------------------- LOGIN ----------------------------------------------------- */
export const login = async(req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }


    user.lastLogin = Date.now();
    await user.save();
    generateTokenAndSetCookie(res,user._id);
    res.json({
      success : true,
      message: "Logged in successfully",
      user: {_id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error during login", error);
    res.status(500).json({ message: "Error during login", error: error.message });
  }
};

/*----------------------------------- LOGOUT --------------------------------------------------- */
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

/*-----------------------------------FORGOT PASSWORD -------------------------------------------- */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please provide your email" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User with this email does not exist" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiresAt = Date.now() + 3600000; // 1 hour

    await user.save();

    //send email
    await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}` );

    res.json({ message: "Password reset email sent" });

  } catch (error) {
    console.error("Error during forgot password", error);
    res.status(500).json({ message: "Error during forgot password", error: error.message });
  }
};

/*-----------------------------------RESET PASSWORD -------------------------------------------- */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Please provide a new password" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiresAt = undefined;
    await user.save();

    await sendResetSuccessEmail(user.email); 

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error during reset password", error);
    res.status(500).json({ message: "Error during reset password", error: error.message });
  }
};


/*------------------- CHECK AUTH -------------------------------------------------- */
export const checkAuth = async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("-password");

		if (!user) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		res.status(200).json({ success: true, user });

	} catch (error) {
		console.log("Error in checkAuth ", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};