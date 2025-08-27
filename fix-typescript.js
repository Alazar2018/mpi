const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/TSX files
function findTsFiles(dir, fileList) {
  if (!fileList) fileList = [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(function(file) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to remove unused imports
function removeUnusedImports(content) {
  // Remove React import if not using JSX
  if (!content.includes('React.') && !content.includes('<') && content.includes("import React from 'react';")) {
    content = content.replace("import React from 'react';", '');
  }
  
  // Remove unused lucide-react imports
  const lucideImports = content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"]/);
  if (lucideImports) {
    const imports = lucideImports[1].split(',').map(function(i) { return i.trim(); });
    const usedImports = imports.filter(function(imp) {
      const cleanImp = imp.replace(/\s+as\s+\w+/, '').trim();
      return content.includes(cleanImp) || content.includes(cleanImp + '.');
    });
    
    if (usedImports.length === 0) {
      content = content.replace(/import\s*{\s*[^}]*\s*}\s*from\s*['"]lucide-react['"];?\n?/g, '');
    } else if (usedImports.length < imports.length) {
      const newImport = 'import { ' + usedImports.join(', ') + " } from 'lucide-react';";
      content = content.replace(/import\s*{\s*[^}]*\s*}\s*from\s*['"]lucide-react['"];?/, newImport);
    }
  }
  
  return content;
}

// Function to remove unused variables
function removeUnusedVariables(content) {
  // Remove unused useState variables
  content = content.replace(/const\s*\[\s*(\w+),\s*set\w+\s*\]\s*=\s*useState[^;]+;?\n?/g, function(match, varName) {
    if (!content.includes(varName) || content.split(varName).length <= 2) {
      return '';
    }
    return match;
  });
  
  // Remove unused destructured variables
  content = content.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*[^;]+;?\n?/g, function(match, vars) {
    const varList = vars.split(',').map(function(v) { return v.trim().split(':')[0].trim(); });
    const usedVars = varList.filter(function(v) { return content.includes(v); });
    
    if (usedVars.length === 0) {
      return '';
    } else if (usedVars.length < varList.length) {
      const newDestructure = 'const { ' + usedVars.join(', ') + ' } = ';
      return match.replace(/const\s*{\s*[^}]*\s*}\s*=\s*/, newDestructure);
    }
    return match;
  });
  
  return content;
}

// Function to fix specific common issues
function fixCommonIssues(content) {
  // Remove unused type imports
  content = content.replace(/import\s+type\s*{\s*[^}]*\s*}\s*from\s*[^;]+;?\n?/g, function(match) {
    const types = match.match(/import\s+type\s*{\s*([^}]+)\s*}/);
    if (types) {
      const typeList = types[1].split(',').map(function(t) { return t.trim(); });
      const usedTypes = typeList.filter(function(t) { return content.includes(t); });
      
      if (usedTypes.length === 0) {
        return '';
      } else if (usedTypes.length < typeList.length) {
        return 'import type { ' + usedTypes.join(', ') + " } from '@/service/learn.server';";
      }
    }
    return match;
  });
  
  // Remove unused function parameters
  content = content.replace(/\(\s*([^)]*)\s*\)\s*=>\s*{/g, function(match, params) {
    const paramList = params.split(',').map(function(p) { return p.trim(); });
    const usedParams = paramList.filter(function(p) {
      const paramName = p.split(':')[0].trim();
      return content.includes(paramName);
    });
    
    if (usedParams.length === 0) {
      return '() => {';
    } else if (usedParams.length < paramList.length) {
      return '(' + usedParams.join(', ') + ') => {';
    }
    return match;
  });
  
  return content;
}

// Main function to process files
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes
    content = removeUnusedImports(content);
    content = removeUnusedVariables(content);
    content = fixCommonIssues(content);
    
    // Clean up multiple empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed: ' + filePath);
    }
  } catch (error) {
    console.error('Error processing ' + filePath + ':', error.message);
  }
}

// Main execution
console.log('Starting TypeScript error fixes...');

const srcDir = path.join(__dirname, 'src');
const tsFiles = findTsFiles(srcDir);

console.log('Found ' + tsFiles.length + ' TypeScript files');

tsFiles.forEach(processFile);

console.log('TypeScript error fixes completed!');
