import { toPaginatedResult, toSkipTake } from 'src/shared/helpers/pagination.helper.js';

describe('pagination.helper', () => {
  describe('toSkipTake', () => {
    it('returns skip 0 for the first page', () => {
      expect(toSkipTake({ page: 1, limit: 10 })).toEqual({ skip: 0, take: 10 });
    });

    it('computes skip for later pages', () => {
      expect(toSkipTake({ page: 3, limit: 20 })).toEqual({ skip: 40, take: 20 });
    });
  });

  describe('toPaginatedResult', () => {
    it('builds the response and rounds totalPages up', () => {
      expect(toPaginatedResult({ data: ['a'], totalItems: 21, page: 1, limit: 10 })).toEqual({
        data: ['a'],
        totalItems: 21,
        page: 1,
        limit: 10,
        totalPages: 3
      });
    });

    it('returns 0 totalPages when empty', () => {
      expect(toPaginatedResult({ data: [], totalItems: 0, page: 1, limit: 10 }).totalPages).toBe(0);
    });
  });
});
