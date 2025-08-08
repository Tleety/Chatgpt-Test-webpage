// Integration tests for the Bevy game module
// These tests verify the overall functionality and integration between components

use bevy_game::{Sprite};

#[test]
fn sprite_integration_full_lifecycle() {
    // Test the complete lifecycle of a sprite
    let mut sprite = Sprite::new(50.0, 50.0, 100.0, 50.0, 20.0, "#FF0000".to_string());
    
    // Verify initial state
    assert_eq!(sprite.get_position(), (50.0, 50.0));
    assert_eq!(sprite.get_velocity(), (100.0, 50.0));
    
    // Update sprite position
    sprite.update(0.1, 800.0, 600.0);
    
    // Verify position changed
    let (x, y) = sprite.get_position();
    assert_eq!(x, 60.0); // 50 + 100 * 0.1
    assert_eq!(y, 55.0); // 50 + 50 * 0.1
    
    // Modify sprite properties
    sprite.set_position(750.0, 100.0);
    sprite.set_velocity(200.0, 0.0);
    
    // Update again - should bounce off right edge
    sprite.update(0.1, 800.0, 600.0);
    
    let (new_x, new_y) = sprite.get_position();
    let (new_vx, new_vy) = sprite.get_velocity();
    
    // Should be at edge and velocity reversed
    assert_eq!(new_x, 790.0); // 800 - 20/2 (canvas_width - size/2)
    assert_eq!(new_vx, -200.0); // Velocity reversed
    assert_eq!(new_y, 100.0); // Y unchanged
    assert_eq!(new_vy, 0.0); // VY unchanged
}

#[test]
fn sprite_integration_corner_bounce() {
    // Test sprite bouncing off corner
    let mut sprite = Sprite::new(5.0, 5.0, -50.0, -25.0, 10.0, "#00FF00".to_string());
    
    sprite.update(0.1, 800.0, 600.0);
    
    let (x, y) = sprite.get_position();
    let (vx, vy) = sprite.get_velocity();
    
    // Should bounce off both edges
    assert_eq!(x, 5.0); // Clamped to size/2
    assert_eq!(y, 5.0); // Clamped to size/2
    assert_eq!(vx, 50.0); // Reversed
    assert_eq!(vy, 25.0); // Reversed
}

#[test]
fn sprite_integration_multiple_updates() {
    // Test multiple sequential updates
    let mut sprite = Sprite::new(400.0, 300.0, 0.0, 0.0, 15.0, "#0000FF".to_string());
    
    // Set velocity and update multiple times
    sprite.set_velocity(60.0, 30.0);
    
    for _ in 0..5 {
        sprite.update(0.1, 800.0, 600.0);
    }
    
    let (x, y) = sprite.get_position();
    
    // After 5 updates of 0.1s each with velocity (60, 30)
    assert_eq!(x, 430.0); // 400 + 60 * 0.1 * 5
    assert_eq!(y, 315.0); // 300 + 30 * 0.1 * 5
}

#[test]
fn sprite_integration_edge_case_zero_size() {
    // Test edge case with zero size sprite
    let mut sprite = Sprite::new(10.0, 10.0, 100.0, 100.0, 0.0, "#FFFF00".to_string());
    
    sprite.update(0.1, 100.0, 100.0);
    
    let (x, y) = sprite.get_position();
    
    // With zero size, sprite should be able to go to edges
    assert_eq!(x, 20.0); // 10 + 100 * 0.1
    assert_eq!(y, 20.0); // 10 + 100 * 0.1
}

#[test]
fn sprite_integration_large_canvas() {
    // Test sprite behavior in large canvas
    let mut sprite = Sprite::new(1000.0, 1000.0, 500.0, 250.0, 50.0, "#FF00FF".to_string());
    
    sprite.update(0.2, 2000.0, 2000.0);
    
    let (x, y) = sprite.get_position();
    
    // Should move freely in large canvas
    assert_eq!(x, 1100.0); // 1000 + 500 * 0.2
    assert_eq!(y, 1050.0); // 1000 + 250 * 0.2
}