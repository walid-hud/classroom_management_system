# CLassroom manager
SAS project at [ENAA](https://enaa.ma)  

### how to run
```sh
git clone https://github.com/walid-hud/classroom_management_system.git
cd classroom_management_system
npm i
npm run start
```

### notes
when testing the `load` option, the path of the file you want to load should be relative to the directory in where you run `npm run start`, so, if you want to load `test.json`, the path will be `src\test.json` even thought `test.js` is in the same directory as `index.ts` (the main program file)   

if you're not familiar with typescript check the js version [here](https://github.com/walid-hud/classroom_management_system/blob/main/dist/index.js)
