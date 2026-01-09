/**
 * PluginsView - 插件管理视图
 * 单窗口架构下的插件管理界面
 */

import { BackButton } from '../BackButton';
import PluginManager from '../PluginManager/PluginManager';

export function PluginsView() {
  return (
    <div className="settings-window">
      <div className="settings-header">
        <BackButton />
        <h2>插件管理</h2>
      </div>

      <div className="settings-content">
        <div className="settings-section settings-section--full">
          <PluginManager
            showMarketplace={true}
            initialView="installed"
          />
        </div>
      </div>
    </div>
  );
}
