import path from 'node:path';
import {pathToFileURL} from 'node:url';
import rt from './runtime.cjs';
process.env.RUNTIME_NODE_MODULES=rt.modules;
const skill=process.env.PRESENTATIONS_SKILL||'C:/Users/dovis/.codex/plugins/cache/openai-primary-runtime/presentations/26.1013.11914/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const finalPath=process.argv[2]?path.resolve(process.argv[2]):path.join(rt.base,'output/chubing-rujiang-e-category.pptx');
const result=await finalizePresentation({workspaceDir:rt.base,candidatePath:path.join(rt.base,'local/candidate.pptx'),finalPath,pythonExecutable:process.env.PPT_PYTHON||'C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:12,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:['SimSun','Microsoft YaHei']},verifyArtifactToolImport:true,receiptPath:path.join(rt.base,'qa/presentation-validation.json')});
console.log(JSON.stringify(result));
