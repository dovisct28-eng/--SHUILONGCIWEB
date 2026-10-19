import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('promo-video/ppt/revision-v4');
const skill='C:/Users/dovis/.codex/plugins/cache/openai-primary-runtime/presentations/26.1015.12040/skills/presentations';
process.env.RUNTIME_NODE_MODULES='C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')));
const result=await finalizePresentation({
 workspaceDir:root,candidatePath:path.join(root,'local/candidate.pptx'),
 finalPath:path.join(root,'output/出兵·入将-设计演进增补版V4.pptx'),
 explicitTotalSlideCount:15,
 pythonExecutable:'C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
 fontPolicy:{basis:'reference',families:['微软雅黑','宋体','等线'],referencePath:path.resolve('promo-video/ppt/revision-v3/output/出兵·入将-独立阅读评审版V3.pptx'),referenceSha256:'eface3ee8eddefc46ab3a6ae683b9727cd70a9fbdd39e033a4c8eecf15fabdc6'},
 verifyArtifactToolImport:true,receiptPath:path.join(root,'qa/presentation-validation.json')
});
console.log(JSON.stringify(result));
