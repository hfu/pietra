const fs = require('fs')
const zlib = require('zlib')
const express = require('express')
const spdy = require('spdy')
const cors = require('cors')
const morgan = require('morgan')
const MBTiles = require('@mapbox/mbtiles')
const config = require('config')
const servicePath = `/arcgis/rest/services/${config.get('name')}/VectorTileServer`

const app = express()
app.use(cors())
app.use(morgan(config.get('log')))
app.use(express.static('htdocs'))

let port = config.get('port')
if (process.argv.length === 3) {
  port = parseInt(process.argv[2])
}

// Prepare modularilized mbtiles
let mbtiles
const scanFiles = () => {
  mbtiles = {}
  fs.readdir(config.get('mbtiles'), (err, files) => {
    if (err) throw err
    for (let file of files) {
      if (!file.endsWith('.mbtiles')) continue
      new MBTiles(`${config.get('mbtiles')}/${file}?mode=ro`, (err, mbt) => {
        if (err) throw err
        mbtiles[file] = mbt
      })
    }
  })
}
scanFiles()

/*
app.get('/', (req, res) => {
  res.set('content-type', 'text/html')
  res.send(`\
<html>
<body>
<h2>pietra</h2>
hi.
<ul>
<li><a href="${servicePath}">${servicePath}</a></li>
<li><a href="/mbtiles">mbtiles metadata</a></li>
<li><a href="/eject">eject mbtiles</a></li>
</ul>
</body>
</html>`)
})
*/

app.get('/eject', (req, res) => {
  scanFiles()
  res.set('content-type', 'text/html')
  res.send('<body>Ejected. See <a href="/mbtiles">mbtiles</a></body>')
})

app.get('/mbtiles', (req, res) => {
  res.set('content-type', 'text/plain')
  res.send(JSON.stringify(mbtiles, null, 2))
})

app.get(servicePath, (req, res) => {
  res.set('content-type', 'application/json')
  res.send(fs.readFileSync(config.get('resource')))
})

app.get(`${servicePath}/resources/styles/root.json`, (req, res) => {
  let root = JSON.parse(fs.readFileSync(config.get('style')))
  root.sprite = '../sprites/sprite'
  root.glyphs = '../fonts/{fontstack}/{range}.pbf'
  root.sources = {}
  root.sources[config.get('source')] = {type: 'vector', url: '../../' }
  res.set('content-type', 'application/json')
  res.send(JSON.stringify(root, null, 2))
})

app.get(`${servicePath}/resources/sprites/sprite.json`, (req, res) => {
  res.set('content-type', 'application/json')
  res.send(fs.readFileSync(config.get('sprite') + '.json'))
})

app.get(`${servicePath}/resources/sprites/sprite.png`, (req, res) => {
  res.set('content-type', 'image/png')
  res.send(fs.readFileSync(config.get('sprite') + '.png'))
})

const selectFile = (z, x, y) => {
  if (z < 6) {
    return '0-0-0.mbtiles'
  } else {
    return `6-${x >> (z - 6)}-${y >> (z - 6)}.mbtiles`
  }
}

const sendTile = async (req, res) => {
  const z = parseInt(req.params.z)
  const x = parseInt(req.params.x)
  const y = parseInt(req.params.y)
  const file = selectFile(z, x, y)
  if(mbtiles[file]) {
    res.set('content-type', 'application/vnd.mapbox-vector-tile')
    res.set('content-encoding', 'gzip')
    let tile = await new Promise((resolve, reject) => {
      mbtiles[file].getTile(z, x, y, (err, data, headers) => {
        if (err) { resolve(false) } else { resolve(data) }
      })
    })
    res.send(tile) 
  } else {
    res.status(404).send('tile not found')
  }
}

app.get(`${servicePath}/tile/:z/:y/:x.pbf`, async (req, res) => {
  sendTile(req, res)
})

app.get(`/:z/:x/:y.pbf`, async (req, res) => {
  sendTile(req, res)
})

const main = async () => {
  spdy.createServer({
    key: fs.readFileSync(config.get('key')),
    cert: fs.readFileSync(config.get('cert')),
    ca: fs.readFileSync(config.get('ca'))
  }, app).listen(port, () => {})
}

main()
