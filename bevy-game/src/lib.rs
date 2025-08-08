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
struct Sprite {
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
    size: f64,
    color: String,
    rotation: f64,
    target: Option<Target>,
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

        let sprites = vec![
            Sprite {
                x: 200.0,
                y: 150.0,
                vx: 120.0,
                vy: 80.0,
                size: 40.0,
                color: "#FF6B6B".to_string(),
                rotation: 0.0,
                target: Some(Target {
                    x: 600.0,
                    y: 400.0,
                    find_new_target: true,
                }),
            },
            Sprite {
                x: 400.0,
                y: 300.0,
                vx: -100.0,
                vy: 150.0,
                size: 30.0,
                color: "#4ECDC4".to_string(),
                rotation: 0.0,
                target: Some(Target {
                    x: 150.0,
                    y: 100.0,
                    find_new_target: false,
                }),
            },
            Sprite {
                x: 100.0,
                y: 400.0,
                vx: 90.0,
                vy: -120.0,
                size: 50.0,
                color: "#45B7D1".to_string(),
                rotation: 0.0,
                target: None, // This sprite has no target and will stay still
            },
        ];

        log("Bevy-style game foundation initialized!");

        Ok(BevyGame {
            canvas,
            ctx,
            time: 0.0,
            sprites,
        })
    }

    #[wasm_bindgen]
    pub fn render_frame(&mut self) {
        self.update_and_render();
    }

    fn update_and_render(&mut self) {
        // Clear canvas
        self.ctx.clear_rect(0.0, 0.0, self.canvas.width() as f64, self.canvas.height() as f64);
        
        // Set background
        self.ctx.set_fill_style(&JsValue::from_str("#1a1a1a"));
        self.ctx.fill_rect(0.0, 0.0, self.canvas.width() as f64, self.canvas.height() as f64);

        // Delta time simulation (16ms ≈ 60fps)
        let dt = 0.016;
        self.time += dt;

        // Update and render sprites
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
            }
            // If no target, sprite stays still (no position update)
            
            sprite.rotation += dt * 2.0; // Continue rotating sprites

            // Keep sprites within bounds
            sprite.x = sprite.x.max(sprite.size/2.0).min(self.canvas.width() as f64 - sprite.size/2.0);
            sprite.y = sprite.y.max(sprite.size/2.0).min(self.canvas.height() as f64 - sprite.size/2.0);

            // Render sprite
            self.ctx.save();
            let _ = self.ctx.translate(sprite.x, sprite.y);
            let _ = self.ctx.rotate(sprite.rotation);
            self.ctx.set_fill_style(&JsValue::from_str(&sprite.color));
            self.ctx.fill_rect(-sprite.size/2.0, -sprite.size/2.0, sprite.size, sprite.size);
            
            // Render target if it exists
            if let Some(target) = &sprite.target {
                self.ctx.restore();
                self.ctx.save();
                let _ = self.ctx.translate(target.x, target.y);
                self.ctx.set_fill_style(&JsValue::from_str("rgba(255, 255, 255, 0.5)"));
                self.ctx.fill_rect(-5.0, -5.0, 10.0, 10.0);
                
                // Draw line to target
                self.ctx.set_stroke_style(&JsValue::from_str("rgba(255, 255, 255, 0.3)"));
                self.ctx.set_line_width(1.0);
                self.ctx.begin_path();
                self.ctx.move_to(sprite.x, sprite.y);
                self.ctx.line_to(target.x, target.y);
                let _ = self.ctx.stroke();
            }
            
            self.ctx.restore();
        }

        // Render title text
        self.ctx.set_fill_style(&JsValue::from_str("#FFFFFF"));
        self.ctx.set_font("20px sans-serif");
        self.ctx.fill_text("Bevy Game Foundation", 10.0, 30.0).unwrap();
        
        self.ctx.set_font("14px sans-serif");
        self.ctx.fill_text(&format!("Time: {:.1}s", self.time), 10.0, 55.0).unwrap();
        self.ctx.fill_text("Entity-Component-System Architecture Demo", 10.0, 75.0).unwrap();
    }
}

#[wasm_bindgen(start)]
pub fn main() {
    console::log_1(&"Bevy Game Foundation WASM module loaded".into());
}