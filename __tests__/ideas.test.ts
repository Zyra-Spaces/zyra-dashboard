/**
 * Unit tests for idea creation and retrieval
 * Run with: npm test -- ideas.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveIdea, getUserIdeas, updateIdea, deleteIdea, getIdeaCount } from '../lib/supabase/ideas';
import { createClient } from '../lib/supabase/client';

// Mock Supabase client
vi.mock('../lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
}));

describe('Idea Functions', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockIdea = {
    prompt: 'Test prompt',
    idea: 'Test idea content',
    formatted_idea: {
      title: 'Test Idea',
      description: 'A test idea',
    },
    context: 'Test context',
    color: 'yellow',
    cover_image_url: null,
    cover_image_type: 'system' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveIdea', () => {
    it('should save an idea successfully', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockInsert = {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'idea-id',
              user_id: mockUser.id,
              ...mockIdea,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue(mockInsert),
      });

      const result = await saveIdea(mockIdea);

      expect(result).toBeDefined();
      expect(result.user_id).toBe(mockUser.id);
      expect(result.prompt).toBe(mockIdea.prompt);
    });

    it('should throw error if user is not authenticated', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(saveIdea(mockIdea)).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockError = {
        code: '42501',
        message: 'permission denied for table users',
        details: null,
        hint: null,
      };

      const mockInsert = {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        })),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue(mockInsert),
      });

      await expect(saveIdea(mockIdea)).rejects.toThrow();
    });
  });

  describe('getUserIdeas', () => {
    it('should retrieve user ideas successfully', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockIdeas = [
        {
          id: 'idea-1',
          user_id: mockUser.id,
          ...mockIdea,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockSelect = {
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: mockIdeas,
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelect),
      });

      const result = await getUserIdeas();

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe(mockUser.id);
    });

    it('should throw error if user is not authenticated', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getUserIdeas()).rejects.toThrow('User not authenticated');
    });
  });

  describe('updateIdea', () => {
    it('should update an idea successfully', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpdate = {
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'idea-id',
                user_id: mockUser.id,
                ...mockIdea,
                prompt: 'Updated prompt',
              },
              error: null,
            }),
          })),
        })),
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue(mockUpdate),
      });

      const result = await updateIdea('idea-id', { prompt: 'Updated prompt' });

      expect(result.prompt).toBe('Updated prompt');
    });
  });

  describe('deleteIdea', () => {
    it('should delete an idea successfully', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockDelete = {
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue(mockDelete),
      });

      await expect(deleteIdea('idea-id')).resolves.not.toThrow();
    });
  });

  describe('getIdeaCount', () => {
    it('should return idea count successfully', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      });

      const count = await getIdeaCount();

      expect(count).toBe(5);
    });

    it('should return 0 if user is not authenticated', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const count = await getIdeaCount();

      expect(count).toBe(0);
    });
  });
});
















