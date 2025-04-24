import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mamamag',
    allowed_formats: ['jpg', 'jpeg', 'png', 'svg'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const upload = multer({ storage: storage });

// Upload brand logo
router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: req.file.path });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading logo', error });
  }
});

// Upload product images
router.post('/product-images', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    const urls = (req.files as Express.Multer.File[]).map(file => file.path);
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading images', error });
  }
});

// Delete an asset
router.delete('/:public_id', async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.public_id);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting asset', error });
  }
});

export default router; 