import mongoose, { Schema, Document } from 'mongoose';

export interface IReservation extends Document {
  campaignId: string;
  brandName: string;
  contactName: string;
  contactEmail: string;
  mailingAddress: string;
  brandUrl: string;
  brandLogo: string;
  placements: IPlacement[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlacement {
  pageId: string;
  pageName: string;
  pageNumber: string;
  productName: string;
  productPrice: string;
  productCopy: string;
  productUrl: string;
  discountCode?: string;
  utmParams?: string;
  articleCopy?: string;
  pageTitle?: string;
  copyWriting: boolean;
  images: string[];
}

const PlacementSchema = new Schema({
  pageId: { type: String, required: true },
  pageName: { type: String, required: true },
  pageNumber: { type: String, required: true },
  productName: { type: String, required: true },
  productPrice: { type: String, required: true },
  productCopy: { type: String, required: true },
  productUrl: { type: String, required: true },
  discountCode: { type: String },
  utmParams: { type: String },
  articleCopy: { type: String },
  pageTitle: { type: String },
  copyWriting: { type: Boolean, default: false },
  images: [{ type: String }]
});

const ReservationSchema = new Schema({
  campaignId: { type: String, required: true },
  brandName: { type: String, required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  mailingAddress: { type: String, required: true },
  brandUrl: { type: String, required: true },
  brandLogo: { type: String, required: true },
  placements: [PlacementSchema],
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ReservationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IReservation>('Reservation', ReservationSchema); 