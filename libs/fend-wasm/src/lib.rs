use wasm_bindgen::prelude::*;
use instant::Instant;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

struct TimeoutInterrupt {
    start: Instant
}

impl TimeoutInterrupt {
    fn new() -> Self {
        Self {
            start: Instant::now()
        }
    }
}

impl fend_core::Interrupt for TimeoutInterrupt {
    fn should_interrupt(&self) -> bool {
        Instant::now().duration_since(self.start).as_millis() > 500
    }
}

#[wasm_bindgen]
pub fn evaluate(input: &str) -> String {
    let interrupt = TimeoutInterrupt::new();
    let mut context = fend_core::Context::new();
    let result = fend_core::evaluate_with_interrupt(input, &mut context, &interrupt);
    match result {
        Ok(result_value) => result_value.get_main_result().to_string(),
        Err(error) => error
    }
}
