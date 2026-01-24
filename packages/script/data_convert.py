import json
import os

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, file_path):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def process_data():
    # 定义路径
    base_dir = os.path.dirname(__file__)
    export_dir = os.path.join(base_dir, "..", "export")
    
    dept_file = os.path.join(export_dir, "department.json")
    user_file = os.path.join(export_dir, "source_data.json")
    output_file = os.path.join(export_dir, "data.json")

    print(f"载入部门数据: {dept_file}")
    dept_tree = load_json(dept_file)
    
    print(f"载入人员数据: {user_file}")
    users = load_json(user_file)

    # 1. 将人员按部门 ID 分组
    users_by_dept = {}
    for user in users:
        dept_id = str(user.get("department_id"))
        if dept_id not in users_by_dept:
            users_by_dept[dept_id] = []
        
        # 去除敏感数据
        if "mobile" in user:
            del user["mobile"]
        users_by_dept[dept_id].append(user)

    # 2. 递归遍历部门树并注入人员
    def inject_users(nodes):
        for node in nodes:
            node_id = str(node.get("id"))
            
            # 获取该部门直属的人员
            node["users"] = users_by_dept.get(node_id, [])
            
            # 如果有子部门，继续递归
            if "children" in node and node["children"]:
                inject_users(node["children"])
            
            # 统计总人数（可选，方便前端显示）
            # total_count = len(node["users"])
            # if "children" in node:
            #     for child in node["children"]:
            #         total_count += child.get("_total_users", 0)
            # node["_total_users"] = total_count

    print("开始匹配人员到部门树...")
    inject_users(dept_tree)

    print(f"数据处理完成，保存至: {output_file}")
    save_json(dept_tree, output_file)

if __name__ == "__main__":
    process_data()
