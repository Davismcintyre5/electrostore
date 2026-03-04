class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // Filter results
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(field => delete queryObj[field]);

    // Advanced filtering (gt, gte, lt, lte)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  // Sort results
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  // Limit fields
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  // Search text
  search() {
    if (this.queryString.search) {
      this.query = this.query.find({
        $text: { $search: this.queryString.search }
      });
    }

    return this;
  }

  // Paginate results
  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  // Count total documents
  async countTotal() {
    const countQuery = this.query.model.find(this.query._conditions);
    const total = await countQuery.countDocuments();
    return total;
  }

  // Get pagination info
  async getPaginationInfo() {
    const total = await this.countTotal();
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 10;
    const pages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    };
  }

  // Execute query with pagination
  async paginateExecute() {
    const pagination = await this.getPaginationInfo();
    const data = await this.query;

    return {
      success: true,
      count: data.length,
      pagination,
      data
    };
  }

  // Aggregate with pagination
  static async aggregatePaginate(model, pipeline, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    // Count total
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await model.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Get data
    const dataPipeline = [
      ...pipeline,
      { $skip: skip },
      { $limit: limit }
    ];
    const data = await model.aggregate(dataPipeline);

    const pages = Math.ceil(total / limit);

    return {
      success: true,
      count: data.length,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      },
      data
    };
  }

  // Build filter object from query string
  static buildFilter(queryString, allowedFields = []) {
    const filter = {};

    Object.keys(queryString).forEach(key => {
      if (allowedFields.length === 0 || allowedFields.includes(key)) {
        const value = queryString[key];

        // Handle operators
        if (typeof value === 'object' && value !== null) {
          filter[key] = {};
          Object.keys(value).forEach(op => {
            if (['gt', 'gte', 'lt', 'lte', 'in', 'nin'].includes(op)) {
              filter[key][`$${op}`] = value[op];
            }
          });
        } else {
          filter[key] = value;
        }
      }
    });

    return filter;
  }

  // Build sort object
  static buildSort(sortString) {
    if (!sortString) return { createdAt: -1 };

    const sort = {};
    sortString.split(',').forEach(field => {
      if (field.startsWith('-')) {
        sort[field.slice(1)] = -1;
      } else {
        sort[field] = 1;
      }
    });

    return sort;
  }

  // Build projection
  static buildProjection(fieldsString) {
    if (!fieldsString) return { __v: 0 };

    const projection = {};
    fieldsString.split(',').forEach(field => {
      projection[field] = 1;
    });

    return projection;
  }

  // Parse range for charts
  static parseDateRange(startDate, endDate, groupBy = 'day') {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    if (!startDate) {
      start.setDate(start.getDate() - 30); // Default to last 30 days
    }

    const range = [];
    const current = new Date(start);

    while (current <= end) {
      let key;
      switch (groupBy) {
        case 'hour':
          key = current.toISOString().slice(0, 13);
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          key = current.toISOString().slice(0, 10);
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          key = `${current.getFullYear()}-W${Math.ceil(current.getDate() / 7)}`;
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          key = current.toISOString().slice(0, 7);
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          key = current.toISOString().slice(0, 10);
          current.setDate(current.getDate() + 1);
      }
      range.push(key);
    }

    return range;
  }
}

module.exports = APIFeatures;