const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Faculty = require('../models/Faculty');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    // 1. Check Faculty first — FIX: added .select('+password') so hashed password aaye
    const faculty = await Faculty.findOne({ email }).select('+password');
    if (faculty) {
      // FIX: agar comparePassword method nahi hai model mein, bcrypt direct use karo
      let isMatch = false;
      if (typeof faculty.comparePassword === 'function') {
        isMatch = await faculty.comparePassword(password);
      } else {
        const bcrypt = require('bcryptjs');
        isMatch = await bcrypt.compare(password, faculty.password);
      }

      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
      if (!faculty.isActive) return res.status(403).json({ message: 'Account inactive' });

      const token = jwt.sign(
        { id: faculty._id, facultyId: faculty.facultyId, role: 'faculty' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.json({
        token,
        user: {
          facultyId: faculty.facultyId,
          name: faculty.name,
          email: faculty.email,
          subject: faculty.subject,
          subjectCode: faculty.subjectCode,
          role: 'faculty',
        },
      });
    }

    // 2. Check User (admin / tpo / student)
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    let isMatch = false;
    if (typeof user.comparePassword === 'function') {
      isMatch = await user.comparePassword(password);
    } else {
      const bcrypt = require('bcryptjs');
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Account inactive' });

    const token = jwt.sign(
      { id: user._id, role: user.role, enrollmentNumber: user.enrollmentNumber },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        enrollmentNumber: user.enrollmentNumber || null,
      },
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ facultyId: req.user.facultyId }).select('-password');
      if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
      return res.json({ ...faculty.toObject(), role: 'faculty' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};