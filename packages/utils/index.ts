import userDataJson from "@byu-flag/export/data.json";
import departmentDataJson from "@byu-flag/export/department.json";
import dayjs from "dayjs";

interface User {
  id: string; // 唯一标识
  cid: string; // CID
  userid: string; // 用户ID
  position: string; // 职位
  name: string; // 姓名
  gender: "male" | "female"; // 性别
  department: string; // 部门名称
  department_id: string; // 部门 ID
}

interface Data {
  id: string;
  label: string;
  children?: Data[];
  users?: User[];
}

export const getCounselorList = (
  data: Data[] = JSON.parse(JSON.stringify(userDataJson)),
) => {
  return data.flatMap((dept) => {
    let counselors: User[] = [];
    if (dept.users) {
      const deptCounselors = dept.users.filter(
        (user) => user.position === "辅导员",
      );
      counselors = counselors.concat(deptCounselors);
    }
    if (dept.children) {
      dept.children.forEach((childDept) => {
        counselors = counselors.concat(getCounselorList([childDept]));
      });
    }
    return counselors;
  });
};

export const partySecretaryList = (
  data: Data[] = JSON.parse(JSON.stringify(userDataJson)),
) => {
  return data.flatMap((dept) => {
    let secretaries: User[] = [];
    if (dept.users) {
      const deptSecretaries = dept.users.filter((user) =>
        user.position.includes("书记"),
      );
      secretaries = secretaries.concat(deptSecretaries);
    }
    if (dept.children) {
      dept.children.forEach((childDept) => {
        secretaries = secretaries.concat(partySecretaryList([childDept]));
      });
    }
    return secretaries;
  });
};

export const getClassList = (data = departmentDataJson) => {
  const dataList = data[0].children || [];
  const dept = dataList.map((dept) => {
    let result: any[] = [];
    if (dept.children && dept.children.length > 0) {
      result = dept.children.map((subDept) => ({
        value: subDept.label,
        label: subDept.label,
        children: subDept.children,
      }));
    }
    return {
      value: dept.label,
      label: dept.label,
      children: result,
    };
  });

  const result: any[] = [];
  function walk(node: any, inStudent = false) {
    if (!node) return;

    // 如果是数组，遍历
    if (Array.isArray(node)) {
      node.forEach((n) => walk(n, false));
      return;
    }

    if (node.value === "学生") {
      if (node.children) {
        node.children.forEach((n: any) => walk(n, true));
      }
      return;
    }

    // 只在“学生”分支下处理
    if (inStudent) {
      // 叶子节点 = 班级
      if (!node.children || node.children.length === 0) {
        if (node.id && node.label) {
          result.push({
            value: node.label,
            label: node.label,
          });
        }
        return;
      }

      // 递归
      node.children.forEach((n: any) => walk(n, true));
    }
  }

  walk(dept);
  return result;
};

export const getDepartment = (data = departmentDataJson) => {
  const dataList = data[0].children || [];
  return dataList.map((dept) => {
    let result: any[] = [];
    if (dept.children && dept.children.length > 0) {
      result = dept.children.map((subDept) => ({
        value: subDept.label,
        label: subDept.label,
      }));
    }
    return {
      value: dept.label,
      label: dept.label,
      children: result,
    };
  });
};

export const getUserById = (id: string): User | null => {
  const gets = (data: Data[]) => {
    return data.flatMap((dept) => {
      let secretaries: User[] = [];
      if (dept.users) {
        secretaries = secretaries.concat(dept.users);
      }
      if (dept.children) {
        dept.children.forEach((childDept) => {
          secretaries = secretaries.concat(gets([childDept]));
        });
      }
      return secretaries;
    });
  };
  const data: User = gets(
    JSON.parse(JSON.stringify(userDataJson)) as Data[],
  ).find((user) => user.id === id) as User;
  return data || null;
};

export const calculationTime = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diff = end.getTime() - start.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let type = 0;
  if (days >= 7) {
    type = 1;
  } else if (days > 1 || (days === 1 && hours >= 0)) {
    type = 2;
  }
  // 请假天数大于等于7天，需要学生处+教务处审批，生成器不支持这种
  return {
    disabled: type === 1,
    type,
    label: `${days || 0}天${hours || 0}小时`,
  };
};

export const getTimeRange = (time: string[]) => {
  return `${dayjs(time[0]).format("YYYY-MM-DD HH:mm")} 至 ${dayjs(time[1]).format("YYYY-MM-DD HH:mm")}`;
};

export const randomDurationSeconds = (options?: {
  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;
}) => {
  const { maxHours = 1, maxMinutes = 59, maxSeconds = 59 } = options || {};

  const hours = Math.floor(Math.random() * (maxHours + 1));
  const minutes = Math.floor(Math.random() * (maxMinutes + 1));
  const seconds = Math.floor(Math.random() * (maxSeconds + 1));

  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * 生成随机时间增量（秒）
 * @param minMinutes 最小间隔（必须保证）
 * @param hourChance 小时增加概率 (0~1)，比如 0.4
 */
export const randomDurationWithHourChance = (
  minMinutes: number,
  hourChance = 0.4,
) => {
  let hours = 0;
  if (Math.random() < hourChance) {
    // 有 hourChance 的概率增加 1 小时以内
    hours = Math.floor(Math.random() * 2); // 0 或 1 小时
  }

  const minutes = Math.floor(Math.random() * 60);
  const seconds = Math.floor(Math.random() * 60);

  // 保证最小间隔
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds < minMinutes * 60 ? minMinutes * 60 : totalSeconds;
};
