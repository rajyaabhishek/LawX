import Case from "../models/Case.js";
import User from "../models/user.model.js";
import { 
  notifyLawyersAboutNewCase,
  notifyCasePosterAboutApplication,
  notifyLawyerAboutApplicationStatus
} from "../services/notification.service.js";
import { startConversation } from "./messageController.js";
import Notification from "../models/notification.model.js";

// Get public cases for landing page (no auth required)
export const getPublicCases = async (req, res) => {
  try {
    const publicCases = await Case.find({ 
  status: 'Open',
  $or: [
    { deadline: { $exists: false } },
    { deadline: { $gt: new Date() } }
  ]
})
      .populate('user', 'name username profilePicture')
      .populate('likes', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title description caseType location budget createdAt likes');

    res.status(200).json({ cases: publicCases });
  } catch (error) {
    console.error("Error in getPublicCases controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all cases (public)
export const getAllCases = async (req, res) => {
  try {
    const { 
      search, 
      caseType, 
      expertise, 
      location, 
      minBudget, 
      maxBudget, 
      isRemote,
      sortBy = 'newest',
      page = 1,
      limit = 10
    } = req.query;

    // Only show open cases whose deadline is still in the future (or no deadline set)
const query = { 
  status: 'Open',
  $or: [
    { deadline: { $exists: false } },
    { deadline: { $gt: new Date() } }
  ]
};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Simple and reliable search like browse cases functionality
    if (search) {
      const searchTerm = search.trim();

      // Create a fuzzy regex pattern that matches all letters of the searchTerm
      // in order, allowing for any characters in-between. This provides a
      // lightweight "did you mean" style fuzzy match without requiring Atlas
      // Search or external libraries.
      //   e.g.  "blck"  =>  /b.*l.*c.*k/i  which will match "black", "block", etc.
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const fuzzyPattern = escapeRegex(searchTerm).split("").join(".*");
      const fuzzyRegex = new RegExp(fuzzyPattern, "i");

      query.$or = [
        // Title search (most important)
        { title: { $regex: fuzzyRegex } },
        // Description search
        { description: { $regex: fuzzyRegex } },
        // Case type search
        { caseType: { $regex: fuzzyRegex } },
        // Location search
        { location: { $regex: fuzzyRegex } }
      ];
    }
    
    // Filter by case type
    if (caseType) {
      query.caseType = caseType;
    }
    
    // Filter by expertise
    if (expertise) {
      const expertiseArray = Array.isArray(expertise) ? expertise : [expertise];
      query.expertise = { $in: expertiseArray.map(e => new RegExp(e, 'i')) };
    }
    
    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Filter by budget
    if (minBudget || maxBudget) {
      query['budget.amount'] = {};
      if (minBudget) query['budget.amount'].$gte = parseFloat(minBudget);
      if (maxBudget) query['budget.amount'].$lte = parseFloat(maxBudget);
    }
    

    
    // Filter by remote status
    if (isRemote !== undefined) {
      query.isRemote = isRemote === 'true';
    }
    
    // Sorting
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'deadline':
        sort = { deadline: 1 };
        break;
      case 'budget_high':
        sort = { 'budget.amount': -1 };
        break;
      case 'budget_low':
        sort = { 'budget.amount': 1 };
        break;

      default:
        sort = { createdAt: -1 };
    }
    
    // Execute queries in parallel
    const [cases, total] = await Promise.all([
      Case.find(query)
        .populate('user', 'name username profilePicture')
        .populate('likes', 'name username profilePicture')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Case.countDocuments(query)
    ]);
    
    // Increment view count for each case (async)
    cases.forEach(caseDoc => {
      Case.findByIdAndUpdate(caseDoc._id, { $inc: { views: 1 } }).exec();
    });
    
    res.status(200).json({
      cases,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting cases:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
};

// Get case by ID
export const getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user?._id;
    
    const caseDoc = await Case.findOne({
      _id: caseId,
      // Only allow viewing if the case is open, or the user is the owner, or the user has applied
      $or: [
        { status: 'Open' },
        { user: userId },
        { 'applications.user': userId }
      ]
    })
    .populate('user', 'name username profilePicture')
    .populate('likes', 'name username profilePicture')
    .populate({
      path: 'applications.user',
      select: 'name username profilePicture bio experience specialization'
    });
      
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found or access denied' });
    }
    
    // Increment view count (async)
    if (caseDoc.user._id.toString() !== userId) {
      Case.findByIdAndUpdate(caseId, { $inc: { views: 1 } }).exec();
    }
    
    res.status(200).json(caseDoc);
  } catch (error) {
    console.error('Error getting case by ID:', error);
    res.status(500).json({ error: 'Failed to fetch case details' });
  }
};

// Apply for a case
export const applyForCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { message = '' } = req.body;
    const userId = req.user._id;
    
    // Find the case
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Check if case is open
    if (caseDoc.status !== 'Open') {
      return res.status(400).json({ error: 'This case is no longer accepting applications' });
    }
    
    // Check if already applied
    const hasApplied = caseDoc.applications.some(app => 
      app.user.toString() === userId.toString()
    );
    
    if (hasApplied) {
      return res.status(400).json({ error: 'You have already applied to this case' });
    }
    
    // Add application
    caseDoc.applications.push({
      user: userId,
      message: message.trim() || `I'm interested in working on your case.`,
      status: 'pending'
    });
    
    await caseDoc.save();
    
    // Notify the case poster (async)
    notifyCasePosterAboutApplication(caseId, userId, message)
      .catch(error => console.error('Error notifying case poster:', error));
    
    // Create a conversation between the lawyer and case poster
    try {
      await startConversation({
        senderId: userId,
        receiverId: caseDoc.user,
        message: `I've applied to your case "${caseDoc.title}". ${message || 'I look forward to discussing this with you.'}`,
        caseId: caseDoc._id
      });
    } catch (convError) {
      console.error('Error creating conversation:', convError);
      // Don't fail the request if conversation creation fails
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Application submitted successfully' 
    });
    
  } catch (error) {
    console.error('Error applying for case:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to submit application' 
    });
  }
};

