const Post = require('../models/Post');
const upload = require('../middleware/upload');

exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    const post = new Post({
      author: req.user._id,
      content,
      image
    });

    await post.save();
    await post.populate('author', 'username profilePicture');

    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username profilePicture')
      .populate('comments')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ author: userId })
      .populate('author', 'username profilePicture')
      .populate('comments')
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};