# TASK_ASSIGNMENT.md

## Worktree: ratemyfeet-cleanup
## Branch: task/ai-cleanup 
## Priority: high

## Description:
Remove AI Model Dependencies and Clean Codebase

## Primary Reference Files:
- **Task 1**: `.taskmaster/tasks/task_001.txt`

## Assigned Tasks: 1

### Instructions for Claude Code:
1. **READ FIRST**: `.taskmaster/tasks/task_001.txt` for complete implementation details
2. **FOLLOW EXACTLY**: Test strategies outlined in the task file  
3. **STAY IN SCOPE**: Focus only on AI/ML removal - avoid touching other systems
4. **COORDINATE**: Some branding removal overlaps with Task 11 - coordinate boundaries

## Task 1 Details Summary:
**Remove AI Model Dependencies and Clean Codebase**
- **Priority**: High
- **Dependencies**: None (foundational cleanup)
- **Reference**: `.taskmaster/tasks/task_001.txt`

### Key Deliverables (from task_001.txt):
1. Remove Replicate API integration and dependencies from package.json
2. Delete AI scoring components and related files  
3. Remove 'Analyze Photo' button and related functionality
4. Clean up unused AI model dependencies
5. Remove 'looxmaxx' branding references (coordinate with branding team)
6. Update environment variables to remove AI-related configs

### Files to Remove/Modify:
- Remove from package.json: `"replicate": "^x.x.x"`
- Delete files like:
  - `components/AIScoring.js`
  - `utils/aiModel.js` 
  - `api/analyze-photo.js`
  - Any TensorFlow.js related components
  - Face detection utilities

## Test Strategy (from task_001.txt):
- Verify all AI-related code is removed by searching codebase for 'replicate', 'ai', 'analyze' keywords
- Test that application builds without errors
- Confirm no broken imports or references remain

## Dependencies & Coordination:
- **No blocking dependencies** - this is foundational work
- **Coordinate with Task 11 (Branding)**: Divide 'looxmaxx' branding removal responsibilities
- **Provide clean foundation** for other teams to build new features

## DO NOT MODIFY:
- Database schema files (Task 2's responsibility)
- Rating system components (Tasks 3-6's responsibility) 
- User management features (Tasks 7-10's responsibility)
- Core Next.js infrastructure unless AI-related

## Search Keywords to Remove:
- 'replicate'
- 'ai', 'AI'
- 'analyze', 'analysis'
- 'model', 'inference'
- 'tensorflow', 'tfjs'
- 'face-api', 'face detection'
- 'ensemble', 'beauty'
- 'deepface'

## Quick Start Checklist:
1. ✅ Read `.taskmaster/tasks/task_001.txt` thoroughly
2. ⬜ Search codebase for AI-related keywords and components
3. ⬜ Remove Replicate dependencies from package.json
4. ⬜ Delete AI scoring and analysis components
5. ⬜ Remove face detection and model loading code
6. ⬜ Clean up AI-related environment variables
7. ⬜ Remove analyze photo functionality from UI
8. ⬜ Test that application builds successfully
9. ⬜ Verify no broken imports remain

## Success Criteria:
- No AI/ML related dependencies in package.json
- No AI-related components or utilities exist
- Application builds and runs without AI functionality
- No broken imports or references
- Clean foundation for new rating system implementation