// Update application status (for case owner)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { caseId, applicationId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;
    
    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Find the case
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Check if the current user is the case owner
    if (caseDoc.user.toString() !== userId.toString()) {
      return res.status(403).json({ 
        error: 'Not authorized to update this application' 
      });
    }
    
    // Find the application
    const application = caseDoc.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Update status
    const previousStatus = application.status;
    application.status = status;
    
    // If accepting an application, reject all others
    if (status === 'accepted') {
      caseDoc.applications.forEach(app => {
        if (app._id.toString() !== applicationId && app.status === 'pending') {
          app.status = 'rejected';
        }
      });
      
      // Update case status to in progress
      caseDoc.status = 'In Progress';
    }
    
    await caseDoc.save();
    
    // Notify the lawyer about the status update (async)
    if (status !== previousStatus) {
      notifyLawyerAboutApplicationStatus(caseId, application.user, status)
        .catch(error => console.error('Error notifying lawyer:', error));
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Application ${status} successfully` 
    });
    
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update application status' 
    });
  }
};

// Get applicants for a case (case owner only)
export const getCaseApplicants = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user._id;
    
    const caseDoc = await Case.findOne({
      _id: caseId,
      user: userId // Only the case owner can view applicants
    })
    .populate({
      path: 'applications.user',
      select: 'name username profilePicture email bio experience specialization rating'
    })
    .select('applications title status');

    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found or access denied' });
    }

    // Transform the data to include application details with user info
    const applicants = caseDoc.applications.map(app => ({
      _id: app._id,
      message: app.message,
      status: app.status,
      appliedAt: app.createdAt,
      user: app.user,
      caseTitle: caseDoc.title,
      caseStatus: caseDoc.status
    }));

    res.status(200).json(applicants);
  } catch (error) {
    console.error('Error fetching case applicants:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch case applicants' 
    });
  }
};

// Create a new case
export const createCase = async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    console.log('Authenticated user:', req.user);
    
    const { 
      title, 
      description, 
      caseType, 
      expertise, 
      location, 
      budget,
      compensation, // For backward compatibility
      urgency,
      deadline, 
      isRemote,
      tags = []
    } = req.body;
    
    console.log('Parsed fields:', {
      title: !!title,
      description: !!description,
      caseType: !!caseType,
      expertise: !!expertise,
      location: !!location,
      hasBudget: !!budget,
      hasCompensation: !!compensation,
      urgency: !!urgency,
      deadline: !!deadline,
      isRemote: isRemote
    });

    // Basic validation
    if (!title || !description || !caseType || !expertise || !location) {
      const error = {
        error: "Missing required fields",
        missingFields: []
      };
      if (!title) error.missingFields.push('title');
      if (!description) error.missingFields.push('description');
      if (!caseType) error.missingFields.push('caseType');
      if (!expertise) error.missingFields.push('expertise');
      if (!location) error.missingFields.push('location');
      
      console.error('Validation failed:', error);
      return res.status(400).json(error);
    }

    // Check for either budget or compensation
    if (!budget && !compensation) {
      const error = "Budget or compensation information is required";
      console.error('Validation failed:', error);
      return res.status(400).json({ error });
    }

    // Validate expertise is an array
    const expertiseArray = Array.isArray(expertise) ? expertise : [expertise];
    if (expertiseArray.length === 0) {
      const error = "At least one expertise area is required";
      console.error('Validation failed:', error);
      return res.status(400).json({ error });
    }

    // Handle both budget and compensation fields
    const budgetData = budget || compensation;
    console.log('Budget data:', budgetData);
    
    // Parse amount, handling both string and number inputs
    const amount = parseFloat(budgetData.amount || budgetData.value || '0');
    if (isNaN(amount)) {
      const error = "Invalid budget amount";
      console.error('Validation failed:', error, { amount: budgetData.amount, value: budgetData.value });
      return res.status(400).json({ error });
    }
    
    const caseData = {
      title: title.trim(),
      description: description.trim(),
      caseType: caseType.trim(),
      expertise: expertiseArray.map(e => e.trim()),
      location: location.trim(),
      budget: {
        amount,
        currency: String(budgetData.currency || compensation?.currency || 'INR').toUpperCase(),
        type: String(budgetData.type || compensation?.type || 'Fixed')
      },
      urgency: String(urgency || 'Medium'),
      isRemote: Boolean(isRemote),
      user: req.user._id,
      tags: Array.isArray(tags) ? tags.map(t => String(t).trim()) : [String(tags)].filter(Boolean).map(t => t.trim())
    };
    
    console.log('Processed case data:', JSON.stringify(caseData, null, 2));

    // Add deadline if provided
    if (deadline) {
      caseData.deadline = new Date(deadline);
    }

    // Create the case
    const newCase = await Case.create(caseData);
    
    // Populate user data for response
    await newCase.populate('user', 'name username profilePicture');
    
    // Notify all verified lawyers about the new case (async, don't await)
    notifyLawyersAboutNewCase(newCase._id, req.user._id)
      .catch(error => console.error('Error notifying lawyers:', error));
    
    res.status(201).json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Failed to create case. Please check your input and try again.';
    res.status(500).json({ error: errorMessage });
  }
};

// Get cases posted by the current user
export const getMyCases = async (req, res) => {
  try {
    const myCases = await Case.find({ user: req.user._id })
    .populate('user', 'name username profilePicture')
    .populate('likes', 'name username profilePicture')
    .populate('applications.user', 'name username profilePicture')
    .sort({ createdAt: -1 });
    res.status(200).json({ cases: myCases });
  } catch (error) {
    console.error('Error fetching my cases:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get cases the current user has applied to
// Like or unlike a case
export const likeCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user._id;
    
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Check if user already liked the case
    const likeIndex = caseDoc.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );
    
    let liked = false;
    
    if (likeIndex === -1) {
      // Like the case
      caseDoc.likes.push(userId);
      liked = true;
      
      // Create notification if not the case owner
      if (caseDoc.user.toString() !== userId.toString()) {
        const notification = new Notification({
          recipient: caseDoc.user,
          type: 'like',
          relatedUser: userId,
          relatedCase: caseId,
          message: `${req.user.name} liked your case: ${caseDoc.title}`
        });
        await notification.save();
      }
    } else {
      // Unlike the case
      caseDoc.likes.splice(likeIndex, 1);
      liked = false;
    }
    
    await caseDoc.save();
    
    // Populate likes for the response
    await caseDoc.populate({
      path: 'likes',
      select: 'name username profilePicture'
    });
    
    res.status(200).json({
      success: true,
      liked,
      likeCount: caseDoc.likes.length,
      case: caseDoc
    });
    
  } catch (error) {
    console.error('Error in likeCase controller:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update like status',
      details: error.message 
    });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const cases = await Case.find({ "applications.user": req.user._id })
      .populate("applications.user", "name username profilePicture")
      .populate("user", "name username profilePicture")
      .sort({ createdAt: -1 });
      
    // Return only the applications relevant to the user
    const applications = [];
    cases.forEach((caseDoc) => {
      caseDoc.applications.forEach((app) => {
        if (app.user._id.toString() === req.user._id.toString()) {
          applications.push({
            _id: app._id,
            case: {
              _id: caseDoc._id,
              title: caseDoc.title,
              description: caseDoc.description,
              expertise: caseDoc.expertise,
              location: caseDoc.location,
              budget: caseDoc.budget,
              compensation: caseDoc.compensation,
              isRemote: caseDoc.isRemote,
              user: caseDoc.user,
              createdAt: caseDoc.createdAt,
              deadline: caseDoc.deadline,
              caseType: caseDoc.caseType,
              status: caseDoc.status
            },
            message: app.message,
            status: app.status,
            appliedAt: app.createdAt
          });
        }
      });
    });
    
    res.status(200).json({ applications });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    res.status(500).json({ error: error.message });
  }
};