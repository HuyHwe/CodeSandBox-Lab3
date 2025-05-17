const express = require("express");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");

const router = express.Router();
const {isValidObjectId} = require("../utils/utils");

router.post("/", async (request, response) => {
  
});

router.get("/", async (request, response) => {
  
});
router.get('/photosOfUser/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: `Invalid user ID format: ${id}. Please provide a valid MongoDB ObjectId.` });
  }

  try {
    const userExists = await User.findById(id).select('_id').lean();
    if (!userExists) {
      return res.status(400).json({ message: `User with ID ${id} not found. Cannot fetch photos.` });
    }

    // Fetch photos for the user
    const photosFromDB = await Photo.find({ user_id: id }).lean();

    if (!photosFromDB || photosFromDB.length === 0) {
      return res.json([]); // Return empty array if no photos found for the user
    }

    // Collect all unique commenter IDs from all photos
    const commenterIds = new Set();
    photosFromDB.forEach(photo => {
      photo.comments.forEach(comment => {
        if (comment.user_id) { // Ensure user_id exists
            commenterIds.add(comment.user_id.toString());
        }
      });
    });

    // Fetch details for all unique commenters in a single query
    const commenters = await User.find({ _id: { $in: Array.from(commenterIds) } })
                                 .select('_id first last_name')
                                 .lean();

    // Create a map for quick lookup of commenter details
    const commentersMap = new Map(commenters.map(c => [
        c._id.toString(),
        { _id: c._id, first_name: c.first, last_name: c.last_name }
    ]));

    // Process photos and their comments
    const processedPhotos = photosFromDB.map(photo => {
      const processedComments = photo.comments.map(comment => {
        const commenterDetails = comment.user_id ? commentersMap.get(comment.user_id.toString()) : null;
        return {
          _id: comment._id,
          comment: comment.comment,
          date_time: comment.date_time,
          user: commenterDetails || { _id: comment.user_id, first_name: "Unknown", last_name: "User" } // Fallback if commenter not found
        };
      });

      return {
        _id: photo._id,
        user_id: photo.user_id, // This is the ID of the user who owns the photo
        file_name: photo.file_name,
        date_time: photo.date_time,
        comments: processedComments,
      };
    });

    res.json(processedPhotos);
  } catch (error) {
    console.error(`Error fetching photos for user ID ${id}:`, error);
    res.status(500).json({ message: 'Error fetching photos', error: error.message });
  }
});
module.exports = router;
