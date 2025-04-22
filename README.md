# MamaMag Reservation System

A real-time page reservation system for MamaMag, a direct mail marketing catalog by PostPilot.

## Features

- Real-time page availability updates
- Visual magazine layout
- Campaign management
- Brand information tracking
- Asset management with Cloudinary
- Google Sheets integration for data export

## Tech Stack

- Frontend: React with TypeScript, Chakra UI
- Backend: Node.js/Express with TypeScript
- Database: MongoDB
- Real-time: Socket.io
- Asset Management: Cloudinary
- Data Export: Google Sheets API

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Cloudinary account
- Google Sheets API credentials (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mamamag.git
cd mamamag
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env` in the server directory
- Update the values with your configuration

4. Start the development servers:
```bash
# Start the backend server
cd server
npm run dev

# Start the frontend development server
cd client
npm run dev
```

## Usage

### Campaign Management

1. Create a new campaign
2. Configure pages and pricing
3. Generate a unique form URL
4. Share the URL with brands

### Brand Reservation

1. Access the form URL
2. Fill in brand information
3. Select and reserve pages
4. Upload assets
5. Submit the reservation

### Asset Management

- Brand logos and product images are stored in Cloudinary
- Assets are organized by campaign and page
- Automatic image optimization and resizing

## Deployment

The application can be deployed to any cloud platform that supports Node.js and MongoDB. Recommended platforms:

- Frontend: Vercel, Netlify
- Backend: Heroku, DigitalOcean
- Database: MongoDB Atlas
- Asset Storage: Cloudinary

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential. All rights reserved. 