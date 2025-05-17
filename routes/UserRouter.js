const express = require("express");
const User = require("../db/userModel");
const router = express.Router();

const {isValidObjectId} = require("../utils/utils");

router.post("/", async (request, response) => {
  
});

router.get("/", async (request, response) => {
  
});

router.get('/list', async (req, res) => {
  try {
    const users = await User.find().select('_id first last_name').lean();

    const userList = users.map(user => ({
      _id: user._id,
      first_name: user.first, 
      last_name: user.last_name,
    }));

    res.json(userList);
  } catch (error) {
    console.error('Error fetching user list:', error);
    res.status(500).json({ message: 'Error fetching user list', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: `Invalid user ID format: ${id}. Please provide a valid MongoDB ObjectId.` });
  }

  try {
    const user = await User.findById(id).lean();

    if (!user) {
      return res.status(400).json({ message: `User with ID ${id} not found.` });
    }

    const userDetail = {
      _id: user._id,
      first_name: user.first, 
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation,
    };

    res.json(userDetail);
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
});

module.exports = router;