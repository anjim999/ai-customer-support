import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { Document } from '../models/index.js';

class RAGService {
    constructor() {
        this.CHUNK_SIZE = 500; // characters per chunk
        this.CHUNK_OVERLAP = 100; // overlap between chunks
    }

    // Extract text from PDF
    async extractFromPDF(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } catch (error) {
            console.error('PDF extraction error:', error);
            throw new Error('Failed to extract text from PDF');
        }
    }

    // Extract text from DOCX
    async extractFromDOCX(filePath) {
        try {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } catch (error) {
            console.error('DOCX extraction error:', error);
            throw new Error('Failed to extract text from DOCX');
        }
    }

    // Extract text from TXT
    async extractFromTXT(filePath) {
        try {
            const text = await fs.readFile(filePath, 'utf-8');
            return text;
        } catch (error) {
            console.error('TXT extraction error:', error);
            throw new Error('Failed to read text file');
        }
    }

    // Extract text based on file type
    async extractText(filePath, mimeType) {
        switch (mimeType) {
            case 'application/pdf':
                return await this.extractFromPDF(filePath);
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return await this.extractFromDOCX(filePath);
            case 'text/plain':
                return await this.extractFromTXT(filePath);
            default:
                throw new Error(`Unsupported file type: ${mimeType}`);
        }
    }

    // Split text into chunks with overlap
    chunkText(text) {
        const chunks = [];
        const sentences = text.replace(/\n+/g, ' ').split(/[.!?]+/);

        let currentChunk = '';
        let chunkIndex = 0;

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            if (currentChunk.length + trimmedSentence.length > this.CHUNK_SIZE) {
                if (currentChunk) {
                    chunks.push({
                        content: currentChunk.trim(),
                        chunkIndex: chunkIndex++
                    });
                }

                // Start new chunk with overlap from previous
                const words = currentChunk.split(' ');
                const overlapWords = words.slice(-Math.ceil(this.CHUNK_OVERLAP / 5));
                currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence + '. ';
            } else {
                currentChunk += trimmedSentence + '. ';
            }
        }

        // Add remaining text
        if (currentChunk.trim()) {
            chunks.push({
                content: currentChunk.trim(),
                chunkIndex: chunkIndex
            });
        }

        return chunks;
    }

    // Process and store document
    async processDocument(documentId) {
        try {
            const document = await Document.findById(documentId);
            if (!document) {
                throw new Error('Document not found');
            }

            document.status = 'processing';
            await document.save();

            // Extract text
            const rawText = await this.extractText(document.filePath, document.mimeType);

            // Chunk text
            const chunks = this.chunkText(rawText);

            // Update document
            document.rawContent = rawText;
            document.chunks = chunks;
            document.wordCount = rawText.split(/\s+/).length;
            document.status = 'ready';
            document.processingError = null;
            await document.save();

            return document;
        } catch (error) {
            console.error('Document processing error:', error);

            // Update document with error
            await Document.findByIdAndUpdate(documentId, {
                status: 'error',
                processingError: error.message
            });

            throw error;
        }
    }

    // Simple keyword-based search (no external embeddings needed)
    async findRelevantChunks(query, limit = 3) {
        try {
            // Get all active documents with chunks
            const documents = await Document.find({
                status: 'ready',
                isActive: true
            }).select('title chunks');

            if (documents.length === 0) {
                return [];
            }

            // Extract keywords from query
            const queryWords = query.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 2);

            // Score each chunk based on keyword matches
            const scoredChunks = [];

            for (const doc of documents) {
                for (const chunk of doc.chunks) {
                    const chunkLower = chunk.content.toLowerCase();
                    let score = 0;

                    for (const word of queryWords) {
                        // Count occurrences
                        const regex = new RegExp(word, 'gi');
                        const matches = chunkLower.match(regex);
                        if (matches) {
                            score += matches.length;
                        }
                    }

                    if (score > 0) {
                        scoredChunks.push({
                            documentId: doc._id,
                            documentTitle: doc.title,
                            content: chunk.content,
                            chunkIndex: chunk.chunkIndex,
                            score
                        });
                    }
                }
            }

            // Sort by score and return top results
            return scoredChunks
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        } catch (error) {
            console.error('Find relevant chunks error:', error);
            return [];
        }
    }
}

export default new RAGService();
