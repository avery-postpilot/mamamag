import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  campaignId: string;
  description: string;
  status: 'draft' | 'active' | 'completed';
  volume: number;
  inHomeDate: Date;
  pages: IPage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPage {
  id: string;
  pageNumber: string;
  name: string;
  type: 'Premium' | 'Standard';
  basePrice: number;
  additionalPremium: number;
  available: boolean;
  facingPage?: string;
  reservedBy?: string;
}

const PageSchema = new Schema({
  id: { type: String, required: true },
  pageNumber: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Premium', 'Standard'], required: true },
  basePrice: { type: Number, required: true },
  additionalPremium: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
  facingPage: { type: String },
  reservedBy: { type: String }
});

const CampaignSchema = new Schema({
  name: { type: String, required: true },
  campaignId: { type: String, required: true, unique: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'completed'],
    default: 'draft'
  },
  volume: { type: Number, required: true },
  inHomeDate: { type: Date, required: true },
  pages: [PageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CampaignSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<ICampaign>('Campaign', CampaignSchema); 