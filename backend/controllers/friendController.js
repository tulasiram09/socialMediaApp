const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    const friendRequest = new FriendRequest({
      sender: req.user._id,
      receiver: userId
    });

    await friendRequest.save();
    res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFriendRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending'
    }).populate('sender', 'username profilePicture email');

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.handleFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;

    const friendRequest = await FriendRequest.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    friendRequest.status = action;
    await friendRequest.save();

    if (action === 'accept') {
      // Add each user to the other's friends list
      await User.findByIdAndUpdate(friendRequest.sender, {
        $addToSet: { friends: friendRequest.receiver }
      });
      
      await User.findByIdAndUpdate(friendRequest.receiver, {
        $addToSet: { friends: friendRequest.sender }
      });
    }

    res.json({ message: `Friend request ${action}ed` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username profilePicture email isOnline');
    
    res.json({ friends: user.friends });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};