/**
 * 人员信息
 */
export interface User {
  id: string; // 唯一标识
  cid: string; // CID
  userid: string; // 用户ID
  position: string; // 职位
  name: string; // 姓名
  gender: "male" | "female"; // 性别
  department: string; // 部门名称
  department_id: string; // 部门 ID
}

export type UserList = User[];

/**
 * 部门
 */
export interface Department {
  id: string; // 唯一标识
  label: string; // 名称
  users?: User[]; // 直属人员列表
  children?: Department[]; // 子部门列表
}

export type DepartmentList = Department[];

export interface Template {
  modelType: "PC" | "Mobile";
  name: string;
  number: string;
  class: string;
  department: string;
  type: string;
  time: string[];
  reason: string;
  courses: string[];
  counselor: string;
  partySecretary: string;
  submitTime: string;
}
