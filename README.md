# µPad

µPad is an open digital note taking app.

Try it today at https://web.getmicropad.com

## What's going on with development?
There are a couple [GitHub Project boards](https://github.com/MicroPad/Web/projects) with what's in development. That board would also be a great place to look for cases to contribute to.

## Building MicroPad
You will need the following:  
- [Yarn](https://yarnpkg.com/lang/en/)
- [Node.js](https://nodejs.org/en/) (preferably >=v10.x)

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
# Not needed to build, but definitely a good idea to make sure these pass
yarn check-syntax
yarn lint
yarn test

# Actually do the build
yarn build
```
