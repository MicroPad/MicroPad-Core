# µPad
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FMicroPad%2FWeb.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FMicroPad%2FWeb?ref=badge_shield)


µPad is an open digital note taking app.

Try it today at https://web.getmicropad.com

## What's going on with development?
There are a couple [GitHub Project boards](https://github.com/MicroPad/Web/projects) with what's in development. That board would also be a great place to look for cases to contribute to.

## Building MicroPad
You will need the following:  
- [Yarn](https://classic.yarnpkg.com/lang/en/) classic
- [Node.js](https://nodejs.org/en/)
- [Rust and Cargo](https://rustup.rs/)
- [Python 3](https://www.python.org/)
- [`wasm-bindgen`](https://rustwasm.github.io/docs/wasm-bindgen/)

### Installing dependencies
```bash
git clone https://github.com/MicroPad/Web micropad-web
cd micropad-web/app
yarn
```

### Running a dev server
```bash
yarn start
```
### Building for production
```bash
yarn build
```


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FMicroPad%2FWeb.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FMicroPad%2FWeb?ref=badge_large)