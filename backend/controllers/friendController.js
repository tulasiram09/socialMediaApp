const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('Sending friend request:', { from: req.user._id, to: userId });

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if the target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if users are already friends
    const currentUser = await User.findById(req.user._id);
    if (currentUser.friends.includes(userId)) {
      return res.status(400).json({ message: 'Already friends with this user' });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: userId, status: 'pending' },
        { sender: userId, receiver: req.user._id, status: 'pending' }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    const friendRequest = new FriendRequest({
      sender: req.user._id,
      receiver: userId,
      status: 'pending'
    });

    await friendRequest.save();
    await friendRequest.populate('sender', 'username profilePicture email');
    
    console.log('Friend request created successfully:', friendRequest._id);
    
    res.status(201).json({ 
      message: 'Friend request sent',
      request: friendRequest 
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFriendRequests = async (req, res) => {
  try {
    console.log('Getting friend requests for user:', req.user._id);
    
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending'
    })
    .populate('sender', 'username profilePicture email')
    .sort({ createdAt: -1 });

    console.log(`Found ${requests.length} pending friend requests`);
    res.json({ requests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.handleFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;

    console.log('Handling friend request:', { requestId, action, userId: req.user._id });

    // Validate requestId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be accept or reject' });
    }

    const friendRequest = await FriendRequest.findById(requestId)
      .populate('sender', 'username profilePicture email')
      .populate('receiver', 'username profilePicture email');
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    console.log('Found friend request:', {
      id: friendRequest._id,
      sender: friendRequest.sender._id,
      receiver: friendRequest.receiver._id,
      status: friendRequest.status
    });

    // Check if the current user is the receiver of the request
    if (friendRequest.receiver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to handle this request' });
    }

    // Check if request is still pending
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: `Friend request already ${friendRequest.status}` });
    }

    // Update the friend request status
    friendRequest.status = action === 'accept' ? 'accepted' : 'rejected';
    await friendRequest.save();

    if (action === 'accept') {
      // Add each user to the other's friends list
      const senderUpdate = await User.findByIdAndUpdate(
        friendRequest.sender._id, 
        { $addToSet: { friends: friendRequest.receiver._id } },
        { new: true }
      );
      
      const receiverUpdate = await User.findByIdAndUpdate(
        friendRequest.receiver._id, 
        { $addToSet: { friends: friendRequest.sender._id } },
        { new: true }
      );

      console.log('Users added to each other\'s friends list');
      console.log('Sender friends count:', senderUpdate.friends.length);
      console.log('Receiver friends count:', receiverUpdate.friends.length);
    }

    res.json({ 
      message: `Friend request ${action}ed successfully`,
      request: friendRequest
    });
  } catch (error) {
    console.error('Handle friend request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    console.log('Getting friends for user:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .populate('friends', 'username profilePicture email isOnline');
    
    console.log(`User has ${user.friends?.length || 0} friends`);
    res.json({ friends: user.friends || [] });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add this function if you want to keep the getSentRequests route
exports.getSentRequests = async (req, res) => {
  try {
    console.log('Getting sent requests for user:', req.user._id);
    
    const requests = await FriendRequest.find({
      sender: req.user._id,
      status: 'pending'
    })
    .populate('receiver', 'username profilePicture email')
    .sort({ createdAt: -1 });

    console.log(`Found ${requests.length} sent pending requests`);
    res.json({ requests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};