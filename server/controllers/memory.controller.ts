import { prisma } from '../config/db';
import { Request, Response } from 'express';

export const createMemory = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { type, album, location, date, files } = req.body;

        if (!album || !files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ success: false, message: 'Album and files are required' });
        }

        const memory = await prisma.memory.create({
            data: {
                userId,
                type: type || 'image',
                album,
                location,
                date
            }
        });

        // Insert files sequentially to prevent "Server has closed the connection" packet size errors
        const createdFiles = [];
        for (const fileData of files) {
            const file = await prisma.memoryFile.create({
                data: {
                    memoryId: memory.id,
                    data: fileData
                }
            });
            createdFiles.push(file);
        }

        const finalMemory = { ...memory, files: createdFiles };

        res.status(201).json({ success: true, memory: finalMemory });
    } catch (error) {
        console.error('Error creating memory:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMemories = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const memories = await prisma.memory.findMany({
            where: { userId, isDeleted: false },
            include: { files: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, memories });
    } catch (error) {
        console.error('Error fetching memories:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getTrash = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const memories = await prisma.memory.findMany({
            where: { userId, isDeleted: true },
            include: { files: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, memories });
    } catch (error) {
        console.error('Error fetching trash:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const softDeleteMemory = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        const memoryId = parseInt(req.params.id);
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const memory = await prisma.memory.findFirst({ where: { id: memoryId, userId } });
        if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });

        await prisma.memory.update({
            where: { id: memoryId },
            data: { isDeleted: true }
        });

        res.json({ success: true, message: 'Memory moved to trash' });
    } catch (error) {
        console.error('Error deleting memory:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const restoreMemory = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        const memoryId = parseInt(req.params.id);
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const memory = await prisma.memory.findFirst({ where: { id: memoryId, userId } });
        if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });

        await prisma.memory.update({
            where: { id: memoryId },
            data: { isDeleted: false }
        });

        res.json({ success: true, message: 'Memory restored' });
    } catch (error) {
        console.error('Error restoring memory:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const hardDeleteMemory = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        const memoryId = parseInt(req.params.id);
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const memory = await prisma.memory.findFirst({ where: { id: memoryId, userId } });
        if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });

        await prisma.memory.delete({
            where: { id: memoryId }
        });

        res.json({ success: true, message: 'Memory permanently deleted' });
    } catch (error) {
        console.error('Error permanently deleting memory:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteMemoryFile = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        const fileId = parseInt(req.params.fileId);
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const file = await prisma.memoryFile.findFirst({
            where: { id: fileId },
            include: { memory: true }
        });

        if (!file || file.memory.userId !== userId) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const filesCount = await prisma.memoryFile.count({
            where: { memoryId: file.memoryId }
        });

        if (filesCount <= 1) {
            // Last file of this memory: soft delete the entire memory (move to Trash)
            await prisma.memory.update({
                where: { id: file.memoryId },
                data: { isDeleted: true }
            });
            return res.json({ success: true, action: 'soft_delete_memory', memoryId: file.memoryId, message: 'Memory moved to trash' });
        } else {
            // Split this specific file into a new soft-deleted Memory so it appears in Trash!
            const newDeletedMemory = await prisma.memory.create({
                data: {
                    userId,
                    type: file.memory.type,
                    album: file.memory.album,
                    location: file.memory.location,
                    date: file.memory.date,
                    isDeleted: true
                }
            });

            await prisma.memoryFile.update({
                where: { id: fileId },
                data: { memoryId: newDeletedMemory.id }
            });

            return res.json({ success: true, action: 'delete_file', fileId, memoryId: file.memoryId, message: 'Photo moved to trash successfully' });
        }
    } catch (error) {
        console.error('Error deleting memory file:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};