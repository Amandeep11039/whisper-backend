import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';
import { AppError } from '../services/auth.service.js';

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { displayName } = req.body;

  try {
    const updatedUser = await userService.updateDisplayName(userId, displayName);
    res.json(updatedUser);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

export const getPartner = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  try {
    const partner = await userService.getPartner(userId);
    res.json(partner);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

export const updatePartnerNickname = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { nickname } = req.body;

  try {
    const result = await userService.updatePartnerNickname(userId, nickname);
    res.json(result);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});
