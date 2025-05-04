import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { User } from "../models/userModel.js";

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(user.id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error", 
            error: error.message 
        });
    }
}

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = await User.create(name, email, hashedPassword);
        const token = createToken(userId);

        res.status(201).json({ 
            success: true, 
            token,
            user: {
                id: userId,
                name,
                email
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

export { loginUser, registerUser };