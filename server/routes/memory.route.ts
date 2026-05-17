import express from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { createMemory, getMemories, getTrash, softDeleteMemory, restoreMemory, hardDeleteMemory, deleteMemoryFile } from '../controllers/memory.controller';

const router = express.Router();

router.use(verifyToken);

router.post('/', createMemory);
router.get('/', getMemories);
router.get('/trash', getTrash);
router.delete('/file/:fileId', deleteMemoryFile);
router.delete('/:id', softDeleteMemory);
router.put('/:id/restore', restoreMemory);
router.delete('/:id/hard', hardDeleteMemory);

export default router;