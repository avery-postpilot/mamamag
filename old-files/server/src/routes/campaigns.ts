import express from 'express';
import Campaign, { ICampaign } from '../models/Campaign';

const router = express.Router();

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaigns', error });
  }
});

// Get a single campaign
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ campaignId: req.params.id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaign', error });
  }
});

// Create a new campaign
router.post('/', async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    const savedCampaign = await campaign.save();
    res.status(201).json(savedCampaign);
  } catch (error) {
    res.status(400).json({ message: 'Error creating campaign', error });
  }
});

// Update a campaign
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { campaignId: req.params.id },
      req.body,
      { new: true }
    );
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ message: 'Error updating campaign', error });
  }
});

// Delete a campaign
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ campaignId: req.params.id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting campaign', error });
  }
});

export default router; 