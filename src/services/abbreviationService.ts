

import { invoke } from '@tauri-apps/api/core';

export interface Abbreviation {
  id: string;
  abbr: string;
  expansion: string;
  description?: string;
  category?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AbbreviationCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface AbbreviationConfig {
  abbreviations: Abbreviation[];
  categories: AbbreviationCategory[];
  globalEnabled: boolean;
  autoOpenSingle: boolean;
  showInSearch: boolean;
  caseSensitive: boolean;
}

class AbbreviationService {
  private config: AbbreviationConfig | null = null;
  private listeners: Set<(config: AbbreviationConfig) => void> = new Set();

  private readonly DEFAULT_CONFIG: AbbreviationConfig = {
    abbreviations: [
      { id: '1', abbr: 'gh', expansion: 'https://github.com', description: 'GitHub', category: 'dev', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', abbr: 'gl', expansion: 'https://gitlab.com', description: 'GitLab', category: 'dev', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '3', abbr: 'ggl', expansion: 'https://google.com', description: 'Google', category: 'search', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '4', abbr: 'so', expansion: 'https://stackoverflow.com', description: 'Stack Overflow', category: 'dev', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '5', abbr: 'yt', expansion: 'https://youtube.com', description: 'YouTube', category: 'social', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '6', abbr: 'tw', expansion: 'https://twitter.com', description: 'Twitter', category: 'social', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '7', abbr: 'li', expansion: 'https://linkedin.com', description: 'LinkedIn', category: 'social', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '8', abbr: 'mdn', expansion: 'https://developer.mozilla.org', description: 'MDN Web Docs', category: 'dev', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '9', abbr: 'npm', expansion: 'https://npmjs.com', description: 'NPM', category: 'dev', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '10', abbr: 'mail', expansion: 'https://mail.google.com', description: 'Gmail', category: 'productivity', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '11', abbr: 'cal', expansion: 'https://calendar.google.com', description: 'Google Calendar', category: 'productivity', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '12', abbr: 'drive', expansion: 'https://drive.google.com', description: 'Google Drive', category: 'productivity', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    categories: [
      { id: 'dev', name: '开发工具', description: '编程和开发相关', icon: '💻', color: '#007acc' },
      { id: 'search', name: '搜索引擎', description: '搜索和查询', icon: '🔍', color: '#4285f4' },
      { id: 'social', name: '社交网络', description: '社交媒体平台', icon: '👥', color: '#1da1f2' },
      { id: 'productivity', name: '生产力', description: '办公和效率工具', icon: '⚡', color: '#34a853' },
      { id: 'entertainment', name: '娱乐', description: '视频、音乐和游戏', icon: '🎮', color: '#ff6b6b' },
      { id: 'shopping', name: '购物', description: '电商平台', icon: '🛒', color: '#ff9800' },
      { id: 'education', name: '教育', description: '学习和教育', icon: '📚', color: '#9c27b0' },
      { id: 'news', name: '新闻', description: '新闻资讯', icon: '📰', color: '#795548' },
    ],
    globalEnabled: true,
    autoOpenSingle: false,
    showInSearch: true,
    caseSensitive: false,
  };

  async loadConfig(): Promise<AbbreviationConfig> {
    try {
      const config = await invoke<AbbreviationConfig>('get_abbreviation_config');
      this.config = config;
      return config;
    } catch (error) {
      console.warn('[AbbreviationService] Failed to load config, using defaults:', error);
      this.config = { ...this.DEFAULT_CONFIG };
      return this.config;
    }
  }

  async saveConfig(config: AbbreviationConfig): Promise<void> {
    try {
      await invoke('save_abbreviation_config', { config });
      this.config = config;
      this.notifyListeners(config);
    } catch (error) {
      console.error('[AbbreviationService] Failed to save config:', error);
      throw error;
    }
  }

  getConfig(): AbbreviationConfig | null {
    return this.config;
  }

  subscribe(listener: (config: AbbreviationConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(config: AbbreviationConfig): void {
    this.listeners.forEach(listener => listener(config));
  }

  expandAbbreviation(abbr: string): string | null {
    if (!this.config?.globalEnabled) return null;

    const searchAbbr = this.config.caseSensitive ? abbr : abbr.toLowerCase();
    
    const abbreviation = this.config.abbreviations.find(
      item => item.enabled && (
        this.config!.caseSensitive 
          ? item.abbr === searchAbbr
          : item.abbr.toLowerCase() === searchAbbr
      )
    );

    return abbreviation?.expansion || null;
  }

  searchAbbreviations(query: string): Abbreviation[] {
    if (!this.config?.globalEnabled || !this.config.showInSearch) return [];

    const searchQuery = this.config.caseSensitive ? query : query.toLowerCase();
    
    return this.config.abbreviations.filter(item => {
      if (!item.enabled) return false;
      
      const abbrMatch = this.config!.caseSensitive 
        ? item.abbr.includes(searchQuery)
        : item.abbr.toLowerCase().includes(searchQuery);
      
      const expansionMatch = this.config!.caseSensitive
        ? item.expansion.toLowerCase().includes(searchQuery)
        : item.expansion.toLowerCase().includes(searchQuery);
      
      const descMatch = item.description && (
        this.config!.caseSensitive
          ? item.description.toLowerCase().includes(searchQuery)
          : item.description.toLowerCase().includes(searchQuery)
      );

      return abbrMatch || expansionMatch || descMatch;
    });
  }

  async addAbbreviation(abbreviation: Omit<Abbreviation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Abbreviation> {
    if (!this.config) throw new Error('Config not loaded');

    const newAbbr: Abbreviation = {
      ...abbreviation,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.config.abbreviations.push(newAbbr);
    await this.saveConfig(this.config);
    
    return newAbbr;
  }

  async updateAbbreviation(id: string, updates: Partial<Abbreviation>): Promise<Abbreviation> {
    if (!this.config) throw new Error('Config not loaded');

    const index = this.config.abbreviations.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Abbreviation not found');

    this.config.abbreviations[index] = {
      ...this.config.abbreviations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveConfig(this.config);
    return this.config.abbreviations[index];
  }

  async deleteAbbreviation(id: string): Promise<void> {
    if (!this.config) throw new Error('Config not loaded');

    const index = this.config.abbreviations.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Abbreviation not found');

    this.config.abbreviations.splice(index, 1);
    await this.saveConfig(this.config);
  }

  exportConfig(): string {
    if (!this.config) throw new Error('Config not loaded');
    return JSON.stringify(this.config, null, 2);
  }

  async importConfig(configJson: string): Promise<void> {
    try {
      const imported = JSON.parse(configJson) as AbbreviationConfig;
      
      if (!imported.abbreviations || !Array.isArray(imported.abbreviations)) {
        throw new Error('Invalid abbreviations format');
      }

      if (!imported.categories || !Array.isArray(imported.categories)) {
        throw new Error('Invalid categories format');
      }

      const mergedConfig: AbbreviationConfig = {
        ...this.DEFAULT_CONFIG,
        ...imported,
        abbreviations: imported.abbreviations,
        categories: [...this.DEFAULT_CONFIG.categories, ...(imported.categories || [])],
      };

      await this.saveConfig(mergedConfig);
    } catch (error) {
      console.error('[AbbreviationService] Failed to import config:', error);
      throw new Error('Invalid configuration format');
    }
  }

  getCategoryById(id: string): AbbreviationCategory | undefined {
    return this.config?.categories.find(cat => cat.id === id);
  }

  getAbbreviationsByCategory(categoryId: string): Abbreviation[] {
    if (!this.config) return [];
    return this.config.abbreviations.filter(item => item.category === categoryId);
  }
}

export const abbreviationService = new AbbreviationService();