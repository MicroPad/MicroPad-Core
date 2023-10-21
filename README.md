# µPad
µPad is an open digital note-taking app.

Try it today at https://web.getmicropad.com

## What's going on with development?
There are a couple [GitHub Project boards](https://github.com/orgs/MicroPad/projects) with what's in development. That board would also be a great place to look for cases to contribute to.

## Building MicroPad
You will need the following:  
- [Bun](https://bun.sh/)
- [Node.js](https://nodejs.org/en/)
- [Python 3](https://www.python.org/)

### Installing dependencies
```bash
git clone https://github.com/MicroPad/MicroPad-Core.git micropad-core
cd micropad-core/app
bun install
```

### Running a dev server
```bash
bun run start
```
### Building for production
```bash
bun run build
```
