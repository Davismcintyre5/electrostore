const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/low-stock', productController.getLowStockProducts);
router.get('/search', productController.searchProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProduct);

// Protected routes (admin only)
router.use(protect, authorize('admin', 'manager'));

router.post('/',
  upload.array('images', 5),
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('stock').isNumeric().withMessage('Stock must be a number')
  ],
  productController.createProduct
);

router.put('/:id',
  upload.array('images', 5),
  productController.updateProduct
);

router.delete('/:id', productController.deleteProduct);
router.post('/:id/restock', productController.restockProduct);
router.post('/:id/reviews', protect, productController.addReview);
router.put('/:id/featured', productController.toggleFeatured);
router.put('/:id/discount', productController.updateDiscount);

module.exports = router;