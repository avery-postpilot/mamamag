import express from 'express';
import Reservation from '../models/Reservation';
import Campaign from '../models/Campaign';

const router = express.Router();

// Get all reservations for a campaign
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const reservations = await Reservation.find({ campaignId: req.params.campaignId });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reservations', error });
  }
});

// Create a new reservation
router.post('/', async (req, res) => {
  try {
    const { campaignId, placements } = req.body;
    
    // Check if all pages are available
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check page availability
    for (const placement of placements) {
      const page = campaign.pages.find(p => p.id === placement.pageId);
      if (!page || !page.available) {
        return res.status(400).json({ 
          message: `Page ${placement.pageId} is not available` 
        });
      }
    }

    // Create reservation
    const reservation = new Reservation(req.body);
    const savedReservation = await reservation.save();

    // Update page availability
    for (const placement of placements) {
      await Campaign.updateOne(
        { campaignId, 'pages.id': placement.pageId },
        { $set: { 'pages.$.available': false, 'pages.$.reservedBy': savedReservation._id } }
      );
    }

    res.status(201).json(savedReservation);
  } catch (error) {
    res.status(400).json({ message: 'Error creating reservation', error });
  }
});

// Update a reservation
router.put('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    res.status(400).json({ message: 'Error updating reservation', error });
  }
});

// Cancel a reservation
router.delete('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Update page availability
    for (const placement of reservation.placements) {
      await Campaign.updateOne(
        { campaignId: reservation.campaignId, 'pages.id': placement.pageId },
        { $set: { 'pages.$.available': true, 'pages.$.reservedBy': null } }
      );
    }

    await reservation.remove();
    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling reservation', error });
  }
});

export default router; 