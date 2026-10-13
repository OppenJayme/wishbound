// Regenerate the portable gift after changing the story, CSS, or JavaScript.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'site');
const imageTypes = {svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'};
const embed = text => text.replace(/assets\/[a-z0-9_./-]+\.(svg|png|jpg|jpeg|webp)/gi, (name, extension) => {
  const file = path.resolve(dir, name);
  if(!file.startsWith(path.resolve(dir,'assets') + path.sep) || !fs.existsSync(file)) return name;
  return 'data:' + imageTypes[extension.toLowerCase()] + ';base64,' + fs.readFileSync(file).toString('base64');
});
let html = fs.readFileSync(path.join(dir,'index.html'),'utf8');
const css = embed(fs.readFileSync(path.join(dir,'styles.css'),'utf8'));
html = html.replace('<link rel="stylesheet" href="styles.css" />', () => '<style>\n'+css+'\n</style>');
const editorial = embed(fs.readFileSync(path.join(dir,'editorial.css'),'utf8'));
html = html.replace('<link rel="stylesheet" href="editorial.css" />', () => '<style>\n'+editorial+'\n</style>');
const voyage = embed(fs.readFileSync(path.join(dir,'voyage.css'),'utf8'));
html = html.replace('<link rel="stylesheet" href="voyage.css" />', () => '<style>\n'+voyage+'\n</style>');
const editorStyle = fs.readFileSync(path.join(dir,'gift-editor.css'),'utf8');
html = html.replace('<link rel="stylesheet" href="gift-editor.css" />', () => '<style>\n'+editorStyle+'\n</style>');
for (const name of ['story-config.js','gift-state.js','app.js','wish.js','intro.js','gift-editor.js']) {
  const js = embed(fs.readFileSync(path.join(dir,name),'utf8')).replace(/<\/script/gi,'<\\/script');
  html = html.replace(`<script src="${name}" defer></script>`, () => `<script data-wishbound-source="${name}">document.addEventListener('DOMContentLoaded', () => {\n${js}\n});</script>`);
}
fs.writeFileSync(path.join(dir,'ONE_FILE_PREVIEW.html'),embed(html));
console.log('Portable preview updated.');
