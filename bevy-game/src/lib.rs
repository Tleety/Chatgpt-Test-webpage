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
    animation_id: Option<i32>,
    time: f64,
    sprites: Vec<Sprite>,
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
            },
            Sprite {
                x: 400.0,
                y: 300.0,
                vx: -100.0,
                vy: 150.0,
                size: 30.0,
                color: "#4ECDC4".to_string(),
                rotation: 0.0,
            },
            Sprite {
                x: 100.0,
                y: 400.0,
                vx: 90.0,
                vy: -120.0,
                size: 50.0,
                color: "#45B7D1".to_string(),
                rotation: 0.0,
            },
        ];

        log("Bevy-style game foundation initialized!");

        Ok(BevyGame {
            canvas,
            ctx,
            animation_id: None,
            time: 0.0,
            sprites,
        })
    }

    #[wasm_bindgen]
    pub fn start(&mut self) {
        log("Starting Bevy-style game loop...");
        self.render_loop();
    }

    #[wasm_bindgen]
    pub fn stop(&mut self) {
        if let Some(id) = self.animation_id {
            window().unwrap().cancel_animation_frame(id).unwrap();
            self.animation_id = None;
        }
    }

    fn render_loop(&mut self) {
        let closure = Closure::wrap(Box::new(move |time: f64| {
            // This will be handled by the JavaScript animation frame callback
        }) as Box<dyn FnMut(f64)>);

        self.update_and_render();
        
        let window = window().unwrap();
        let request_id = window
            .request_animation_frame(closure.as_ref().unchecked_ref())
            .unwrap();
        
        self.animation_id = Some(request_id);
        closure.forget();
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
            // Update position
            sprite.x += sprite.vx * dt;
            sprite.y += sprite.vy * dt;
            sprite.rotation += dt * 2.0; // Rotate sprites

            // Bounce off edges
            if sprite.x <= sprite.size/2.0 || sprite.x >= self.canvas.width() as f64 - sprite.size/2.0 {
                sprite.vx *= -1.0;
                sprite.x = sprite.x.max(sprite.size/2.0).min(self.canvas.width() as f64 - sprite.size/2.0);
            }
            if sprite.y <= sprite.size/2.0 || sprite.y >= self.canvas.height() as f64 - sprite.size/2.0 {
                sprite.vy *= -1.0;
                sprite.y = sprite.y.max(sprite.size/2.0).min(self.canvas.height() as f64 - sprite.size/2.0);
            }

            // Render sprite
            self.ctx.save();
            self.ctx.translate(sprite.x, sprite.y);
            self.ctx.rotate(sprite.rotation);
            self.ctx.set_fill_style(&JsValue::from_str(&sprite.color));
            self.ctx.fill_rect(-sprite.size/2.0, -sprite.size/2.0, sprite.size, sprite.size);
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