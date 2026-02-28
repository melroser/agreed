import skills from "@/lib/data/skills.json";
import questions from "@/lib/data/questions.json";
import roleDefaults from "@/lib/data/role-defaults.json";

export interface Skill {
  id: string;
  name: string;
  familyId: string;
  familyName: string;
  functionTags: string[];
}

export interface Question {
  id: string;
  skillId: string;
  prompt: string;
}

export interface RoleDefault {
  function: string;
  skillId: string;
  skillName: string;
  requiredLevel: 1 | 2 | 3 | 4;
}

export function getSkills(): Skill[] {
  return skills;
}

export function getQuestions(): Question[] {
  return questions;
}

export function getRoleDefaults(): RoleDefault[] {
  return roleDefaults as RoleDefault[];
}
