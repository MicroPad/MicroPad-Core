use wasm_bindgen::prelude::*;
use js_sys::Uint8Array;
use crc::crc32;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn checksum(asset: Uint8Array) -> u32 {
    let bytes: Vec<u8> = asset.to_vec();
    crc32::checksum_ieee(bytes.as_slice())
}
