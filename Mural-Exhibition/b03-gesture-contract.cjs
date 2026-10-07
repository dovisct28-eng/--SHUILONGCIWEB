// V3 explicitly replaces person selection and two-hand lifecycle. Protect the
// unchanged open-palm classifier and archive scroll equations across revisions.
module.exports=function gestureContract(html) {
 const s=html.replace(/\r\n/g,'\n');
 const block=(a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start);if(start<0||end<=start)throw Error('Missing protected gesture block '+a);return s.slice(start,end).trim();};
 return [block('function isHandOpen','\n        }\n'),block('const maxScroll = infoText.scrollHeight','if (scrollSpeed !== 0)')].join('\n');
};
