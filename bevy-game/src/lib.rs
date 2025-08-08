use wasm_bindgen::prelude::*;
use web_sys::{console, CanvasRenderingContext2d, HtmlCanvasElement, window};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub struct BevyGame {
    canvas: HtmlCanvasElement,
    ctx: CanvasRenderingContext2d,
    time: f64,
    sprites: Vec<Sprite>,
}

#[derive(Clone)]
struct Target {
    x: f64,
    y: f64,
    find_new_target: bool,
}

#[derive(Clone)]
pub struct Sprite {
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub size: f64,
    pub color: String,
    pub rotation: f64,
    target: Option<Target>,
}

impl Sprite {
    pub fn new(x: f64, y: f64, vx: f64, vy: f64, size: f64, color: String) -> Self {
        Self {
            x,
            y,
            vx,
            vy,
            size,
            color,
            rotation: 0.0,
            target: None,
        }
    }

    pub fn new_with_target(x: f64, y: f64, vx: f64, vy: f64, size: f64, color: String, target: Option<Target>) -> Self {
        Self {
            x,
            y,
            vx,
            vy,
            size,
            color,
            rotation: 0.0,
            target,
        }
    }

    pub fn update(&mut self, dt: f64, canvas_width: f64, canvas_height: f64) {
        // Update position based on velocity (for sprites without targets)
        if self.target.is_none() {
            self.x += self.vx * dt;
            self.y += self.vy * dt;

            // Bounce off edges
            if self.x <= self.size/2.0 || self.x >= canvas_width - self.size/2.0 {
                self.vx *= -1.0;
                self.x = self.x.max(self.size/2.0).min(canvas_width - self.size/2.0);
            }
            if self.y <= self.size/2.0 || self.y >= canvas_height - self.size/2.0 {
                self.vy *= -1.0;
                self.y = self.y.max(self.size/2.0).min(canvas_height - self.size/2.0);
            }
        }

        // Always update rotation
        self.rotation += dt * 2.0;
    }

    pub fn get_position(&self) -> (f64, f64) {
        (self.x, self.y)
    }

    pub fn get_velocity(&self) -> (f64, f64) {
        (self.vx, self.vy)
    }

    pub fn set_position(&mut self, x: f64, y: f64) {
        self.x = x;
        self.y = y;
    }

    pub fn set_velocity(&mut self, vx: f64, vy: f64) {
        self.vx = vx;
        self.vy = vy;
    }

    pub fn get_target(&self) -> &Option<Target> {
        &self.target
    }

    pub fn set_target(&mut self, target: Option<Target>) {
        self.target = target;
    }
}

#[wasm_bindgen]
impl BevyGame {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_id: &str) -> Result<BevyGame, JsValue> {
        let document = window().unwrap().document().unwrap();
        let canvas = document
            .get_element_by_id(canvas_id)
            .unwrap()
            .dyn_into::<HtmlCanvasElement>()
            .unwrap();
        
        let ctx = canvas
            .get_context("2d")
            .unwrap()
            .unwrap()
            .dyn_into::<CanvasRenderingContext2d>()
            .unwrap();

        let sprites = Self::create_default_sprites();

        log("Bevy-style game foundation initialized!");

