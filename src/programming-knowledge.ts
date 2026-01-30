// src/programming-knowledge.ts
import { Logger } from './logger.js';

export interface LanguageGuide {
  language: string;
  category: 'python' | 'javascript' | 'java' | 'web';
  conventions: string[];
  commonPatterns: Record<string, string>;
  bestPractices: string[];
  commonIssues: string[];
  fileExtensions: string[];
  packageManagers: string[];
  frameworks: string[];
  testFrameworks: string[];
}

export interface ProjectTemplate {
  name: string;
  language: string;
  description: string;
  structure: Record<string, string>;
  configFiles: Record<string, string>;
  scripts: Record<string, string>;
}

export class ProgrammingKnowledge {
  private logger: Logger;
  private languageGuides: Map<string, LanguageGuide> = new Map();
  private projectTemplates: Map<string, ProjectTemplate> = new Map();

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
    this.initializePythonKnowledge();
    this.initializeJavaScriptKnowledge();
    this.initializeJavaKnowledge();
    this.initializeWebDevelopmentKnowledge();
  }

  // ============= PYTHON KNOWLEDGE =============
  private initializePythonKnowledge(): void {
    const pythonGuide: LanguageGuide = {
      language: 'python',
      category: 'python',
      fileExtensions: ['.py'],
      packageManagers: ['pip', 'pipenv', 'poetry', 'conda'],
      frameworks: ['Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado', 'Bottle'],
      testFrameworks: ['pytest', 'unittest', 'nose', 'tox'],
      conventions: [
        'PEP 8 - Python Enhancement Proposal 8',
        'Snake_case for variables and functions',
        'UPPER_CASE for constants',
        'CamelCase for classes',
        'Use type hints for better code clarity',
        '__main__ pattern for executability',
        'Docstrings for modules, classes, functions',
        'Virtual environments for isolation',
        'Requirements.txt or pyproject.toml for dependencies',
      ],
      commonPatterns: {
        'if_main_pattern': `if __name__ == "__main__":
    main()`,
        'context_manager': `with open(file_path) as f:
    content = f.read()`,
        'list_comprehension': `[x * 2 for x in range(10) if x % 2 == 0]`,
        'decorator': `@property
def name(self):
    return self._name`,
        'async_pattern': `async def fetch_data():
    result = await async_operation()
    return result`,
        'exception_handling': `try:
    risky_operation()
except SpecificError as e:
    handle_error(e)
finally:
    cleanup()`,
      },
      bestPractices: [
        'Use virtual environments (venv, poetry, pipenv)',
        'Follow PEP 8 style guide',
        'Write comprehensive docstrings',
        'Use type hints (Python 3.5+)',
        'Implement proper error handling with specific exceptions',
        'Use list comprehensions instead of loops when appropriate',
        'Avoid mutable default arguments',
        'Use context managers for resource management',
        'Implement __repr__ and __str__ methods in classes',
        'Use logging module instead of print() for debugging',
        'Write unit tests with pytest',
        'Use pathlib for file path operations',
        'Leverage Python data structures (dict, set, tuple)',
        'Use f-strings for string formatting',
        'Implement proper __init__ with type annotations',
      ],
      commonIssues: [
        'Mutable default arguments - use None and assign in __init__',
        'Global variable scope issues - use proper scoping',
        'IndentationError - always use consistent indentation',
        'NameError - check variable scope and spelling',
        'Import errors - verify virtual environment and installed packages',
        'Memory leaks - properly close file handles and connections',
        'Threading issues - use Queue and Lock for thread-safe operations',
        'Circular imports - reorganize module structure',
        'TypeError from passing wrong argument types - use type hints',
      ],
    };

    this.languageGuides.set('python', pythonGuide);

    // Python Project Template
    const pythonTemplate: ProjectTemplate = {
      name: 'python-project',
      language: 'python',
      description: 'Standard Python project structure',
      structure: {
        'src/': 'Source code directory',
        'tests/': 'Unit tests directory',
        'docs/': 'Documentation directory',
        '.gitignore': 'Git ignore rules',
        'README.md': 'Project README',
      },
      configFiles: {
        'pyproject.toml': `[project]
name = "my-project"
version = "0.1.0"
description = "My Python project"
requires-python = ">=3.8"

[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"`,
        'setup.py': `from setuptools import setup, find_packages

setup(
    name='my-project',
    version='0.1.0',
    packages=find_packages(),
    install_requires=[],
)`,
        '.gitignore': `__pycache__/
*.py[cod]
*$py.class
*.egg-info/
dist/
build/
.venv/
venv/
.pytest_cache/
.coverage`,
      },
      scripts: {
        'install': 'pip install -r requirements.txt',
        'test': 'pytest tests/',
        'lint': 'pylint src/',
        'format': 'black src/ tests/',
      },
    };

    this.projectTemplates.set('python-project', pythonTemplate);
  }

  // ============= JAVASCRIPT/TYPESCRIPT KNOWLEDGE =============
  private initializeJavaScriptKnowledge(): void {
    const jsGuide: LanguageGuide = {
      language: 'javascript',
      category: 'javascript',
      fileExtensions: ['.js', '.jsx', '.mjs'],
      packageManagers: ['npm', 'yarn', 'pnpm', 'bun'],
      frameworks: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Express', 'Fastify'],
      testFrameworks: ['Jest', 'Mocha', 'Vitest', 'Jasmine'],
      conventions: [
        'camelCase for variables, functions, methods',
        'PascalCase for classes and components',
        'UPPER_CASE for constants',
        'Use semicolons consistently',
        'Use arrow functions for callbacks',
        'Use const by default, let when needed, avoid var',
        'Use template literals for string interpolation',
        'Use async/await over .then() chains',
        'Destructuring for imports and object access',
      ],
      commonPatterns: {
        'arrow_function': `const add = (a, b) => a + b;`,
        'destructuring': `const { name, age } = person;
const [first, ...rest] = array;`,
        'template_literal': `const message = \`Hello, \${name}!\`;`,
        'async_await': `async function fetchData() {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}`,
        'object_shorthand': `const name = 'John';
const obj = { name, greet() { return \`Hi \${this.name}\`; } };`,
        'spread_operator': `const merged = { ...obj1, ...obj2 };
const combined = [...arr1, ...arr2];`,
      },
      bestPractices: [
        'Use ESLint and Prettier for code style',
        'Use strict mode ("use strict")',
        'Use const by default for immutability',
        'Avoid callback hell - use async/await',
        'Use proper error handling with try/catch',
        'Implement unit tests with Jest',
        'Use environment variables for configuration',
        'Implement proper logging strategy',
        'Use TypeScript for type safety',
        'Implement proper module structure',
        'Use dependency injection patterns',
        'Avoid global variables',
        'Implement proper event handling',
        'Use proper naming conventions',
      ],
      commonIssues: [
        'undefined vs null - understand the difference',
        'Callback hell - use async/await or promises',
        'Hoisting confusion - understand let/const vs var',
        'This binding - use arrow functions or bind()',
        'Shallow vs deep copy - understand object references',
        'Promise rejections not handled - always add catch()',
        'Race conditions - proper state management',
        'Memory leaks - proper cleanup in useEffect',
        'Event listener not removed - add cleanup functions',
      ],
    };

    this.languageGuides.set('javascript', jsGuide);

    // TypeScript Guide
    const tsGuide: LanguageGuide = {
      ...jsGuide,
      language: 'typescript',
      fileExtensions: ['.ts', '.tsx'],
      conventions: [
        ...jsGuide.conventions,
        'Use strict TypeScript settings (strict: true)',
        'Define interfaces for object shapes',
        'Use type aliases for complex types',
        'Generic types for reusable code',
        'Use enums for fixed sets of values',
        'Proper use of access modifiers (public, private, protected)',
        'Async function return types (Promise<T>)',
      ],
      commonPatterns: {
        ...jsGuide.commonPatterns,
        'interface': `interface User {
  id: number;
  name: string;
  email: string;
}`,
        'generic_function': `function getValue<T>(obj: T, key: keyof T): T[key] {
  return obj[key];
}`,
        'type_guard': `function isString(value: unknown): value is string {
  return typeof value === 'string';
}`,
      },
    };

    this.languageGuides.set('typescript', tsGuide);

    // JavaScript/Node.js Project Template
    const jsTemplate: ProjectTemplate = {
      name: 'nodejs-project',
      language: 'javascript',
      description: 'Standard Node.js/JavaScript project structure',
      structure: {
        'src/': 'Source code directory',
        'tests/': 'Unit tests directory',
        'dist/': 'Compiled/built code directory',
        '.gitignore': 'Git ignore rules',
        'README.md': 'Project README',
      },
      configFiles: {
        'package.json': `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "My Node.js project",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "node --watch src/index.js",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/"
  },
  "dependencies": {},
  "devDependencies": {}
}`,
        'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}`,
        '.eslintrc.json': `{
  "env": { "node": true, "es2021": true },
  "extends": "eslint:recommended",
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
  "rules": { "no-unused-vars": "warn", "semi": ["error", "always"] }
}`,
      },
      scripts: {
        'install': 'npm install',
        'dev': 'npm run dev',
        'build': 'npm run build',
        'test': 'npm test',
      },
    };

    this.projectTemplates.set('nodejs-project', jsTemplate);
  }

  // ============= JAVA KNOWLEDGE =============
  private initializeJavaKnowledge(): void {
    const javaGuide: LanguageGuide = {
      language: 'java',
      category: 'java',
      fileExtensions: ['.java'],
      packageManagers: ['Maven', 'Gradle'],
      frameworks: ['Spring Boot', 'Quarkus', 'Micronaut', 'Play', 'Vaadin'],
      testFrameworks: ['JUnit', 'TestNG', 'Mockito'],
      conventions: [
        'Package names in lowercase (com.example.myapp)',
        'Class names in PascalCase',
        'Method and variable names in camelCase',
        'Constants in UPPER_CASE',
        'One public class per file',
        'Use access modifiers (public, private, protected)',
        'Follow Object-Oriented principles',
        'Use proper naming conventions for boolean methods (isActive, hasValue)',
        'Use generics for type safety',
        'Implement equals() and hashCode() for objects',
      ],
      commonPatterns: {
        'class_definition': `public class User {
  private String name;
  private int age;
  
  public User(String name, int age) {
    this.name = name;
    this.age = age;
  }
  
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
}`,
        'interface': `public interface Drawable {
  void draw();
  String getShape();
}`,
        'try_catch': `try {
  risky_operation();
} catch (SpecificException e) {
  log.error("Error occurred", e);
} finally {
  cleanup();
}`,
        'lambda': `List<String> filtered = list.stream()
  .filter(s -> s.length() > 3)
  .map(String::toUpperCase)
  .collect(Collectors.toList());`,
        'annotation': `@Override
@Deprecated
@SuppressWarnings("unchecked")
public void method() {}`,
      },
      bestPractices: [
        'Follow SOLID principles (Single Responsibility, Open/Closed, etc.)',
        'Use dependency injection frameworks (Spring)',
        'Implement proper exception handling hierarchy',
        'Use collections properly (List, Set, Map)',
        'Implement equals() and hashCode() consistently',
        'Use generics for type safety',
        'Use functional streams (Java 8+)',
        'Use immutable objects when possible',
        'Implement proper logging (SLF4J, Logback)',
        'Use Optional for nullable values',
        'Implement thread-safe code when needed',
        'Use proper naming conventions',
        'Write unit tests with JUnit',
        'Use constructor injection over field injection',
      ],
      commonIssues: [
        'NullPointerException - use Optional or null checks',
        'ClassCastException - proper type checking before casting',
        'ConcurrentModificationException - proper iteration',
        'StackOverflowError - infinite recursion',
        'OutOfMemoryError - memory leaks and resource management',
        'Unchecked exceptions - proper exception handling',
        'Thread issues - proper synchronization',
        'Equals and hashCode inconsistency - implement both',
        'Serialization issues - proper implementation',
      ],
    };

    this.languageGuides.set('java', javaGuide);

    // Java Project Template
    const javaTemplate: ProjectTemplate = {
      name: 'java-project',
      language: 'java',
      description: 'Standard Java Maven project structure',
      structure: {
        'src/main/java/': 'Main source code',
        'src/main/resources/': 'Configuration and resources',
        'src/test/java/': 'Test code',
        'target/': 'Compiled output',
      },
      configFiles: {
        'pom.xml': `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>my-app</artifactId>
  <version>1.0-SNAPSHOT</version>
  
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.13.2</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`,
      },
      scripts: {
        'compile': 'mvn compile',
        'test': 'mvn test',
        'package': 'mvn package',
        'run': 'mvn exec:java',
      },
    };

    this.projectTemplates.set('java-project', javaTemplate);
  }

  // ============= WEB DEVELOPMENT KNOWLEDGE =============
  private initializeWebDevelopmentKnowledge(): void {
    const webGuide: LanguageGuide = {
      language: 'web-development',
      category: 'web',
      fileExtensions: ['.html', '.css', '.scss', '.jsx', '.tsx'],
      packageManagers: ['npm', 'yarn', 'pnpm'],
      frameworks: [
        'React',
        'Vue.js',
        'Angular',
        'Svelte',
        'Next.js',
        'Nuxt',
        'Remix',
        'Astro',
        'Tailwind CSS',
        'Bootstrap',
      ],
      testFrameworks: ['Jest', 'React Testing Library', 'Cypress', 'Playwright'],
      conventions: [
        'BEM (Block Element Modifier) for CSS naming',
        'Component-based architecture',
        'Semantic HTML5',
        'Mobile-first responsive design',
        'Accessibility (a11y) first approach',
        'Use CSS Grid and Flexbox',
        'Mobile-responsive breakpoints',
        'Atomic design patterns',
        'Separation of concerns',
      ],
      commonPatterns: {
        'react_component': `import React, { useState } from 'react';

export const Counter = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div className="counter">
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};`,
        'html_template': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
</head>
<body>
  <header>Header</header>
  <main>Content</main>
  <footer>Footer</footer>
</body>
</html>`,
        'css_flexbox': `display: flex;
justify-content: space-between;
align-items: center;
gap: 1rem;`,
        'css_grid': `display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 2rem;`,
      },
      bestPractices: [
        'Use semantic HTML elements (header, nav, section, article)',
        'Implement proper ARIA labels for accessibility',
        'Use CSS custom properties (variables)',
        'Mobile-first responsive design',
        'Lazy load images and resources',
        'Optimize bundle size with tree-shaking',
        'Use Web Components for reusability',
        'Implement proper error boundaries',
        'Use proper state management (Redux, Zustand, Context)',
        'Implement proper form validation',
        'Use progressive enhancement',
        'Proper performance optimization (Core Web Vitals)',
        'Security: CSRF, XSS, CSP headers',
        'SEO optimization (meta tags, structured data)',
      ],
      commonIssues: [
        'Layout shift - use proper sizing attributes',
        'Poor accessibility - missing alt text, labels',
        'Slow page load - unoptimized images, large bundles',
        'Mobile responsiveness - not testing on devices',
        'Memory leaks - not cleaning up event listeners',
        'CSS conflicts - proper scoping and naming',
        'Form validation - client-side and server-side',
        'CORS issues - proper headers configuration',
        'XSS vulnerabilities - proper sanitization',
      ],
    };

    this.languageGuides.set('web-development', webGuide);

    // React Project Template
    const reactTemplate: ProjectTemplate = {
      name: 'react-project',
      language: 'javascript',
      description: 'Standard React project with TypeScript',
      structure: {
        'src/components/': 'Reusable components',
        'src/pages/': 'Page components',
        'src/hooks/': 'Custom React hooks',
        'src/utils/': 'Utility functions',
        'src/styles/': 'CSS/SCSS files',
        'public/': 'Static assets',
      },
      configFiles: {
        'package.json': `{
  "name": "my-react-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`,
      },
      scripts: {
        'dev': 'npm run dev',
        'build': 'npm run build',
        'test': 'npm test',
      },
    };

    this.projectTemplates.set('react-project', reactTemplate);
  }

  /**
   * Get language guide
   */
  getLanguageGuide(language: string): LanguageGuide | undefined {
    return this.languageGuides.get(language.toLowerCase());
  }

  /**
   * Get project template
   */
  getProjectTemplate(templateName: string): ProjectTemplate | undefined {
    return this.projectTemplates.get(templateName.toLowerCase());
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): string[] {
    return Array.from(this.languageGuides.keys());
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.projectTemplates.keys());
  }

  /**
   * Get recommendations for a programming task
   */
  getRecommendations(task: string, language: string): string[] {
    const guide = this.getLanguageGuide(language);
    if (!guide) return [];

    const recommendations: string[] = [];
    const taskLower = task.toLowerCase();

    // Recommend frameworks
    if (
      taskLower.includes('api') ||
      taskLower.includes('server') ||
      taskLower.includes('backend')
    ) {
      recommendations.push(
        `Recommended frameworks for ${language}: ${guide.frameworks.slice(0, 3).join(', ')}`
      );
    }

    // Recommend test frameworks
    if (taskLower.includes('test')) {
      recommendations.push(
        `Test frameworks for ${language}: ${guide.testFrameworks.slice(0, 2).join(', ')}`
      );
    }

    // Recommend best practices
    recommendations.push(...guide.bestPractices.slice(0, 3));

    return recommendations;
  }

  /**
   * Get code example for a pattern
   */
  getCodeExample(language: string, patternName: string): string | undefined {
    const guide = this.getLanguageGuide(language);
    if (!guide) return undefined;
    return guide.commonPatterns[patternName];
  }

  /**
   * Analyze code for common issues
   */
  analyzeForIssues(language: string, code: string): string[] {
    const guide = this.getLanguageGuide(language);
    if (!guide) return [];

    const issues: string[] = [];
    const codeLower = code.toLowerCase();

    // Simple pattern matching for common issues
    guide.commonIssues.forEach((issue) => {
      const keywords = issue.split(' - ')[0].toLowerCase();
      if (codeLower.includes(keywords.split(' ')[0])) {
        issues.push(issue);
      }
    });

    return issues.slice(0, 5);
  }

  /**
   * Get package manager commands
   */
  getPackageManagerInfo(language: string): string[] {
    const guide = this.getLanguageGuide(language);
    if (!guide) return [];
    return guide.packageManagers;
  }
}
