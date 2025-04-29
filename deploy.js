const ghpages = require('gh-pages');
const path = require('path');
const fs = require('fs');

// Define specific files to include
const files = [
  'index.html',
  'resources.json',
  'js/app.js'
];

// Create a temporary directory for deployment
const tempDir = path.join(__dirname, '.publish-temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Create the js directory inside the temp dir
const jsTempDir = path.join(tempDir, 'js');
if (!fs.existsSync(jsTempDir)) {
  fs.mkdirSync(jsTempDir);
}

// Copy only the files we want to deploy
files.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const destPath = path.join(tempDir, file);
  
  // Create directories as needed
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copy the file
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Copied ${sourcePath} to ${destPath}`);
});

// Deploy to GitHub Pages
console.log('Deploying to GitHub Pages...');
ghpages.publish(tempDir, {
  message: 'Auto-generated deployment to GitHub Pages',
  branch: 'gh-pages',
  dotfiles: true
}, function(err) {
  if (err) {
    console.error('Error deploying to GitHub Pages:', err);
    process.exit(1);
  } else {
    console.log('Successfully deployed to GitHub Pages!');
    
    // Clean up the temp directory
    try {
      fs.rmSync(tempDir, { recursive: true });
      console.log('Cleaned up temporary directory');
    } catch (error) {
      console.error('Error cleaning up temporary directory:', error);
    }
  }
});
