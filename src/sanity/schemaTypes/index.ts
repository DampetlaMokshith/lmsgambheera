import { type SchemaTypeDefinition } from 'sanity'

// Import all schema types
import course from './course'
import courseSection from './courseSection'
import lecture from './lecture'
import quiz, { quizQuestion } from './quiz'
import assignment from './assignment'
import module from './module'
import faculty from './faculty'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Main document types
    course,
    courseSection,
    lecture,
    quiz,
    assignment,
    module,
    faculty,
    
    // Object types
    quizQuestion,
  ],
}
