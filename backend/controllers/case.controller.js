import Case from "../models/Case.js";
import User from "../models/user.model.js";

// Get all cases (public)
export const getAllCases = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { expertise: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    const cases = await Case.find(query)
      .populate('user', 'name username profilePicture')
      .sort({ createdAt: -1 });
      
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get case by ID
export const getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseDoc = await Case.findById(caseId)
      .populate('user', 'name username profilePicture')
      .populate('applications.user', 'name username profilePicture');
      
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    res.status(200).json(caseDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCaseApplicants = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.caseId)
      .populate({
        path: 'applications.user',
        select: 'name username profilePicture email bio'
      })
      .select('applications');

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check if the current user is the owner of the case
    if (caseItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view applicants for this case' });
    }

    // Transform the data to include application details with user info
    const applicants = caseItem.applications.map(app => ({
      _id: app._id,
      message: app.message,
      status: app.status,
      appliedAt: app.appliedAt,
      user: app.user
    }));

    res.json(applicants);
  } catch (error) {
    console.error('Error fetching case applicants:', error);
    res.status(500).json({ error: 'Failed to fetch case applicants' });
  }
};

// Create a new case
export const createCase = async (req, res) => {
  try {
    const { title, description, expertise, location, deadline, compensation, isRemote } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }
    
    const newCase = await Case.create({
      title,
      description,
      expertise,
      location,
      deadline: deadline || undefined,
      compensation,
      isRemote: Boolean(isRemote),
      user: req.user._id,
    });
    
    await newCase.populate('user', 'name username profilePicture');
    
    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get cases posted by the current user
export const getMyCases = async (req, res) => {
  try {
    const cases = await Case.find({ user: req.user._id })
      .populate('applications.user', 'name username profilePicture')
      .sort({ createdAt: -1 });
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get cases the current user has applied to
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
            ...caseDoc.toObject(),
            application: app
          });
        }
      });
    });
    
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};