const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secure_key_phrase";

// POST: /register 
router.post('/register', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("users");

        const { email, password, name } = req.body;

        // Check for duplicate emails in the collection
        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            logger.warn(`Registration rejected: ${email} already exists.`);
            return res.status(400).json({ error: "Email target registration already exists." });
        }

        // Salt and hash the password using bcryptjs
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            date_joined: new Date()
        };

        await collection.insertOne(newUser);

        // Sign and return a JWT token stream
        const token = jwt.sign({ email, name }, JWT_SECRET, { expiresIn: '2h' });
        res.status(201).json({ token, userName: name, userEmail: email });
    } catch (e) {
        logger.error(e);
        next(e);
    }
});

// POST: /login - 
router.post('/login', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("users");

        const { email, password } = req.body;

        // Find user document matching email
        const user = await collection.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or matching record tracks missing." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Authentication credentials mismatch." });
        }

        const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
        res.status(200).json({ token, userName: user.name, userEmail: user.email });
    } catch (e) {
        logger.error(e);
        next(e);
    }
});

// PUT: /update
router.put(
    '/update',
    [
        body('name').notEmpty().withMessage('Name field cannot be left blank.'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: "Verification authorization headers required." });
            }

            const token = authHeader.split(" ")[1];
            const verifiedData = jwt.verify(token, JWT_SECRET);

            const db = await connectToDatabase();
            const collection = db.collection("users");

            const updateFields = { name: req.body.name };

            // Re-hash password update if a user supplies a modification payload
            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                updateFields.password = await bcrypt.hash(req.body.password, salt);
            }

            const result = await collection.updateOne(
                { email: verifiedData.email },
                { $set: updateFields }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: "Target profile user document not found." });
            }

            // Re-issue a fresh updated JWT token mapping configurations
            const newToken = jwt.sign({ email: verifiedData.email, name: req.body.name }, JWT_SECRET, { expiresIn: '2h' });
            res.status(200).json({ token: newToken, message: "User profile configurations fully aligned." });
        } catch (e) {
            logger.error(e);
            res.status(401).json({ error: "Access token verification validation operations dropped." });
        }
    }
);

module.exports = router;