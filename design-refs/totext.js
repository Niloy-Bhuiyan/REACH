const fs=require('fs'),path=require('path');
const dir='design-refs/src', out='design-refs/text';
fs.mkdirSync(out,{recursive:true});
for(const f of fs.readdirSync(dir)){
  let s=fs.readFileSync(path.join(dir,f),'utf8');
  s=s.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<script[\s\S]*?<\/script>/gi,'');
  s=s.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi,(m,src)=>`[IMG ${src}]`);
  s=s.replace(/<(div|p|h1|h2|h3|h4|h5|h6|li|tr|section|header|footer|table|ul|ol|br|hr|td|th|article|aside|nav|main|figure|figcaption|helmet|x-dc|body|html|head|meta|link|span|button|input|label)\b[^>]*>/gi,'\n');
  s=s.replace(/<\/(div|p|h1|h2|h3|h4|h5|h6|li|tr|section|header|footer|table|ul|ol|td|th|article|aside|nav|main|figure|figcaption|helmet|x-dc|body|html|head|span|button|label)>/gi,'\n');
  s=s.replace(/<[^>]+>/g,' ');
  s=s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
  s=s.split('\n').map(l=>l.replace(/[ \t]+/g,' ').trim()).filter(l=>l.length).join('\n').replace(/\n{3,}/g,'\n\n');
  fs.writeFileSync(path.join(out,f.replace(/\.dc\.html$/,'.txt')),s);
  console.log(f.replace(/\.dc\.html$/,'.txt'), s.split('\n').length+' lines', s.length+' chars');
}