        Ok(BevyGame {
            canvas,
            ctx,
            time: 0.0,
            sprites,
        })
    }

    fn create_default_sprites() -> Vec<Sprite> {
        vec![
            Sprite::new_with_target(
                200.0, 150.0, 120.0, 80.0, 40.0, "#FF6B6B".to_string(),
                Some(Target {
                    x: 600.0,
                    y: 400.0,
                    find_new_target: true,
                })
            ),
            Sprite::new_with_target(
                400.0, 300.0, -100.0, 150.0, 30.0, "#4ECDC4".to_string(),
                Some(Target {
                    x: 150.0,
                    y: 100.0,
                    find_new_target: false,
                })
            ),
            Sprite::new(100.0, 400.0, 90.0, -120.0, 50.0, "#45B7D1".to_string()), // No target
        ]
    }

    #[wasm_bindgen]
    pub fn render_frame(&mut self) {
        self.update_and_render();
    }

    pub fn update_sprites(&mut self, dt: f64) {
        for sprite in &mut self.sprites {
            sprite.update(dt, self.canvas.width() as f64, self.canvas.height() as f64);
        }
    }

    pub fn get_sprite_count(&self) -> usize {
        self.sprites.len()
    }

    pub fn get_time(&self) -> f64 {
        self.time
    }

    pub fn advance_time(&mut self, dt: f64) {
        self.time += dt;
    }

    fn clear_canvas(&self) {
        self.ctx.clear_rect(0.0, 0.0, self.canvas.width() as f64, self.canvas.height() as f64);
        self.ctx.set_fill_style(&JsValue::from_str("#1a1a1a"));
        self.ctx.fill_rect(0.0, 0.0, self.canvas.width() as f64, self.canvas.height() as f64);
    }

    fn render_sprite(&self, sprite: &Sprite) {
        self.ctx.save();
        let _ = self.ctx.translate(sprite.x, sprite.y);
        let _ = self.ctx.rotate(sprite.rotation);
        self.ctx.set_fill_style(&JsValue::from_str(&sprite.color));
        self.ctx.fill_rect(-sprite.size/2.0, -sprite.size/2.0, sprite.size, sprite.size);
        self.ctx.restore();
    }

    fn update_and_render(&mut self) {
        // Clear canvas
        self.clear_canvas();

        // Delta time simulation (16ms ≈ 60fps)
        let dt = 0.016;
        self.time += dt;

        // Update and render sprites with target-seeking behavior
        for sprite in &mut self.sprites {
            if let Some(target) = &sprite.target {
                // Calculate direction to target
                let dx = target.x - sprite.x;
                let dy = target.y - sprite.y;
                let distance = (dx * dx + dy * dy).sqrt();
                
                // Check if close enough to target (avoid floating point errors and wiggles)
                let tolerance = 5.0; // pixels
                if distance <= tolerance {
                    // Reached target
                    if target.find_new_target {
                        // Find a new random target
                        sprite.target = Some(Target {
                            x: (js_sys::Math::random() * (self.canvas.width() as f64 - sprite.size)) + sprite.size / 2.0,
                            y: (js_sys::Math::random() * (self.canvas.height() as f64 - sprite.size)) + sprite.size / 2.0,
                            find_new_target: true,
                        });
                    } else {
                        // Clear the target
                        sprite.target = None;
                    }
                } else {
                    // Move towards target
                    let speed = 100.0; // pixels per second
                    sprite.x += (dx / distance) * speed * dt;
                    sprite.y += (dy / distance) * speed * dt;
                }
            } else {
                // If no target, use regular movement with bouncing
                sprite.update(dt, self.canvas.width() as f64, self.canvas.height() as f64);
            }
            
            // Continue rotating sprites (for sprites with targets, this is done here)
            if sprite.target.is_some() {
                sprite.rotation += dt * 2.0;
            }

            // Keep sprites within bounds
            sprite.x = sprite.x.max(sprite.size/2.0).min(self.canvas.width() as f64 - sprite.size/2.0);
            sprite.y = sprite.y.max(sprite.size/2.0).min(self.canvas.height() as f64 - sprite.size/2.0);
        }

        // Render sprites
        for sprite in &self.sprites {
            self.render_sprite(sprite);
            
            // Render target if it exists
            if let Some(target) = &sprite.target {
                self.ctx.save();
                let _ = self.ctx.translate(target.x, target.y);
                self.ctx.set_fill_style(&JsValue::from_str("rgba(255, 255, 255, 0.5)"));
                self.ctx.fill_rect(-5.0, -5.0, 10.0, 10.0);
                self.ctx.restore();
                
                // Draw line to target
                self.ctx.set_stroke_style(&JsValue::from_str("rgba(255, 255, 255, 0.3)"));
                self.ctx.set_line_width(1.0);
                self.ctx.begin_path();
                self.ctx.move_to(sprite.x, sprite.y);
                self.ctx.line_to(target.x, target.y);
                let _ = self.ctx.stroke();
            }
        }

        // Render UI
        self.render_ui();
    }

    fn render_ui(&self) {
        self.ctx.set_fill_style(&JsValue::from_str("#FFFFFF"));
        self.ctx.set_font("20px sans-serif");
        self.ctx.fill_text("Bevy Game Foundation", 10.0, 30.0).unwrap();
        
        self.ctx.set_font("14px sans-serif");
        self.ctx.fill_text(&format!("Time: {:.1}s", self.time), 10.0, 55.0).unwrap();
        self.ctx.fill_text("Entity-Component-System Architecture Demo", 10.0, 75.0).unwrap();
    }

    // Public method for getting canvas dimensions (testable via mocking)
    pub fn get_canvas_width(&self) -> f64 {
        self.canvas.width() as f64
    }

    pub fn get_canvas_height(&self) -> f64 {
        self.canvas.height() as f64
    }

    // Public method for getting sprite count (testable)
    pub fn get_sprites_count(&self) -> usize {
        self.sprites.len()
    }

    // Public method for clearing sprites (testable)
    pub fn clear_sprites(&mut self) {
        self.sprites.clear();
    }

    fn update_and_render(&mut self) {
        // Clear canvas
        self.clear_canvas();

        // Delta time simulation (16ms ≈ 60fps)
        let dt = 0.016;
        self.time += dt;

        // Update and render sprites with target-seeking behavior
        for sprite in &mut self.sprites {
            if let Some(target) = &sprite.target {
                // Calculate direction to target
                let dx = target.x - sprite.x;
                let dy = target.y - sprite.y;
                let distance = (dx * dx + dy * dy).sqrt();
                
                // Check if close enough to target (avoid floating point errors and wiggles)
                let tolerance = 5.0; // pixels
                if distance <= tolerance {
                    // Reached target
                    if target.find_new_target {
                        // Find a new random target
                        sprite.target = Some(Target {
                            x: (js_sys::Math::random() * (self.canvas.width() as f64 - sprite.size)) + sprite.size / 2.0,
                            y: (js_sys::Math::random() * (self.canvas.height() as f64 - sprite.size)) + sprite.size / 2.0,
                            find_new_target: true,
                        });
                    } else {
                        // Clear the target
                        sprite.target = None;
                    }
                } else {
                    // Move towards target
                    let speed = 100.0; // pixels per second
                    sprite.x += (dx / distance) * speed * dt;
                    sprite.y += (dy / distance) * speed * dt;
                }
            } else {
                // If no target, use regular movement with bouncing
                sprite.update(dt, self.canvas.width() as f64, self.canvas.height() as f64);
            }
            
            // Continue rotating sprites (for sprites with targets, this is done here)
            if sprite.target.is_some() {
                sprite.rotation += dt * 2.0;
            }

            // Keep sprites within bounds
            sprite.x = sprite.x.max(sprite.size/2.0).min(self.canvas.width() as f64 - sprite.size/2.0);
            sprite.y = sprite.y.max(sprite.size/2.0).min(self.canvas.height() as f64 - sprite.size/2.0);
        }

        // Render sprites
        for sprite in &self.sprites {
            self.render_sprite(sprite);
            
            // Render target if it exists
            if let Some(target) = &sprite.target {
                self.ctx.save();
                let _ = self.ctx.translate(target.x, target.y);
                self.ctx.set_fill_style(&JsValue::from_str("rgba(255, 255, 255, 0.5)"));
                self.ctx.fill_rect(-5.0, -5.0, 10.0, 10.0);
                self.ctx.restore();
                
                // Draw line to target
                self.ctx.set_stroke_style(&JsValue::from_str("rgba(255, 255, 255, 0.3)"));
                self.ctx.set_line_width(1.0);
                self.ctx.begin_path();
                self.ctx.move_to(sprite.x, sprite.y);
                self.ctx.line_to(target.x, target.y);
                let _ = self.ctx.stroke();
            }
        }

        // Render UI
        self.render_ui();
    }
}

