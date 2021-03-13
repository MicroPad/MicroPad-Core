//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;
use js_sys::{Uint8Array, SharedArrayBuffer};
use wasm_bindgen::__rt::core::convert::TryInto;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn checksum() {
    // Arrange
    let asset = Uint8Array::from("Hello, World!".as_bytes());
    let expected: u32 = 3964322768;

    // Act
    let res = asset_checksum::checksum(asset);

    // Assert
    assert_eq!(res, expected);
}

#[wasm_bindgen_test]
fn consistency() {
    // Arrange
    let expected: u32 = 1038552626;

    // Act
    let res = asset_checksum::checksum(Uint8Array::from("Consistency is key".as_bytes()));
    let res2 = asset_checksum::checksum(Uint8Array::from("Consistency is key".as_bytes()));

    assert_eq!(res, expected);
    assert_eq!(res, res2);
}

pub mod shared {
    use super::*;

    #[wasm_bindgen_test]
    fn checksum() {
        // Arrange
        let shared_buffer = slice_to_shared_array_buffer("Hello, World!".as_bytes());
        let expected: u32 = 3964322768;

        // Act
        let res = asset_checksum::checksum_shared(shared_buffer);

        // Assert
        assert_eq!(res, expected);
    }

    #[wasm_bindgen_test]
    fn consistency() {
        // Arrange
        let expected: u32 = 1038552626;

        // Act
        let res = asset_checksum::checksum_shared(slice_to_shared_array_buffer("Consistency is key".as_bytes()));
        let res2 = asset_checksum::checksum_shared(slice_to_shared_array_buffer("Consistency is key".as_bytes()));

        assert_eq!(res, expected);
        assert_eq!(res, res2);
    }
}

fn slice_to_shared_array_buffer(slice: &[u8]) -> SharedArrayBuffer {
    // Construct the shared array buffer to hash
    let shared_buffer = SharedArrayBuffer::new(slice.len().try_into().unwrap());
    let asset_typed_array = Uint8Array::new(&shared_buffer);
    for (i, byte) in slice.iter().enumerate() {
        asset_typed_array.set_index(i as u32, *byte);
    }

    shared_buffer
}
