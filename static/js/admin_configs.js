// Admin-specific overrides
const READONLY_MODULES = [
  'administrators', 
  'projects', 
  'courses', 
  'modules', 
  'chapters', 
  'chapter_assignments', 
  'skills', 
  'student_skills'
];

READONLY_MODULES.forEach(mod => {
  if (ENTITIES[mod]) {
    ENTITIES[mod].readonly = true;
  }
});
