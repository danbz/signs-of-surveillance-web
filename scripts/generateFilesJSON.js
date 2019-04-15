#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const DIR = './signs'

const result = fs.readdirSync(DIR)
const files = []

for (const file of result) {
  if (file.includes('.jpg')) {
    files.push(path.join(DIR, file))
  }
}

fs.writeFileSync('./files.json', JSON.stringify(files, null, 2))
