const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directoryPath); // Specify the upload directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name
    },
});

const upload = multer({ storage: storage });

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        logger.error('oops something went wrong', e);
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('image'), async (req, res, next) => {
    try {

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        let newItem = req.body;


        const currentCount = await collection.countDocuments();
        newItem.id = String(currentCount + 1);
        newItem.date_added = Math.floor(Date.now() / 1000);

        // Calculate age parameters dynamically
        if (newItem.age_days) {
            newItem.age_years = Number(newItem.age_days) / 365;
        }

        // Bind incoming multi-part image paths safely if captured
        if (req.file) {
            newItem.image = `/images/${req.file.filename}`;
        }

        await collection.insertOne(newItem);

        // Mocking .ops mapping structure to maintain template script compatibility
        const secondChanceItem = { ops: [newItem] };
        res.status(201).json(secondChanceItem.ops[0]);
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const item = await collection.findOne({ id: req.params.id });

        if (!item) {
            return res.status(404).json({ error: "Item listing not found." });
        }
        res.json(item);
    } catch (e) {
        next(e);
    }
});

// Update an existing item
router.put('/:id', async (req, res, next) => {
    try {

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        let updateData = { ...req.body };
        if (updateData.age_days) {
            updateData.age_years = Number(updateData.age_days) / 365;
        }

        const result = await collection.updateOne(
            { id: req.params.id },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Item target not found for update execution." });
        }
        res.json({ message: "Listing elements adjusted systematically." });
    } catch (e) {
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
    try {

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const result = await collection.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Item target not found for deletion execution." });
        }
        res.json({ message: "Listing permanently cleared from core registry maps." });
    } catch (e) {
        next(e);
    }
});

module.exports = router;