/**
 * Base Repository Class
 * Provides common CRUD operations for all repositories
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, populate = '') {
    return this.model.findById(id).populate(populate);
  }

  async findOne(filter, populate = '') {
    return this.model.findOne(filter).populate(populate);
  }

  async find(filter = {}, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      sort = { createdAt: -1 }, 
      populate = '',
      select = ''
    } = options;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate(populate)
        .select(select)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      this.model.countDocuments(filter)
    ]);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async create(data) {
    const doc = new this.model(data);
    return doc.save();
  }

  async createMany(dataArray) {
    return this.model.insertMany(dataArray);
  }

  async updateById(id, data) {
    return this.model.findByIdAndUpdate(
      id, 
      { $set: data }, 
      { new: true, runValidators: true }
    );
  }

  async updateOne(filter, data) {
    return this.model.findOneAndUpdate(
      filter, 
      { $set: data }, 
      { new: true, runValidators: true }
    );
  }

  async updateMany(filter, data) {
    return this.model.updateMany(filter, { $set: data });
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  async deleteOne(filter) {
    return this.model.findOneAndDelete(filter);
  }

  async deleteMany(filter) {
    return this.model.deleteMany(filter);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async exists(filter) {
    const doc = await this.model.findOne(filter).select('_id');
    return !!doc;
  }

  async aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }
}

export default BaseRepository;
