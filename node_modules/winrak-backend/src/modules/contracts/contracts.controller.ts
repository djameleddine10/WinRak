import { Request, Response, NextFunction } from 'express';
import { contractsService } from './contracts.service';

export const getMyContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contract = await contractsService.getMyContract(req.user!.driverId!);
    res.json({ success: true, contract });
  } catch (err) { next(err); }
};

export const getTerms = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await contractsService.getContractTerms();
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

export const signContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId, signature } = req.body;
    if (!contractId || !signature) {
      return res.status(400).json({ success: false, message: 'معرف العقد والتوقيع مطلوبان.' });
    }
    const contract = await contractsService.signContract(req.user!.driverId!, contractId, signature);
    res.json({ success: true, contract, message: 'تم توقيع العقد بنجاح! مرحباً بك في عائلة WinRak.' });
  } catch (err) { next(err); }
};

export const createOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { driverId, contractType } = req.body;
    const contract = await contractsService.createContractOffer(driverId, contractType);
    res.status(201).json({ success: true, contract });
  } catch (err) { next(err); }
};

export const calculateLoss = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { incidentId, totalLossAmount, driverId } = req.body;
    const result = await contractsService.calculateLossSharing(incidentId, totalLossAmount, driverId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};
