#!/usr/bin/env node

/**
 * Visual Bug Fix Workflow Automation Script
 * 
 * This script provides guided workflow for fixing visual bugs in RateMyBeard
 * following the same methodology used for functional bug fixes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

// Visual bug definitions
const visualBugs = [
  {
    id: 'V1',
    title: 'Branding Inconsistencies',
    priority: 'critical',
    files: ['app/layout.tsx'],
    description: 'Update LooxMaxx references to RateMyBeard',
    phase: 1,
    estimatedTime: '30 minutes'
  },
  {
    id: 'V2', 
    title: 'Missing Alt Text for Images',
    priority: 'critical',
    files: ['app/page.tsx', 'components/Leaderboard.tsx', 'components/WebcamCaptureSimple.tsx'],
    description: 'Add descriptive alt text for accessibility',
    phase: 1,
    estimatedTime: '45 minutes'
  },
  {
    id: 'V3',
    title: 'Color Contrast Issues',
    priority: 'critical', 
    files: ['app/globals.css'],
    description: 'Fix color system and ensure WCAG compliance',
    phase: 1,
    estimatedTime: '60 minutes'
  },
  {
    id: 'V4',
    title: 'Responsive Design Problems',
    priority: 'critical',
    files: ['components/Leaderboard.tsx', 'app/page.tsx'],
    description: 'Fix mobile layout and responsive breakpoints',
    phase: 1,
    estimatedTime: '90 minutes'
  },
  {
    id: 'V5',
    title: 'Focus States Missing',
    priority: 'medium',
    files: ['components/ui/slider.tsx', 'components/ui/button.tsx'],
    description: 'Add keyboard navigation and focus indicators',
    phase: 2,
    estimatedTime: '45 minutes'
  },
  {
    id: 'V6',
    title: 'Image Performance Problems',
    priority: 'medium',
    files: ['components/Leaderboard.tsx', 'app/page.tsx'],
    description: 'Optimize images with Next.js Image component',
    phase: 2,
    estimatedTime: '60 minutes'
  },
  {
    id: 'V7',
    title: 'Animation Performance Issues',
    priority: 'medium',
    files: ['app/globals.css', 'app/layout.tsx'],
    description: 'Optimize animations and add reduced motion support',
    phase: 2,
    estimatedTime: '45 minutes'
  },
  {
    id: 'V8',
    title: 'Form Validation UI Issues',
    priority: 'medium',
    files: ['components/UsernameInput.tsx', 'components/RatingSlider.tsx'],
    description: 'Improve validation feedback for accessibility',
    phase: 2,
    estimatedTime: '30 minutes'
  },
  {
    id: 'V9',
    title: 'Inconsistent Spacing',
    priority: 'low',
    files: ['Multiple components'],
    description: 'Standardize spacing using design tokens',
    phase: 3,
    estimatedTime: '120 minutes'
  },
  {
    id: 'V10',
    title: 'CSS Architecture Issues',
    priority: 'low',
    files: ['app/globals.css'],
    description: 'Consolidate CSS variables and design system',
    phase: 3,
    estimatedTime: '90 minutes'
  },
  {
    id: 'V11',
    title: 'Missing Loading States',
    priority: 'low',
    files: ['components/WebcamCaptureSimple.tsx', 'components/Leaderboard.tsx'],
    description: 'Add consistent loading indicators',
    phase: 3,
    estimatedTime: '60 minutes'
  },
  {
    id: 'V12',
    title: 'Print Styles Incomplete',
    priority: 'low',
    files: ['app/globals.css'],
    description: 'Extend print styles for better document output',
    phase: 3,
    estimatedTime: '30 minutes'
  },
  {
    id: 'V13',
    title: 'Incorrect "Face" Text in Image Capture',
    priority: 'critical',
    files: ['components/WebcamCaptureSimple.tsx'],
    description: 'Fix "Position Your Face" to "Position Your Feet"',
    phase: 1,
    estimatedTime: '15 minutes'
  },
  {
    id: 'V14',
    title: 'Incorrect Instruction Text',
    priority: 'critical',
    files: ['components/WebcamCaptureSimple.tsx'],
    description: 'Fix "Position yourself" to "Position your feet"',
    phase: 1,
    estimatedTime: '10 minutes'
  },
  {
    id: 'V15',
    title: 'Logo Size Too Small',
    priority: 'medium',
    files: ['app/page.tsx'],
    description: 'Increase logo size to maximum without breaking layout',
    phase: 2,
    estimatedTime: '30 minutes'
  },
  {
    id: 'V16',
    title: 'Page Requires Scrollbar',
    priority: 'medium',
    files: ['app/page.tsx', 'app/globals.css'],
    description: 'Adjust layout to eliminate scrollbar on desktop',
    phase: 2,
    estimatedTime: '60 minutes'
  },
  {
    id: 'V17',
    title: 'Tagline Punctuation',
    priority: 'low',
    files: ['app/page.tsx'],
    description: 'Fix tagline punctuation for better emphasis',
    phase: 3,
    estimatedTime: '5 minutes'
  },
  {
    id: 'V18',
    title: 'Background Color Too Dark',
    priority: 'medium',
    files: ['app/globals.css'],
    description: 'Update background to brighter color scheme',
    phase: 2,
    estimatedTime: '45 minutes'
  }
];

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log(`\n${'='.repeat(50)}`, 'cyan');
  log(`${title}`, 'bright');
  log(`${'='.repeat(50)}`, 'cyan');
}

function logBug(bug) {
  const priorityColor = bug.priority === 'critical' ? 'red' : 
                       bug.priority === 'medium' ? 'yellow' : 'green';
  
  log(`\n${colors.bright}Bug ${bug.id}: ${bug.title}${colors.reset}`);
  log(`Priority: ${colors[priorityColor]}${bug.priority.toUpperCase()}${colors.reset}`);
  log(`Phase: ${bug.phase}`);
  log(`Estimated Time: ${bug.estimatedTime}`);
  log(`Files: ${bug.files.join(', ')}`);
  log(`Description: ${bug.description}`);
}

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function runTests() {
  try {
    log('\n🧪 Running tests...', 'blue');
    execSync('npm run build', { stdio: 'pipe' });
    log('✅ Build successful', 'green');
    return true;
  } catch (error) {
    log('❌ Build failed', 'red');
    log(error.message, 'red');
    return false;
  }
}

function checkAccessibility() {
  log('\n♿ Accessibility recommendations:', 'blue');
  log('1. Test with screen reader (NVDA, JAWS, VoiceOver)');
  log('2. Verify keyboard navigation works');
  log('3. Check color contrast with WebAIM tool');
  log('4. Run axe-core accessibility scanner');
}

function showPhaseProgress(phase) {
  const phaseBugs = visualBugs.filter(bug => bug.phase === phase);
  const totalTime = phaseBugs.reduce((sum, bug) => {
    const minutes = parseInt(bug.estimatedTime);
    return sum + minutes;
  }, 0);
  
  log(`\n📊 Phase ${phase} Overview:`, 'cyan');
  log(`Total bugs: ${phaseBugs.length}`);
  log(`Estimated time: ${totalTime} minutes (${Math.round(totalTime/60)} hours)`);
  log(`Priority distribution:`);
  
  const priorities = phaseBugs.reduce((acc, bug) => {
    acc[bug.priority] = (acc[bug.priority] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(priorities).forEach(([priority, count]) => {
    const color = priority === 'critical' ? 'red' : 
                  priority === 'medium' ? 'yellow' : 'green';
    log(`  ${colors[color]}${priority}: ${count}${colors.reset}`);
  });
}

function createWorkingBranch() {
  try {
    log('\n🌿 Creating working branch...', 'blue');
    execSync('git checkout -b visual-bug-fixes', { stdio: 'pipe' });
    log('✅ Created branch: visual-bug-fixes', 'green');
  } catch (error) {
    log('ℹ️  Branch may already exist or you\'re already on it', 'yellow');
  }
}

function showNextSteps(bugId) {
  const bug = visualBugs.find(b => b.id === bugId);
  if (!bug) return;
  
  log('\n📋 Next Steps:', 'cyan');
  log('1. 📖 Read the file(s) to understand current implementation');
  log('2. 🔧 Make the necessary changes following the PRD guidelines');
  log('3. 🧪 Test the changes (build, accessibility, responsive)');
  log('4. 💾 Commit the changes with descriptive message');
  log('5. ▶️  Move to next bug or phase');
  
  log('\n📚 Helpful Commands:', 'blue');
  bug.files.forEach(file => {
    if (file !== 'Multiple components') {
      log(`   Read file: claude read ${file}`);
    }
  });
  log('   Test build: npm run build');
  log('   Run linter: npm run lint');
  log('   Commit: git add . && git commit -m "Fix: Bug V# description"');
}

function showToolingRecommendations() {
  log('\n🛠️  Recommended Tools:', 'cyan');
  log('• Accessibility: axe DevTools, WAVE, Lighthouse');
  log('• Color Contrast: WebAIM Contrast Checker, Colour Contrast Analyser');
  log('• Responsive: Chrome DevTools, BrowserStack');
  log('• Performance: Lighthouse, WebPageTest');
  log('• Screen Readers: NVDA (free), JAWS, VoiceOver (Mac)');
}

// Main workflow functions
function showOverview() {
  logHeader('VISUAL BUG FIX WORKFLOW - RATEMYBEARD');
  
  log('This workflow helps you systematically fix visual bugs using the same', 'bright');
  log('methodology used for functional bug fixes.', 'bright');
  
  log('\n📊 Summary:', 'cyan');
  log(`Total visual bugs identified: ${visualBugs.length}`);
  
  const byPriority = visualBugs.reduce((acc, bug) => {
    acc[bug.priority] = (acc[bug.priority] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(byPriority).forEach(([priority, count]) => {
    const color = priority === 'critical' ? 'red' : 
                  priority === 'medium' ? 'yellow' : 'green';
    log(`${colors[color]}${priority}: ${count} bugs${colors.reset}`);
  });
  
  log('\n📋 Implementation Phases:', 'cyan');
  log('Phase 1: Critical visual fixes (branding, accessibility, responsive)');
  log('Phase 2: Performance & accessibility improvements');
  log('Phase 3: Polish & consistency improvements');
}

function showPhase(phaseNumber) {
  if (phaseNumber < 1 || phaseNumber > 3) {
    log('❌ Invalid phase number. Use 1, 2, or 3.', 'red');
    return;
  }
  
  logHeader(`PHASE ${phaseNumber} - VISUAL BUG FIXES`);
  showPhaseProgress(phaseNumber);
  
  const phaseBugs = visualBugs.filter(bug => bug.phase === phaseNumber);
  
  log('\n🐛 Bugs in this phase:', 'cyan');
  phaseBugs.forEach(bug => {
    logBug(bug);
  });
  
  log('\n🚀 Getting Started:', 'green');
  log('1. Run: node scripts/visual-bug-fix-workflow.js setup');
  log(`2. Start with: node scripts/visual-bug-fix-workflow.js bug V${phaseNumber === 1 ? '1' : phaseNumber === 2 ? '5' : '9'}`);
}

function showBug(bugId) {
  const bug = visualBugs.find(b => b.id === bugId);
  if (!bug) {
    log(`❌ Bug ${bugId} not found. Available bugs: ${visualBugs.map(b => b.id).join(', ')}`, 'red');
    return;
  }
  
  logHeader(`BUG ${bug.id}: ${bug.title.toUpperCase()}`);
  logBug(bug);
  
  // Check if files exist
  log('\n📂 File Status:', 'cyan');
  bug.files.forEach(file => {
    if (file !== 'Multiple components') {
      const exists = checkFileExists(file);
      const status = exists ? '✅' : '❌';
      const color = exists ? 'green' : 'red';
      log(`${status} ${file}`, color);
    }
  });
  
  showNextSteps(bugId);
  
  if (bug.priority === 'critical') {
    log('\n⚠️  This is a CRITICAL bug that should be fixed immediately!', 'red');
  }
}

function setup() {
  logHeader('SETUP - VISUAL BUG FIX ENVIRONMENT');
  
  log('🔍 Checking environment...', 'blue');
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log('❌ Not in a Node.js project directory', 'red');
    return;
  }
  
  // Check if key files exist
  const requiredFiles = ['app/layout.tsx', 'app/globals.css', 'components'];
  const missingFiles = requiredFiles.filter(file => !checkFileExists(file));
  
  if (missingFiles.length > 0) {
    log(`❌ Missing required files: ${missingFiles.join(', ')}`, 'red');
    return;
  }
  
  log('✅ Environment check passed', 'green');
  
  // Create working branch
  createWorkingBranch();
  
  // Run initial tests
  if (!runTests()) {
    log('⚠️  Initial build failed. Fix build errors before proceeding.', 'yellow');
    return;
  }
  
  log('\n🎯 Environment ready for visual bug fixes!', 'green');
  showToolingRecommendations();
  
  log('\n📋 Next Steps:', 'cyan');
  log('1. Choose a phase: node scripts/visual-bug-fix-workflow.js phase 1');
  log('2. Or start with a specific bug: node scripts/visual-bug-fix-workflow.js bug V1');
}

function showHelp() {
  logHeader('VISUAL BUG FIX WORKFLOW - HELP');
  
  log('📖 Available Commands:', 'cyan');
  log('');
  log('node scripts/visual-bug-fix-workflow.js overview    - Show project overview');
  log('node scripts/visual-bug-fix-workflow.js setup      - Setup environment for bug fixes');
  log('node scripts/visual-bug-fix-workflow.js phase <1-3> - Show bugs for specific phase');
  log('node scripts/visual-bug-fix-workflow.js bug <V1-V12> - Show details for specific bug');
  log('node scripts/visual-bug-fix-workflow.js test       - Run build and basic tests');
  log('node scripts/visual-bug-fix-workflow.js help       - Show this help message');
  
  log('\n🎯 Recommended Workflow:', 'green');
  log('1. overview  - Understand the scope');
  log('2. setup     - Prepare environment');
  log('3. phase 1   - Start with critical bugs');
  log('4. bug V1    - Work on specific bugs');
  log('5. test      - Validate changes');
  
  log('\n📚 Additional Resources:', 'blue');
  log('• PRD Document: .taskmaster/docs/visual_bugs_prd.md');
  log('• Functional Bug Fixes: BUG_FIXES_SUMMARY.md');
  log('• WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];
  
  if (!command || command === 'help') {
    showHelp();
  } else if (command === 'overview') {
    showOverview();
  } else if (command === 'setup') {
    setup();
  } else if (command === 'phase') {
    const phaseNum = parseInt(param);
    showPhase(phaseNum);
  } else if (command === 'bug') {
    showBug(param?.toUpperCase());
  } else if (command === 'test') {
    runTests();
    checkAccessibility();
  } else {
    log(`❌ Unknown command: ${command}`, 'red');
    log('Run: node scripts/visual-bug-fix-workflow.js help', 'blue');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  visualBugs,
  showOverview,
  showPhase,
  showBug,
  setup,
  runTests
};