const authorize = (requiredRole) => {
  return (req, res, next) => {
    const rolePermissions = {
      admin: ['*'],
      editor: ['create_post', 'edit_any_post', 'publish_post', 'manage_categories'],
      author: ['create_post', 'edit_own_post'],
      viewer: ['view_published_content'],
    }

    const userPermissions = rolePermissions[req.user.role]
    
    if (userPermissions.includes('*')) {
      return next()
    }

    if (requiredRole && !userPermissions.includes(requiredRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

module.exports = authorize