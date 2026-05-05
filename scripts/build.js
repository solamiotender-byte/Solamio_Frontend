const timestamp = new Date()
  .toISOString()
  .replace(/[-:T.Z]/g, '')
  .slice(0, 14);

const buildPath = `build_frontend_${timestamp}`;

process.env.BUILD_PATH = buildPath;
require('react-scripts/scripts/build');
