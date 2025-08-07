use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};
use std::cell::RefCell;
use std::rc::Rc;

// TODO: Replace this minimal implementation with Bevy game engine
// This is a foundational structure that can be expanded into a full Bevy ECS game
// 
// Planned Bevy migration:
// 1. Replace Ball struct with Bevy Components
// 2. Convert update loop to Bevy Systems
// 3. Use Bevy's Transform and Velocity components
// 4. Implement proper ECS architecture
// 5. Add Bevy's input handling and rendering systems

#[derive(Clone)]
struct Ball {
    x: f64,
    y: f64,
    velocity_x: f64,
    velocity_y: f64,
    radius: f64,
}

impl Ball {
    fn new(x: f64, y: f64) -> Self {
        Ball {
            x,
            y,
            velocity_x: 150.0,
            velocity_y: 100.0,
            radius: 20.0,
        }
    }

    // Update ball position - will become a Bevy System
    fn update(&mut self, delta_time: f64, canvas_width: f64, canvas_height: f64) {
        self.x += self.velocity_x * delta_time;
        self.y += self.velocity_y * delta_time;

        // Bounce off walls
        if self.x + self.radius > canvas_width || self.x - self.radius < 0.0 {
            self.velocity_x = -self.velocity_x;
        }
        if self.y + self.radius > canvas_height || self.y - self.radius < 0.0 {
            self.velocity_y = -self.velocity_y;
        }

        // Keep within bounds
        self.x = self.x.clamp(self.radius, canvas_width - self.radius);
        self.y = self.y.clamp(self.radius, canvas_height - self.radius);
    }

    // Render ball - will become a Bevy Sprite Component
    fn render(&self, context: &CanvasRenderingContext2d) {
        context.begin_path();
        context.arc(self.x, self.y, self.radius, 0.0, 2.0 * std::f64::consts::PI).unwrap();
        context.set_fill_style(&JsValue::from_str("#ff3333"));
        context.fill();
    }

    // Redirect ball towards point - will become Bevy input handling
    fn redirect_towards(&mut self, target_x: f64, target_y: f64) {
        let dx = target_x - self.x;
        let dy = target_y - self.y;
        let distance = (dx * dx + dy * dy).sqrt();
        
        if distance > 0.0 {
            let speed = 200.0;
            self.velocity_x = (dx / distance) * speed;
            self.velocity_y = (dy / distance) * speed;
        }
    }
}

// Game state - will become Bevy Resources and World
struct GameState {
    ball: Ball,
    canvas: HtmlCanvasElement,
    context: CanvasRenderingContext2d,
    last_frame_time: f64,
}

impl GameState {
    fn new() -> Result<Self, JsValue> {
        let window = web_sys::window().unwrap();
        let document = window.document().unwrap();
        let canvas = document
            .get_element_by_id("game-canvas")
            .unwrap()
            .dyn_into::<HtmlCanvasElement>()?;

        let context = canvas
            .get_context("2d")?
            .unwrap()
            .dyn_into::<CanvasRenderingContext2d>()?;

        let ball = Ball::new(canvas.width() as f64 / 2.0, canvas.height() as f64 / 2.0);

        Ok(GameState {
            ball,
            canvas,
            context,
            last_frame_time: 0.0,
        })
    }

    // Main game loop - will become Bevy's Update schedule
    fn update(&mut self, current_time: f64) {
        let delta_time = if self.last_frame_time == 0.0 {
            0.016 // ~60fps fallback
        } else {
            (current_time - self.last_frame_time) / 1000.0 // Convert to seconds
        };
        self.last_frame_time = current_time;

        // Update game logic
        self.ball.update(delta_time, self.canvas.width() as f64, self.canvas.height() as f64);

        // Clear and render
        self.context.clear_rect(0.0, 0.0, self.canvas.width().into(), self.canvas.height().into());
        self.ball.render(&self.context);
    }

    // Handle mouse input - will become Bevy input events
    fn handle_click(&mut self, x: f64, y: f64) {
        self.ball.redirect_towards(x, y);
        
        // Log interaction for debugging
        web_sys::console::log_1(&format!("Click at ({:.0}, {:.0}), ball heading towards it", x, y).into());
    }
}

// WASM bindings
#[wasm_bindgen]
pub struct Game {
    state: Rc<RefCell<GameState>>,
}

#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<Game, JsValue> {
        console_error_panic_hook::set_once();
        
        let state = GameState::new()?;
        let game = Game {
            state: Rc::new(RefCell::new(state)),
        };

        web_sys::console::log_1(&"Minimal Rust Game initialized successfully (ready for Bevy migration)".into());
        Ok(game)
    }

    #[wasm_bindgen]
    pub fn start(&self) -> Result<(), JsValue> {
        let state = self.state.clone();
        
        // Set up click handler
        let click_state = state.clone();
        let click_closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            let canvas = &click_state.borrow().canvas;
            let element: &web_sys::Element = canvas.as_ref();
            let rect = element.get_bounding_client_rect();
            let x = event.client_x() as f64 - rect.left();
            let y = event.client_y() as f64 - rect.top();
            click_state.borrow_mut().handle_click(x, y);
        }) as Box<dyn FnMut(_)>);
        
        state.borrow().canvas.add_event_listener_with_callback("click", click_closure.as_ref().unchecked_ref())?;
        click_closure.forget();

        // Start game loop
        let loop_state = state.clone();
        let game_loop: Rc<RefCell<Option<Closure<dyn FnMut(f64)>>>> = Rc::new(RefCell::new(None));
        let loop_clone = game_loop.clone();
        
        *loop_clone.borrow_mut() = Some(Closure::wrap(Box::new(move |time: f64| {
            loop_state.borrow_mut().update(time);
            
            // Schedule next frame
            let window = web_sys::window().unwrap();
            window.request_animation_frame(game_loop.borrow().as_ref().unwrap().as_ref().unchecked_ref()).unwrap();
        }) as Box<dyn FnMut(f64)>));

        let window = web_sys::window().unwrap();
        window.request_animation_frame(loop_clone.borrow().as_ref().unwrap().as_ref().unchecked_ref())?;

        Ok(())
    }
}

// Initialize function
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}