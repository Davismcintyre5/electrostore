const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const logger = require('../config/logger');

class FileUploadService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../public/uploads');
    this.maxSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
    };

    this.ensureUploadDirectories();
  }

  // Ensure upload directories exist
  ensureUploadDirectories() {
    const dirs = [
      this.uploadDir,
      path.join(this.uploadDir, 'images'),
      path.join(this.uploadDir, 'documents'),
      path.join(this.uploadDir, 'temp'),
      path.join(this.uploadDir, 'products'),
      path.join(this.uploadDir, 'receipts'),
      path.join(this.uploadDir, 'avatars')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Configure multer storage
  getStorage(folder = '') {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = folder 
          ? path.join(this.uploadDir, folder)
          : path.join(this.uploadDir, this.getFileTypeFolder(file.mimetype));
        
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const ext = this.allowedTypes[file.mimetype] || path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
      }
    });
  }

  // Get folder based on file type
  getFileTypeFolder(mimetype) {
    if (mimetype.startsWith('image/')) {
      return 'images';
    }
    return 'documents';
  }

  // File filter
  fileFilter = (req, file, cb) => {
    if (this.allowedTypes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }
  };

  // Create multer upload instance
  createUploader(folder = '', maxCount = 1) {
    const storage = this.getStorage(folder);
    
    const upload = multer({
      storage: storage,
      limits: { fileSize: this.maxSize },
      fileFilter: this.fileFilter
    });

    return {
      single: (fieldName) => upload.single(fieldName),
      array: (fieldName, maxCount) => upload.array(fieldName, maxCount),
      fields: (fields) => upload.fields(fields)
    };
  }

  // Process image (resize, optimize)
  async processImage(filePath, options = {}) {
    try {
      const { width = 800, height = 800, quality = 80 } = options;
      
      const image = sharp(filePath);
      const metadata = await image.metadata();

      // Resize if larger than specified dimensions
      if (metadata.width > width || metadata.height > height) {
        await image
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality })
          .toFile(filePath.replace(/\.[^/.]+$/, '_optimized.jpg'));
        
        // Replace original with optimized
        fs.unlinkSync(filePath);
        fs.renameSync(filePath.replace(/\.[^/.]+$/, '_optimized.jpg'), filePath);
      }

      return {
        success: true,
        dimensions: { width: metadata.width, height: metadata.height }
      };
    } catch (error) {
      logger.error('Image processing error:', error);
      throw error;
    }
  }

  // Upload single file
  async uploadSingle(file, folder = '', options = {}) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      const fileInfo = {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/${folder || this.getFileTypeFolder(file.mimetype)}/${file.filename}`
      };

      // Process if it's an image
      if (file.mimetype.startsWith('image/')) {
        await this.processImage(file.path, options);
      }

      return fileInfo;
    } catch (error) {
      logger.error('File upload error:', error);
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultiple(files, folder = '', options = {}) {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      const uploadedFiles = [];
      
      for (const file of files) {
        const fileInfo = await this.uploadSingle(file, folder, options);
        uploadedFiles.push(fileInfo);
      }

      return uploadedFiles;
    } catch (error) {
      logger.error('Multiple files upload error:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('File deletion error:', error);
      throw error;
    }
  }

  // Get file info
  getFileInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      logger.error('Get file info error:', error);
      return null;
    }
  }

  // Clean up old temp files
  async cleanupTempFiles(hours = 24) {
    try {
      const tempDir = path.join(this.uploadDir, 'temp');
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      const maxAge = hours * 60 * 60 * 1000;

      let deletedCount = 0;
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });

      return { deletedCount };
    } catch (error) {
      logger.error('Cleanup temp files error:', error);
      throw error;
    }
  }

  // Validate file
  validateFile(file, options = {}) {
    const { maxSize = this.maxSize, allowedTypes = Object.keys(this.allowedTypes) } = options;

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` };
    }

    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'File type not allowed' };
    }

    return { valid: true };
  }
}

module.exports = new FileUploadService();