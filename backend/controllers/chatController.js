const Chat = require('../models/Chat');

exports.createChat = async (req, res) => {
  try {
    const { participants, isGroup, groupName } = req.body;
    
    // Add current user to participants if not included
    const allParticipants = participants.includes(req.user._id.toString()) 
      ? participants 
      : [...participants, req.user._id];

    // For private chats, check if chat already exists
    if (!isGroup && allParticipants.length === 2) {
      const existingChat = await Chat.findOne({
        participants: { $all: allParticipants },
        isGroup: false
      });

      if (existingChat) {
        return res.json({ chat: existingChat });
      }
    }

    const chat = new Chat({
      participants: allParticipants,
      isGroup,
      groupName: isGroup ? groupName : ''
    });

    await chat.save();
    await chat.populate('participants', 'username profilePicture isOnline');

    res.status(201).json({ chat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
    .populate('participants', 'username profilePicture isOnline')
    .populate({
      path: 'messages.sender',
      select: 'username profilePicture'
    })
    .sort({ updatedAt: -1 });

    res.json({ chats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId)
      .populate({
        path: 'messages.sender',
        select: 'username profilePicture'
      });

    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ messages: chat.messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    
    const chat = await Chat.findById(chatId);
    
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = {
      sender: req.user._id,
      content,
      timestamp: new Date()
    };

    chat.messages.push(message);
    chat.updatedAt = new Date();
    await chat.save();

    await chat.populate({
      path: 'messages.sender',
      select: 'username profilePicture'
    });

    res.status(201).json({ 
      message: chat.messages[chat.messages.length - 1] 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};