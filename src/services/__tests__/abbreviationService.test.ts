import { describe, it, expect, beforeEach, vi } from 'vitest';
import { abbreviationService, type Abbreviation, type AbbreviationConfig } from '@/services/abbreviationService';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

describe('AbbreviationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('expandAbbreviation', () => {
    it('should return null when global is disabled', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [
          { id: '1', abbr: 'gh', expansion: 'https://github.com', enabled: true, category: 'dev', createdAt: '', updatedAt: '' }
        ],
        categories: [],
        globalEnabled: false,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config);

      await abbreviationService.loadConfig();
      const result = abbreviationService.expandAbbreviation('gh');
      expect(result).toBeNull();
    });

    it('should return expansion for valid abbreviation', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [
          { id: '1', abbr: 'gh', expansion: 'https://github.com', enabled: true, category: 'dev', createdAt: '', updatedAt: '' }
        ],
        categories: [],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config);

      await abbreviationService.loadConfig();
      const result = abbreviationService.expandAbbreviation('gh');
      expect(result).toBe('https://github.com');
    });

    it('should return null for disabled abbreviation', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [
          { id: '1', abbr: 'gh', expansion: 'https://github.com', enabled: false, category: 'dev', createdAt: '', updatedAt: '' }
        ],
        categories: [],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config);

      await abbreviationService.loadConfig();
      const result = abbreviationService.expandAbbreviation('gh');
      expect(result).toBeNull();
    });

    it('should handle case insensitive matching', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [
          { id: '1', abbr: 'GH', expansion: 'https://github.com', enabled: true, category: 'dev', createdAt: '', updatedAt: '' }
        ],
        categories: [],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config);

      await abbreviationService.loadConfig();
      const result = abbreviationService.expandAbbreviation('gh');
      expect(result).toBe('https://github.com');
    });
  });

  describe('searchAbbreviations', () => {
    it('should return empty array when global is disabled', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [
          { id: '1', abbr: 'gh', expansion: 'https://github.com', enabled: true, category: 'dev', createdAt: '', updatedAt: '' }
        ],
        categories: [],
        globalEnabled: false,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config);

      await abbreviationService.loadConfig();
      const results = abbreviationService.searchAbbreviations('gh');
      expect(results).toEqual([]);
    });

    it('should return matching abbreviations', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [
          { id: '1', abbr: 'gh', expansion: 'https://github.com', enabled: true, category: 'dev', createdAt: '', updatedAt: '' },
          { id: '2', abbr: 'ggl', expansion: 'https://google.com', enabled: true, category: 'search', createdAt: '', updatedAt: '' }
        ],
        categories: [],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config);

      await abbreviationService.loadConfig();
      const results = abbreviationService.searchAbbreviations('gh');
      expect(results).toHaveLength(1);
      expect(results[0].abbr).toBe('gh');
    });

    it('should search in both abbreviation and expansion', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [
          { id: '1', abbr: 'gh', expansion: 'https://github.com', enabled: true, category: 'dev', createdAt: '', updatedAt: '' }
        ],
        categories: [],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config);

      await abbreviationService.loadConfig();
      const results = abbreviationService.searchAbbreviations('github');
      expect(results).toHaveLength(1);
      expect(results[0].abbr).toBe('gh');
    });
  });

  describe('addAbbreviation', () => {
    it('should add new abbreviation', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [],
        categories: [],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config)
        .mockResolvedValueOnce(undefined); // save_config returns void

      await abbreviationService.loadConfig();
      
      const newAbbr = await abbreviationService.addAbbreviation({
        abbr: 'test',
        expansion: 'https://example.com',
        description: 'Test Site',
        category: 'test',
        enabled: true
      });

      expect(newAbbr.abbr).toBe('test');
      expect(newAbbr.expansion).toBe('https://example.com');
      expect(newAbbr.id).toBeDefined();
      expect(newAbbr.createdAt).toBeDefined();
      expect(newAbbr.updatedAt).toBeDefined();
    });
  });

  describe('deleteAbbreviation', () => {
    it('should delete abbreviation by id', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [
          { id: '1', abbr: 'gh', expansion: 'https://github.com', enabled: true, category: 'dev', createdAt: '', updatedAt: '' }
        ],
        categories: [],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config)
        .mockResolvedValueOnce(undefined); // save_config returns void

      await abbreviationService.loadConfig();
      await abbreviationService.deleteAbbreviation('1');

      expect(vi.mocked(require('@tauri-apps/api/core').invoke)).toHaveBeenCalledWith('save_abbreviation_config', expect.any(Object));
    });

    it('should throw error for non-existent id', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [],
        categories: [],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config);

      await abbreviationService.loadConfig();
      
      await expect(abbreviationService.deleteAbbreviation('non-existent'))
        .rejects.toThrow('Abbreviation not found');
    });
  });

  describe('importConfig', () => {
    it('should import valid config', async () => {
      const validConfig = {
        abbreviations: [
          { id: '1', abbr: 'imported', expansion: 'https://imported.com', enabled: true, category: 'test', createdAt: '', updatedAt: '' }
        ],
        categories: [],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(undefined); // save_config returns void

      await abbreviationService.importConfig(JSON.stringify(validConfig));

      expect(vi.mocked(require('@tauri-apps/api/core').invoke)).toHaveBeenCalledWith('save_abbreviation_config', expect.any(Object));
    });

    it('should throw error for invalid JSON', async () => {
      await expect(abbreviationService.importConfig('invalid json'))
        .rejects.toThrow('Invalid configuration format');
    });

    it('should throw error for missing abbreviations', async () => {
      const invalidConfig = {
        categories: [],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      await expect(abbreviationService.importConfig(JSON.stringify(invalidConfig)))
        .rejects.toThrow('Invalid configuration format');
    });
  });

  describe('exportConfig', () => {
    it('should export config as JSON string', async () => {
      const config: AbbreviationConfig = {
        abbreviations: [
          { id: '1', abbr: 'gh', expansion: 'https://github.com', enabled: true, category: 'dev', createdAt: '', updatedAt: '' }
        ],
        categories: [
          { id: 'dev', name: 'Development', icon: '💻', color: '#007acc' }
        ],
        globalEnabled: true,
        autoOpenSingle: false,
        showInSearch: true,
        caseSensitive: false
      };

      vi.mocked(require('@tauri-apps/api/core').invoke)
        .mockResolvedValueOnce(config);

      await abbreviationService.loadConfig();
      const exported = abbreviationService.exportConfig();
      
      const parsed = JSON.parse(exported);
      expect(parsed).toEqual(config);
    });

    it('should throw error when config not loaded', () => {
      expect(() => abbreviationService.exportConfig())
        .toThrow('Config not loaded');
    });
  });
});