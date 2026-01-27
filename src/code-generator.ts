// src/code-generator.ts
import { Logger } from './logger.js';
import { ProgrammingKnowledge } from './programming-knowledge.js';

export interface CodeTemplate {
  name: string;
  language: string;
  template: string;
  description?: string;
  examples?: string[];
}

export interface GeneratedCode {
  code: string;
  language: string;
  fileName: string;
  description: string;
  generatedAt: number;
  bestPractices?: string[];
  recommendations?: string[];
}

export class CodeGenerator {
  private logger: Logger;
  private codeTemplates: Map<string, CodeTemplate[]> = new Map();
  private programmingKnowledge: ProgrammingKnowledge;

  // Supported languages
  private readonly SUPPORTED_LANGUAGES = [
    'javascript',
    'typescript',
    'python',
    'java',
    'csharp',
    'cpp',
    'rust',
    'go',
    'kotlin',
    'swift',
    'ruby',
    'php',
    'shell',
    'sql',
    'html',
    'css',
    'yaml',
    'json',
  ];

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
    this.programmingKnowledge = new ProgrammingKnowledge(logLevel);
    this.initializeTemplates();
  }

  /**
   * Initialize code templates
   */
  private initializeTemplates(): void {
    // Function/Method templates
    this.codeTemplates.set('function', [
      {
        name: 'basic-function',
        language: 'typescript',
        template: `function ${'{functionName}'}(${'{parameters}'}) {
  // TODO: Implement function body
  return ${'{returnValue}'};
}`,
        description: 'Basic function template',
      },
      {
        name: 'async-function',
        language: 'typescript',
        template: `async function ${'{functionName}'}(${'{parameters}'}) {
  try {
    // TODO: Implement async logic
    return ${'{returnValue}'};
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}`,
        description: 'Async function template',
      },
      {
        name: 'arrow-function',
        language: 'typescript',
        template: `const ${'{functionName}'} = (${'{parameters}'}): ${'{returnType}'} => {
  // TODO: Implement function body
  return ${'{returnValue}'};
};`,
        description: 'Arrow function template',
      },
    ]);

    // Class templates
    this.codeTemplates.set('class', [
      {
        name: 'basic-class',
        language: 'typescript',
        template: `class ${'{className}'} {
  constructor(${'{constructorParams}'}) {
    // TODO: Initialize properties
  }

  // TODO: Add methods
}`,
        description: 'Basic class template',
      },
      {
        name: 'class-with-interface',
        language: 'typescript',
        template: `interface I${'{className}'} {
  // TODO: Define interface properties
}

class ${'{className}'} implements I${'{className}'} {
  constructor(${'{constructorParams}'}) {
    // TODO: Initialize properties
  }

  // TODO: Add methods
}`,
        description: 'Class with interface template',
      },
    ]);

    // API templates
    this.codeTemplates.set('api', [
      {
        name: 'rest-endpoint',
        language: 'typescript',
        template: `app.${'{method}'}('${'{endpoint}'}', async (req, res) => {
  try {
    // TODO: Implement endpoint logic
    const result = ${'{logic}'};
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});`,
        description: 'REST API endpoint template',
      },
      {
        name: 'graphql-resolver',
        language: 'typescript',
        template: `const ${'{resolverName}'}Resolver = {
  Query: {
    ${'{queryName}'}: (_, args, context) => {
      // TODO: Implement query logic
      return ${'{queryLogic}'};
    },
  },
  Mutation: {
    ${'{mutationName}'}: (_, args, context) => {
      // TODO: Implement mutation logic
      return ${'{mutationLogic}'};
    },
  },
};`,
        description: 'GraphQL resolver template',
      },
    ]);

    // Test templates
    this.codeTemplates.set('test', [
      {
        name: 'unit-test',
        language: 'typescript',
        template: `describe('${'{testSuite}'}', () => {
  it('${'{testDescription}'}', () => {
    // Arrange
    // TODO: Set up test data

    // Act
    // TODO: Execute function

    // Assert
    // TODO: Verify results
  });
});`,
        description: 'Unit test template',
      },
      {
        name: 'integration-test',
        language: 'typescript',
        template: `describe('${'{testSuite}'} Integration', () => {
  beforeEach(() => {
    // TODO: Set up test environment
  });

  afterEach(() => {
    // TODO: Clean up test environment
  });

  it('${'{testDescription}'}', async () => {
    // TODO: Implement integration test
  });
});`,
        description: 'Integration test template',
      },
    ]);

    // Python templates
    this.codeTemplates.set('python', [
      {
        name: 'python-function',
        language: 'python',
        template: `def ${'{functionName}'}(${'{parameters}'}):
    """
    ${'{docstring}'}
    """
    # TODO: Implement function body
    return ${'{returnValue}'}`,
        description: 'Python function template',
      },
      {
        name: 'python-class',
        language: 'python',
        template: `class ${'{className}'}:
    """${'{docstring}'}"""
    
    def __init__(self${'{initParams}'}):
        """Initialize the class."""
        # TODO: Initialize properties
        pass
    
    # TODO: Add methods`,
        description: 'Python class template',
      },
    ]);

    // SQL templates
    this.codeTemplates.set('sql', [
      {
        name: 'select-query',
        language: 'sql',
        template: `SELECT ${'{columns}'}
FROM ${'{table}'}
WHERE ${'{condition}'}
ORDER BY ${'{orderBy}'}
LIMIT ${'{limit}'};`,
        description: 'SELECT query template',
      },
      {
        name: 'join-query',
        language: 'sql',
        template: `SELECT ${'{columns}'}
FROM ${'{table1}'}
INNER JOIN ${'{table2}'} ON ${'{joinCondition}'}
WHERE ${'{condition}'}
ORDER BY ${'{orderBy}'};`,
        description: 'JOIN query template',
      },
      {
        name: 'aggregate-query',
        language: 'sql',
        template: `SELECT ${'{groupBy}'}, COUNT(*) as count, AVG(${'{column}'}) as average
FROM ${'{table}'}
GROUP BY ${'{groupBy}'}
HAVING COUNT(*) > ${'{threshold}'}
ORDER BY count DESC;`,
        description: 'Aggregate query template',
      },
    ]);

    // Shell templates
    this.codeTemplates.set('shell', [
      {
        name: 'bash-script',
        language: 'shell',
        template: `#!/bin/bash

# ${'{description}'}

set -e

# TODO: Add script logic

echo "Script completed successfully"`,
        description: 'Bash script template',
      },
      {
        name: 'bash-function',
        language: 'shell',
        template: `function ${'{functionName}'}() {
    local ${'{param1}'}="$1"
    local ${'{param2}'}="$2"
    
    # TODO: Implement function logic
    
    echo "Function completed"
}`,
        description: 'Bash function template',
      },
    ]);
  }

  /**
   * Generate code from template with parameter substitution
   */
  generateCode(
    templateType: string,
    templateName: string,
    language: string,
    parameters: Record<string, string>,
    context?: string
  ): GeneratedCode {
    const templates = this.codeTemplates.get(templateType) || [];
    const template = templates.find((t) => t.name === templateName && t.language === language);

    if (!template) {
      throw new Error(`Template not found: ${templateType}/${templateName}/${language}`);
    }

    // Replace parameters in template
    let code = template.template;
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{${key}}`;
      code = code.replace(new RegExp(placeholder, 'g'), value || placeholder);
    }

    const fileName = this.generateFileName(templateType, language, parameters);

    // Get language guide for best practices and recommendations
    const guide = this.programmingKnowledge.getLanguageGuide(language);
    const bestPractices = guide?.bestPractices.slice(0, 3) || [];
    const recommendations = context
      ? this.programmingKnowledge.getRecommendations(context, language)
      : [];

    return {
      code,
      language,
      fileName,
      description: template.description || '',
      generatedAt: Date.now(),
      bestPractices,
      recommendations,
    };
  }

  /**
   * Generate appropriate file name
   */
  private generateFileName(templateType: string, language: string, parameters: Record<string, string>): string {
    const extensions: Record<string, string> = {
      javascript: '.js',
      typescript: '.ts',
      python: '.py',
      java: '.java',
      csharp: '.cs',
      cpp: '.cpp',
      rust: '.rs',
      go: '.go',
      kotlin: '.kt',
      swift: '.swift',
      ruby: '.rb',
      php: '.php',
      shell: '.sh',
      sql: '.sql',
      html: '.html',
      css: '.css',
      yaml: '.yaml',
      json: '.json',
    };

    let baseName = parameters['functionName'] || parameters['className'] || parameters['testSuite'] || templateName;
    baseName = baseName.toLowerCase().replace(/\s+/g, '-');

    const ext = extensions[language] || '.txt';
    return `${baseName}${ext}`;
  }

  /**
   * Create custom code snippet
   */
  createCustomSnippet(
    description: string,
    code: string,
    language: string,
    fileName?: string
  ): GeneratedCode {
    return {
      code,
      language,
      fileName: fileName || `snippet-${Date.now()}.txt`,
      description,
      generatedAt: Date.now(),
    };
  }

  /**
   * List available templates for a type
   */
  listTemplates(templateType?: string): Record<string, CodeTemplate[]> {
    if (templateType) {
      const templates = this.codeTemplates.get(templateType) || [];
      return { [templateType]: templates };
    }

    const result: Record<string, CodeTemplate[]> = {};
    for (const [type, templates] of this.codeTemplates.entries()) {
      result[type] = templates;
    }

    return result;
  }

  /**
   * Get available languages
   */
  getSupportedLanguages(): string[] {
    return this.SUPPORTED_LANGUAGES;
  }

  /**
   * Add custom template
   */
  addCustomTemplate(type: string, template: CodeTemplate): void {
    if (!this.codeTemplates.has(type)) {
      this.codeTemplates.set(type, []);
    }

    const templates = this.codeTemplates.get(type)!;
    templates.push(template);
    this.logger.info(`Added custom template: ${type}/${template.name}`);
  }

  /**
   * Display templates as formatted text
   */
  displayTemplates(): string {
    const lines: string[] = [];

    lines.push('📚 CODE TEMPLATES');
    lines.push('═'.repeat(70));

    for (const [type, templates] of this.codeTemplates.entries()) {
      lines.push(`\n📂 ${type.toUpperCase()}`);
      for (const template of templates) {
        lines.push(`  ├─ ${template.name} (${template.language})`);
        if (template.description) {
          lines.push(`  │  ${template.description}`);
        }
      }
    }

    lines.push('\n\n📋 SUPPORTED LANGUAGES');
    lines.push('═'.repeat(70));
    for (let i = 0; i < this.SUPPORTED_LANGUAGES.length; i += 5) {
      lines.push(`  ${this.SUPPORTED_LANGUAGES.slice(i, i + 5).join(', ')}`);
    }

    return lines.join('\n');
  }
}
