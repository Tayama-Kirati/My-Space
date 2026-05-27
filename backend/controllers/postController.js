const Post = require('../models/Post')
const slugify = require('slugify')

exports.createPost = async (req, res) => {
  try {
    const { title, content, categories, tags, contentType } = req.body

    const slug = slugify(title, { lower: true })

    const post = new Post({
      title,
      slug,
      content,
      contentType,
      categories,
      tags,
      author: req.user._id,
      status: 'draft',
    })

    await post.save()
    await post.populate('author', 'username email')

    res.status(201).json({
      success: true,
      post,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getPosts = async (req, res) => {
  try {
    const { status, author, category, page = 1, limit = 20, search } = req.query

    const filter = { deletedAt: null }

    if (status) filter.status = status
    if (author) filter.author = author
    if (category) filter.categories = category

    if (search) {
      filter.$text = { $search: search }
    }

    const skip = (page - 1) * limit

    const posts = await Post.find(filter)
      .populate('author', 'username email')
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Post.countDocuments(filter)

    res.json({
      success: true,
      posts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const post = await Post.findById(id)

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Check authorization
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

  
    if (updates.content && updates.content !== post.content) {
      post.revisions.push({
        content: post.content,
        createdBy: req.user._id,
        comment: updates.revisionComment || '',
      })
    }

    Object.assign(post, updates)
    post.editor = req.user._id
    await post.save()

    res.json({
      success: true,
      post,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.publishPost = async (req, res) => {
  try {
    const { id } = req.params

    const post = await Post.findById(id)

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'editor') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    post.status = 'published'
    post.publishedAt = new Date()
    await post.save()

    res.json({
      success: true,
      post,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params

    const post = await Post.findById(id)

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' })
    }
 
    post.deletedAt = new Date()
    await post.save()

    res.json({
      success: true,
      message: 'Post deleted',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}