use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement, console};
use js_sys::Math;

// Import the `console.log` function from the browser console
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! console_log {
    ( $( $t:tt )* ) => {
        log(&format!( $( $t )* ))
    }
}

#[wasm_bindgen]
pub struct RustWasmGame {
    ctx: CanvasRenderingContext2d,
    canvas: HtmlCanvasElement,
    ball_x: f64,
    ball_y: f64,
    ball_dx: f64,
    ball_dy: f64,
    ball_radius: f64,
    width: f64,
    height: f64,
    last_time: f64,
}

#[wasm_bindgen]
impl RustWasmGame {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_id: &str) -> Result<RustWasmGame, JsValue> {
        let window = web_sys::window().unwrap();
        let document = window.document().unwrap();
        let canvas = document
            .get_element_by_id(canvas_id)
            .unwrap()
            .dyn_into::<HtmlCanvasElement>()?;

        let ctx = canvas
            .get_context("2d")?
            .unwrap()
            .dyn_into::<CanvasRenderingContext2d>()?;

        let width = canvas.width() as f64;
        let height = canvas.height() as f64;

        console_log!("Rust WASM Game initialized: {}x{}", width, height);

        Ok(RustWasmGame {
            ctx,
            canvas,
            ball_x: width / 2.0,
            ball_y: height / 2.0,
            ball_dx: 150.0, // pixels per second
            ball_dy: 100.0, // pixels per second
            ball_radius: 20.0,
            width,
            height,
            last_time: 0.0,
        })
    }

    #[wasm_bindgen]
    pub fn update(&mut self, current_time: f64) {
        if self.last_time == 0.0 {
            self.last_time = current_time;
            return;
        }

        let delta_time = (current_time - self.last_time) / 1000.0; // Convert to seconds
        self.last_time = current_time;

        // Update ball position
        self.ball_x += self.ball_dx * delta_time;
        self.ball_y += self.ball_dy * delta_time;

        // Bounce off walls
        if self.ball_x + self.ball_radius > self.width || self.ball_x - self.ball_radius < 0.0 {
            self.ball_dx = -self.ball_dx;
            // Clamp to bounds
            if self.ball_x + self.ball_radius > self.width {
                self.ball_x = self.width - self.ball_radius;
            } else {
                self.ball_x = self.ball_radius;
            }
        }

        if self.ball_y + self.ball_radius > self.height || self.ball_y - self.ball_radius < 0.0 {
            self.ball_dy = -self.ball_dy;
            // Clamp to bounds
            if self.ball_y + self.ball_radius > self.height {
                self.ball_y = self.height - self.ball_radius;
            } else {
                self.ball_y = self.ball_radius;
            }
        }
    }

    #[wasm_bindgen]
    pub fn render(&self) {
        // Clear canvas with a dark background
        self.ctx.set_fill_style(&JsValue::from_str("#2c3e50"));
        self.ctx.fill_rect(0.0, 0.0, self.width, self.height);

        // Draw the bouncing ball
        self.ctx.begin_path();
        self.ctx.arc(self.ball_x, self.ball_y, self.ball_radius, 0.0, 2.0 * std::f64::consts::PI).unwrap();
        self.ctx.set_fill_style(&JsValue::from_str("#e74c3c"));
        self.ctx.fill();

        // Add a white border to the ball
        self.ctx.set_stroke_style(&JsValue::from_str("#ffffff"));
        self.ctx.set_line_width(2.0);
        self.ctx.stroke();

        // Draw some decorative text
        self.ctx.set_fill_style(&JsValue::from_str("#ecf0f1"));
        self.ctx.set_font("16px Arial");
        self.ctx.fill_text("Rust WASM Bouncing Ball", 10.0, 25.0).unwrap();
        
        let position_text = format!("Ball Position: ({:.0}, {:.0})", self.ball_x, self.ball_y);
        self.ctx.fill_text(&position_text, 10.0, 45.0).unwrap();
    }

    #[wasm_bindgen]
    pub fn resize(&mut self, width: f64, height: f64) {
        self.width = width;
        self.height = height;
        self.canvas.set_width(width as u32);
        self.canvas.set_height(height as u32);
        console_log!("Canvas resized to: {}x{}", width, height);
    }

    #[wasm_bindgen]
    pub fn on_click(&mut self, x: f64, y: f64) {
        // Move ball towards click position
        let dx = x - self.ball_x;
        let dy = y - self.ball_y;
        let length = (dx * dx + dy * dy).sqrt();
        
        if length > 0.0 {
            self.ball_dx = (dx / length) * 200.0; // Normalize and set speed
            self.ball_dy = (dy / length) * 200.0;
        }
        
        console_log!("Click at ({}, {}), ball heading towards it", x, y);
    }

    #[wasm_bindgen]
    pub fn add_random_velocity(&mut self) {
        // Add some randomness to the ball movement
        self.ball_dx += (Math::random() - 0.5) * 100.0;
        self.ball_dy += (Math::random() - 0.5) * 100.0;
        console_log!("Added random velocity, new velocity: ({}, {})", self.ball_dx, self.ball_dy);
    }
}
