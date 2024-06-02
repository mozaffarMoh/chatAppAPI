const express = require("express");
const Users = require("../models/Users");
const MessageBox = require("../models/MessageBox");
const bcrypt = require("bcryptjs");
const authenticateToken = require("../middleware/isAuth");

/* Get all users */
async function getAllUsers(req, res) {
  const userID = req.params.userID;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const limitDocs = page * limit;

    // Fetch the specified user separately
    const specifiedUser = await Users.findById(userID).lean();

    // Fetch users up to the current page limit, excluding the specified user
    let users = await Users.find({ _id: { $ne: userID } })
                           .limit(limitDocs)
                           .lean();

    // Remove the password field from all users
    if (specifiedUser) {
      delete specifiedUser.password;
    }
    users = users.map(user => {
      delete user.password;
      return user;
    });

    // Combine the specified user at the front, if they exist
    if (specifiedUser) {
      users.unshift(specifiedUser);
    }

    // Ensure the result contains only the first 'limit' items
    const paginatedUsers = users.slice(0, limitDocs);

    const totalUsersNumber = await Users.countDocuments();

    res.json({ users: paginatedUsers, total: totalUsersNumber });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}


/* Get one user */
async function getOneUser(req, res) {
  const id = req.params.userID;
  try {
    const user = await Users.findById(id).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    delete user.password;
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/* Delete user */
async function deleteUser(req, res) {
  const id = req.params.userID;
  try {
    const deletedUser = await Users.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    await MessageBox.deleteMany({
      sender: id,
    });
    res.send("delete success");
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/* Update Profile */
async function updateProfile(req, res) {
  const userID = req.params.userID;
  const { profilePhoto, username, oldPassword, newPassword } = req.body;
  try {
    const existingUser = await Users.findOne({ _id: userID });

    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      existingUser?.password
    );

    let updatedPassword = "";
    if (oldPassword && !newPassword) {
      return res.status(402).send("please enter new password");
    } else if (!oldPassword && newPassword) {
      return res.status(402).send("please enter old password");
    }
    if (oldPassword) {
      if (!isPasswordMatched) {
        return res.status(402).send("old password is not correct");
      } else {
        updatedPassword = await bcrypt.hash(newPassword, 10);
      }
    }

    const updatedProfile = await Users.findOneAndUpdate(
      { _id: userID },
      {
        profilePhoto: profilePhoto,
        username: username,
        password: updatedPassword ? updatedPassword : existingUser.password,
      },
      { new: true }
    );

    if (updatedProfile) {
      res.send("Update Profile Photo success");
    } else {
      res.status(404).json({ error: "Photo not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/* Add new value to all users */
/* This function not for front its for me to add a new value if exist */
async function updateUsers(req, res) {
  try {
    const usersToUpdate = await Users.find({
      profilePhoto: { $exists: false },
    });

    for (const user of usersToUpdate) {
      user.profilePhoto = "";
      await user.save();
    }

    res.send("Users updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating users");
  }
}

const router = express.Router();

router.get("/:userID", authenticateToken, getAllUsers);
router.get("/one-user/:userID", authenticateToken, getOneUser);
router.delete("/:userID", authenticateToken, deleteUser);
router.put("/update-profile/:userID", authenticateToken, updateProfile);
router.get("/update-users/update", authenticateToken, updateUsers);

module.exports = router;
