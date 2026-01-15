/**
 * PluginUIView - 插件 UI 视图
 * 用于渲染带有 UI 组件的插件界面
 */

import { useState, useEffect } from 'react';
import { BackButton } from '../BackButton';
import { pluginLoader } from '@/services/pluginLoader';

interface PluginUIViewProps {
  pluginId?: string;
  toolId?: string;
  query?: string;
}

export function PluginUIView({ pluginId, toolId, query }: PluginUIViewProps) {
  const [PluginUI, setPluginUI] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPluginUI = async () => {
      if (!pluginId) {
        setError('未指定插件 ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`[PluginUIView] Loading UI for plugin: ${pluginId}`);

        // 获取插件 manifest
        const manifest = pluginLoader.getManifest(pluginId);
        if (!manifest) {
          setError(`插件 ${pluginId} 未找到`);
          setLoading(false);
          return;
        }

        // 获取插件模块
        const plugin = pluginLoader.getPlugin(pluginId);
        if (!plugin) {
          setError(`插件 ${pluginId} 未加载`);
          setLoading(false);
          return;
        }

        // 检查是否有 getUIComponent 方法
        const pluginModule = plugin as any;
        if (typeof pluginModule.getUIComponent === 'function') {
          const UIComponent = await pluginModule.getUIComponent();
          if (UIComponent) {
            setPluginUI(() => UIComponent);
            console.log(`[PluginUIView] Plugin UI loaded for: ${pluginId}`);
          } else {
            setError(`插件 ${pluginId} 没有 UI 组件`);
          }
        } else if (pluginModule.ui?.component) {
          // 如果插件直接导出了 ui.component
          setPluginUI(() => pluginModule.ui.component);
          console.log(`[PluginUIView] Plugin UI loaded from export: ${pluginId}`);
        } else {
          setError(`插件 ${pluginId} 不支持 UI`);
        }
      } catch (err) {
        console.error(`[PluginUIView] Failed to load plugin UI:`, err);
        setError(err instanceof Error ? err.message : '加载插件 UI 失败');
      } finally {
        setLoading(false);
      }
    };

    loadPluginUI();
  }, [pluginId]);

  if (loading) {
    return (
      <div className="plugin-ui-view plugin-ui-view--loading">
        <div className="plugin-ui-view__back">
          <BackButton />
        </div>
        <div className="plugin-ui-view__loading">
          <div className="plugin-ui-view__spinner" />
          <p>加载插件界面...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plugin-ui-view plugin-ui-view--error">
        <div className="plugin-ui-view__back">
          <BackButton />
        </div>
        <div className="plugin-ui-view__error">
          <span className="plugin-ui-view__error-icon">⚠️</span>
          <h2>加载失败</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="plugin-ui-view">
      <div className="plugin-ui-view__back">
        <BackButton />
      </div>
      <div className="plugin-ui-view__content">
        {PluginUI && <PluginUI toolId={toolId} query={query as any} />}
      </div>
    </div>
  );
}
