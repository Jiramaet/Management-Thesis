import mongoose, { Schema, model, Document } from 'mongoose';

interface IStatistic extends Document {
  report_id?: number;
  download_count: number;
  view_count: string;
  thesis_id?: number;
}

const StatisticSchema = new Schema<IStatistic>({
  report_id: { type: Number, required: true, unique: true },
  download_count: { type: Number, required: true },
  view_count: { type: String, required: true },
  thesis_id: { type: Number, required: true },
});

export const statistic = mongoose.models.statistic || mongoose.model('statistic', StatisticSchema)
    