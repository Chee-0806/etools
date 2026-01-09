use crate::models::{ScreenInfo, ViewConfig, CalculatedWindowLayout};

/// Calculate window size and position based on screen info and view config
pub fn calculate_window_layout(
    screen_info: &ScreenInfo,
    config: &ViewConfig,
    current_size: Option<(u32, u32)>,
) -> Result<CalculatedWindowLayout, String> {
    println!("[window_calculator] ===== 计算窗口布局 =====");
    println!("  - 视图ID: {}", config.view_id);
    println!("  - 屏幕尺寸: {}x{}", screen_info.screen_width, screen_info.screen_height);
    println!("  - 可用尺寸: {}x{}", screen_info.available_width, screen_info.available_height);

    // 1. Calculate from percentages
    let mut width = (screen_info.available_width as f64 * config.width_percent) as u32;
    let mut height = (screen_info.available_height as f64 * config.height_percent) as u32;

    println!("  - 初始计算（百分比）: {}x{} ({}%, {}%)", width, height, config.width_percent * 100.0, config.height_percent * 100.0);

    // 2. Apply min/max constraints (FR-002, FR-003)
    println!("  - 宽度限制: {}-{}", config.min_width, config.max_width);
    println!("  - 高度限制: {}-{}", config.min_height, config.max_height);

    width = width.clamp(config.min_width, config.max_width);
    height = height.clamp(config.min_height, config.max_height);

    println!("  - 应用限制后: {}x{}", width, height);

    // 3. Apply 20px margins (FR-004)
    let margin_x: u32 = 20;
    let margin_y: u32 = 20;
    let max_width = screen_info.available_width.saturating_sub(2 * margin_x);
    let max_height = screen_info.available_height.saturating_sub(2 * margin_y);

    println!("  - 边距后最大尺寸: {}x{}", max_width, max_height);

    width = width.min(max_width);
    height = height.min(max_height);

    println!("  - 应用边距后: {}x{}", width, height);

    // 4. Calculate position
    let x = ((screen_info.screen_width - width) / 2) as i32;

    let y = if config.vertical_offset == 0.0 {
        // Centered (FR-007)
        println!("  - 垂直位置: 居中");
        ((screen_info.screen_height - height) / 2) as i32
    } else {
        // Upper portion for search (FR-006)
        println!("  - 垂直位置: 偏移 {}%", config.vertical_offset * 100.0);
        let offset_y = (screen_info.screen_height as f64 * config.vertical_offset) as i32;
        offset_y - (height as i32 / 2)
    };

    println!("  - 最终位置: ({}, {})", x, y);

    // 5. Create layout
    let current_width = current_size.map(|(w, _)| w);
    let layout = CalculatedWindowLayout::new(width, height, x, y, current_width);

    // 6. Validate
    layout.validate(screen_info)?;

    println!("[window_calculator] 布局计算完成:");
    println!("  - 最终尺寸: {}x{}", layout.width, layout.height);
    println!("  - 最终位置: ({}, {})", layout.x, layout.y);
    println!("  - 需要动画: {}", layout.animation_required);

    Ok(layout)
}