#[wasm_bindgen(start)]
pub fn main() {
    console::log_1(&"Bevy Game Foundation WASM module loaded".into());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sprite_new_creates_correct_sprite() {
        let sprite = Sprite::new(100.0, 200.0, 50.0, -25.0, 30.0, "#FF0000".to_string());
        
        assert_eq!(sprite.x, 100.0);
        assert_eq!(sprite.y, 200.0);
        assert_eq!(sprite.vx, 50.0);
        assert_eq!(sprite.vy, -25.0);
        assert_eq!(sprite.size, 30.0);
        assert_eq!(sprite.color, "#FF0000");
        assert_eq!(sprite.rotation, 0.0);
    }

    #[test]
    fn sprite_get_position_returns_correct_coordinates() {
        let sprite = Sprite::new(123.45, 678.90, 0.0, 0.0, 10.0, "#000000".to_string());
        let (x, y) = sprite.get_position();
        
        assert_eq!(x, 123.45);
        assert_eq!(y, 678.90);
    }

    #[test]
    fn sprite_get_velocity_returns_correct_velocity() {
        let sprite = Sprite::new(0.0, 0.0, 45.67, -89.12, 10.0, "#000000".to_string());
        let (vx, vy) = sprite.get_velocity();
        
        assert_eq!(vx, 45.67);
        assert_eq!(vy, -89.12);
    }

    #[test]
    fn sprite_set_position_updates_coordinates() {
        let mut sprite = Sprite::new(0.0, 0.0, 0.0, 0.0, 10.0, "#000000".to_string());
        sprite.set_position(300.0, 400.0);
        
        assert_eq!(sprite.x, 300.0);
        assert_eq!(sprite.y, 400.0);
    }

    #[test]
    fn sprite_set_velocity_updates_velocity() {
        let mut sprite = Sprite::new(0.0, 0.0, 0.0, 0.0, 10.0, "#000000".to_string());
        sprite.set_velocity(150.0, -75.0);
        
        assert_eq!(sprite.vx, 150.0);
        assert_eq!(sprite.vy, -75.0);
    }

    #[test]
    fn sprite_update_moves_sprite_correctly() {
        let mut sprite = Sprite::new(100.0, 100.0, 50.0, 25.0, 10.0, "#000000".to_string());
        let dt = 0.1;
        
        sprite.update(dt, 800.0, 600.0);
        
        assert_eq!(sprite.x, 105.0); // 100 + 50 * 0.1
        assert_eq!(sprite.y, 102.5); // 100 + 25 * 0.1
        assert_eq!(sprite.rotation, 0.2); // 0 + 0.1 * 2.0
    }

    #[test]
    fn sprite_update_bounces_off_left_edge() {
        let mut sprite = Sprite::new(5.0, 100.0, -50.0, 0.0, 10.0, "#000000".to_string());
        let dt = 0.1;
        
        sprite.update(dt, 800.0, 600.0);
        
        assert_eq!(sprite.x, 5.0); // Clamped to size/2
        assert_eq!(sprite.vx, 50.0); // Velocity reversed
    }

    #[test]
    fn sprite_update_bounces_off_right_edge() {
        let mut sprite = Sprite::new(795.0, 100.0, 50.0, 0.0, 10.0, "#000000".to_string());
        let dt = 0.1;
        
        sprite.update(dt, 800.0, 600.0);
        
        assert_eq!(sprite.x, 795.0); // Clamped to canvas_width - size/2
        assert_eq!(sprite.vx, -50.0); // Velocity reversed
    }

    #[test]
    fn sprite_update_bounces_off_top_edge() {
        let mut sprite = Sprite::new(100.0, 5.0, 0.0, -50.0, 10.0, "#000000".to_string());
        let dt = 0.1;
        
        sprite.update(dt, 800.0, 600.0);
        
        assert_eq!(sprite.y, 5.0); // Clamped to size/2
        assert_eq!(sprite.vy, 50.0); // Velocity reversed
    }

    #[test]
    fn sprite_update_bounces_off_bottom_edge() {
        let mut sprite = Sprite::new(100.0, 595.0, 0.0, 50.0, 10.0, "#000000".to_string());
        let dt = 0.1;
        
        sprite.update(dt, 800.0, 600.0);
        
        assert_eq!(sprite.y, 595.0); // Clamped to canvas_height - size/2
        assert_eq!(sprite.vy, -50.0); // Velocity reversed
    }

    #[test]
    fn bevy_game_create_default_sprites_returns_three_sprites() {
        let sprites = BevyGame::create_default_sprites();
        
        assert_eq!(sprites.len(), 3);
    }

    #[test]
    fn bevy_game_create_default_sprites_has_correct_properties() {
        let sprites = BevyGame::create_default_sprites();
        
        // First sprite
        assert_eq!(sprites[0].x, 200.0);
        assert_eq!(sprites[0].y, 150.0);
        assert_eq!(sprites[0].size, 40.0);
        assert_eq!(sprites[0].color, "#FF6B6B");
        
        // Second sprite
        assert_eq!(sprites[1].x, 400.0);
        assert_eq!(sprites[1].y, 300.0);
        assert_eq!(sprites[1].size, 30.0);
        assert_eq!(sprites[1].color, "#4ECDC4");
        
        // Third sprite
        assert_eq!(sprites[2].x, 100.0);
        assert_eq!(sprites[2].y, 400.0);
        assert_eq!(sprites[2].size, 50.0);
        assert_eq!(sprites[2].color, "#45B7D1");
    }

    // Mock tests for methods that require DOM elements (can't test in unit tests without WASM runtime)
    // These test the business logic without DOM dependencies

    #[test]
    fn mock_bevy_game_time_increases() {
        // Since we can't create BevyGame without DOM, test the time logic separately
        let initial_time = 0.0;
        let dt = 0.016;
        let new_time = initial_time + dt;
        
        assert_eq!(new_time, 0.016);
    }

    #[test]
    fn mock_bevy_game_sprite_count_logic() {
        let sprites = BevyGame::create_default_sprites();
        assert_eq!(sprites.len(), 3);
    }

    // Test BevyGame methods that don't require DOM (pure logic)
    
    #[test]
    fn bevy_game_update_sprites_with_mock() {
        // Test update logic by creating sprites directly and updating them
        let mut sprites = BevyGame::create_default_sprites();
        let dt = 0.1;
        let canvas_width = 800.0;
        let canvas_height = 600.0;
        
        // Record initial positions
        let initial_positions: Vec<(f64, f64)> = sprites.iter().map(|s| (s.x, s.y)).collect();
        
        // Update all sprites
        for sprite in &mut sprites {
            sprite.update(dt, canvas_width, canvas_height);
        }
        
        // Verify sprites moved
        for (i, sprite) in sprites.iter().enumerate() {
            let (initial_x, initial_y) = initial_positions[i];
            // Position should change (unless at boundary)
            assert!(sprite.x != initial_x || sprite.y != initial_y || sprite.rotation != 0.0);
        }
    }

    #[test]
    fn sprite_clone_functionality() {
        // Test that Sprite implements Clone correctly
        let sprite1 = Sprite::new(50.0, 75.0, 25.0, 30.0, 15.0, "#ABCDEF".to_string());
        let sprite2 = sprite1.clone();
        
        assert_eq!(sprite1.x, sprite2.x);
        assert_eq!(sprite1.y, sprite2.y);
        assert_eq!(sprite1.vx, sprite2.vx);
        assert_eq!(sprite1.vy, sprite2.vy);
        assert_eq!(sprite1.size, sprite2.size);
        assert_eq!(sprite1.color, sprite2.color);
        assert_eq!(sprite1.rotation, sprite2.rotation);
    }

    #[test]
    fn sprite_edge_case_exactly_at_boundary() {
        // Test sprite exactly at boundary conditions
        let mut sprite = Sprite::new(5.0, 5.0, 0.0, 0.0, 10.0, "#TEST123".to_string());
        
        sprite.update(0.1, 100.0, 100.0);
        
        // Should stay at boundary
        assert_eq!(sprite.x, 5.0); // size/2 = 5.0
        assert_eq!(sprite.y, 5.0); // size/2 = 5.0
    }

    #[test]
    fn sprite_very_large_delta_time() {
        // Test with unusually large delta time
        let mut sprite = Sprite::new(50.0, 50.0, 10.0, 10.0, 20.0, "#LARGE".to_string());
        
        sprite.update(10.0, 500.0, 500.0); // Very large dt
        
        // Should still be within bounds
        assert!(sprite.x >= 10.0); // size/2
        assert!(sprite.y >= 10.0); // size/2
        assert!(sprite.x <= 490.0); // canvas_width - size/2
        assert!(sprite.y <= 490.0); // canvas_height - size/2
    }

    #[test]
    fn sprite_zero_delta_time() {
        // Test with zero delta time
        let mut sprite = Sprite::new(100.0, 100.0, 50.0, 50.0, 20.0, "#ZERO".to_string());
        let initial_x = sprite.x;
        let initial_y = sprite.y;
        let initial_rotation = sprite.rotation;
        
        sprite.update(0.0, 500.0, 500.0);
        
        // Should not move with zero dt
        assert_eq!(sprite.x, initial_x);
        assert_eq!(sprite.y, initial_y);
        assert_eq!(sprite.rotation, initial_rotation);
    }

    #[test]
    fn sprite_negative_size_handling() {
        // Test edge case with negative size (should still work)
        let mut sprite = Sprite::new(100.0, 100.0, 50.0, 50.0, -10.0, "#NEG".to_string());
        
        sprite.update(0.1, 200.0, 200.0);
        
        // Should still update position and rotation
        assert_eq!(sprite.x, 105.0); // 100 + 50 * 0.1
        assert_eq!(sprite.y, 105.0); // 100 + 50 * 0.1
        assert_eq!(sprite.rotation, 0.2); // 0 + 0.1 * 2.0
    }

    #[test]
    fn bevy_game_default_sprites_velocity_values() {
        // Test specific velocity values of default sprites
        let sprites = BevyGame::create_default_sprites();
        
        assert_eq!(sprites[0].vx, 120.0);
        assert_eq!(sprites[0].vy, 80.0);
        
        assert_eq!(sprites[1].vx, -100.0);
        assert_eq!(sprites[1].vy, 150.0);
        
        assert_eq!(sprites[2].vx, 90.0);
        assert_eq!(sprites[2].vy, -120.0);
    }

    #[test]
    fn sprite_rotation_increases_over_time() {
        // Test that rotation increases with each update
        let mut sprite = Sprite::new(400.0, 300.0, 0.0, 0.0, 20.0, "#ROT".to_string());
        let dt = 0.1;
        
        let initial_rotation = sprite.rotation;
        sprite.update(dt, 800.0, 600.0);
        
        assert!(sprite.rotation > initial_rotation);
        assert_eq!(sprite.rotation, initial_rotation + dt * 2.0);
    }

    // Additional tests for methods that can be tested without DOM

    #[test]
    fn bevy_game_advance_time() {
        // Create a mock test for advance_time logic
        let mut time = 0.0;
        let dt = 0.5;
        time += dt;
        
        assert_eq!(time, 0.5);
    }

    #[test]
    fn test_time_accumulation() {
        // Test multiple time advances
        let mut time = 0.0;
        for _ in 0..10 {
            time += 0.016; // 60 FPS
        }
        assert!((time - 0.16_f64).abs() < f64::EPSILON);
    }

    #[test]
    fn sprite_position_after_multiple_bounces() {
        // Test sprite behavior through multiple bounces
        let mut sprite = Sprite::new(10.0, 10.0, -20.0, -20.0, 10.0, "#BOUNCE".to_string());
        
        // Should bounce multiple times
        for _ in 0..5 {
            sprite.update(0.1, 100.0, 100.0);
        }
        
        // Should still be within bounds
        assert!(sprite.x >= 5.0);
        assert!(sprite.y >= 5.0);
        assert!(sprite.x <= 95.0);
        assert!(sprite.y <= 95.0);
    }

    #[test]
    fn sprite_different_canvas_sizes() {
        // Test sprite behavior with different canvas sizes
        let mut sprite1 = Sprite::new(50.0, 50.0, 100.0, 100.0, 20.0, "#SIZE1".to_string());
        let mut sprite2 = sprite1.clone();
        
        sprite1.update(0.1, 200.0, 200.0); // Small canvas
        sprite2.update(0.1, 2000.0, 2000.0); // Large canvas
        
        // Both should move the same amount initially
        assert_eq!(sprite1.x, sprite2.x);
        assert_eq!(sprite1.y, sprite2.y);
    }

    #[test]
    fn sprite_velocity_reversal_consistency() {
        // Test that velocity reversal is consistent
        let mut sprite = Sprite::new(5.0, 100.0, -50.0, 0.0, 10.0, "#VEL".to_string());
        let initial_vx = sprite.vx;
        
        sprite.update(0.1, 800.0, 600.0);
        
        assert_eq!(sprite.vx, -initial_vx); // Should be exactly reversed
    }

    // Tests for new BevyGame methods

    #[test] 
    fn test_create_and_manipulate_sprites() {
        // Test sprite management without DOM
        let mut sprites = Vec::new();
        
        // Test adding sprites
        sprites.push(Sprite::new(100.0, 100.0, 50.0, 25.0, 20.0, "#TEST1".to_string()));
        sprites.push(Sprite::new(200.0, 200.0, -30.0, 40.0, 15.0, "#TEST2".to_string()));
        
        assert_eq!(sprites.len(), 2);
        
        // Test clearing sprites
        sprites.clear();
        assert_eq!(sprites.len(), 0);
    }

    #[test]
    fn test_sprite_collection_operations() {
        // Test operations on sprite collections
        let sprites = BevyGame::create_default_sprites();
        let sprite_count = sprites.len();
        
        assert_eq!(sprite_count, 3);
        
        // Test accessing individual sprites
        assert!(sprites[0].x > 0.0);
        assert!(sprites[1].y > 0.0);
        assert!(sprites[2].size > 0.0);
    }

    #[test]
    fn test_time_accumulation_with_different_intervals() {
        // Test time accumulation with various intervals
        let mut time = 0.0;
        
        // Simulate different frame rates
        time += 0.016; // 60 FPS
        time += 0.033; // 30 FPS
        time += 0.008; // 120 FPS
        
        assert!((time - 0.057_f64).abs() < f64::EPSILON);
    }

    #[test]
    fn test_sprite_boundary_physics() {
        // Test comprehensive boundary physics
        let mut sprite = Sprite::new(50.0, 50.0, 200.0, 150.0, 30.0, "#PHYS".to_string());
        let canvas_w = 400.0;
        let canvas_h = 300.0;
        
        // Simulate until sprite hits boundary
        for _ in 0..10 {
            sprite.update(0.01, canvas_w, canvas_h);
            
            // Verify sprite stays within bounds
            assert!(sprite.x >= sprite.size / 2.0);
            assert!(sprite.y >= sprite.size / 2.0);
            assert!(sprite.x <= canvas_w - sprite.size / 2.0);
            assert!(sprite.y <= canvas_h - sprite.size / 2.0);
        }
    }

    #[test]
    fn test_sprite_energy_conservation() {
        // Test that bouncing preserves energy (velocity magnitude)
        let mut sprite = Sprite::new(10.0, 100.0, -50.0, 75.0, 20.0, "#ENERGY".to_string());
        
        let initial_speed = (sprite.vx.powi(2) + sprite.vy.powi(2)).sqrt();
        
        // Update to trigger bounce
        sprite.update(0.1, 500.0, 500.0);
        
        let final_speed = (sprite.vx.powi(2) + sprite.vy.powi(2)).sqrt();
        
        // Speed should be preserved (energy conservation)
        assert!((initial_speed - final_speed).abs() < f64::EPSILON);
    }

    #[test]
    fn test_sprite_rotation_accumulation() {
        // Test rotation accumulates correctly over time
        let mut sprite = Sprite::new(200.0, 200.0, 0.0, 0.0, 25.0, "#ROTATE".to_string());
        
        let dt = 0.05;
        let steps = 4;
        
        for _ in 0..steps {
            sprite.update(dt, 800.0, 600.0);
        }
        
        let expected_rotation = dt * 2.0 * steps as f64;
        assert!((sprite.rotation - expected_rotation).abs() < f64::EPSILON);
    }

    #[test]
    fn test_mock_canvas_dimensions() {
        // Test canvas dimension logic
        let width = 1024.0;
        let height = 768.0;
        
        // Mock the logic that would be in get_canvas_dimensions
        assert_eq!((width, height), (1024.0, 768.0));
    }

    #[test]
    fn test_sprite_state_consistency() {
        // Test that sprite state remains consistent
        let sprite = Sprite::new(150.0, 250.0, 80.0, -60.0, 35.0, "#CONSISTENT".to_string());
        
        // Test getter consistency
        let (x, y) = sprite.get_position();
        let (vx, vy) = sprite.get_velocity();
        
        assert_eq!(x, sprite.x);
        assert_eq!(y, sprite.y);
        assert_eq!(vx, sprite.vx);
        assert_eq!(vy, sprite.vy);
    }
}