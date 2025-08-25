import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, requireRole, generateToken, hashPassword, comparePassword, type AuthenticatedRequest } from "./middleware/auth";
import { 
  insertUserSchema, insertStoreSchema, insertRatingSchema, 
  loginSchema, signupSchema, passwordSchema, updatePasswordSchema 
} from "@shared/schema";
import { Request, Response } from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      console.log('Signup request body:', req.body);
      // Validate the entire signup request
      const validatedData = signupSchema.parse(req.body);
      console.log('Validated data:', validatedData);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Hash password
      const passwordHash = await hashPassword(validatedData.password);

      // Create user (exclude password and storeName from validatedData)
      const { password: _, storeName, ...userData } = validatedData;
      const user = await storage.createUser({
        ...userData,
        passwordHash,
      });

      // Create store for store owners
      if (user.role === 'store_owner') {
        const storeData = {
          name: req.body.storeName || `${user.name}'s Store`,
          address: user.address,
          ownerId: user.id,
        };
        await storage.createStore(storeData);
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/auth/update-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      const success = await storage.updateUserPassword(user.id, newPasswordHash);
      if (!success) {
        return res.status(500).json({ message: 'Failed to update password' });
      }

      res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User profile routes
  app.get('/api/user/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/user/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updates = {
        name: req.body.name,
        address: req.body.address,
      };

      const user = await storage.updateUser(req.user!.id, updates);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/users', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const search = req.query.search as string;
      const role = req.query.role as string;
      const users = await storage.getUsersWithFilters(search, role);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/users', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const userData = {
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        role: req.body.role || 'user'
      };
      const validatedData = insertUserSchema.omit({ passwordHash: true }).parse(userData);
      const password = req.body.password;
      passwordSchema.parse(password);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await storage.createUser({
        ...validatedData,
        passwordHash,
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/admin/users/:id', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/stores', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/stores', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const storeData = insertStoreSchema.parse(req.body);
      
      // Verify owner exists and is a store owner
      const owner = await storage.getUser(storeData.ownerId);
      if (!owner) {
        return res.status(400).json({ message: 'Store owner not found' });
      }
      if (owner.role !== 'store_owner') {
        return res.status(400).json({ message: 'User must be a store owner' });
      }

      // Check if owner already has a store
      const existingStore = await storage.getStoreByOwnerId(storeData.ownerId);
      if (existingStore) {
        return res.status(400).json({ message: 'Store owner already has a store' });
      }

      const store = await storage.createStore(storeData);
      res.status(201).json(store);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/admin/stores/:id', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.deleteStore(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Store not found' });
      }
      res.json({ message: 'Store deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Store routes
  app.get('/api/stores', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const search = req.query.search as string;
      const address = req.query.address as string;
      const stores = await storage.searchStores(search, address);

      // Get user's ratings for these stores
      const userRatings = await storage.getUserRatings(req.user!.id);
      const userRatingMap = new Map(userRatings.map(rating => [rating.storeId, rating]));

      const storesWithUserRatings = stores.map(store => ({
        ...store,
        userRating: userRatingMap.get(store.id) || null,
      }));

      res.json(storesWithUserRatings);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/stores/my-store', authenticateToken, requireRole(['store_owner']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const store = await storage.getStoreByOwnerId(req.user!.id);
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }

      const storeWithRatings = await storage.getStoreWithRatings(store.id);
      res.json(storeWithRatings);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Rating routes
  app.post('/api/ratings', authenticateToken, requireRole(['user']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Check if rating already exists
      const existingRating = await storage.getRating(ratingData.userId, ratingData.storeId);
      if (existingRating) {
        return res.status(400).json({ message: 'You have already rated this store. Use PUT to update your rating.' });
      }

      // Verify store exists
      const store = await storage.getStore(ratingData.storeId);
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }

      const rating = await storage.createRating(ratingData);
      res.status(201).json(rating);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/ratings/:storeId', authenticateToken, requireRole(['user']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ratingValue = insertRatingSchema.shape.ratingValue.parse(req.body.ratingValue);
      
      const rating = await storage.updateRating(req.user!.id, req.params.storeId, ratingValue);
      if (!rating) {
        return res.status(404).json({ message: 'Rating not found' });
      }

      res.json(rating);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/ratings/:storeId', authenticateToken, requireRole(['user']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.deleteRating(req.user!.id, req.params.storeId);
      if (!success) {
        return res.status(404).json({ message: 'Rating not found' });
      }
      res.json({ message: 'Rating deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
