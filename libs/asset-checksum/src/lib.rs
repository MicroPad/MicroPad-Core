use wasm_bindgen::prelude::*;
use js_sys::{Uint8Array, SharedArrayBuffer};
use crc::crc32;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn checksum(asset: Uint8Array) -> u32 {
    let bytes: Vec<u8> = asset.to_vec();
    crc32::checksum_ieee(bytes.as_slice())
}

#[wasm_bindgen]
pub fn checksum_shared(asset: SharedArrayBuffer) -> u32 {
    let bytes: Vec<u8> = Uint8Array::new(&asset).to_vec();
    crc32::checksum_ieee(bytes.as_slice())
}
