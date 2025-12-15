const fs = require('fs');

fs.cp('assets', 'dist/assets', { force: true, recursive: true }, () => {});