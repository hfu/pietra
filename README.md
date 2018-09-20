# pietra
tsunagi plus modulalized mbtiles server as in tile-block

## Background
I wanted have a tsunagi-based vector tiles server that can work with modulalized mbtiles. This was for developing a vector tile Proof-of-Concept named prototype10.

## Install
```console
$ git clone git@github.com:hfu/pietra
$ cd pietra
$ npm install
```

## Configuration
You need to have a configuration file normally at config/default.hjson like the following. 
```
{
  key: somewhere/privkey.pem
  cert: somewhere/fullchain.pem
  ca: somewhere/chain.pem
  port: 8800
  name: OpenStreetMap_v2
  resource: somewhere/resource.json
  style: somewhere/style.json 
  sprite: config/sprite
  mbtiles: mbtiles
}
```
resource.json is a root response for ArcGIS Server Web Service.

style.json is a Mapbox Style description for Mapbox GL JS. Some parts are automatically modified by this script, as in tsunagi.

## Usage
```console
$ vi config/default.hjson
$ node index.js {port}
```

## TODO
- We need to add work on glyphs.

## See also
- [tsunagi](https://github.com/hfu/tsunagi)
- [tile-block](https://github.com/hfu/tile-block)
