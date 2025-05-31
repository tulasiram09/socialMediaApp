const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;

    const comment = new Comment({
      author: req.user._id,
      post: postId,
      content
    });

    await comment.save();
    await comment.populate('author', 'username profilePicture');

    // Add comment to post
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id }
    });

    res.status(201).json({ comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};