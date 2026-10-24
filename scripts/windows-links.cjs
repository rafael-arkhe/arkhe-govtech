// Next standalone tracing: directory junctions do not require Windows Developer Mode.
// File links are copied. Linux/macOS use the original filesystem behavior.
if(process.platform==='win32'){
  const fs=require('node:fs'),path=require('node:path'),original=fs.promises.symlink.bind(fs.promises);
  fs.promises.symlink=async(target,destination)=>{
    const source=path.resolve(path.dirname(destination),target),stat=await fs.promises.stat(source);
    if(stat.isDirectory())return original(source,destination,'junction');
    return fs.promises.copyFile(source,destination);
  };
}
